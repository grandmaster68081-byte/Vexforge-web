-- VEXFORGE — VE-2-RANK-NOTIF-SHOP-ICON-DATA
-- Unidad de datos: elimina los sustitutos Unicode del DATO oficial y de las
-- funciones que lo generan, sustituyéndolos por nombres de glifo canónicos de
-- ForgeIcon (src/shared/components/ForgeIcon.tsx).
--
-- Alcance: presentación/identidad visual. No modifica MMR, tiers, umbrales,
-- shields, recompensas, precios, energía, RLS, roles ni resultados
-- autoritativos. Todo valor heredado queda respaldado y es reversible.
--
-- Idempotente: puede ejecutarse varias veces sin duplicar respaldo.

BEGIN;

-- 1. Respaldo canónico de valores heredados ----------------------------------
CREATE TABLE IF NOT EXISTS public.vexforge_icon_legacy (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table  text        NOT NULL,
  source_column text        NOT NULL,
  row_key       text        NOT NULL,
  legacy_value  text,
  canonical_value text,
  recorded_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_table, source_column, row_key)
);

GRANT ALL ON public.vexforge_icon_legacy TO service_role;
ALTER TABLE public.vexforge_icon_legacy ENABLE ROW LEVEL SECURITY;
-- Sin políticas: tabla de auditoría interna, no expuesta por la Data API.

-- 2. player_notifications.icon -> glifo canónico por tipo ---------------------
INSERT INTO public.vexforge_icon_legacy (source_table, source_column, row_key, legacy_value, canonical_value)
SELECT 'player_notifications', 'icon', n.id::text, n.icon,
       CASE n.type
         WHEN 'mission_reward'      THEN 'missions'
         WHEN 'achievement'         THEN 'achievements'
         WHEN 'achievement_unlock'  THEN 'achievements'
         WHEN 'market'              THEN 'market'
         WHEN 'market_sale'         THEN 'market'
         WHEN 'pvp'                 THEN 'attack'
         WHEN 'pvp_result'          THEN 'attack'
         WHEN 'raid'                THEN 'raid'
         WHEN 'pack'                THEN 'packs'
         WHEN 'reward'              THEN 'gift'
         WHEN 'economy'             THEN 'economy'
         WHEN 'withdrawal'          THEN 'withdrawal'
         WHEN 'deposit'             THEN 'deposit'
         WHEN 'friend'              THEN 'friends'
         WHEN 'clan'                THEN 'clans'
         WHEN 'admin'               THEN 'admin'
         ELSE 'notification'
       END
FROM public.player_notifications n
WHERE n.icon IS NOT NULL
ON CONFLICT (source_table, source_column, row_key) DO NOTHING;

UPDATE public.player_notifications n
   SET icon = l.canonical_value
  FROM public.vexforge_icon_legacy l
 WHERE l.source_table = 'player_notifications'
   AND l.source_column = 'icon'
   AND l.row_key = n.id::text
   AND n.icon IS DISTINCT FROM l.canonical_value;

-- 3. vexforge_shop_catalog.icon -> glifo canónico por producto ----------------
INSERT INTO public.vexforge_icon_legacy (source_table, source_column, row_key, legacy_value, canonical_value)
SELECT 'vexforge_shop_catalog', 'icon', s.item_key, s.icon,
       CASE s.item_key
         WHEN 'season_pass_premium'   THEN 'crown'
         WHEN 'xp_boost_7d'           THEN 'energy'
         WHEN 'xp_boost_24h'          THEN 'energy'
         WHEN 'charm_epic'            THEN 'spark'
         WHEN 'charm_rare'            THEN 'gem'
         WHEN 'charm_common'          THEN 'star'
         WHEN 'battle_skin'           THEN 'cosmetics'
         WHEN 'raid_key'              THEN 'key'
         WHEN 'vex_conversion_token'  THEN 'coin'
         ELSE 'shop'
       END
FROM public.vexforge_shop_catalog s
WHERE s.icon IS NOT NULL
ON CONFLICT (source_table, source_column, row_key) DO NOTHING;

UPDATE public.vexforge_shop_catalog s
   SET icon = l.canonical_value
  FROM public.vexforge_icon_legacy l
 WHERE l.source_table = 'vexforge_shop_catalog'
   AND l.source_column = 'icon'
   AND l.row_key = s.item_key
   AND s.icon IS DISTINCT FROM l.canonical_value;

-- 4. fn_notify_mission_complete: glifo canónico en el dato generado -----------
CREATE OR REPLACE FUNCTION public.fn_notify_mission_complete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_name TEXT; v_parts TEXT[] := '{}';
BEGIN
  IF NEW.status <> 'completed' OR OLD.status = 'completed' THEN RETURN NEW; END IF;
  SELECT name INTO v_name FROM missions WHERE id = NEW.mission_id;
  v_name := COALESCE(v_name,'Misión');
  IF COALESCE(NEW.xp_reward,0)>0 THEN v_parts:=array_append(v_parts,'+'||NEW.xp_reward::TEXT||' XP'); END IF;
  IF COALESCE(NEW.ingame_reward,0)>0 THEN v_parts:=array_append(v_parts,'+'||NEW.ingame_reward::TEXT||' VEX'); END IF;
  IF COALESCE(NEW.tradeable_reward,0)>0 THEN v_parts:=array_append(v_parts,'+'||NEW.tradeable_reward::TEXT||' VEX-T'); END IF;
  INSERT INTO player_notifications(player_id,type,title,message,icon,link,read)
  VALUES(NEW.player_id,'mission_reward','Misión completada',v_name||': '||COALESCE(array_to_string(v_parts,' · '),'recompensa recibida'),'missions','/missions',FALSE);
  RETURN NEW;
END; $function$;

-- 5. get_player_rank: tier_icon canónico (mismos umbrales y colores) ----------
CREATE OR REPLACE FUNCTION public.get_player_rank(p_player_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
      DECLARE
        v_season    record;
        v_ranking   record;
        v_mmr       integer := 0;
        v_tier      text;
        v_tier_color text;
        v_tier_icon  text;
        v_tier_min   integer;
        v_shields    integer := 0;
      BEGIN
        -- Current active season
        SELECT id INTO v_season FROM public.pvp_seasons WHERE active = true LIMIT 1;

        -- Player ranking in this season
        SELECT mmr, wins, losses, draws
          INTO v_ranking
          FROM public.pvp_rankings
         WHERE player_id = p_player_id
           AND (v_season IS NULL OR season_id = v_season.id)
         ORDER BY updated_at DESC LIMIT 1;

        v_mmr := COALESCE(v_ranking.mmr, 1000);

        -- Determine tier (Iron -> Bronze -> Silver -> Gold -> Platinum -> Diamond -> Mythic)
        -- tier_icon guarda el nombre del glifo canónico de ForgeIcon, nunca un emoji.
        IF    v_mmr >= 3000 THEN v_tier := 'Mythic';   v_tier_color := '#ff4444'; v_tier_icon := 'rank-mythic';   v_tier_min := 3000;
        ELSIF v_mmr >= 2400 THEN v_tier := 'Diamond';  v_tier_color := '#4a9eff'; v_tier_icon := 'rank-diamond';  v_tier_min := 2400;
        ELSIF v_mmr >= 1800 THEN v_tier := 'Platinum'; v_tier_color := '#a855f7'; v_tier_icon := 'rank-platinum'; v_tier_min := 1800;
        ELSIF v_mmr >= 1300 THEN v_tier := 'Gold';     v_tier_color := '#e8b84b'; v_tier_icon := 'rank-gold';     v_tier_min := 1300;
        ELSIF v_mmr >= 900  THEN v_tier := 'Silver';   v_tier_color := '#b0b0b0'; v_tier_icon := 'rank-silver';   v_tier_min := 900;
        ELSIF v_mmr >= 500  THEN v_tier := 'Bronze';   v_tier_color := '#cd7f32'; v_tier_icon := 'rank-bronze';   v_tier_min := 500;
        ELSE                     v_tier := 'Iron';     v_tier_color := '#9e9e9e'; v_tier_icon := 'rank-iron';     v_tier_min := 0;
        END IF;

        -- Shields
        IF v_season.id IS NOT NULL THEN
          SELECT shields_remaining INTO v_shields
            FROM public.rank_shields
           WHERE player_id = p_player_id AND season_id = v_season.id AND tier_name = v_tier;
        END IF;

        RETURN jsonb_build_object(
          'ok',         true,
          'player_id',  p_player_id,
          'mmr',        v_mmr,
          'tier',       v_tier,
          'tier_color', v_tier_color,
          'tier_icon',  v_tier_icon,
          'tier_min',   v_tier_min,
          'shields',    COALESCE(v_shields, 0),
          'wins',       COALESCE(v_ranking.wins, 0),
          'losses',     COALESCE(v_ranking.losses, 0),
          'season_id',  v_season.id
        );
      END;
      $function$;

COMMIT;
