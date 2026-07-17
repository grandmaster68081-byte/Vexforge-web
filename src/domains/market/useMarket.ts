import { useEffect, useState, useCallback } from "react";
    import {
    listOpenListings, listMyUnlockedCards,
    createListing, buyListing, cancelListing, getCurrentPlayerId,
    type MarketListing, type OwnedCard,
    } from "./repository";

    export function useMarket() {
    const [listings, setListings]               = useState<MarketListing[]>([]);
    const [myCards, setMyCards]                 = useState<OwnedCard[]>([]);
    const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
    const [loading, setLoading]                 = useState(true);
    const [error, setError]                     = useState<string | null>(null);
    const [actionError, setActionError]         = useState<string | null>(null);
    const [pending, setPending]                 = useState(false);

    const refresh = useCallback(async () => {
      setLoading(true);
      const [listingsResult, cardsResult, pid] = await Promise.all([
        listOpenListings(),
        listMyUnlockedCards(),
        getCurrentPlayerId(),
      ]);
      if (listingsResult.data)  setListings(listingsResult.data);
      if (listingsResult.reason && !listingsResult.data) setError(listingsResult.reason);
      if (cardsResult.data)     setMyCards(cardsResult.data);
      setCurrentPlayerId(pid);
      setLoading(false);
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    async function create(playerCardId: string, price: number, fee?: number) {
      setPending(true); setActionError(null);
      const result = await createListing(playerCardId, price, fee);
      if (result.reason) setActionError(result.reason);
      setPending(false); await refresh();
      return result;
    }

    async function buy(listingId: string) {
      setPending(true); setActionError(null);
      const result = await buyListing(listingId);
      if (result.reason) setActionError(result.reason);
      setPending(false); await refresh();
      return result;
    }

    async function cancel(listingId: string) {
      setPending(true); setActionError(null);
      const result = await cancelListing(listingId);
      if (result.reason) setActionError(result.reason);
      setPending(false); await refresh();
      return result;
    }

    return { listings, myCards, currentPlayerId, loading, error, actionError, pending, create, buy, cancel };
    }
    