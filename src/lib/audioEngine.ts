// VexForge Audio Engine v3.0 — Epic I: VEXFORGE DOMINION
// Faction themes + Dynamic intensity + Crossfade + Combo audio + Rarity variants.
// Backward-compatible with all v2.0 callers.
// Web Audio API only — zero external assets.

type MusicOscEntry = { stop: () => void };

type FactionId = 'Guerrero' | 'Mago' | 'Explorador' | 'Comerciante' | string;
type IntensityLevel = 'calm' | 'tense' | 'desperate';

// ─── Faction music config ──────────────────────────────────────────────────────
const FACTION_MUSIC: Record<string, { base: number; mode: OscillatorType[]; tempo: number; color: string }> = {
  Guerrero:    { base: 110, mode: ['sawtooth', 'square'],   tempo: 0.72, color: '#c0392b' },
  Mago:        { base: 220, mode: ['sine', 'triangle'],     tempo: 0.52, color: '#8e44ad' },
  Explorador:  { base: 174, mode: ['triangle', 'sine'],     tempo: 0.64, color: '#27ae60' },
  Comerciante: { base: 196, mode: ['square', 'sawtooth'],   tempo: 0.68, color: '#f39c12' },
  default:     { base: 140, mode: ['sine', 'triangle'],     tempo: 0.60, color: '#4a9eff' },
};

// Pentatonic scale intervals for procedural melody
const PENTA = [0, 3, 5, 7, 10, 12, 15, 17];

export class VexForgeAudioEngine {
  private _ctx: AudioContext | null = null;
  private _master: GainNode | null = null;
  private _musicBus: GainNode | null = null;
  private _sfxBus: GainNode | null = null;
  private _musicOscs: MusicOscEntry[] = [];
  private _muted = false;
  private _musicVol = 0.32;
  private _sfxVol = 0.88;

  // v3.0 additions
  private _faction: FactionId = 'default';
  private _intensity: number = 1.0; // 0=desperate..1=calm
  private _intensityLevel: IntensityLevel = 'calm';
  private _factionMusicActive = false;

  // ─── Context management ────────────────────────────────────────────────────
  private ctx(): AudioContext {
    if (!this._ctx || this._ctx.state === 'closed') {
      this._ctx = new AudioContext();
      this._master = this._ctx.createGain();
      this._master.gain.value = this._muted ? 0 : 1;
      this._master.connect(this._ctx.destination);
      this._musicBus = this._ctx.createGain();
      this._musicBus.gain.value = this._musicVol;
      this._musicBus.connect(this._master);
      this._sfxBus = this._ctx.createGain();
      this._sfxBus.gain.value = this._sfxVol;
      this._sfxBus.connect(this._master);
    }
    if (this._ctx.state === 'suspended') this._ctx.resume().catch(() => {});
    return this._ctx;
  }

  private sfx(): AudioNode { this.ctx(); return this._sfxBus ?? this._ctx!.destination; }
  private mus(): AudioNode { this.ctx(); return this._musicBus ?? this._ctx!.destination; }

  // ─── Primitives ────────────────────────────────────────────────────────────
  private tone(
    freq: number, dur: number,
    type: OscillatorType = 'sine', vol = 0.3, detune = 0,
    out?: AudioNode, delay = 0,
  ): void {
    try {
      const c = this.ctx(); const dest = out ?? this.sfx();
      const osc = c.createOscillator(); const g = c.createGain();
      osc.type = type; osc.frequency.value = freq; osc.detune.value = detune;
      const t0 = c.currentTime + delay;
      g.gain.setValueAtTime(0.001, t0);
      g.gain.linearRampToValueAtTime(vol, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(g); g.connect(dest);
      osc.start(t0); osc.stop(t0 + dur + 0.05);
    } catch { /* silent fail */ }
  }

  private noise(dur: number, vol = 0.15, hp = 2000, delay = 0): void {
    try {
      const c = this.ctx(); const out = this.sfx();
      const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource(); src.buffer = buf;
      const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
      const g = c.createGain();
      const t0 = c.currentTime + delay;
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      src.connect(f); f.connect(g); g.connect(out);
      src.start(t0); src.stop(t0 + dur + 0.05);
    } catch { /* silent fail */ }
  }

  // ─── Core combat SFX (v2.0 API — fully preserved) ─────────────────────────
  attack() { this.tone(120, 0.08, 'sawtooth', 0.35); this.noise(0.05, 0.18, 1500); }

  critical() {
    this.tone(220, 0.04, 'square', 0.42);
    this.tone(880, 0.15, 'square', 0.28); this.tone(1760, 0.1, 'sine', 0.18, 1200);
    this.noise(0.09, 0.24, 3000, 0.02);
    this.tone(440, 0.18, 'square', 0.18, 0, undefined, 0.06);
  }

  death() {
    try {
      const c = this.ctx(); const out = this.sfx();
      const osc = c.createOscillator(); const g = c.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(35, c.currentTime + 0.7);
      g.gain.setValueAtTime(0.52, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.7);
      osc.connect(g); g.connect(out);
      osc.start(); osc.stop(c.currentTime + 0.75);
    } catch { /* silent fail */ }
    this.noise(0.3, 0.22, 400, 0.05);
  }

  heal() {
    this.tone(523, 0.12, 'sine', 0.28); this.tone(659, 0.15, 'sine', 0.22, 0, undefined, 0.05);
    this.tone(784, 0.18, 'sine', 0.18, 0, undefined, 0.10);
  }

  shield() {
    this.tone(440, 0.06, 'square', 0.3, 1200);
    this.tone(880, 0.12, 'sine', 0.18, 0, undefined, 0.04);
    this.noise(0.08, 0.12, 4000, 0.02);
  }

  poison() {
    this.tone(220, 0.1, 'triangle', 0.22); this.tone(293, 0.14, 'triangle', 0.18, 0, undefined, 0.06);
    this.tone(246, 0.08, 'triangle', 0.14, 0, undefined, 0.12);
  }

  lifesteal() { this.tone(440, 0.08, 'sine', 0.22); this.tone(523, 0.15, 'sine', 0.18, 700); }

  // ─── 8 Keyword SFX (v2.0 — fully preserved) ───────────────────────────────
  guard()       { this.tone(196, 0.05, 'square', 0.38); this.tone(147, 0.18, 'sawtooth', 0.28, 0, undefined, 0.04); this.noise(0.07, 0.2, 1200, 0.02); }
  surge()       { [0, 0.04, 0.08].forEach(d => this.tone(880 * (1 + d * 2), 0.06, 'square', 0.28, 0, undefined, d)); }
  flux()        { [220, 440, 330, 550].forEach((f, i) => this.tone(f, 0.08, 'sine', 0.22, 0, undefined, i * 0.06)); }
  consecrate()  { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.16 - i * 0.02, 'sine', 0.24 - i * 0.04, 0, undefined, i * 0.07)); this.noise(0.2, 0.08, 6000, 0.1); }
  drain()       { [196, 220, 246].forEach((f, i) => this.tone(f, 0.2, 'triangle', 0.24, 0, undefined, i * 0.06)); this.tone(392, 0.18, 'sine', 0.2, 0, undefined, 0.18); }
  veil()        { this.tone(1046, 0.25, 'sine', 0.15, 1200); this.tone(880, 0.2, 'sine', 0.12, -800, undefined, 0.05); this.noise(0.15, 0.06, 5000, 0.1); }
  forge()       { this.noise(0.04, 0.35, 800); this.tone(147, 0.12, 'sawtooth', 0.4, 0, undefined, 0.03); this.tone(110, 0.18, 'square', 0.3, 0, undefined, 0.08); }
  resonance()   { [440, 554, 659, 784].forEach((f, i) => this.tone(f, 0.28, 'sine', 0.18 - i * 0.02, i * 120, undefined, i * 0.06)); }

  // ─── v3.0: Rarity-specific attack variants ────────────────────────────────
  rarityAttack(rarity: string): void {
    switch (rarity) {
      case 'Mythic':
      case 'Founder':
        this.tone(60, 0.12, 'sawtooth', 0.45); this.noise(0.08, 0.3, 500);
        this.tone(1760, 0.06, 'square', 0.2, 0, undefined, 0.04); break;
      case 'Legendary':
        this.tone(220, 0.06, 'square', 0.4); this.noise(0.06, 0.25, 1200);
        this.tone(880, 0.08, 'sine', 0.2, 0, undefined, 0.03); break;
      case 'Epic':
        this.tone(175, 0.07, 'sawtooth', 0.38); this.noise(0.05, 0.22, 1400); break;
      case 'Rare':
        this.tone(147, 0.07, 'sawtooth', 0.33); this.noise(0.05, 0.18, 1600); break;
      default:
        this.attack(); break;
    }
  }

  // ─── v3.0: Combo activation sound (2+ keywords at once) ──────────────────
  combo(keywordCount: number): void {
    const intensity = Math.min(keywordCount, 4);
    const freqs = [440, 554, 659, 880].slice(0, intensity);
    freqs.forEach((f, i) => {
      this.tone(f, 0.2 + i * 0.04, 'sine', 0.28 - i * 0.04, i * 200, undefined, i * 0.04);
    });
    if (intensity >= 3) this.noise(0.12, 0.15, 4000, 0.08);
    // Ascending finish
    this.tone(1046, 0.15, 'sine', 0.22, 0, undefined, intensity * 0.04 + 0.08);
  }

  // ─── v3.0: Faction setter ──────────────────────────────────────────────────
  setFaction(faction: FactionId): void {
    this._faction = faction;
  }

  // ─── v3.0: Dynamic intensity (0=desperate/low HP, 1=calm/full HP) ─────────
  setIntensity(hpRatio: number): void {
    const prev = this._intensityLevel;
    this._intensity = Math.max(0, Math.min(1, hpRatio));
    if (hpRatio < 0.25) this._intensityLevel = 'desperate';
    else if (hpRatio < 0.55) this._intensityLevel = 'tense';
    else this._intensityLevel = 'calm';
    // If level changed, restart music loop at new intensity
    if (prev !== this._intensityLevel && this._factionMusicActive) {
      this.stopMusic();
      this.musicLoop();
    }
  }

  // ─── Music system (v2.0 base + v3.0 faction/intensity) ────────────────────
  musicLoop(): void {
    if (this._muted) return;
    this.stopMusic();
    this._factionMusicActive = true;

    const cfg = FACTION_MUSIC[this._faction] ?? FACTION_MUSIC['default'];
    const tempoMultiplier = this._intensityLevel === 'desperate' ? 1.45
      : this._intensityLevel === 'tense' ? 1.18 : 1.0;
    const beatDur = cfg.tempo / tempoMultiplier;
    const baseVol = this._intensityLevel === 'desperate' ? 0.28
      : this._intensityLevel === 'tense' ? 0.22 : 0.18;

    try {
      const c = this.ctx(); const out = this.mus();

      // Layer 1: bass drone
      const drone = c.createOscillator(); const dg = c.createGain();
      drone.type = cfg.mode[0];
      drone.frequency.value = cfg.base;
      dg.gain.value = baseVol * 0.6;
      drone.connect(dg); dg.connect(out);
      drone.start();
      drone.stop(c.currentTime + beatDur * 32);
      this._musicOscs.push({ stop: () => { try { drone.stop(); } catch {} } });

      // Layer 2: melodic voice — pentatonic arpeggio
      let step = 0;
      const scheduleArp = () => {
        if (!this._ctx || this._ctx.state === 'closed') return;
        const interval = beatDur * (this._intensityLevel === 'desperate' ? 0.25 : 0.5);
        const semitone = PENTA[step % PENTA.length];
        const freq = cfg.base * 2 * Math.pow(2, semitone / 12);
        const noteVol = baseVol * (0.5 + Math.random() * 0.25);
        const arpOsc = c.createOscillator(); const ag = c.createGain();
        arpOsc.type = cfg.mode[1] ?? 'sine';
        arpOsc.frequency.value = freq;
        const t0 = c.currentTime;
        ag.gain.setValueAtTime(0.001, t0);
        ag.gain.linearRampToValueAtTime(noteVol, t0 + 0.015);
        ag.gain.exponentialRampToValueAtTime(0.001, t0 + interval * 0.85);
        arpOsc.connect(ag); ag.connect(out);
        arpOsc.start(t0); arpOsc.stop(t0 + interval * 0.9);
        step++;
      };
      scheduleArp();
      const arpId = setInterval(scheduleArp, beatDur * (this._intensityLevel === 'desperate' ? 250 : 500));
      this._musicOscs.push({ stop: () => clearInterval(arpId) });

      // Layer 3: percussion hit (desperate/tense only)
      if (this._intensityLevel !== 'calm') {
        const percInterval = beatDur * (this._intensityLevel === 'desperate' ? 320 : 480);
        const percId = setInterval(() => {
          this.noise(0.04, 0.14, 2500, 0);
          this.tone(cfg.base * 0.5, 0.06, 'square', 0.12);
        }, percInterval);
        this._musicOscs.push({ stop: () => clearInterval(percId) });
      }
    } catch { /* silent fail */ }
  }

  stopMusic(): void {
    this._factionMusicActive = false;
    this._musicOscs.forEach(o => { try { o.stop(); } catch {} });
    this._musicOscs = [];
  }

  // ─── Cinematic SFX (v2.0 fully preserved) ─────────────────────────────────
  battleIntro(): void {
    // Rising fanfare
    [196, 247, 294, 370, 440].forEach((f, i) => {
      this.tone(f, 0.15, 'triangle', 0.32, 0, undefined, i * 0.09);
      this.tone(f * 2, 0.12, 'sine', 0.18, 0, undefined, i * 0.09 + 0.04);
    });
    this.noise(0.12, 0.1, 3000, 0.42);
    setTimeout(() => this.musicLoop(), 700);
  }

  // v3.0: faction-specific intro fanfare
  factionIntro(faction: FactionId): void {
    this.setFaction(faction);
    const cfg = FACTION_MUSIC[faction] ?? FACTION_MUSIC['default'];
    [0, 3, 7, 12].forEach((semi, i) => {
      const f = cfg.base * 2 * Math.pow(2, semi / 12);
      this.tone(f, 0.18 - i * 0.02, cfg.mode[0], 0.3 - i * 0.04, 0, undefined, i * 0.1);
    });
    this.noise(0.06, 0.18, 2000, 0.02);
  }

  victory(): void {
    this.stopMusic();
    [523, 659, 784, 1046, 1318].forEach((f, i) => {
      this.tone(f, 0.3 - i * 0.03, 'sine', 0.35 - i * 0.04, 0, undefined, i * 0.09);
    });
    this.tone(2093, 0.5, 'sine', 0.25, 0, undefined, 0.5);
    this.noise(0.12, 0.12, 5000, 0.45);
  }

  defeat(): void {
    this.stopMusic();
    try {
      const c = this.ctx(); const out = this.sfx();
      const osc = c.createOscillator(); const g = c.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(330, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(55, c.currentTime + 1.2);
      g.gain.setValueAtTime(0.42, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.2);
      osc.connect(g); g.connect(out);
      osc.start(); osc.stop(c.currentTime + 1.25);
    } catch {}
    this.noise(0.4, 0.15, 300, 0.1);
  }

  draw(): void {
    this.stopMusic();
    [440, 440, 392].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.28, 0, undefined, i * 0.15));
  }

  // ─── Volume controls (v2.0 fully preserved) ───────────────────────────────
  setMuted(m: boolean): void {
    this._muted = m;
    if (this._master) this._master.gain.value = m ? 0 : 1;
    if (m) this.stopMusic();
  }
  setMusicVol(v: number): void {
    this._musicVol = Math.max(0, Math.min(1, v));
    if (this._musicBus) this._musicBus.gain.value = this._musicVol;
  }
  setSfxVol(v: number): void {
    this._sfxVol = Math.max(0, Math.min(1, v));
    if (this._sfxBus) this._sfxBus.gain.value = this._sfxVol;
  }
  getMusicVol(): number { return this._musicVol; }
  getSfxVol(): number { return this._sfxVol; }
  isMuted(): boolean { return this._muted; }
  getIntensityLevel(): IntensityLevel { return this._intensityLevel; }

  // ─── T.2: UI SFX Actions (EPICA T.2 — chat76) ─────────────────────────────
  /** Card hover — subtle tick (T.2) */
  sfxCardHover(): void {
    this.tone(1200, 0.04, 'sine', 0.07, 200);
  }
  /** Card confirm-select (T.2) */
  sfxCardSelect(): void {
    this.tone(880, 0.07, 'square', 0.16);
    this.tone(1108, 0.09, 'sine', 0.12, 0, undefined, 0.04);
  }
  /** Card dropped onto field — impact thud (T.2) */
  sfxCardDrop(): void {
    this.noise(0.06, 0.28, 350);
    this.tone(147, 0.10, 'square', 0.30, 0, undefined, 0.03);
  }
  /** Advance turn whoosh (T.2) */
  sfxTurnAdvance(): void {
    this.tone(440, 0.07, 'triangle', 0.14);
    this.tone(660, 0.09, 'sine', 0.10, 0, undefined, 0.04);
  }
  /** Dramatic pack-open reveal: rising sweep + shimmer (T.2) */
  sfxPackOpen(): void {
    this.noise(0.08, 0.22, 800);
    [196, 261, 329, 392, 523].forEach((f, i) =>
      this.tone(f, 0.16, 'sawtooth', 0.20, 0, undefined, i * 0.06),
    );
    this.tone(1046, 0.38, 'sine', 0.26, 0, undefined, 0.32);
    this.noise(0.10, 0.10, 5000, 0.28);
  }
  /** Battle action hit — delegates to existing attack() (T.2) */
  sfxBattleHit(): void { this.attack(); }
  /** Victory jingle shorthand (T.2) */
  sfxBattleWin(): void { this.victory(); }
  /** Defeat jingle shorthand (T.2) */
  sfxBattleLose(): void { this.defeat(); }


  // ─── AN.1: Extended UI SFX (chat94) ─────────────────────────────────────
  /** Generic action button click — soft confirmation (AN.1) */
  sfxButtonClick(): void {
    this.tone(900, 0.03, 'sine', 0.08, 100);
    this.tone(1100, 0.04, 'sine', 0.05, 0, undefined, 0.02);
  }
  /** Route/navigation change — subtle whoosh (AN.1) */
  sfxNavChange(): void {
    this.noise(0.07, 0.06, 2500, 0);
    this.tone(740, 0.05, 'sine', 0.07, 0, undefined, 0.02);
  }
  /** Notification/toast appear — ascending chime (AN.1) */
  sfxNotification(): void {
    this.tone(880, 0.10, 'sine', 0.16);
    this.tone(1108, 0.12, 'sine', 0.12, 0, undefined, 0.05);
    this.tone(1318, 0.15, 'sine', 0.09, 0, undefined, 0.11);
  }
  /** Error/fail feedback — descending buzz (AN.1) */
  sfxError(): void {
    this.tone(220, 0.10, 'sawtooth', 0.16);
    this.tone(185, 0.09, 'square',   0.12, 0, undefined, 0.07);
  }

  // ─── AU.1+AU.2 Audio Extensions (chat99) ────────────────────────────────
  sfxDoubleStrike(): void {
    this.tone(280, 0.04, 'square', 0.32); this.noise(0.04, 0.15, 1800);
    this.tone(280, 0.04, 'square', 0.28, 0, undefined, 0.12); this.noise(0.04, 0.13, 2200, 0.12);
  }
  sfxKeywordPoison(): void {
    this.noise(0.35, 0.12, 800); this.tone(180, 0.18, 'triangle', 0.10, 0, undefined, 0.05);
    this.tone(220, 0.14, 'triangle', 0.08, 0, undefined, 0.16);
  }
  sfxKeywordShield(): void {
    this.tone(1046, 0.03, 'square', 0.35); this.tone(523, 0.14, 'sine', 0.22, 400, undefined, 0.02);
    this.noise(0.06, 0.14, 5000, 0.01);
  }
  sfxKeywordLifesteal(): void {
    this.noise(0.10, 0.12, 300); this.tone(660, 0.12, 'sine', 0.18, 700);
    this.tone(880, 0.14, 'sine', 0.12, 0, undefined, 0.08);
  }
  sfxCardByRarity(rarity: string): void {
    switch (rarity) {
      case 'Common':   this.tone(440, 0.05, 'sine', 0.08); break;
      case 'Uncommon': this.tone(523, 0.07, 'sine', 0.11); break;
      case 'Rare':
        this.tone(659, 0.10, 'sine', 0.16); this.tone(880, 0.12, 'sine', 0.10, 600, undefined, 0.05); break;
      case 'Epic':
        this.tone(330, 0.06, 'square', 0.22); this.noise(0.06, 0.10, 1200, 0.02);
        this.tone(523, 0.14, 'sine', 0.16, 0, undefined, 0.06); break;
      case 'Legendary':
        this.tone(440, 0.04, 'square', 0.28); this.tone(659, 0.12, 'sine', 0.22);
        this.tone(880, 0.16, 'sine', 0.16, 0, undefined, 0.08);
        this.tone(1108, 0.18, 'sine', 0.10, 0, undefined, 0.16); break;
      case 'Mythic':
        this.tone(220, 0.06, 'sawtooth', 0.32); this.noise(0.08, 0.18, 600, 0.02);
        this.tone(440, 0.10, 'square', 0.22, 0, undefined, 0.06);
        this.tone(880, 0.16, 'sine', 0.20, 0, undefined, 0.12);
        this.tone(1320, 0.22, 'sine', 0.14, 800, undefined, 0.20); break;
      default: this.tone(440, 0.05, 'sine', 0.08); break;
    }
  }

  // ─── Keyword trigger (v2.0 API — fully preserved) ────────────────────────
  triggerKeyword(keyword: string): void {
    const map: Record<string, () => void> = {
      Guard: () => this.guard(), Surge: () => this.surge(), Flux: () => this.flux(),
      Consecrate: () => this.consecrate(), Drain: () => this.drain(),
      Veil: () => this.veil(), Forge: () => this.forge(), Resonance: () => this.resonance(),
      Lifesteal: () => this.lifesteal(), Poison: () => this.poison(),
      Shield: () => this.shield(), Rush: () => this.surge(), DoubleStrike: () => { this.attack(); setTimeout(() => this.attack(), 120); },
    };
    map[keyword]?.();
  }
}

export const AudioEngine = new VexForgeAudioEngine();

// ═══════════════════════════════════════════════════════════════════════════
// T.1 — Section Ambient Music (chat74 · EPICA T.1 · Sistema de Audio Global)
// Extends v3.0 with section-based ambient palettes, crossfade on section
// change, localStorage persistence and first-gesture unlock.
// Backward-compatible: existing setFaction/musicLoop callers keep working.
// ═══════════════════════════════════════════════════════════════════════════

export type VexforgeSection = 'hub' | 'battle' | 'missions' | 'market' | 'bosses' | 'social';

const SECTION_PALETTES: Record<string, { base: number; mode: OscillatorType[]; tempo: number; color: string }> = {
  'section:hub':      { base: 165, mode: ['sine', 'triangle'],     tempo: 0.70, color: '#e8b84b' },
  'section:battle':   { base: 130, mode: ['sawtooth', 'square'],   tempo: 0.55, color: '#c0392b' },
  'section:missions': { base: 174, mode: ['triangle', 'sine'],     tempo: 0.62, color: '#27ae60' },
  'section:market':   { base: 196, mode: ['square', 'sawtooth'],   tempo: 0.72, color: '#f39c12' },
  'section:bosses':   { base:  98, mode: ['sawtooth', 'triangle'], tempo: 0.48, color: '#8e44ad' },
  'section:social':   { base: 220, mode: ['sine', 'triangle'],     tempo: 0.66, color: '#4a9eff' },
};

const AUDIO_STORAGE_KEY = 'vexforge_audio_prefs_v1';

// Register section palettes into the module-level FACTION_MUSIC lookup so
// setFaction('section:hub') + musicLoop() reuse the existing music engine.
Object.entries(SECTION_PALETTES).forEach(([k, v]) => {
  (FACTION_MUSIC as any)[k] = v;
});

function _installSectionApi(engine: any): void {
  if (engine.__sectionApiInstalled) return;
  engine.__sectionApiInstalled = true;
  engine._currentSection = null;

  // localStorage persistence
  engine.hydrateFromStorage = function (): void {
    try {
      const raw = localStorage.getItem(AUDIO_STORAGE_KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as { muted?: boolean; musicVol?: number; sfxVol?: number };
      if (typeof p.muted    === 'boolean') this.setMuted(p.muted);
      if (typeof p.musicVol === 'number')  this.setMusicVol(p.musicVol);
      if (typeof p.sfxVol   === 'number')  this.setSfxVol(p.sfxVol);
    } catch { /* silent */ }
  };
  engine._persist = function (): void {
    try {
      localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify({
        muted: this._muted, musicVol: this._musicVol, sfxVol: this._sfxVol,
      }));
    } catch { /* silent */ }
  };
  // Wrap existing setters so every mutation persists.
  (['setMuted', 'setMusicVol', 'setSfxVol'] as const).forEach((name) => {
    const orig = engine[name];
    if (typeof orig !== 'function') return;
    engine[name] = function (v: any) {
      const r = orig.call(this, v);
      this._persist();
      return r;
    };
  });

  engine.getSection = function (): VexforgeSection | null { return this._currentSection ?? null; };

  // First-user-gesture unlock (browsers block AudioContext until interaction)
  engine.unlock = function (): void {
    try {
      const c = this.ctx();
      if (c && c.state === 'suspended') c.resume().catch(() => {});
    } catch { /* silent */ }
  };

  // Section ambient with crossfade
  engine.startSectionAmbient = function (section: VexforgeSection): void {
    if (this._currentSection === section && this._factionMusicActive && !this._muted) return;
    this._currentSection = section;
    if (this._muted) return;

    const paletteKey = 'section:' + section;
    const target = (FACTION_MUSIC as any)[paletteKey] ? paletteKey : 'default';

    try {
      const c = this.ctx();
      const bus = this._musicBus;
      if (!bus) { this.setFaction(target); this.musicLoop(); return; }

      const now = c.currentTime;
      const targetVol = this._musicVol;
      bus.gain.cancelScheduledValues(now);
      bus.gain.setValueAtTime(bus.gain.value, now);
      bus.gain.linearRampToValueAtTime(0.001, now + 0.30);

      setTimeout(() => {
        this.stopMusic();
        this.setFaction(target);
        this._intensity = 1.0;
        this._intensityLevel = 'calm';
        this.musicLoop();
        try {
          const cc = this.ctx();
          const now2 = cc.currentTime;
          bus.gain.cancelScheduledValues(now2);
          bus.gain.setValueAtTime(0.001, now2);
          bus.gain.linearRampToValueAtTime(targetVol, now2 + 0.40);
        } catch { /* silent */ }
      }, 320);
    } catch { /* silent fail */ }
  };

  engine.stopAmbient = function (): void {
    this._currentSection = null;
    this.stopMusic();
  };
}

_installSectionApi(AudioEngine as any);
