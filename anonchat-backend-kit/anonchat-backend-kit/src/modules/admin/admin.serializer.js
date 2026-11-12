const { env } = require('../../config/env');
const presenceService = require('../../services/presenceService');

function toAdminUser(row) {
  const user = {
    id: row.id,
    anonUsername: row.anon_username,
    email: row.email,
    gender: row.gender,
    status: row.status,
    role: row.role,
    isOnline: presenceService.isOnline(row.id),
    reportCount: Number(row.report_count || 0),
    createdAt: new Date(row.created_at).toISOString(),
    lastSeenAt: row.last_seen_at ? new Date(row.last_seen_at).toISOString() : null,
    suspendedUntil: row.suspended_until ? new Date(row.suspended_until).toISOString() : null,
  };

  if (env.ADMIN_CAN_SEE_FULL_NAME) {
    user.fullName = row.full_name;
  }

  return user;
}

function toAdminReportSummary(row) {
  return {
    id: row.id,
    reason: row.reason,
    details: row.details || null,
    status: row.status,
    resolutionNote: row.resolution_note || null,
    createdAt: new Date(row.created_at).toISOString(),
    resolvedAt: row.resolved_at ? new Date(row.resolved_at).toISOString() : null,
    reporter: row.reporter_id
      ? { id: row.reporter_id, anonUsername: row.reporter_anon_username }
      : null,
    reported: {
      id: row.reported_id,
      anonUsername: row.reported_anon_username,
      status: row.reported_status,
    },
    handledBy: row.handled_by
      ? { id: row.handled_by, anonUsername: row.handled_by_anon_username }
      : null,
  };
}

function toAdminReportDetail(row) {
  const summary = toAdminReportSummary(row);
  const rawSnapshot = Array.isArray(row.snapshot) ? row.snapshot : [];
  const snapshot = rawSnapshot.map((entry) => {
    let roleLabel = 'Participant';
    if (row.reporter_anon_username && entry.sender === row.reporter_anon_username) {
      roleLabel = 'Reporter';
    } else if (row.reported_anon_username && entry.sender === row.reported_anon_username) {
      roleLabel = 'Reported';
    }
    return {
      sender: entry.sender,
      roleLabel,
      body: entry.body,
      at: entry.at,
    };
  });

  return {
    ...summary,
    conversationId: row.conversation_id || null,
    snapshot,
  };
}

function toAuditEntry(row) {
  return {
    id: Number(row.id),
    action: row.action,
    admin: row.admin_id ? { id: row.admin_id, anonUsername: row.admin_anon_username } : null,
    targetUser: row.target_user_id
      ? { id: row.target_user_id, anonUsername: row.target_anon_username }
      : null,
    meta: row.meta || null,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

module.exports = {
  toAdminUser,
  toAdminReportSummary,
  toAdminReportDetail,
  toAuditEntry,
};
