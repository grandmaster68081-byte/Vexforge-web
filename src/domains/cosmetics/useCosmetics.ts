import { useState, useEffect, useCallback } from "react";
import { listCosmetics, getMyCosmetics, equipCosmetic, unequipCosmetic } from "./repository";
import type { Cosmetic, PlayerCosmetic } from "./repository";
import type { DomainResult } from "../../shared/types/domain";

export function useCosmetics() {
  const [catalog, setCatalog]         = useState<DomainResult<Cosmetic[]>>({ status: "loading", data: null });
  const [myCosmetics, setMyCosmetics] = useState<DomainResult<PlayerCosmetic[]>>({ status: "loading", data: null });
  const [equipping, setEquipping]     = useState(false);
  const [equipMsg, setEquipMsg]       = useState<string | null>(null);
  const [tick, setTick]               = useState(0);
  const reload = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let mounted = true;
    listCosmetics().then(r   => { if (mounted) setCatalog(r);     });
    getMyCosmetics().then(r  => { if (mounted) setMyCosmetics(r); });
    return () => { mounted = false; };
  }, [tick]);

  const equip = useCallback(async (cosmeticId: string, slot: string) => {
    setEquipping(true); setEquipMsg(null);
    const result = await equipCosmetic(cosmeticId, slot);
    setEquipping(false);
    if (result.status === "blocked_auth")  setEquipMsg("Inicia sesion para equipar cosméticos.");
    else if (result.data?.ok)              { setEquipMsg("Cosmetico equipado!"); reload(); }
    else                                   setEquipMsg(result.reason ?? "Error al equipar.");
  }, [reload]);

  const unequip = useCallback(async (cosmeticId: string) => {
    setEquipping(true); setEquipMsg(null);
    const result = await unequipCosmetic(cosmeticId);
    setEquipping(false);
    if (result.status === "blocked_auth")  setEquipMsg("Inicia sesion.");
    else if (result.data?.ok)              { setEquipMsg("Cosmético desequipado."); reload(); }
    else                                   setEquipMsg(result.reason ?? "Error al desequipar.");
  }, [reload]);

  return { catalog, myCosmetics, equipping, equipMsg, equip, unequip, reload };
}
