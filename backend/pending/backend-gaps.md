# Pending: backend gaps (not frontend-fixable)

These need an owner decision, not more frontend work:

- **inventory**: only RLS policy is `service_role`-only. No public or
  authenticated read path exists at all. If this feature is meant to ship,
  someone needs to add a scoped RLS policy or an RPC.
- **fusion** (`vexforge_card_fusion_log`, `vexforge_card_fusion_policy`): same
  situation — `service_role`-only, no frontend path.
- **SECURITY DEFINER views**: not enumerated as of chat 21/22. Should be
  audited before assuming any view is safe to read from the client.
- **Auth provider**: not configured yet. Blocks 4 domains (see
  `auth-and-writes.md`).
