-- VE-2-ACHIEVEMENTS-ICON-DATA
-- Migra public.achievements.icon de sustitutos Unicode heredados a nombres de
-- glifo canónicos de ForgeIcon (regla de cero genéricos del Protocolo Maestro).
-- El valor heredado se conserva en metadata.legacy_icon para reversibilidad.
-- No modifica puntos, recompensas, categorías, RLS, RPCs ni desbloqueos.

begin;

-- 1. Respaldo del valor heredado (idempotente: no sobrescribe un respaldo previo).
update public.achievements
set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('legacy_icon', icon)
where icon is not null
  and icon <> ''
  and not (coalesce(metadata, '{}'::jsonb) ? 'legacy_icon');

-- 2. Asignación canónica por code.
update public.achievements a
set icon = m.glyph
from (values
  ('boss_slayer_1','boss'),
  ('boss_slayer_5','skull'),
  ('first_rare','gem'),
  ('first_epic','spark'),
  ('first_legendary','star'),
  ('first_mythic','eclipse'),
  ('collector_25','collection'),
  ('collector_50','cards'),
  ('collector_127','trophy'),
  ('daily_streak_7','calendar'),
  ('daily_streak_30','flame'),
  ('merchant_5','coin'),
  ('merchant_25','market'),
  ('forger_5','fusion'),
  ('forger_25','evolution'),
  ('forger_100','flux'),
  ('missions_10','map'),
  ('missions_50','banner'),
  ('pack_opener_10','packs'),
  ('first_win','attack'),
  ('pvp_10','shield'),
  ('pvp_50','crown'),
  ('pvp_100','rank-mythic'),
  ('clan_founder','clans'),
  ('clan_veteran','friends')
) as m(code, glyph)
where a.code = m.code
  and a.icon is distinct from m.glyph;

-- 3. Cualquier logro sin mapa explicito degrada al glifo neutro canonico.
update public.achievements
set icon = 'achievements'
where icon is null
   or icon !~ '^[a-z][a-z0-9-]*$';

commit;
