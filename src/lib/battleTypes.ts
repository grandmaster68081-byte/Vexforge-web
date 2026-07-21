// VexForge Battle Types — F.2.a Épica F
// KEYWORD_ICON updated G.4 chat66: includes real synergy_json keywords from DB

    export type BattleRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic' | 'Founder';
    export type BattleSide = 'a' | 'b';

    export interface BattleUnit {
    idx: number; side: BattleSide; id: string; name: string;
    faction: string; rarity: BattleRarity; image_url: string;
    keywords: string[];
    hp: number; max_hp: number; atk: number; def: number; spd: number; power: number;
    alive: boolean; poisoned: boolean; shielded: boolean;
    guard: boolean; lifesteal: boolean; poison_atk: boolean; rush: boolean; double_strike: boolean;
    }

    export interface BattleTurnActor {
    name: string; faction: string; rarity: BattleRarity; image_url: string;
    atk?: number; def?: number; hp: number; max_hp: number; spd?: number;
    }

    export interface BattleEvent {
    type: 'shield_block' | 'poisoned' | 'lifesteal' | 'poison_tick' | 'poison_death' | 'double_strike';
    unit?: string; side?: BattleSide; dmg?: number; heal?: number; hp?: number;
    }

    export interface BattleTurnData {
    turn: number; atk_side: BattleSide;
    attacker: BattleTurnActor; defender: BattleTurnActor;
    damage: number; is_crit: boolean; is_kill: boolean; lifesteal_heal: number;
    events: BattleEvent[]; alive_a: number; alive_b: number;
    type?: string;  // 'double_strike' for follow-up sub-turns
    }

    export interface RealBattleResult {
    ok: boolean; status?: string;
    match_id?: string; winner_id?: string;
    you_won?: boolean; total_turns?: number; elo_change?: number;
    turns?: BattleTurnData[]; final_units?: BattleUnit[];
    engine?: string; error?: string; sqlstate?: string;
    // Legacy compat
    reason?: string; session_id?: string; player_name?: string; opponent_name?: string;
    }

    export const RARITY_COLOR: Record<string, string> = {
    Common: '#8b8b9e', Uncommon: '#3ddc84', Rare: '#4a9eff',
    Epic: '#a855f7', Legendary: '#e8b84b', Mythic: '#ff4444', Founder: '#ff6b35',
    };

    export const RARITY_GLOW: Record<string, string> = {
    Common: 'rgba(139,139,158,0.35)', Uncommon: 'rgba(61,220,132,0.5)',
    Rare: 'rgba(74,158,255,0.5)', Epic: 'rgba(168,85,247,0.6)',
    Legendary: 'rgba(232,184,75,0.65)', Mythic: 'rgba(255,68,68,0.7)', Founder: 'rgba(255,107,53,0.75)',
    };

    export const FACTION_BG: Record<string, string> = {
    Guerrero: 'linear-gradient(135deg,#3a1010 0%,#1a0a0a 100%)',
    Mago:     'linear-gradient(135deg,#0d0d3a 0%,#0a0a1a 100%)',
    Explorador: 'linear-gradient(135deg,#0a2a0a 0%,#0a1a0a 100%)',
    Comerciante: 'linear-gradient(135deg,#2a2a00 0%,#1a1a00 100%)',
    };

    /**
     * KEYWORD_ICON — mapea synergy_json.keywords reales del DB a iconos de UI.
     * Keywords reales en DB: Guard, Surge, Flux, Consecrate, Drain, Veil, Forge, Resonance
     * Mapeo mecánico: Guard→🛡️ Drain→💚 Surge→⚡ Veil→🔮
     * Alias planned (por si aparecen): Lifesteal→💚 Poison→☠️ Shield→✨ Rush→⚡ DoubleStrike→⚔️
     */
    export const KEYWORD_ICON: Record<string, string> = {
    // ── Keywords reales en synergy_json.keywords del DB ──────────────────────
    Guard:      '🛡️',   // tanque — fuerza a ser el objetivo
    Surge:      '⚡',   // iniciativa alta, actúa primero (→ rush)
    Flux:       '🌀',   // caótico, bonus aleatorio
    Consecrate: '✝️',   // sagrado, daño extra a oscuridad
    Drain:      '💚',   // roba vida del oponente (→ lifesteal 30%)
    Veil:       '🔮',   // barrera mágica que absorbe un golpe (→ shield)
    Forge:      '🔨',   // forja — potencia ATK en combate
    Resonance:  '🎵',   // resonancia — buff a aliados del mismo facción
    // ── Alias planeados (compatibilidad) ─────────────────────────────────────
    Lifesteal:   '💚',
    Poison:      '☠️',
    Shield:      '✨',
    Rush:        '⚡',
    DoubleStrike:'⚔️',
    };
