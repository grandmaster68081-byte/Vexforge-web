# Supabase web-surface retirement

The old VEXFORGE web application contained client-side surfaces that are no longer part of the product: login/dashboard, PvP views, marketplace, inventory, economy, admin and other operational screens.

This package intentionally does **not** issue destructive SQL against Supabase because some of those objects may be shared with the Unity runtime. Before deleting any table/view/RPC/function/policy, verify:

1. no `unity/` code calls it;
2. no server function depends on it;
3. no current production client depends on it;
4. backups/export exist;
5. the object is explicitly marked `WEB_LEGACY_ONLY`.

Only then should a separate maintenance migration remove it.
