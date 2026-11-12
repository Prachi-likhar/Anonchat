const { env } = require('../../config/env');
const { pool, withTransaction } = require('../../db/pool');
const presenceService = require('../../services/presenceService');
const tokenService = require('../../services/tokenService');
const { invalidateUserAuthCache } = require('../../middleware/auth');
const { emitForceLogout } = require('../../sockets/emitter');
const AppError = require('../../utils/AppError');
const { decodeCursor, escapeLike, slicePage } = require('../../utils/pagination');
const {
  toAdminUser,
  toAdminReportSummary,
  toAdminReportDetail,
  toAuditEntry,
} = require('./admin.serializer');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidTimeIdCursor(obj) {
  return (
    typeof obj.ts === 'string' &&
    !Number.isNaN(Date.parse(obj.ts)) &&
    typeof obj.id === 'string' &&
    UUID_REGEX.test(obj.id)
  );
}

function isValidAuditCursor(obj) {
  return typeof obj.id === 'number' && Number.isInteger(obj.id) && obj.id > 0;
}

const ADMIN_USER_SELECT = `
  SELECT
    u.id,
    u.anon_username,
    u.full_name,
    u.email,
    u.gender,
    u.status,
    u.role,
    u.created_at,
    u.last_seen_at,
    u.suspended_until,
    (SELECT COUNT(*)::int FROM reports r WHERE r.reported_id = u.id) AS report_count
  FROM users u
`;

const ALLOWED_REPORT_TRANSITIONS = {
  open: new Set(['reviewing', 'resolved', 'dismissed']),
  reviewing: new Set(['resolved', 'dismissed']),
  resolved: new Set(),
  dismissed: new Set(),
};

async function writeAudit(client, { adminId, action, targetUserId = null, meta = null }) {
  await client.query(
    `INSERT INTO admin_audit_log (admin_id, action, target_user_id, meta)
     VALUES ($1, $2, $3, $4)`,
    [adminId, action, targetUserId, meta ? JSON.stringify(meta) : null],
  );
}

async function ensureNotLastActiveAdmin(client, targetUser) {
  if (targetUser.role !== 'admin') return;
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS admin_count
     FROM users
     WHERE role = 'admin' AND status = 'active'`,
  );
  if (Number(rows[0]?.admin_count || 0) <= 1) {
    throw AppError.badRequest('Cannot modify or restrict the last active admin');
  }
}

async function applyUserModerationInTx(client, { adminId, targetId, action, reason, until }) {
  if (adminId === targetId) {
    throw AppError.badRequest(`Cannot ${action} your own account`);
  }

  const targetRes = await client.query(
    `SELECT id, role, status FROM users WHERE id = $1 FOR UPDATE`,
    [targetId],
  );
  if (targetRes.rows.length === 0) {
    throw AppError.notFound('User not found');
  }

  const target = targetRes.rows[0];
  await ensureNotLastActiveAdmin(client, target);

  if (action === 'suspend') {
    await client.query(
      `UPDATE users
       SET status = 'suspended', suspended_until = $2, status_reason = $3, updated_at = now()
       WHERE id = $1`,
      [targetId, until, reason],
    );
    await tokenService.revokeAllUserRefreshTokens(targetId, { db: client });
    await writeAudit(client, {
      adminId,
      action: 'suspend',
      targetUserId: targetId,
      meta: { until, reason },
    });
  } else if (action === 'ban') {
    await client.query(
      `UPDATE users
       SET status = 'banned', suspended_until = NULL, status_reason = $2, updated_at = now()
       WHERE id = $1`,
      [targetId, reason],
    );
    await tokenService.revokeAllUserRefreshTokens(targetId, { db: client });
    await writeAudit(client, {
      adminId,
      action: 'ban',
      targetUserId: targetId,
      meta: { reason },
    });
  }
}

async function getStats() {
  const [userStats, reportStats, msgStats, convoStats] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*)::int AS total_users,
        COUNT(*) FILTER (WHERE gender = 'male')::int AS male,
        COUNT(*) FILTER (WHERE gender = 'female')::int AS female,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('day', now()))::int AS new_today,
        COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days')::int AS new_7d,
        COUNT(*) FILTER (WHERE status = 'suspended')::int AS suspended,
        COUNT(*) FILTER (WHERE status = 'banned')::int AS banned
      FROM users
    `),
    pool.query(`SELECT COUNT(*)::int AS open_reports FROM reports WHERE status = 'open'`),
    pool.query(
      `SELECT COUNT(*)::int AS messages_today FROM messages WHERE created_at >= date_trunc('day', now())`,
    ),
    pool.query(
      `SELECT COUNT(*)::int AS conversations_active FROM conversations WHERE status = 'active'`,
    ),
  ]);

  const u = userStats.rows[0] || {};
  return {
    totalUsers: Number(u.total_users || 0),
    male: Number(u.male || 0),
    female: Number(u.female || 0),
    onlineNow: presenceService.getOnlineCount(),
    newToday: Number(u.new_today || 0),
    new7d: Number(u.new_7d || 0),
    suspended: Number(u.suspended || 0),
    banned: Number(u.banned || 0),
    openReports: Number(reportStats.rows[0]?.open_reports || 0),
    messagesToday: Number(msgStats.rows[0]?.messages_today || 0),
    conversationsActive: Number(convoStats.rows[0]?.conversations_active || 0),
  };
}

async function listUsers({ status, gender, q, limit = 20, cursor }) {
  const decodedCursor = decodeCursor(cursor, isValidTimeIdCursor);
  const conditions = [];
  const params = [];

  if (status) {
    params.push(status);
    conditions.push(`u.status = $${params.length}`);
  }
  if (gender) {
    params.push(gender);
    conditions.push(`u.gender = $${params.length}`);
  }
  if (q) {
    params.push(`%${escapeLike(q)}%`);
    conditions.push(
      `(u.anon_username ILIKE $${params.length} ESCAPE '\\' OR u.email::text ILIKE $${params.length} ESCAPE '\\')`,
    );
  }
  if (decodedCursor) {
    params.push(decodedCursor.ts, decodedCursor.id);
    conditions.push(
      `(u.created_at, u.id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`,
    );
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(limit + 1);

  const { rows } = await pool.query(
    `${ADMIN_USER_SELECT}
     ${whereClause}
     ORDER BY u.created_at DESC, u.id DESC
     LIMIT $${params.length}`,
    params,
  );

  const page = slicePage(rows, limit, (lastRow) => ({
    ts: new Date(lastRow.created_at).toISOString(),
    id: lastRow.id,
  }));

  return {
    items: page.rows.map(toAdminUser),
    nextCursor: page.nextCursor,
  };
}

async function getUserDetail(userId) {
  const userRes = await pool.query(`${ADMIN_USER_SELECT} WHERE u.id = $1`, [userId]);
  if (userRes.rows.length === 0) {
    throw AppError.notFound('User not found');
  }

  const [reportsRes, auditRes] = await Promise.all([
    pool.query(
      `SELECT
         r.id, r.reason, r.details, r.status, r.resolution_note, r.created_at, r.resolved_at,
         r.reporter_id, rep.anon_username AS reporter_anon_username,
         r.reported_id, rptd.anon_username AS reported_anon_username, rptd.status AS reported_status,
         r.handled_by, h.anon_username AS handled_by_anon_username
       FROM reports r
       JOIN users rptd ON rptd.id = r.reported_id
       LEFT JOIN users rep ON rep.id = r.reporter_id
       LEFT JOIN users h ON h.id = r.handled_by
       WHERE r.reported_id = $1
       ORDER BY r.created_at DESC
       LIMIT 20`,
      [userId],
    ),
    pool.query(
      `SELECT
         a.id, a.action, a.admin_id, adm.anon_username AS admin_anon_username,
         a.target_user_id, tgt.anon_username AS target_anon_username,
         a.meta, a.created_at
       FROM admin_audit_log a
       LEFT JOIN users adm ON adm.id = a.admin_id
       LEFT JOIN users tgt ON tgt.id = a.target_user_id
       WHERE a.target_user_id = $1
       ORDER BY a.id DESC
       LIMIT 20`,
      [userId],
    ),
  ]);

  return {
    user: toAdminUser(userRes.rows[0]),
    recentReports: reportsRes.rows.map(toAdminReportSummary),
    auditEntries: auditRes.rows.map(toAuditEntry),
  };
}

async function suspendUser(adminId, targetId, { until, reason }) {
  await withTransaction(async (client) => {
    await applyUserModerationInTx(client, {
      adminId,
      targetId,
      action: 'suspend',
      reason,
      until,
    });
  });
  invalidateUserAuthCache(targetId);
  emitForceLogout({ userId: targetId, reason: 'suspended' });
}

async function banUser(adminId, targetId, { reason }) {
  await withTransaction(async (client) => {
    await applyUserModerationInTx(client, {
      adminId,
      targetId,
      action: 'ban',
      reason,
    });
  });
  invalidateUserAuthCache(targetId);
  emitForceLogout({ userId: targetId, reason: 'banned' });
}

async function reinstateUser(adminId, targetId) {
  await withTransaction(async (client) => {
    const res = await client.query(
      `UPDATE users
       SET status = 'active', suspended_until = NULL, status_reason = NULL, updated_at = now()
       WHERE id = $1
       RETURNING id`,
      [targetId],
    );
    if (res.rows.length === 0) {
      throw AppError.notFound('User not found');
    }
    await writeAudit(client, {
      adminId,
      action: 'reinstate',
      targetUserId: targetId,
    });
  });
  invalidateUserAuthCache(targetId);
}

async function changeUserRole(adminId, targetId, { role }) {
  const callerRes = await pool.query(`SELECT email FROM users WHERE id = $1`, [adminId]);
  const callerEmail = String(callerRes.rows[0]?.email || '').toLowerCase();
  if (callerEmail !== env.SUPER_ADMIN_EMAIL.trim().toLowerCase()) {
    throw AppError.forbidden('FORBIDDEN', 'Only the super-admin may change user roles');
  }

  await withTransaction(async (client) => {
    const targetRes = await client.query(
      `SELECT id, role, status FROM users WHERE id = $1 FOR UPDATE`,
      [targetId],
    );
    if (targetRes.rows.length === 0) {
      throw AppError.notFound('User not found');
    }

    const target = targetRes.rows[0];
    if (target.role === 'admin' && role === 'user') {
      if (adminId === targetId) {
        throw AppError.badRequest('Cannot demote your own admin role');
      }
      await ensureNotLastActiveAdmin(client, target);
    }

    await client.query(`UPDATE users SET role = $2, updated_at = now() WHERE id = $1`, [
      targetId,
      role,
    ]);
    await writeAudit(client, {
      adminId,
      action: 'role.change',
      targetUserId: targetId,
      meta: { role },
    });
  });

  invalidateUserAuthCache(targetId);
}

async function listReports({ status, limit = 20, cursor }) {
  const decodedCursor = decodeCursor(cursor, isValidTimeIdCursor);
  const conditions = [];
  const params = [];

  if (status) {
    params.push(status);
    conditions.push(`r.status = $${params.length}`);
  }
  if (decodedCursor) {
    params.push(decodedCursor.ts, decodedCursor.id);
    conditions.push(
      `(r.created_at, r.id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`,
    );
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(limit + 1);

  const { rows } = await pool.query(
    `SELECT
       r.id, r.reason, r.details, r.status, r.resolution_note, r.created_at, r.resolved_at,
       r.reporter_id, rep.anon_username AS reporter_anon_username,
       r.reported_id, rptd.anon_username AS reported_anon_username, rptd.status AS reported_status,
       r.handled_by, h.anon_username AS handled_by_anon_username
     FROM reports r
     JOIN users rptd ON rptd.id = r.reported_id
     LEFT JOIN users rep ON rep.id = r.reporter_id
     LEFT JOIN users h ON h.id = r.handled_by
     ${whereClause}
     ORDER BY r.created_at DESC, r.id DESC
     LIMIT $${params.length}`,
    params,
  );

  const page = slicePage(rows, limit, (lastRow) => ({
    ts: new Date(lastRow.created_at).toISOString(),
    id: lastRow.id,
  }));

  return {
    items: page.rows.map(toAdminReportSummary),
    nextCursor: page.nextCursor,
  };
}

async function getReportDetail(reportId) {
  const { rows } = await pool.query(
    `SELECT
       r.id, r.conversation_id, r.reason, r.details, r.snapshot, r.status, r.resolution_note,
       r.created_at, r.resolved_at,
       r.reporter_id, rep.anon_username AS reporter_anon_username,
       r.reported_id, rptd.anon_username AS reported_anon_username, rptd.status AS reported_status,
       r.handled_by, h.anon_username AS handled_by_anon_username
     FROM reports r
     JOIN users rptd ON rptd.id = r.reported_id
     LEFT JOIN users rep ON rep.id = r.reporter_id
     LEFT JOIN users h ON h.id = r.handled_by
     WHERE r.id = $1`,
    [reportId],
  );

  if (rows.length === 0) {
    throw AppError.notFound('Report not found');
  }

  return toAdminReportDetail(rows[0]);
}

async function updateReport(adminId, reportId, { status, resolutionNote, action = 'none', until }) {
  let moderationApplied = null;
  let reportedUserId = null;

  await withTransaction(async (client) => {
    const reportRes = await client.query(
      `SELECT id, reported_id, status FROM reports WHERE id = $1 FOR UPDATE`,
      [reportId],
    );
    if (reportRes.rows.length === 0) {
      throw AppError.notFound('Report not found');
    }

    const report = reportRes.rows[0];
    reportedUserId = report.reported_id;

    const allowedNext = ALLOWED_REPORT_TRANSITIONS[report.status] || new Set();
    if (!allowedNext.has(status)) {
      throw AppError.badRequest(`Cannot transition report from "${report.status}" to "${status}"`);
    }

    const isFinal = status === 'resolved' || status === 'dismissed';
    await client.query(
      `UPDATE reports
       SET status = $2,
           resolution_note = COALESCE($3, resolution_note),
           handled_by = $4,
           resolved_at = CASE WHEN $5 THEN now() ELSE resolved_at END
       WHERE id = $1`,
      [reportId, status, resolutionNote || null, adminId, isFinal],
    );

    if (action === 'suspend' || action === 'ban') {
      await applyUserModerationInTx(client, {
        adminId,
        targetId: report.reported_id,
        action,
        reason: resolutionNote || `Report ${reportId} resolved`,
        until,
      });
      moderationApplied = action;
    }

    await writeAudit(client, {
      adminId,
      action: `report.${status === 'reviewing' ? 'review' : status}`,
      targetUserId: report.reported_id,
      meta: { reportId, status, action, resolutionNote: resolutionNote || null },
    });
  });

  if (moderationApplied && reportedUserId) {
    invalidateUserAuthCache(reportedUserId);
    emitForceLogout({
      userId: reportedUserId,
      reason: moderationApplied === 'ban' ? 'banned' : 'suspended',
    });
  }

  return getReportDetail(reportId);
}

async function listActivity({ limit = 20, cursor }) {
  const decodedCursor = decodeCursor(cursor, isValidAuditCursor);
  const params = [];
  let whereClause = '';

  if (decodedCursor) {
    params.push(decodedCursor.id);
    whereClause = `WHERE a.id < $1`;
  }

  params.push(limit + 1);
  const { rows } = await pool.query(
    `SELECT
       a.id, a.action, a.admin_id, adm.anon_username AS admin_anon_username,
       a.target_user_id, tgt.anon_username AS target_anon_username,
       a.meta, a.created_at
     FROM admin_audit_log a
     LEFT JOIN users adm ON adm.id = a.admin_id
     LEFT JOIN users tgt ON tgt.id = a.target_user_id
     ${whereClause}
     ORDER BY a.id DESC
     LIMIT $${params.length}`,
    params,
  );

  const page = slicePage(rows, limit, (lastRow) => ({ id: Number(lastRow.id) }));

  return {
    items: page.rows.map(toAuditEntry),
    nextCursor: page.nextCursor,
  };
}

async function listOnlineUsers() {
  const onlineIds = presenceService.getOnlineUserIds();
  if (onlineIds.length === 0) {
    return { items: [] };
  }

  const { rows } = await pool.query(
    `${ADMIN_USER_SELECT}
     WHERE u.id = ANY($1::uuid[])
     ORDER BY u.anon_username ASC`,
    [onlineIds],
  );

  return {
    items: rows.map(toAdminUser),
  };
}

module.exports = {
  getStats,
  listUsers,
  getUserDetail,
  suspendUser,
  banUser,
  reinstateUser,
  changeUserRole,
  listReports,
  getReportDetail,
  updateReport,
  listActivity,
  listOnlineUsers,
};
