# Admin & Moderation
- Admin = `users.role='admin'`. Created only by `seed:admin` or by super-admin via `/admin/users/:id/role`. No public way to become admin.
- Router-level guard: `router.use(authenticate, requireAdmin)`. Admin accounts are hidden from discovery and cannot be reported/banned by regular flows.
- Stats SQL: counts by gender (`COUNT(*) FILTER (WHERE gender='male')`), online from presenceService, new today/7d, open reports, messages today (count only).
- Suspend: set `status='suspended'`, `suspended_until`, `status_reason`; revoke tokens; force-logout; write audit. Ban: `status='banned'`. Reinstate: `status='active'`, clear fields. Login auto-lifts expired suspensions.
- Report workflow: open → reviewing → resolved/dismissed. Action on resolve may suspend/ban reported user (one transaction + audit row).
- Admin can never see message content except `reports.snapshot`. Show snapshots with anon usernames (`Reporter` / `Reported`) only.
- Prevent self-ban and banning the last admin.
- Pagination everywhere; search by anon username or email (`ILIKE`, escape `%`/`_`).
