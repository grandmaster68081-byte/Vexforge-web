import { useCallback, useEffect, useState } from "react";
    import {
    getMyVexBalance,
    getMyPackHistory,
    getPackCatalog,
    buyPackWithVex,
    openPackOrder,
    type PackOrder,
    type OpenedCard,
    type CatalogPack,
    } from "./repository";

    /**
    * usePacks — manages pack purchasing + opening flow.
    * E.1.b: refactored from PacksRoute direct supabase calls.
    * chat72 P.2: also loads the real pack catalog from vexforge_pack_catalog.
    */
    export function usePacks() {
    const [vexBalance, setVexBalance]     = useState(0);
    const [history, setHistory]           = useState<PackOrder[]>([]);
    const [catalog, setCatalog]           = useState<CatalogPack[]>([]);
    const [catalogError, setCatalogError] = useState<string | null>(null);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState<string | null>(null);
    const [authed, setAuthed]             = useState(true);

    const [buying, setBuying]             = useState(false);
    const [buyError, setBuyError]         = useState<string | null>(null);
    const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

    const [opening, setOpening]           = useState(false);
    const [openError, setOpenError]       = useState<string | null>(null);
    const [openedCards, setOpenedCards]   = useState<OpenedCard[] | null>(null);

    const load = useCallback(async () => {
      setLoading(true);
      setError(null);
      setCatalogError(null);

      const [balRes, histRes, catRes] = await Promise.all([
        getMyVexBalance(),
        getMyPackHistory(),
        getPackCatalog(),
      ]);

      // Catalog is public — always try to render it, even when logged out.
      if (catRes.data) setCatalog(catRes.data);
      else if (catRes.reason) setCatalogError(catRes.reason);

      if (balRes.status === "blocked_auth") {
        setAuthed(false);
      } else if (balRes.data) {
        setAuthed(true);
        setVexBalance(balRes.data.vex_ingame);
      } else if (balRes.reason) {
        setError(balRes.reason);
      }

      if (histRes.data) setHistory(histRes.data);

      setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    /** Buy a pack with in-game VEX. Returns the new order id on success. */
    const buyWithVex = useCallback(async (packKey: string) => {
      setBuying(true);
      setBuyError(null);
      const res = await buyPackWithVex(packKey);
      setBuying(false);
      if (res.ok && res.orderId) {
        setPendingOrderId(res.orderId);
        await load();
      } else {
        setBuyError(res.reason ?? "No se pudo comprar el pack.");
      }
      return res;
    }, [load]);

    /** Open a pending order — triggers the reveal sequence. */
    const openOrder = useCallback(async (orderId: string) => {
      setOpening(true);
      setOpenError(null);
      const res = await openPackOrder(orderId);
      setOpening(false);
      if (res.ok && res.cards) {
        setOpenedCards(res.cards);
        await load();
      } else {
        setOpenError(res.reason ?? "No se pudo abrir el pack.");
      }
      return res;
    }, [load]);

    /** Clear opened cards after the reveal dismissal. */
    const clearOpenedCards = useCallback(() => {
      setOpenedCards(null);
      setPendingOrderId(null);
    }, []);

    return {
      vexBalance, history, catalog, catalogError,
      loading, error, authed,
      buying, buyError, pendingOrderId,
      opening, openError, openedCards,
      buyWithVex, openOrder, clearOpenedCards,
      reload: load,
    };
    }
    
