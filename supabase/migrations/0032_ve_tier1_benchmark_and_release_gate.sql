-- VE-TIER1-3: benchmark and release gate
-- Idempotent mirror of the official Tier 1 reinforcement registered in Supabase.

insert into public.vexforge_tier1_phases (phase, name, goal, exit_criteria, status)
values (7, 'Benchmark y release readiness', 'Demostrar que VEXFORGE compite, retiene, escala y puede operar con evidencia frente a su benchmark vivo.', 'benchmark_definition, competitive_integrity, network_resilience, monetization_fairness, retention_validation, release_readiness, player_trust y evidence_reproducibility en MET; ningun criterio del plan fuera de MET.', 'NOT_STARTED')
on conflict (phase) do update set name=excluded.name, goal=excluded.goal, exit_criteria=excluded.exit_criteria, status=excluded.status, updated_at=now();

-- The eight criteria are seeded by the authoritative Supabase transaction for this unit.
-- This migration is intentionally a source-control mirror; reapplying it is safe.

update public.vexforge_project_decisions
set description = replace(description, 'ningun criterio con blocking = true fuera de MET', 'ningun criterio del plan fuera de MET'),
    official_payload = official_payload || jsonb_build_object('tier1_declaration_rule', 'ningun criterio del plan fuera de MET')
where decision_key = 'VE-VIS-2-TIER1-PLAN-EXTENSION';
