import { useEffect, useState, useCallback } from "react";
import {
listActivePacks, listMyOrders, createPackOrder, openPack,
type PackCatalogEntry, type PackOrder, type OpenedCard,
} from "./repository";

export function usePacks() {
const [catalog, setCatalog] = useState<PackCatalogEntry[]>([]);
const [orders, setOrders] = useState<PackOrder[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [actionError, setActionError] = useState<string | null>(null);
const [pending, setPending] = useState(false);
const [openedCards, setOpenedCards] = useState<OpenedCard[] | null>(null);
const [openingOrderId, setOpeningOrderId] = useState<string | null>(null);

const load = useCallback(async () => {
  setLoading(true);
  const [catalogRes, ordersRes] = await Promise.all([listActivePacks(), listMyOrders()]);
  if (catalogRes.data) setCatalog(catalogRes.data);
  if (ordersRes.data) setOrders(ordersRes.data);
  setError(catalogRes.reason ?? ordersRes.reason ?? null);
  setLoading(false);
}, []);

useEffect(() => { load(); }, [load]);

const order = useCallback(async (packKey: string, walletAddress: string) => {
  setPending(true); setActionError(null);
  const res = await createPackOrder(packKey, walletAddress);
  if (!res.data) setActionError(res.reason ?? "Order failed");
  else await load();
  setPending(false);
  return res;
}, [load]);

const openPackById = useCallback(async (orderId: string) => {
  setOpeningOrderId(orderId); setActionError(null); setOpenedCards(null);
  const res = await openPack(orderId);
  if (res.data?.ok && res.data.cards) {
    setOpenedCards(res.data.cards);
    await load();
  } else {
    setActionError(res.data?.reason ?? res.reason ?? "Failed to open pack");
  }
  setOpeningOrderId(null);
  return res;
}, [load]);

const dismissReveal = useCallback(() => setOpenedCards(null), []);

return {
  catalog, orders, loading, error, actionError, pending,
  openedCards, openingOrderId,
  order, openPackById, dismissReveal, reload: load,
};
}