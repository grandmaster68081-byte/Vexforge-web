-- U.2 chat79 — DB Trigger: player_notifications en mission completion
-- Referencia DBA. Frontend (insertMissionNotification) activo desde chat79.
CREATE OR REPLACE FUNCTION public.fn_notify_mission_complete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name TEXT; v_parts TEXT[] := '{}';
BEGIN
  IF NEW.status <> 'completed' OR OLD.status = 'completed' THEN RETURN NEW; END IF;
  SELECT name INTO v_name FROM missions WHERE id = NEW.mission_id;
  v_name := COALESCE(v_name,'Misión');
  IF COALESCE(NEW.xp_reward,0)>0        THEN v_parts:=array_append(v_parts,'+'||NEW.xp_reward::TEXT||' XP'); END IF;
  IF COALESCE(NEW.ingame_reward,0)>0    THEN v_parts:=array_append(v_parts,'+'||NEW.ingame_reward::TEXT||' VEX'); END IF;
  IF COALESCE(NEW.tradeable_reward,0)>0 THEN v_parts:=array_append(v_parts,'+'||NEW.tradeable_reward::TEXT||' VEX-T'); END IF;
  INSERT INTO player_notifications(player_id,type,title,message,icon,link,read)
  VALUES(NEW.player_id,'mission_reward','Misión completada',
    v_name||': '||COALESCE(array_to_string(v_parts,' · '),'recompensa recibida'),
    '🎯','/missions',FALSE);
  RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS trg_notify_mission_complete ON mission_runs;
CREATE TRIGGER trg_notify_mission_complete
  AFTER UPDATE OF status ON mission_runs FOR EACH ROW
  EXECUTE FUNCTION public.fn_notify_mission_complete();
