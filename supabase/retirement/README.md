# Web retirement / database cleanup

This folder is deliberately non-destructive.

The portal remaster removes the old web client from the application layer, but it must not drop database tables/RPCs blindly: VEXFORGE Unity may share backend objects with the retired web application.

Use `01_web_object_audit.sql` to identify candidates. A candidate is only safe to remove after a repository-wide and Unity consumer audit proves that no active Unity feature, RPC, job, policy, edge function or production process uses it.

No new portal tables are introduced by this remaster.
