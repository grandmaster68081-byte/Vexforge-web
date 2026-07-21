import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { listActiveCards, type Card } from "./repository";
import { getPlayerCollection, type PlayerCard } from "../inventory/repository";
export type { Card };
export type { PlayerCard };

export interface UseCardsResult {
  cards:             Card[];
  loading:           boolean;
  error:             string | null;
  collection:        PlayerCard[];
  collectionById:    Map<string, PlayerCard>;
  collectionLoading: boolean;
  completionPct:     number;
  ownedCount:        number;
  totalCatalog:      number;
  isAuth:            boolean;
}

export function useCards(): UseCardsResult {
  const [cards, setCards]                         = useState<Card[]>([]);
  const [loading, setLoading]                     = useState(true);
  const [error, setError]                         = useState<string | null>(null);
  const [collection, setCollection]               = useState<PlayerCard[]>([]);
  const [collectionById, setCollectionById]       = useState<Map<string, PlayerCard>>(new Map());
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [completionPct, setCompletionPct]         = useState(0);
  const [ownedCount, setOwnedCount]               = useState(0);
  const [isAuth, setIsAuth]                       = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      listActiveCards(),
      supabase.auth.getSession(),
    ]).then(([catResult, sessionResult]) => {
      if (cancelled) return;

      const catalogCards = catResult.data ?? [];
      if (catResult.data)   setCards(catResult.data);
      if (catResult.reason) setError(catResult.reason);
      setLoading(false);

      const hasSession = !!sessionResult.data?.session;
      setIsAuth(hasSession);

      if (hasSession) {
        setCollectionLoading(true);
        getPlayerCollection().then((colResult) => {
          if (cancelled) return;
          const col = colResult.data ?? [];
          setCollection(col);
          const byId = new Map<string, PlayerCard>();
          col.forEach((pc) => byId.set(pc.card_id, pc));
          setCollectionById(byId);
          const uniqueOwned = byId.size;
          setOwnedCount(uniqueOwned);
          if (catalogCards.length > 0) {
            setCompletionPct(Math.round((uniqueOwned / catalogCards.length) * 100));
          }
          setCollectionLoading(false);
        });
      }
    });

    return () => { cancelled = true; };
  }, []);

  return {
    cards, loading, error,
    collection, collectionById, collectionLoading,
    completionPct, ownedCount, totalCatalog: cards.length, isAuth,
  };
}
