import type { BattleEvent, BattleResult, OpenedCard } from '../types/api';

const finite = (value: unknown) => typeof value === 'number' && Number.isFinite(value);

export function isBattleEvent(value: unknown): value is BattleEvent {
  if (!value || typeof value !== 'object') return false;
  const e = value as Record<string, unknown>;
  if (typeof e.event_type !== 'string' || e.event_type.length === 0 || e.event_type.length > 96) return false;
  if (e.event_id != null && (typeof e.event_id !== 'string' || e.event_id.length === 0 || e.event_id.length > 160)) return false;
  if (e.amount != null && !finite(e.amount)) return false;
  if (e.round != null && (!finite(e.round) || Number(e.round) < 0 || Number(e.round) > 1000)) return false;
  return true;
}

export function assertBattleResult(value: unknown): BattleResult {
  if (!value || typeof value !== 'object') throw new Error('El servidor devolvió un resultado de combate inválido.');
  const result = value as Record<string, unknown>;
  if (typeof result.ok !== 'boolean') throw new Error('El servidor devolvió un resultado de combate sin estado válido.');
  if (result.events != null && (!Array.isArray(result.events) || result.events.length > 512 || !result.events.every(isBattleEvent))) {
    throw new Error('La secuencia de eventos del combate no es válida.');
  }
  if (result.total_turns != null && (!finite(result.total_turns) || Number(result.total_turns) < 0 || Number(result.total_turns) > 1000)) {
    throw new Error('El número de turnos del combate está fuera de rango.');
  }
  return result as BattleResult;
}

export function assertOpenedCards(value: unknown): OpenedCard[] {
  if (!Array.isArray(value)) throw new Error('La apertura devolvió un inventario inválido.');
  return value.map((card, index) => {
    if (!card || typeof card !== 'object') throw new Error(`Carta ${index + 1} inválida en la apertura.`);
    const c = card as Record<string, unknown>;
    if (c.id == null && c.card_id == null && c.code == null) throw new Error(`Carta ${index + 1} sin identidad canónica.`);
    if (typeof c.id === 'string' && c.id.length > 256) throw new Error(`Carta ${index + 1} con identidad inválida.`);
    return card as OpenedCard;
  });
}
