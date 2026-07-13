import { useEffect, useState, useCallback } from "react";
import {
  listOpenListings,
  listMyUnlockedCards,
  createListing,
  buyListing,
  cancelListing,
  type MarketListing,
  type OwnedCard,
} from "./repository";

export function useMarket() {
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [myCards, setMyCards] = useState<OwnedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [listingsResult, cardsResult] = await Promise.all([
      listOpenListings(),
      listMyUnlockedCards(),
    ]);
    if (listingsResult.data) setListings(listingsResult.data);
    if (listingsResult.reason) setError(listingsResult.reason);
    // not signed in is a normal state, not an error banner
    if (cardsResult.data) setMyCards(cardsResult.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function create(playerCardId: string, price: number, fee?: number) {
    setPending(true);
    setActionError(null);
    const result = await createListing(playerCardId, price, fee);
    if (result.reason && result.status !== "ready") setActionError(result.reason);
    else if (result.reason) setActionError(result.reason);
    setPending(false);
    await refresh();
    return result;
  }

  async function buy(listingId: string) {
    setPending(true);
    setActionError(null);
    const result = await buyListing(listingId);
    if (result.reason) setActionError(result.reason);
    setPending(false);
    await refresh();
    return result;
  }

  async function cancel(listingId: string) {
    setPending(true);
    setActionError(null);
    const result = await cancelListing(listingId);
    if (result.reason) setActionError(result.reason);
    setPending(false);
    await refresh();
    return result;
  }

  return { listings, myCards, loading, error, actionError, pending, create, buy, cancel };
}
