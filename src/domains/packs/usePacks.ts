import { useEffect, useState, useCallback } from "react";
import {
  listActivePacks,
  listMyOrders,
  createPackOrder,
  type PackCatalogEntry,
  type PackOrder,
} from "./repository";

export function usePacks() {
  const [catalog, setCatalog] = useState<PackCatalogEntry[]>([]);
  const [orders, setOrders] = useState<PackOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const catalogResult = await listActivePacks();
    if (catalogResult.data) setCatalog(catalogResult.data);
    if (catalogResult.reason) setError(catalogResult.reason);

    const ordersResult = await listMyOrders();
    if (ordersResult.data) setOrders(ordersResult.data);
    // not signed in is a normal state, not an error banner

    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function order(packKey: string, playerWalletAddress: string) {
    setPending(true);
    setActionError(null);
    const result = await createPackOrder(packKey, playerWalletAddress);
    if (result.reason) setActionError(result.reason);
    setPending(false);
    await refresh();
    return result;
  }

  return { catalog, orders, loading, error, actionError, pending, order };
}
