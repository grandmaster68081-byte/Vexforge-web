-- VE-VIS-2-TIER1-PLAN-EXTENSION
-- Solo gobierno del plan: no toca esquema de juego, economia, RLS de datos de jugador,
-- Storage ni arte. Extiende el objetivo Tier 1 de "calidad visual" a "juego Tier 1 del
-- genero" (RPG de forja / gacha competitivo) y lo hace medible por fases, con unidad
-- responsable por criterio, para que cualquier IA futura sepa que falta y como se mide.

-- 1) Columnas de gobierno del criterio -------------------------------------------------

alter table public.vexforge_visual_tier1_objective
  add column if not exists owning_unit text,
  add column if not exists phase integer not null default 0;

comment on column public.vexforge_visual_tier1_objective.owning_unit is
  'text. Unidad de protocolo responsable de llevar el criterio a MET. Nula si ya esta cerrado.';
comment on column public.vexforge_visual_tier1_objective.phase is
  'integer. Fase del plan Tier 1 (ver public.vexforge_tier1_phases). 0 = criterio heredado ya cerrado o sin fase asignada.';

comment on table public.vexforge_visual_tier1_objective is
  'VE-VIS-1/VE-VIS-2: criterios medibles del objetivo final del protocolo (juego Tier 1 del genero: RPG de forja / gacha competitivo). Solo lectura publica; se actualiza por migracion con evidencia real de verify:all o del deploy vivo. El criterio no se marca MET sin evidencia reproducible.';

-- 2) Fases del plan --------------------------------------------------------------------

create table if not exists public.vexforge_tier1_phases (
  id uuid primary key default gen_random_uuid(),
  phase integer not null unique,
  name text not null,
  goal text not null,
  exit_criteria text not null,
  status text not null check (status in ('DONE', 'IN_PROGRESS', 'NOT_STARTED')),
  updated_at timestamptz not null default now()
);

grant select on public.vexforge_tier1_phases to anon;
grant select on public.vexforge_tier1_phases to authenticated;
grant all on public.vexforge_tier1_phases to service_role;

alter table public.vexforge_tier1_phases enable row level security;

drop policy if exists "public_read_tier1_phases" on public.vexforge_tier1_phases;
create policy "public_read_tier1_phases"
  on public.vexforge_tier1_phases
  for select
  to anon, authenticated
  using (true);

comment on table public.vexforge_tier1_phases is
  'VE-VIS-2: hoja de ruta por fases hacia Tier 1. Cada fase agrupa criterios de public.vexforge_visual_tier1_objective por su columna phase. Solo lectura publica; se actualiza por migracion.';
comment on column public.vexforge_tier1_phases.id is 'uuid. Clave primaria. Obligatoria. Por defecto gen_random_uuid().';
comment on column public.vexforge_tier1_phases.phase is 'integer. Numero de fase. Obligatorio y unico. Se ejecutan en orden ascendente.';
comment on column public.vexforge_tier1_phases.name is 'text. Nombre corto de la fase.';
comment on column public.vexforge_tier1_phases.goal is 'text. Objetivo de la fase en una frase.';
comment on column public.vexforge_tier1_phases.exit_criteria is 'text. Condicion verificable para dar la fase por cerrada.';
comment on column public.vexforge_tier1_phases.status is 'text. DONE, IN_PROGRESS o NOT_STARTED.';
comment on column public.vexforge_tier1_phases.updated_at is 'timestamptz. Ultima actualizacion. Obligatoria. Por defecto now().';

insert into public.vexforge_tier1_phases (phase, name, goal, exit_criteria, status) values
  (1, 'Arte y manifiesto',
   'Todo lo que se ve tiene arte propio, inscrito y servido.',
   'surface_backgrounds, boss_art, card_art y asset_manifest_integrity en MET con verify:all verde.',
   'DONE'),
  (2, 'Identidad y layout',
   'Un unico sistema visual: tokens, iconos, tipografia y layout responsive sin desbordes.',
   'ui_identity_tokens, icon_language, mobile_layout y loading_and_empty_states en MET.',
   'IN_PROGRESS'),
  (3, 'Vida de la interfaz',
   'La superficie deja de ser estatica: motion canonico, direccion de escena en combate y flujo sonoro.',
   'motion_and_feedback, combat_scene_direction y audio_flow en MET, cada uno con guarda en verify:all.',
   'NOT_STARTED'),
  (4, 'Bucle medido y primera sesion',
   'El juego se mide y la primera sesion convierte: telemetria del bucle, onboarding y economia legible.',
   'game_loop_telemetry, first_session_flow y economy_readability en MET.',
   'NOT_STARTED'),
  (5, 'Profundidad competitiva y live-ops',
   'Hay razon para volver: contenido con profundidad, temporadas vivas y capa social/competitiva.',
   'content_depth, live_ops_seasons y social_competitive en MET.',
   'NOT_STARTED'),
  (6, 'Acabado Tier 1',
   'Rendimiento, accesibilidad, estabilidad y una firma de diseno reconocible.',
   'performance_budget, accessibility_baseline, stability_error_budget y design_uniqueness en MET; ningun criterio blocking fuera de MET.',
   'NOT_STARTED')
on conflict (phase) do update set
  name = excluded.name,
  goal = excluded.goal,
  exit_criteria = excluded.exit_criteria,
  status = excluded.status,
  updated_at = now();

-- 3) Fase y unidad responsable de los criterios ya inscritos ---------------------------

update public.vexforge_visual_tier1_objective set phase = 1, updated_at = now()
  where criterion_key in ('surface_backgrounds','boss_art','card_art','asset_manifest_integrity');
update public.vexforge_visual_tier1_objective set phase = 2, updated_at = now()
  where criterion_key in ('ui_identity_tokens','icon_language','mobile_layout','loading_and_empty_states');
update public.vexforge_visual_tier1_objective set phase = 6, updated_at = now()
  where criterion_key = 'asset_hygiene';
update public.vexforge_visual_tier1_objective
  set owning_unit = 'VE-VIS-3-ICON-LANGUAGE-RESIDUAL', updated_at = now()
  where criterion_key = 'icon_language';
update public.vexforge_visual_tier1_objective
  set owning_unit = 'VE-VIS-3-EMPTY-STATE-ART', updated_at = now()
  where criterion_key = 'loading_and_empty_states';
update public.vexforge_visual_tier1_objective
  set owning_unit = 'VE-9-BOSS-ART-VARIANT-DECISION', updated_at = now()
  where criterion_key = 'asset_hygiene';

-- El sistema de motion diseñado en la sesion anterior NO llego al repositorio: se
-- especifica aqui como contrato de implementacion, pero el criterio sigue sin cumplir.
update public.vexforge_visual_tier1_objective
set objective = 'Sistema de motion canonico unico: tokens de duracion, curva y distancia; entrada de superficie por cambio de ruta; escalonado de listas; press/lift en controles; escena cinematica y curva de impacto en resultado de combate; guarda completa de prefers-reduced-motion.',
    measure_source = 'scripts/verify-motion.mjs encadenado en verify:all + evidencia de navegador sobre el deploy',
    target_value = '17 tokens declarados y consumidos, 8 clases publicas aplicadas en src/, prefers-reduced-motion presente, 0 animaciones ad hoc fuera del sistema',
    current_value = 'sin sistema de motion en el repositorio (el diseno de VE-VIS-2 no llego a commit)',
    status = 'NOT_STARTED',
    blocking = true,
    phase = 3,
    owning_unit = 'VE-VIS-3-MOTION-SYSTEM',
    notes = 'Contrato heredado de la sesion VE-VIS-2: src/styles.css (tokens --motion-dur-*, --motion-ease-*, --motion-dist-* y clases motion-surface, motion-stagger, motion-press, motion-lift, motion-scene, motion-impact, motion-nudge, motion-reveal), consumo en App.tsx, HomeRoute.tsx y BattleResultScreen.tsx, y guarda scripts/verify-motion.mjs en verify:all.',
    updated_at = now()
where criterion_key = 'motion_and_feedback';

-- 4) Criterios que faltaban para que el plan describa un juego Tier 1 ------------------

insert into public.vexforge_visual_tier1_objective
  (criterion_key, area, objective, measure_source, target_value, current_value, status, blocking, sort_order, phase, owning_unit, notes)
values
  ('combat_scene_direction', 'motion',
   'El combate se dirige como escena: entrada de contendientes, ritmo por turno, impacto legible por tipo de accion, camara/foco en el golpe decisivo y cierre de resultado con jerarquia clara.',
   'scripts/verify-combat-scene.mjs + evidencia de navegador sobre una batalla completa en el deploy',
   'toda accion de combate produce respuesta visual dedicada; 0 turnos sin feedback',
   'combate resuelto por texto y estados; sin direccion de escena',
   'NOT_STARTED', true, 110, 3, 'VE-VIS-4-COMBAT-SCENE-DIRECTION',
   'Depende del sistema de motion (VE-VIS-3).'),
  ('audio_flow', 'audio',
   'Flujo sonoro coherente: musica por contexto (forja, mapa, combate, resultado), efectos para acciones canonicas y control de volumen/silencio persistente y respetuoso con el arranque sin interaccion.',
   'scripts/verify-audio-manifest.mjs (assets inscritos y resolubles) + QA de navegador',
   'todo asset de audio inscrito en el manifiesto y 4 contextos musicales cubiertos',
   'sin capa de audio',
   'NOT_STARTED', true, 120, 3, 'VE-VIS-5-AUDIO-FLOW',
   'El audio nunca arranca sin gesto del usuario; preferencia persistida por jugador.'),
  ('game_loop_telemetry', 'producto',
   'El bucle de juego esta medido: eventos canonicos de sesion, forja, combate, recompensa y retorno persistidos y consultables para decidir con datos y no con opinion.',
   'tabla de telemetria en Supabase + scripts/verify-telemetry.mjs',
   'los 5 eventos canonicos del bucle emitidos y consultables',
   'sin telemetria de producto',
   'NOT_STARTED', true, 130, 4, 'VE-VIS-6-GAME-LOOP-TELEMETRY',
   'Solo datos de juego propios del jugador; sin datos personales fuera de user_id.'),
  ('first_session_flow', 'producto',
   'La primera sesion ensena y convierte: onboarding guiado hasta el primer combate y la primera forja en menos de 3 minutos, con recompensa inicial y ningun callejon sin salida.',
   'recorrido Playwright de cuenta nueva sobre el deploy + telemetria de primera sesion',
   'primer combate y primera forja alcanzables en <= 3 min sin ayuda externa',
   'la cuenta nueva aterriza sin guia',
   'NOT_STARTED', true, 140, 4, 'VE-VIS-7-FIRST-SESSION-FLOW',
   null),
  ('economy_readability', 'producto',
   'Toda moneda, coste, probabilidad y recompensa se explica en pantalla: tasas de gacha publicadas, costes previos a la accion y balance de progresion documentado.',
   'catalogo de economia en Supabase + auditoria de superficies de tienda, forja e invocacion',
   'tasas publicadas y 0 acciones con coste oculto',
   'costes visibles parcialmente; tasas no publicadas',
   'PARTIAL', true, 150, 4, 'VE-VIS-7-ECONOMY-READABILITY',
   'Requisito de confianza en gacha competitivo.'),
  ('content_depth', 'producto',
   'Hay profundidad real: suficientes cartas, jefes, misiones y modos para sostener progresion mas alla de la primera semana, con curva de dificultad declarada.',
   'conteo vivo de catalogos + curva de dificultad registrada en decisiones',
   'catalogo suficiente para 7+ dias de progresion con curva declarada',
   '127 cartas y 15 jefes inscritos; curva de dificultad no declarada',
   'PARTIAL', true, 160, 5, 'VE-VIS-10-CONTENT-DEPTH',
   null),
  ('live_ops_seasons', 'producto',
   'El juego respira: temporadas con inicio y cierre, eventos rotativos, recompensas de temporada y estado de temporada visible al jugador.',
   'catalogo de temporadas/eventos en Supabase + QA de la superficie de rangos',
   'temporada activa siempre definida y visible, con cierre y premiacion automaticos',
   'rangos de temporada presentes; ciclo de temporada sin cierre automatico',
   'PARTIAL', true, 170, 5, 'VE-VIS-11-LIVE-OPS-SEASONS',
   null),
  ('social_competitive', 'producto',
   'Capa competitiva y social creible: PvP con emparejamiento justo, clasificaciones fiables, historial de combates y comparacion con otros jugadores.',
   'QA autenticada con la cuenta canonica VE-QA-01 + auditoria de emparejamiento',
   'PvP jugable con emparejamiento e historial verificados en el deploy',
   'PvP y clasificaciones presentes; emparejamiento e historial sin verificar',
   'PARTIAL', true, 180, 5, 'VE-VIS-12-SOCIAL-COMPETITIVE',
   null),
  ('performance_budget', 'rendimiento',
   'Presupuesto de rendimiento declarado y cumplido en movil de gama media: carga inicial, peso de bundle y fluidez de animacion sin caidas perceptibles.',
   'medicion Lighthouse/Playwright sobre el deploy + tamano de bundle del build',
   'LCP <= 2.5 s, bundle inicial <= 350 kB gzip, animaciones a 60 fps',
   'sin presupuesto declarado ni medicion registrada',
   'NOT_STARTED', true, 190, 6, 'VE-VIS-8-PERFORMANCE-BUDGET',
   'El motion y el audio no pueden entrar sin este presupuesto medido.'),
  ('accessibility_baseline', 'higiene',
   'Base de accesibilidad: contraste suficiente, foco visible, navegacion por teclado, objetivos tactiles adecuados y textos alternativos en arte significativo.',
   'auditoria automatizada de accesibilidad sobre el deploy + revision de foco y contraste',
   '0 violaciones criticas de contraste y foco en las superficies principales',
   'sin auditoria de accesibilidad registrada',
   'NOT_STARTED', false, 200, 6, 'VE-VIS-13-ACCESSIBILITY-BASELINE',
   null),
  ('stability_error_budget', 'higiene',
   'Estabilidad verificable: 0 errores de consola en las rutas publicas y autenticadas, y ningun fallo de lectura por RLS o permisos en QA.',
   'scripts/verify-authed-qa.mjs + recorrido Playwright de todas las rutas del deploy',
   '0 errores de consola y 0 fallos de lectura en el recorrido completo',
   'rutas publicas limpias; recorrido autenticado completo pendiente de repetir',
   'PARTIAL', true, 210, 6, 'VE-VIS-14-STABILITY-ERROR-BUDGET',
   'Usa la cuenta QA canonica VE-QA-01.'),
  ('design_uniqueness', 'identidad',
   'Firma de diseno reconocible: la interfaz no es una plantilla generica; composicion, tipografia y lenguaje de forja identifican al producto en una sola captura.',
   'revision comparativa contra referentes del genero + decision de direccion registrada',
   'direccion de diseno registrada como decision oficial y aplicada en todas las superficies principales',
   'identidad de color e iconos coherente; composicion aun cercana a plantilla',
   'PARTIAL', true, 220, 6, 'VE-VIS-9-DESIGN-UNIQUENESS',
   'Ultimo criterio en cerrarse: consolida el resultado de todas las fases.')
on conflict (criterion_key) do update set
  area = excluded.area,
  objective = excluded.objective,
  measure_source = excluded.measure_source,
  target_value = excluded.target_value,
  current_value = excluded.current_value,
  status = excluded.status,
  blocking = excluded.blocking,
  sort_order = excluded.sort_order,
  phase = excluded.phase,
  owning_unit = excluded.owning_unit,
  notes = excluded.notes,
  updated_at = now();

-- 5) Decision canonica -----------------------------------------------------------------

insert into public.vexforge_project_decisions
  (decision_key, category, title, description, status, official_payload)
values (
  'VE-VIS-2-TIER1-PLAN-EXTENSION',
  'governance',
  'Plan Tier 1 extendido: de calidad visual a juego Tier 1 del genero',
  'El plan original (VE-VIS-1) solo cubria arte e identidad estatica, por lo que cumplirlo no producia un juego Tier 1. Decision canonica: el objetivo final del protocolo es un juego Tier 1 del genero (RPG de forja / gacha competitivo) y se mide con la tabla public.vexforge_visual_tier1_objective organizada en seis fases descritas en public.vexforge_tier1_phases. Se anaden doce criterios: combat_scene_direction, audio_flow, game_loop_telemetry, first_session_flow, economy_readability, content_depth, live_ops_seasons, social_competitive, performance_budget, accessibility_baseline, stability_error_budget y design_uniqueness. Cada criterio declara fuente de medicion, valor objetivo, valor medido, estado, fase y unidad responsable. Reglas: ningun criterio pasa a MET sin evidencia reproducible (guarda en verify:all o recorrido de navegador sobre el deploy vivo); las fases se ejecutan en orden ascendente; Tier 1 solo puede declararse cuando ningun criterio con blocking = true esta fuera de MET. El sistema de motion disenado en la sesion anterior no llego al repositorio: queda inscrito como contrato de la unidad VE-VIS-3-MOTION-SYSTEM y su criterio permanece NOT_STARTED.',
  'official',
  jsonb_build_object(
    'unit', 'VE-VIS-2-TIER1-PLAN-EXTENSION',
    'objective_table', 'public.vexforge_visual_tier1_objective',
    'phases_table', 'public.vexforge_tier1_phases',
    'phases', 6,
    'criteria_added', 12,
    'tier1_declaration_rule', 'ningun criterio con blocking = true fuera de MET',
    'evidence_rule', 'MET solo con guarda en verify:all o evidencia de navegador sobre el deploy vivo',
    'next_unit', 'VE-VIS-3-MOTION-SYSTEM',
    'reopen_condition', 'cambio de genero, de alcance del producto o incorporacion de un criterio nuevo de Tier 1'
  )
)
on conflict (decision_key) do update
set category = excluded.category,
    title = excluded.title,
    description = excluded.description,
    status = excluded.status,
    official_payload = excluded.official_payload,
    updated_at = now();
