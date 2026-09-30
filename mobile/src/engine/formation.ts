import type { DeckSlot, FormationSnapshot } from '../types/api';

export type FormationRole = 'vanguard' | 'champion' | 'sentinel' | 'reserve';

export interface FormationDraftSlot {
  role: FormationRole;
  slot: DeckSlot | null;
}

export function buildFormationDraft(slots: DeckSlot[]): FormationDraftSlot[] {
  const filled = [...slots].filter((slot) => Boolean(slot.card_id)).sort((a, b) => a.slot_number - b.slot_number);
  const champion = filled.find((slot) => slot.is_champion) ?? null;
  const remaining = filled.filter((slot) => slot !== champion);
  return [
    { role: 'vanguard', slot: remaining[0] ?? null },
    { role: 'champion', slot: champion },
    { role: 'sentinel', slot: remaining[1] ?? null },
    ...remaining.slice(2).map((slot) => ({ role: 'reserve' as const, slot })),
  ];
}

export function formationToSnapshot(slots: DeckSlot[]): FormationSnapshot {
  const draft = buildFormationDraft(slots);
  const role = (name: FormationRole) => draft.find((x) => x.role === name)?.slot?.card_id ?? null;
  return {
    champion_id: role('champion'),
    vanguard_id: role('vanguard'),
    sentinel_id: role('sentinel'),
    reserve_ids: draft.filter((x) => x.role === 'reserve').map((x) => x.slot?.card_id).filter((x): x is string => Boolean(x)),
  };
}

export function deckCanEnterBattle(slots: DeckSlot[]): { ok: boolean; reason?: string } {
  const count = slots.filter((slot) => Boolean(slot.card_id)).length;
  if (count !== 8) return { ok: false, reason: 'La formación de combate oficial exige exactamente 8 cartas.' };
  if (!slots.some((slot) => slot.is_champion && slot.card_id)) return { ok: false, reason: 'La formación necesita un Champion asignado.' };
  return { ok: true };
}
