-- VE-QA-1-AUTHENTICATED-SURFACE-SWEEP
-- Hallazgo medido en vivo: public.vexforge_treasury tenia RLS habilitado con una
-- unica politica TO service_role. El rol authenticated tenia GRANT de columnas
-- pero ninguna politica, asi que el select devolvia 0 filas sin error y
-- /deposit quedaba colgado en el loader (chains.length === 0).
-- Correccion de minimo privilegio: lectura authenticated limitada a las wallets
-- activas del tesoro del proyecto. anon sigue sin lectura.

alter table public.vexforge_treasury enable row level security;

drop policy if exists authenticated_read_active_project_treasury on public.vexforge_treasury;

create policy authenticated_read_active_project_treasury
on public.vexforge_treasury
for select
to authenticated
using (active = true and purpose = 'project_treasury');
