import type { BattleEvent, BattleResult, CardRecord, DeckSlot, MissionRecord, PvpOpponent, WalletRecord } from './api';

export type ScreenId = 'nexus' | 'arena' | 'archive' | 'forge' | 'legacy' | 'missions' | 'store' | 'economy' | 'world' | 'social' | 'meta';
export type QualityTier = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ContentBudget {
  tier: QualityTier;
  maxConcurrentCardImages: number;
  maxParticleLayers: number;
  preferredBackgroundScale: number;
}

export interface RemoteState {
  profile: { data: any; loading: boolean; error: string | null };
  cards: { data: CardRecord[]; loading: boolean; error: string | null };
  collection: { data: any[]; loading: boolean; error: string | null };
  deck: { data: DeckSlot[]; loading: boolean; error: string | null };
  missions: { data: MissionRecord[]; loading: boolean; error: string | null };
  wallet: { data: WalletRecord | null; loading: boolean; error: string | null };
  opponents: { data: PvpOpponent[]; loading: boolean; error: string | null };
}

export interface BattlePresentationState {
  result: BattleResult | null;
  cursor: number;
  currentEvent: BattleEvent | null;
  playing: boolean;
}
