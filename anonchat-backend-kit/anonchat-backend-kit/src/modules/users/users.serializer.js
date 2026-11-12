/**
 * Serializes a database user row into the contract `Me` object.
 * Never returns password_hash or internal moderation fields.
 * @param {Record<string, any>} row
 */
function toMe(row) {
  return {
    id: row.id,
    anonUsername: row.anon_username,
    fullName: row.full_name,
    email: row.email,
    gender: row.gender,
    avatarColor: row.avatar_color,
    role: row.role,
    theme: row.theme,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

/**
 * Single serializer for public member data.
 * NEVER add email, fullName, lastSeen, createdAt, or any real-world identifier here.
 * @param {Record<string, any>} row
 * @param {{ isOnline?: boolean, blockedByMe?: boolean }} [opts]
 */
function toPublicMember(row, opts = {}) {
  return {
    id: row.id,
    anonUsername: row.anon_username,
    gender: row.gender,
    avatarColor: row.avatar_color,
    isOnline: Boolean(opts.isOnline),
    blockedByMe: Boolean(opts.blockedByMe),
  };
}

module.exports = { toMe, toPublicMember };
