import { useEffect, useState, useCallback } from "react";
import {
getMyCards, getMyDeck, saveDeck, validateDeck,
type PlayerCardEntry, type DeckSlot,
} from "./repository";

const LEGENDARY_MYTHIC = new Set(["Legendary","Mythic"]);
const MAX_DECK = 30;

export function useDeck() {
const [myCards, setMyCards] = useState<PlayerCardEntry[]>([]);
const [deckSlots, setDeckSlots] = useState<DeckSlot[]>([]);
const [selectedIds, setSelectedIds] = useState<string[]>([]);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [error, setError] = useState<string | null>(null);
const [saveMsg, setSaveMsg] = useState<string | null>(null);
const [validation, setValidation] = useState<{ valid: boolean; errors: string[] } | null>(null);

const load = useCallback(async () => {
  setLoading(true);
  const [cardsRes, deckRes] = await Promise.all([getMyCards(), getMyDeck()]);
  if (cardsRes.data) setMyCards(cardsRes.data);
  if (deckRes.data) {
    setDeckSlots(deckRes.data);
    setSelectedIds(deckRes.data.map(s => s.card_id));
  }
  setError(cardsRes.reason ?? deckRes.reason ?? null);
  setLoading(false);
}, []);

useEffect(() => { load(); }, [load]);

/**
 * Standard Format toggle:
 * - Max 2 copies of any card (Legendary/Mythic: max 1)
 * - Max 30 total
 * - Click adds a copy; double click (already at max) removes all copies
 */
const toggleCard = useCallback((cardId: string) => {
  setSelectedIds(prev => {
    const card = myCards.find(c => c.card_id === cardId);
    const rarity = card?.rarity ?? "Common";
    const maxCopies = LEGENDARY_MYTHIC.has(rarity) ? 1 : 2;
    const currentCount = prev.filter(id => id === cardId).length;

    if (currentCount >= maxCopies) {
      // remove all copies
      return prev.filter(id => id !== cardId);
    }
    if (prev.length >= MAX_DECK) return prev;
    return [...prev, cardId];
  });
  setSaveMsg(null);
  setValidation(null);
}, [myCards]);

const validate = useCallback(async () => {
  if (selectedIds.length === 0) {
    setValidation({ valid: false, errors: ["El mazo está vacío"] });
    return;
  }
  const res = await validateDeck(selectedIds);
  setValidation({ valid: res.valid, errors: res.errors });
}, [selectedIds]);

const save = useCallback(async () => {
  if (selectedIds.length < 5) {
    setSaveMsg("El mazo necesita al menos 5 cartas.");
    return;
  }
  setSaving(true); setSaveMsg(null);
  const res = await saveDeck(selectedIds);
  if (res.data) {
    setSaveMsg(`✓ Mazo guardado — ${res.data.slots_saved} cartas`);
    await load();
  } else {
    setSaveMsg(res.reason ?? "Error al guardar el mazo");
  }
  setSaving(false);
}, [selectedIds, load]);

return { myCards, deckSlots, selectedIds, loading, saving, error, saveMsg, validation, toggleCard, validate, save };
}