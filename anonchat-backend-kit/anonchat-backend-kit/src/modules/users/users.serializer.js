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

module.exports = { toMe };

