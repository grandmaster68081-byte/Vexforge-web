// VexForge Audio Engine v3.0 — Epic I: VEXFORGE DOMINION
// Faction themes + Dynamic intensity + Crossfade + Combo audio + Rarity variants.
// Backward-compatible with all v2.0 callers.
// Web Audio API only — zero external assets.

type MusicOscEntry = { stop: () => void };

type FactionId = 'Guerrero' | 'Mago' | 'Pícaro' | 'Paladín' | 'Explorador' | 'Comerciante' | string;
type IntensityLevel = 'calm' | 'tense' | 'desperate';

// ─── Faction music config ──────────────────────────────────────────────────────
const FACTION_MUSIC: Record<string, { base: number; mode: OscillatorType[]; tempo: number; color: string }> = {
  Guerrero:    { base: 110, mode: ['sawtooth', 'square'],   tempo: 0.72, color: '#c0392b' },
  Mago:        { base: 220, mode: ['sine', 'triangle'],     tempo: 0.52, color: '#8e44ad' },
  'Pícaro':    { base: 174, mode: ['triangle', 'sine'],     tempo: 0.64, color: '#27ae60' },
  'Paladín':   { base: 196, mode: ['square', 'sawtooth'],   tempo: 0.68, color: '#f39c12' },
  // Legacy aliases
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
    const faction = this._faction as string;
    // Per-faction + per-rarity hit sounds — Lote 3/4
    try {
      switch (rarity) {
        case 'Mythic':
        case 'Founder': {
          // Deep seismic boom + high harmonic shriek
          this.tone(40, 0.10, 'sawtooth', 0.5); this.noise(0.10, 0.35, 300);
          this.tone(1760, 0.06, 'square', 0.22, 0, undefined, 0.04);
          this.tone(880, 0.08, 'sine', 0.18, 0, undefined, 0.07);
          // Faction tint
          if (faction === 'Guerrero') { this.tone(110, 0.08, 'sawtooth', 0.4, 0, undefined, 0.02); }
          else if (faction === 'Mago') { this.tone(1046, 0.06, 'sine', 0.18, 200, undefined, 0.06); }
          else if (faction === 'Paladín') { this.tone(659, 0.06, 'triangle', 0.16, 0, undefined, 0.05); }
          break;
        }
        case 'Legendary': {
          this.tone(220, 0.06, 'square', 0.42); this.noise(0.07, 0.28, 1200);
          this.tone(880, 0.09, 'sine', 0.22, 0, undefined, 0.03);
          this.tone(440, 0.08, 'triangle', 0.2, 0, undefined, 0.05);
          if (faction === 'Guerrero') { this.tone(147, 0.07, 'sawtooth', 0.3); }
          else if (faction === 'Mago') { this.tone(987, 0.06, 'sine', 0.18, 150, undefined, 0.04); }
          break;
        }
        case 'Epic': {
          this.tone(175, 0.07, 'sawtooth', 0.38); this.noise(0.05, 0.22, 1400);
          this.tone(523, 0.06, 'sine', 0.16, 0, undefined, 0.04);
          if (faction === 'Pícaro') { this.tone(659, 0.05, 'square', 0.14, 100, undefined, 0.03); }
          else if (faction === 'Mago') { this.tone(830, 0.05, 'sine', 0.14, 120, undefined, 0.03); }
          break;
        }
        case 'Rare': {
          this.tone(147, 0.07, 'sawtooth', 0.33); this.noise(0.05, 0.18, 1600);
          this.tone(370, 0.05, 'triangle', 0.15, 0, undefined, 0.03);
          break;
        }
        case 'Uncommon': {
          // Crisp metal clash
          this.tone(300, 0.05, 'square', 0.25); this.noise(0.04, 0.14, 2200);
          break;
        }
        case 'Common':
        default: {
          // Quick thud
          this.noise(0.04, 0.10, 800); this.tone(200, 0.04, 'square', 0.2);
          break;
        }
      }
    } catch { this.attack(); }
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
    // Guard: prevent orphan intervals if stopMusic called concurrently
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

      // Layer 2: melodic voice — pentatonic arpeggio (AudioContext-scheduled for zero jitter)
      let step = 0;
      let arpActive = true;
      const noteDur = beatDur * (this._intensityLevel === 'desperate' ? 0.25 : 0.5);

      const scheduleArpAt = (t0: number) => {
        if (!this._ctx || this._ctx.state === 'closed' || !arpActive) return;
        const semitone = PENTA[step % PENTA.length];
        const freq = cfg.base * 2 * Math.pow(2, semitone / 12);
        const noteVol = baseVol * (0.5 + Math.random() * 0.25);
        const arpOsc = c.createOscillator(); const ag = c.createGain();
        arpOsc.type = cfg.mode[1] ?? 'sine';
        arpOsc.frequency.value = freq;
        ag.gain.setValueAtTime(0.001, t0);
        ag.gain.linearRampToValueAtTime(noteVol, t0 + 0.015);
        ag.gain.exponentialRampToValueAtTime(0.001, t0 + noteDur * 0.85);
        arpOsc.connect(ag); ag.connect(out);
        arpOsc.start(t0); arpOsc.stop(t0 + noteDur * 0.9);
        step++;
      };

      // Pre-schedule ahead in a look-ahead loop (60ms look-ahead, checked every 25ms)
      const LOOK_AHEAD = 0.06; // seconds
      const SCHEDULE_INTERVAL = 25; // ms
      let nextNoteTime = c.currentTime;
      // Schedule first batch immediately
      while (nextNoteTime < c.currentTime + LOOK_AHEAD) {
        scheduleArpAt(nextNoteTime);
        nextNoteTime += noteDur;
      }
      const arpId = setInterval(() => {
        if (!this._factionMusicActive || !arpActive) { clearInterval(arpId); return; }
        if (!this._ctx || this._ctx.state === 'closed') { clearInterval(arpId); return; }
        while (nextNoteTime < this._ctx.currentTime + LOOK_AHEAD) {
          scheduleArpAt(nextNoteTime);
          nextNoteTime += noteDur;
        }
      }, SCHEDULE_INTERVAL);
      this._musicOscs.push({ stop: () => { arpActive = false; clearInterval(arpId); } });

      // Layer 3: percussion hit (desperate/tense only) — also AudioContext-scheduled
      if (this._intensityLevel !== 'calm') {
        const percNoteDur = beatDur * (this._intensityLevel === 'desperate' ? 0.32 : 0.48);
        let percActive = true;
        let nextPercTime = c.currentTime;
        while (nextPercTime < c.currentTime + LOOK_AHEAD) {
          const delay = Math.max(0, nextPercTime - c.currentTime);
          this.noise(0.04, 0.14, 2500, delay);
          this.tone(cfg.base * 0.5, 0.06, 'square', 0.12, 0, undefined, delay);
          nextPercTime += percNoteDur;
        }
        const percId = setInterval(() => {
          if (!this._factionMusicActive || !percActive) { clearInterval(percId); return; }
          if (!this._ctx || this._ctx.state === 'closed') { clearInterval(percId); return; }
          while (nextPercTime < this._ctx.currentTime + LOOK_AHEAD) {
            const delay = Math.max(0, nextPercTime - this._ctx.currentTime);
            this.noise(0.04, 0.14, 2500, delay);
            this.tone(cfg.base * 0.5, 0.06, 'square', 0.12, 0, undefined, delay);
            nextPercTime += percNoteDur;
          }
        }, SCHEDULE_INTERVAL);
        this._musicOscs.push({ stop: () => { percActive = false; clearInterval(percId); } });
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

  // ─── AU.3: Fase 2 Batch 3 SFX additions ─────────────────────────────────
  /** Mythic card attack — earth-shattering roar */
  sfxMythicAttack(): void {
    this.noise(0.12, 0.30, 300, 0);
    this.tone(80,  0.08, 'sawtooth', 0.38, 0, undefined, 0.00);
    this.tone(120, 0.06, 'square',   0.28, 0, undefined, 0.06);
    this.tone(55,  0.10, 'sawtooth', 0.35, 0, undefined, 0.12);
    this.noise(0.08, 0.18, 5000, 0.10);
    this.tone(440, 0.06, 'sine', 0.15, 0, undefined, 0.22);
  }
  /** Legendary card attack — orchestral stab */
  sfxLegendaryAttack(): void {
    this.tone(220, 0.05, 'sawtooth', 0.30);
    this.tone(330, 0.08, 'square',   0.22, 0, undefined, 0.04);
    this.tone(550, 0.10, 'sine',     0.18, 0, undefined, 0.08);
    this.noise(0.06, 0.14, 1800, 0.02);
    this.tone(880, 0.14, 'sine', 0.12, 0, undefined, 0.16);
  }
  /** Epic card attack — arcane surge */
  sfxEpicAttack(): void {
    this.tone(370, 0.06, 'square', 0.22); this.noise(0.05, 0.12, 1500, 0.02);
    this.tone(740, 0.10, 'sine', 0.16, 0, undefined, 0.08);
  }
  /** Kill confirmed — dramatic elimination SFX */
  sfxKillV2(): void {
    this.noise(0.10, 0.08, 400, 0);
    this.tone(180, 0.07, 'square', 0.28, 0, undefined, 0.04);
    this.tone(150, 0.08, 'sawtooth', 0.22, 0, undefined, 0.12);
    setTimeout(() => {
      this.tone(110, 0.06, 'square', 0.18, 0, undefined, 0.04);
      this.noise(0.06, 0.14, 200, 0.05);
    }, 200);
  }
  /** Critical hit — electric crack + impact */
  sfxCritV2(): void {
    this.noise(0.06, 0.04, 8000, 0);
    this.tone(660, 0.03, 'square', 0.32);
    this.noise(0.10, 0.12, 1600, 0.02);
    this.tone(330, 0.08, 'sawtooth', 0.22, 0, undefined, 0.04);
  }
  /** Pack Mythic reveal — ultra dramatic */
  sfxPackMythicReveal(): void {
    this.noise(0.14, 0.06, 200, 0);
    [110, 165, 220, 330, 440, 659, 880, 1320].forEach((f, i) =>
      this.tone(f, 0.18, i < 4 ? 'sawtooth' : 'sine', 0.28, 0, undefined, i * 0.045)
    );
    setTimeout(() => {
      this.noise(0.08, 0.25, 5000, 0);
      this.tone(2637, 0.30, 'sine', 0.12, 1000, undefined, 0.1);
    }, 380);
  }
  /** Achievement unlock — triumphant fanfare */
  sfxAchievementUnlock(): void {
    [523, 659, 784, 1047].forEach((f, i) =>
      this.tone(f, 0.20, 'sine', 0.20, 0, undefined, i * 0.07)
    );
    this.noise(0.04, 0.08, 5000, 0.08);
    this.tone(1568, 0.30, 'sine', 0.16, 0, undefined, 0.28);
  }
  /** Level up — ascending scale fanfare */
  sfxLevelUp(): void {
    [261, 329, 392, 523, 659].forEach((f, i) =>
      this.tone(f, 0.14, 'sine', 0.20, 200, undefined, i * 0.08)
    );
    this.noise(0.04, 0.10, 4000, 0.40);
    this.tone(1047, 0.24, 'sine', 0.18, 0, undefined, 0.42);
  }
  /** Shop purchase — satisfying buy SFX */
  sfxPurchase(): void {
    this.tone(523, 0.08, 'sine', 0.18); this.tone(784, 0.10, 'sine', 0.14, 0, undefined, 0.06);
    this.noise(0.03, 0.06, 4000, 0.04);
  }
  /** Clan join — epic horn */
  sfxClanJoin(): void {
    this.tone(220, 0.10, 'sawtooth', 0.25); this.tone(330, 0.12, 'square', 0.20, 0, undefined, 0.06);
    this.tone(440, 0.16, 'sine', 0.18, 0, undefined, 0.14);
  }
  /** Rarity-gated attack SFX dispatcher */
  sfxAttackByRarity(rarity: string): void {
    switch (rarity) {
      case 'Mythic':    this.sfxMythicAttack();    break;
      case 'Legendary': this.sfxLegendaryAttack(); break;
      case 'Epic':      this.sfxEpicAttack();      break;
      default:          this.attack();              break;
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

// ═══════════════════════════════════════════════════════════════════════════
// FASE 2 — Nuevos SFX para reveals, level up, craft y efectos especiales
// Chat 98 — mejorar experiencia auditiva completa
// ═══════════════════════════════════════════════════════════════════════════

declare module "./audioEngine" {
  interface VexForgeAudioEngine {
    sfxLegendaryReveal(): void;
    sfxMythicReveal(): void;
    sfxLevelUp(): void;
    sfxCraftSuccess(): void;
    sfxRarityReveal(rarity: string): void;
    sfxScreenTransition(): void;
    sfxBossEncounter(): void;
    sfxQuestComplete(): void;
    sfxPackLegendaryOpen(): void;
    sfxComboChain(count: number): void;
  }
}

// Patch nuevos métodos sobre la instancia AudioEngine existente
(function installFase2Sfx(engine: any) {
  if (engine.__fase2SfxInstalled) return;
  engine.__fase2SfxInstalled = true;

  // ─── Golden fanfare for Legendary card reveal ────────────────────────────
  engine.sfxLegendaryReveal = function (): void {
    try {
      // Rising arpegio dorado — Do-Mi-Sol-Do'
      const freqs = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
      freqs.forEach((f, i) => {
        this.tone(f, 0.3, 'sine', 0.22 - i * 0.02, 0, undefined, i * 0.075);
      });
      // Harmony chord
      [523.25, 659.25, 783.99].forEach((f, i) => {
        this.tone(f, 0.55, 'triangle', 0.12, i * 200, undefined, 0.45 + i * 0.04);
      });
      // Final shimmer
      this.tone(1046.5, 0.4, 'sine', 0.18, 600, undefined, 0.55);
      this.noise(0.08, 0.12, 6000, 0.48);
    } catch { /* silent */ }
  };

  // ─── Dramatic reveal for Mythic card ────────────────────────────────────
  engine.sfxMythicReveal = function (): void {
    try {
      // Deep bass hit
      this.tone(55, 0.06, 'sawtooth', 0.5, 0);
      this.noise(0.07, 0.4, 300, 0);
      // Thunder rumble
      this.noise(0.18, 0.25, 150, 0.04);
      // Rising siren
      const ctx = this.ctx();
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, ctx.currentTime + 0.05);
      osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.55);
      g.gain.setValueAtTime(0, ctx.currentTime + 0.05);
      g.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.15);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
      osc.connect(g); g.connect(this.sfx());
      osc.start(ctx.currentTime + 0.05);
      osc.stop(ctx.currentTime + 0.7);
      // Chaos stabs
      [220, 330, 440, 660].forEach((f, i) => {
        this.tone(f, 0.05, 'square', 0.18, 0, undefined, 0.1 + i * 0.07);
      });
      // Final high impact
      this.tone(880, 0.2, 'sine', 0.22, 0, undefined, 0.58);
      this.tone(1100, 0.15, 'sine', 0.15, 0, undefined, 0.65);
    } catch { /* silent */ }
  };

  // ─── Level up jingle ─────────────────────────────────────────────────────
  engine.sfxLevelUp = function (): void {
    try {
      // Ascending arpeggio
      const scale = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      scale.forEach((f, i) => {
        this.tone(f, 0.25, 'sine', 0.25 - i * 0.02, 0, undefined, i * 0.06);
      });
      // Fanfare chord
      [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
        this.tone(f, 0.6, 'triangle', 0.15, i * 100, undefined, 0.42 + i * 0.03);
      });
      this.noise(0.06, 0.18, 8000, 0.44);
      // Shimmer tail
      this.tone(1568, 0.35, 'sine', 0.12, 0, undefined, 0.7);
    } catch { /* silent */ }
  };

  // ─── Craft / fusion success ───────────────────────────────────────────────
  engine.sfxCraftSuccess = function (): void {
    try {
      this.noise(0.04, 0.35, 800, 0);
      this.tone(147, 0.12, 'sawtooth', 0.35, 0, undefined, 0.03);
      [293.66, 369.99, 440.00, 587.33].forEach((f, i) => {
        this.tone(f, 0.2, 'sine', 0.22, 0, undefined, 0.15 + i * 0.08);
      });
      this.noise(0.05, 0.12, 5000, 0.5);
      this.tone(880, 0.25, 'sine', 0.18, 0, undefined, 0.52);
    } catch { /* silent */ }
  };

  // ─── Screen / page transition whoosh ─────────────────────────────────────
  engine.sfxScreenTransition = function (): void {
    try {
      const ctx = this.ctx();
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.18);
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(g); g.connect(this.sfx());
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.22);
    } catch { /* silent */ }
  };

  // ─── Boss encounter dramatic sting ───────────────────────────────────────
  engine.sfxBossEncounter = function (): void {
    try {
      this.noise(0.06, 0.45, 200, 0);
      this.noise(0.12, 0.3, 100, 0.04);
      this.tone(55, 0.08, 'sawtooth', 0.5, 0, undefined, 0);
      this.tone(73.4, 0.12, 'square', 0.35, 0, undefined, 0.06);
      this.tone(146.8, 0.35, 'sawtooth', 0.25, 0, undefined, 0.15);
      this.tone(110, 0.5, 'sine', 0.18, 0, undefined, 0.5);
    } catch { /* silent */ }
  };

  // ─── Quest complete — uplifting ───────────────────────────────────────────
  engine.sfxQuestComplete = function (): void {
    try {
      [329.63, 392.00, 523.25, 659.25].forEach((f, i) => {
        this.tone(f, 0.28, 'sine', 0.24, 0, undefined, i * 0.07);
      });
      this.tone(783.99, 0.4, 'triangle', 0.18, 0, undefined, 0.28);
      this.noise(0.05, 0.1, 6000, 0.3);
    } catch { /* silent */ }
  };

  // ─── Pack opening — Legendary/Mythic entrance fanfare ────────────────────
  engine.sfxPackLegendaryOpen = function (): void {
    try {
      this.noise(0.04, 0.4, 500, 0);
      const ctx = this.ctx();
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, ctx.currentTime + 0.05);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.4);
      g.gain.setValueAtTime(0.001, ctx.currentTime + 0.05);
      g.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.18);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
      osc.connect(g); g.connect(this.sfx());
      osc.start(ctx.currentTime + 0.05);
      osc.stop(ctx.currentTime + 0.6);
      setTimeout(() => { try { this.sfxLegendaryReveal(); } catch {} }, 420);
    } catch { /* silent */ }
  };

  // ─── Combo chain — escalating ─────────────────────────────────────────────
  engine.sfxComboChain = function (count: number): void {
    try {
      const base = 220 * Math.pow(1.15, Math.min(count, 8));
      this.tone(base, 0.1, 'square', 0.28, 0);
      this.tone(base * 1.5, 0.08, 'sine', 0.18, 0, undefined, 0.05);
      if (count >= 3) this.tone(base * 2, 0.06, 'triangle', 0.14, 0, undefined, 0.1);
    } catch { /* silent */ }
  };

  // ─── Dispatch by rarity ───────────────────────────────────────────────────
  engine.sfxRarityReveal = function (rarity: string): void {
    try {
      switch (rarity) {
        case 'Mythic':    this.sfxMythicReveal(); break;
        case 'Legendary': this.sfxLegendaryReveal(); break;
        case 'Epic':      [440, 554, 659].forEach((f,i) => this.tone(f, 0.2, 'sine', 0.2, 0, undefined, i * 0.06)); break;
        case 'Rare':      [329, 440, 523].forEach((f,i) => this.tone(f, 0.15, 'sine', 0.18, 0, undefined, i * 0.05)); break;
        default:          this.tone(440, 0.1, 'sine', 0.15, 0); break;
      }
    } catch { /* silent */ }
  };

  // ─── Attack hit SFX — per faction type ────────────────────────────────────
  engine.sfxAttackHit = function (type: string): void {
    try {
      if (type === 'heavy') {
        this.tone(80, 0.05, 'sawtooth', 0.5, 0);
        this.noise(0.07, 0.3, 400, 0.02);
        this.tone(160, 0.12, 'square', 0.25, 0, undefined, 0.04);
      } else if (type === 'magic') {
        this.tone(880, 0.08, 'sine', 0.22, 0);
        this.tone(1100, 0.12, 'sine', 0.18, 200, undefined, 0.04);
        this.noise(0.05, 0.12, 4000, 0.06);
      } else {
        this.tone(220, 0.06, 'square', 0.28, 0);
        this.noise(0.05, 0.18, 1200, 0.02);
      }
    } catch { /* silent */ }
  };

})(AudioEngine as any);

// ═══════════════════════════════════════════════════════════════════════════
// CHAT100 — SFX Expansion Pack: Victory, Defeat, Crit, Kill, RankUp, Streak
// ═══════════════════════════════════════════════════════════════════════════
(function addChat100SFX(engine: any) {

  /** sfxVictory — orchestral fanfare: 3 rising stabs + bell shimmer */
  engine.sfxVictory = function (): void {
    try {
      // Brass stabs ascending
      [[0, 220, 0.45], [0.18, 330, 0.42], [0.34, 440, 0.48]].forEach(([delay, freq, vol]) => {
        this.tone(freq, 0.28, 'sawtooth', vol, 0, undefined, delay);
        this.tone(freq * 1.5, 0.22, 'sine', vol * 0.6, 0, undefined, delay + 0.05);
      });
      // Bell shimmer at the top
      [0.52, 0.6, 0.68, 0.76].forEach((d, i) => {
        this.tone(880 + i * 220, 0.4, 'sine', 0.18 - i * 0.02, 0, undefined, d);
      });
      // Low triumphant bass
      this.tone(55, 0.5, 'sawtooth', 0.4, 0, undefined, 0.35);
      this.tone(110, 0.4, 'square', 0.25, 0, undefined, 0.4);
      // Noise burst for impact
      this.noise?.(0.08, 0.15, 600, 0.0, undefined, 0.52);
    } catch { /* silent */ }
  };

  /** sfxDefeat — descending minor arpeggio + low drone */
  engine.sfxDefeat = function (): void {
    try {
      [[0, 330, 0.38], [0.2, 261, 0.35], [0.38, 196, 0.32], [0.55, 130, 0.28]].forEach(([delay, freq, vol]) => {
        this.tone(freq, 0.5, 'sine', vol, 0, undefined, delay);
        this.tone(freq * 0.5, 0.6, 'triangle', vol * 0.5, 0, undefined, delay);
      });
      // Rumble
      this.tone(55, 0.9, 'sawtooth', 0.25, 0, undefined, 0.6);
      this.noise?.(0.12, 0.4, 200, 0.0, undefined, 0.6);
    } catch { /* silent */ }
  };

  /** sfxCriticalHit — sharp crack + electric sizzle */
  engine.sfxCriticalHit = function (): void {
    try {
      this.tone(60, 0.04, 'sawtooth', 0.6, 0);
      this.tone(180, 0.06, 'square', 0.5, 0, undefined, 0.02);
      this.noise?.(0.1, 0.18, 3000, 0.0);
      this.tone(1200, 0.12, 'sine', 0.22, 0, undefined, 0.06);
      this.tone(2400, 0.08, 'sine', 0.14, 0, undefined, 0.1);
    } catch { /* silent */ }
  };

  /** sfxKillConfirm — enemy eliminated satisfying pop */
  engine.sfxKillConfirm = function (): void {
    try {
      this.tone(440, 0.08, 'square', 0.35, 0);
      this.tone(880, 0.12, 'sine', 0.28, 0, undefined, 0.06);
      this.tone(1760, 0.18, 'sine', 0.18, 0, undefined, 0.12);
      this.noise?.(0.06, 0.12, 2000, 0.0, undefined, 0.18);
    } catch { /* silent */ }
  };

  /** sfxRankUp — dramatic multi-layer rank promotion */
  engine.sfxRankUp = function (): void {
    try {
      // Rising scale sweep
      [196, 247, 294, 370, 440, 587, 740, 880].forEach((f, i) => {
        this.tone(f, 0.25, 'sine', 0.28 - i * 0.02, 0, undefined, i * 0.07);
      });
      // Final chord
      [440, 550, 660, 880].forEach((f, i) => {
        this.tone(f, 0.5, 'sine', 0.3, 0, undefined, 0.62 + i * 0.03);
      });
      // Bass boom
      this.tone(110, 0.4, 'sawtooth', 0.35, 0, undefined, 0.65);
      // Shimmer tail
      this.tone(1760, 0.6, 'sine', 0.1, 0, undefined, 0.72);
      this.tone(2200, 0.5, 'sine', 0.07, 0, undefined, 0.78);
    } catch { /* silent */ }
  };

  /** sfxStreakFire — escalating fire crackle for win streaks */
  engine.sfxStreakFire = function (count: number): void {
    try {
      const intensity = Math.min(count / 5, 1);
      const baseFreq = 120 + count * 30;
      this.tone(baseFreq, 0.12, 'sawtooth', 0.3 + intensity * 0.2, 0);
      this.noise?.(0.08 + intensity * 0.06, 0.2, 800 + count * 200, 0.0);
      if (count >= 3) {
        this.tone(baseFreq * 2, 0.08, 'square', 0.2, 0, undefined, 0.04);
        this.noise?.(0.06, 0.15, 2000, 0.0, undefined, 0.06);
      }
      if (count >= 5) {
        this.tone(baseFreq * 3, 0.06, 'sawtooth', 0.15, 0, undefined, 0.08);
        this.tone(1200, 0.1, 'sine', 0.12, 0, undefined, 0.12);
      }
    } catch { /* silent */ }
  };

  /** sfxHolographicReveal — for legendary card display in UI */
  engine.sfxHolographicReveal = function (): void {
    try {
      // Ascending shimmer
      [440, 554, 659, 880, 1109].forEach((f, i) => {
        this.tone(f, 0.3, 'sine', 0.2, 200, undefined, i * 0.06);
      });
      // Resonant bell
      this.tone(1760, 0.5, 'sine', 0.15, 0, undefined, 0.32);
      // Subtle noise burst
      this.noise?.(0.04, 0.12, 4000, 0.0, undefined, 0.35);
    } catch { /* silent */ }
  };

})(AudioEngine as any);

// ═══════════════════════════════════════════════════════════════════════════
// FASE 2 v5 — Per-faction cinematic attack SFX
// sfxFactionAttack(faction, rarity) — SFX único por facción + rareza
// ═══════════════════════════════════════════════════════════════════════════

(function installFactionAttackSfx(engine: any) {
  if (engine.__factionAttackSfxInstalled) return;
  engine.__factionAttackSfxInstalled = true;

  // ─── Guerrero — Sword clashes, heavy metal ────────────────────────────────
  engine._sfxGuerreroAttack = function (rarity: string): void {
    try {
      // Heavy sword clash — low thud + metallic ring
      this.noise(0.04, 0.45, 200, 0);
      this.tone(80, 0.06, 'sawtooth', 0.5, 0);
      this.tone(160, 0.12, 'square', 0.3, 0, undefined, 0.025);
      if (rarity === 'Rare' || rarity === 'Epic' || rarity === 'Legendary' || rarity === 'Mythic') {
        // Metallic ring after impact
        this.tone(880, 0.18, 'triangle', 0.15, -50, undefined, 0.06);
        this.tone(1108, 0.14, 'triangle', 0.10, 80, undefined, 0.08);
      }
      if (rarity === 'Legendary' || rarity === 'Mythic') {
        // War cry bass
        this.tone(55, 0.08, 'sawtooth', 0.4, 0, undefined, 0.02);
        this.noise(0.06, 0.35, 150, 0.04);
        this.tone(220, 0.10, 'square', 0.22, 0, undefined, 0.07);
      }
      if (rarity === 'Mythic') {
        // Screen-shake slam
        this.tone(40, 0.10, 'sawtooth', 0.6, 0);
        this.noise(0.08, 0.55, 80, 0.01);
        [110, 165, 220].forEach((f, i) => this.tone(f, 0.06, 'sawtooth', 0.2, 0, undefined, 0.03 + i * 0.02));
      }
    } catch { /* silent */ }
  };

  // ─── Mago — Arcane spell burst ────────────────────────────────────────────
  engine._sfxMagoAttack = function (rarity: string): void {
    try {
      // Magic burst — high frequency + shimmer
      this.tone(880, 0.08, 'sine', 0.22, 0);
      this.tone(1100, 0.12, 'sine', 0.18, 200, undefined, 0.04);
      this.noise(0.05, 0.12, 4000, 0.06);
      if (rarity === 'Rare' || rarity === 'Epic' || rarity === 'Legendary' || rarity === 'Mythic') {
        // Rising arcane energy
        [440, 554, 659, 880].forEach((f, i) => this.tone(f, 0.12, 'sine', 0.18 - i * 0.02, 0, undefined, i * 0.05));
        this.tone(1320, 0.15, 'sine', 0.20, 300, undefined, 0.18);
      }
      if (rarity === 'Legendary' || rarity === 'Mythic') {
        // Thunderclap spell
        this.noise(0.07, 0.35, 300, 0);
        [220, 440, 880, 1760].forEach((f, i) => this.tone(f, 0.10, 'triangle', 0.15, 0, undefined, i * 0.04));
        this.tone(2200, 0.20, 'sine', 0.18, 0, undefined, 0.16);
      }
      if (rarity === 'Mythic') {
        // Ultimate arcane implosion
        this.noise(0.12, 0.50, 200, 0.02);
        [110, 220, 440, 880, 1760].forEach((f, i) => this.tone(f, 0.08, 'sawtooth', 0.12, 0, undefined, i * 0.03));
        this.tone(3520, 0.25, 'sine', 0.15, 0, undefined, 0.15);
      }
    } catch { /* silent */ }
  };

  // ─── Pícaro — Quick dagger / stealth strikes ──────────────────────────────
  engine._sfxPicaroAttack = function (rarity: string): void {
    try {
      // Sharp quick hit — mid-high freq cut
      this.tone(440, 0.04, 'square', 0.25, 0);
      this.noise(0.03, 0.22, 2000, 0.01);
      this.tone(660, 0.06, 'square', 0.15, 100, undefined, 0.02);
      if (rarity === 'Rare' || rarity === 'Epic' || rarity === 'Legendary' || rarity === 'Mythic') {
        // Double hit flutter
        this.tone(550, 0.05, 'square', 0.20, 0, undefined, 0.08);
        this.tone(660, 0.05, 'square', 0.18, 0, undefined, 0.13);
        this.noise(0.03, 0.18, 3000, 0.09);
      }
      if (rarity === 'Legendary' || rarity === 'Mythic') {
        // Shadow burst
        this.noise(0.06, 0.30, 1500, 0);
        [880, 1100, 1320, 1760].forEach((f, i) => this.tone(f, 0.06, 'square', 0.14 - i * 0.02, 0, undefined, i * 0.03));
      }
      if (rarity === 'Mythic') {
        // Legendary combo finish
        [330, 440, 550, 660, 880].forEach((f, i) => this.tone(f, 0.06, 'square', 0.16, 0, undefined, i * 0.04));
        this.tone(1320, 0.12, 'sine', 0.18, 0, undefined, 0.20);
        this.noise(0.05, 0.28, 2500, 0.20);
      }
    } catch { /* silent */ }
  };

  // ─── Paladín — Holy light strikes ────────────────────────────────────────
  engine._sfxPaladinAttack = function (rarity: string): void {
    try {
      // Holy chime + pure tone
      this.tone(659, 0.08, 'triangle', 0.22, 0);
      this.tone(880, 0.12, 'triangle', 0.16, 50, undefined, 0.04);
      this.noise(0.04, 0.10, 6000, 0.06);
      if (rarity === 'Rare' || rarity === 'Epic' || rarity === 'Legendary' || rarity === 'Mythic') {
        // Bell resonance
        [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.20, 'triangle', 0.15 - i * 0.02, 0, undefined, i * 0.06));
        this.tone(2093, 0.25, 'sine', 0.12, 0, undefined, 0.24);
      }
      if (rarity === 'Legendary' || rarity === 'Mythic') {
        // Divine judgement
        [261, 329, 392, 523, 659, 784].forEach((f, i) => this.tone(f, 0.25, 'sine', 0.18 - i * 0.02, 0, undefined, i * 0.05));
        this.noise(0.06, 0.15, 8000, 0.30);
        this.tone(1047, 0.35, 'triangle', 0.18, 0, undefined, 0.30);
      }
      if (rarity === 'Mythic') {
        // Holy nova
        [130, 261, 523, 1047, 2093].forEach((f, i) => this.tone(f, 0.30, 'sine', 0.15, 0, undefined, i * 0.04));
        this.noise(0.08, 0.20, 10000, 0.02);
        this.tone(4186, 0.40, 'sine', 0.12, 0, undefined, 0.20);
      }
    } catch { /* silent */ }
  };

  // ─── Main dispatcher — faction + rarity ───────────────────────────────────
  engine.sfxFactionAttack = function (faction: string, rarity: string): void {
    try {
      switch (faction) {
        case 'Guerrero':    this._sfxGuerreroAttack(rarity); break;
        case 'Mago':        this._sfxMagoAttack(rarity); break;
        case 'Pícaro':      this._sfxPicaroAttack(rarity); break;
        case 'Explorador':  this._sfxPicaroAttack(rarity); break;
        case 'Paladín':     this._sfxPaladinAttack(rarity); break;
        case 'Comerciante': this._sfxPaladinAttack(rarity); break;
        default:            this.sfxAttackHit?.('light'); break;
      }
    } catch { /* silent */ }
  };

})(AudioEngine as any);

// ═══════════════════════════════════════════════════════════════════════════
// VEXFORGE AUDIO — Per-Keyword SFX (Chat 101)
// sfxKeyword(keyword) — SFX único por keyword al activarse en batalla.
// ═══════════════════════════════════════════════════════════════════════════

(function installKeywordSfx(engine: any) {
  if (engine.__keywordSfxInstalled) return;
  engine.__keywordSfxInstalled = true;

  /** sfxKeyword — dispatch by keyword name */
  engine.sfxKeyword = function(keyword: string): void {
    try {
      switch (keyword) {
        case 'Guard':        this._sfxKwGuard();        break;
        case 'Drain':
        case 'Lifesteal':    this._sfxKwDrain();        break;
        case 'Surge':
        case 'Rush':         this._sfxKwSurge();        break;
        case 'Veil':
        case 'Shield':       this._sfxKwVeil();         break;
        case 'Forge':        this._sfxKwForge();        break;
        case 'Consecrate':   this._sfxKwConsecrate();   break;
        case 'Flux':         this._sfxKwFlux();         break;
        case 'Resonance':    this._sfxKwResonance();    break;
        case 'Poison':       this._sfxKwPoison();       break;
        case 'DoubleStrike': this._sfxKwDoubleStrike(); break;
      }
    } catch { /* silent */ }
  };

  /** Guard — metálico escudo resonante */
  engine._sfxKwGuard = function(): void {
    try {
      this.noise?.(0.07, 0.06, 250, 0.0);
      this.tone(440, 0.06, 'square', 0.40, -60);
      this.tone(880, 0.10, 'triangle', 0.28, 40, undefined, 0.02);
      this.tone(1320, 0.22, 'triangle', 0.14, 0, undefined, 0.04);
      this.tone(660, 0.20, 'sine', 0.12, 0, undefined, 0.06);
    } catch { /* silent */ }
  };

  /** Drain / Lifesteal — slurp húmedo descendente */
  engine._sfxKwDrain = function(): void {
    try {
      this.tone(880, 0.10, 'sine', 0.22, -600, undefined, 0.0);
      this.tone(660, 0.10, 'sine', 0.22, -500, undefined, 0.07);
      this.tone(440, 0.12, 'sine', 0.20, -400, undefined, 0.14);
      this.tone(330, 0.10, 'sine', 0.18, -200, undefined, 0.20);
      this.noise?.(0.03, 0.20, 1200, 0.02);
    } catch { /* silent */ }
  };

  /** Surge / Rush — crepitar eléctrico */
  engine._sfxKwSurge = function(): void {
    try {
      this.noise?.(0.10, 0.04, 9000, 0.0);
      this.tone(3520, 0.08, 'sawtooth', 0.28, -2500, undefined, 0.01);
      this.tone(1760, 0.06, 'sawtooth', 0.22, -1500, undefined, 0.02);
      this.noise?.(0.07, 0.06, 7000, 0.04);
      this.tone(880, 0.06, 'square', 0.18, -500, undefined, 0.05);
    } catch { /* silent */ }
  };

  /** Veil / Shield — chime místico + whoosh */
  engine._sfxKwVeil = function(): void {
    try {
      this.tone(1320, 0.18, 'sine', 0.16, 300, undefined, 0.0);
      this.tone(1760, 0.18, 'sine', 0.13, 250, undefined, 0.04);
      this.noise?.(0.03, 0.14, 5000, 0.0);
      this.tone(2200, 0.14, 'triangle', 0.10, 0, undefined, 0.06);
      this.tone(880, 0.24, 'triangle', 0.09, 0, undefined, 0.08);
    } catch { /* silent */ }
  };

  /** Forge — impacto de yunque + chispas */
  engine._sfxKwForge = function(): void {
    try {
      this.noise?.(0.06, 0.07, 350, 0.0);
      this.tone(110, 0.09, 'sawtooth', 0.45, 0, undefined, 0.0);
      this.tone(330, 0.06, 'square', 0.28, -120, undefined, 0.03);
      this.noise?.(0.04, 0.14, 3500, 0.04);
      this.tone(660, 0.08, 'triangle', 0.14, 0, undefined, 0.07);
    } catch { /* silent */ }
  };

  /** Consecrate — campana sagrada + acorde */
  engine._sfxKwConsecrate = function(): void {
    try {
      this.tone(523, 0.28, 'triangle', 0.20, 0, undefined, 0.0);
      this.tone(659, 0.28, 'triangle', 0.18, 0, undefined, 0.05);
      this.tone(784, 0.32, 'triangle', 0.15, 0, undefined, 0.09);
      this.tone(1047, 0.38, 'sine', 0.12, 0, undefined, 0.13);
      this.tone(1568, 0.40, 'sine', 0.09, 0, undefined, 0.18);
      this.noise?.(0.04, 0.10, 8000, 0.15);
    } catch { /* silent */ }
  };

  /** Flux — distorsión digital caótica */
  engine._sfxKwFlux = function(): void {
    try {
      this.noise?.(0.05, 0.03, 2500, 0.0);
      const fq1 = 300 + Math.random() * 500;
      const fq2 = 600 + Math.random() * 400;
      this.tone(fq1, 0.06, 'sawtooth', 0.22, 0);
      this.tone(fq2, 0.05, 'square', 0.18, 0, undefined, 0.03);
      this.noise?.(0.06, 0.05, 4500, 0.03);
      this.tone(220, 0.07, 'sawtooth', 0.26, 0, undefined, 0.06);
      this.noise?.(0.04, 0.04, 1800, 0.07);
    } catch { /* silent */ }
  };

  /** Resonance — anillos armónicos */
  engine._sfxKwResonance = function(): void {
    try {
      [261, 329, 392, 523, 659, 784].forEach((f, i) => {
        this.tone(f, 0.40, 'sine', 0.12 - i * 0.012, 0, undefined, i * 0.065);
      });
      this.tone(1047, 0.45, 'triangle', 0.08, 0, undefined, 0.40);
      this.tone(1568, 0.40, 'sine', 0.05, 0, undefined, 0.50);
    } catch { /* silent */ }
  };

  /** Poison — burbujeo oscuro */
  engine._sfxKwPoison = function(): void {
    try {
      this.tone(220, 0.09, 'sawtooth', 0.26, -80, undefined, 0.0);
      this.noise?.(0.04, 0.09, 700, 0.0);
      this.tone(110, 0.14, 'sawtooth', 0.22, 0, undefined, 0.04);
      this.noise?.(0.04, 0.07, 500, 0.06);
      this.tone(165, 0.09, 'sawtooth', 0.18, 0, undefined, 0.10);
    } catch { /* silent */ }
  };

  /** DoubleStrike — dos golpes rápidos */
  engine._sfxKwDoubleStrike = function(): void {
    try {
      this.noise?.(0.05, 0.04, 280, 0.0);
      this.tone(155, 0.04, 'square', 0.38, 0);
      this.tone(195, 0.03, 'sawtooth', 0.32, 0, undefined, 0.02);
      // Second hit at 0.12s
      this.noise?.(0.05, 0.04, 320, 0.12);
      this.tone(175, 0.04, 'square', 0.38, 0, undefined, 0.12);
      this.tone(220, 0.03, 'sawtooth', 0.28, 0, undefined, 0.14);
    } catch { /* silent */ }
  };

})(AudioEngine as any);

// ═══════════════════════════════════════════════════════════════════════════
// VEXFORGE AUDIO — Poison SFX + Battle utility sounds (Chat FASE1+2)
// sfxPoisonTick()  — daño veneno per round
// sfxPoisonApply() — infección al aplicar veneno
// sfxHealSelf()    — curación propia
// sfxShieldBreak() — escudo roto
// sfxDrawCard()    — robar carta
// sfxTurnStart()   — inicio de turno
// ═══════════════════════════════════════════════════════════════════════════
;(function installBattleUtilitySfx(engine: any) {
  if (engine.__battleUtilityInstalled) return;
  engine.__battleUtilityInstalled = true;

  /** Poison tick — green bubbling tick every round */
  engine.sfxPoisonTick = function(): void {
    try {
      this.tone(180, 0.08, 'sawtooth', 0.20, -60, undefined, 0.0);
      this.noise?.(0.04, 0.06, 600, 0.02);
      this.tone(220, 0.05, 'sawtooth', 0.14, 0, undefined, 0.05);
    } catch { /* silent */ }
  };

  /** Poison apply — venomous hiss */
  engine.sfxPoisonApply = function(): void {
    try {
      this.noise?.(0.08, 0.12, 800, 0.0);
      this.tone(165, 0.12, 'sawtooth', 0.26, -80, undefined, 0.0);
      this.tone(110, 0.10, 'sawtooth', 0.20, 0, undefined, 0.04);
      this.noise?.(0.06, 0.08, 500, 0.08);
    } catch { /* silent */ }
  };

  /** Heal self — warm rising tones */
  engine.sfxHealSelf = function(): void {
    try {
      [261, 329, 392].forEach((f, i) => this.tone(f, 0.20, 'sine', 0.18, 0, undefined, i * 0.06));
      this.tone(523, 0.25, 'sine', 0.12, 0, undefined, 0.18);
    } catch { /* silent */ }
  };

  /** Shield break — crack + dispersion */
  engine.sfxShieldBreak = function(): void {
    try {
      this.noise?.(0.05, 0.22, 4000, 0.0);
      this.tone(600, 0.04, 'square', 0.30, 0);
      this.tone(400, 0.06, 'square', 0.24, 0, undefined, 0.02);
      this.tone(200, 0.08, 'triangle', 0.18, 0, undefined, 0.04);
    } catch { /* silent */ }
  };

  /** Draw card — soft whoosh + chime */
  engine.sfxDrawCard = function(): void {
    try {
      this.tone(880, 0.06, 'sine', 0.14, 0, undefined, 0.0);
      this.tone(1100, 0.05, 'sine', 0.10, 0, undefined, 0.04);
      this.noise?.(0.03, 0.04, 3000, 0.0);
    } catch { /* silent */ }
  };

  /** Turn start — short drum hit */
  engine.sfxTurnStart = function(): void {
    try {
      this.noise?.(0.05, 0.18, 200, 0.0);
      this.tone(80, 0.06, 'triangle', 0.28, 0);
    } catch { /* silent */ }
  };

})(AudioEngine as any);

// ═══════════════════════════════════════════════════════════════════════════
// AU.0 — Combat Phase Music (3 phases with crossfade)
// startCombatMusic('intro')      — 8-bar tense loop
// startCombatMusic('mid')        — 12-bar active loop (higher HP-avg)
// startCombatMusic('last_stand') — dramatic loop, higher tempo, BPM ramps
// ═══════════════════════════════════════════════════════════════════════════
;(function installCombatPhaseMusic(engine: any) {
  if (engine.__combatPhaseMusicInstalled) return;
  engine.__combatPhaseMusicInstalled = true;

  engine._combatPhase = null as string | null;
  engine._combatLoopTimeout = null as ReturnType<typeof setTimeout> | null;

  // Crossfade helper: fade out music bus, then restart with new settings
  function _crossfadeTo(eng: any, setupFn: () => void, fadeMs = 600): void {
    try {
      const c = eng.ctx?.();
      const bus = eng._musicBus;
      if (!c || !bus) { eng.stopMusic?.(); setupFn(); eng.musicLoop?.(); return; }
      const now = c.currentTime;
      bus.gain.cancelScheduledValues(now);
      bus.gain.setValueAtTime(bus.gain.value ?? 0.3, now);
      bus.gain.linearRampToValueAtTime(0.001, now + fadeMs / 1000);
      setTimeout(() => {
        eng.stopMusic?.();
        setupFn();
        eng.musicLoop?.();
        try {
          const c2 = eng.ctx?.();
          const bus2 = eng._musicBus;
          if (!c2 || !bus2) return;
          const n2 = c2.currentTime;
          const targetVol = eng._musicVol ?? 0.3;
          bus2.gain.cancelScheduledValues(n2);
          bus2.gain.setValueAtTime(0.001, n2);
          bus2.gain.linearRampToValueAtTime(targetVol, n2 + 0.5);
        } catch { /* silent */ }
      }, fadeMs + 50);
    } catch { /* silent */ }
  }

  engine.startCombatMusic = function(phase: 'intro' | 'mid' | 'last_stand'): void {
    if (this._muted) return;
    if (this._combatPhase === phase) return; // already in this phase
    this._combatPhase = phase;

    if (phase === 'intro') {
      // Tense 8-bar build — minor key, slower tempo
      _crossfadeTo(this, () => {
        this.setFaction?.('section:battle');
        if (this._factionConfig) {
          this._factionConfig.tempo = 0.48;
          this._factionConfig.base  = 110;
        }
        this._intensity      = 0.75;
        this._intensityLevel = 'calm';
      }, 800);

    } else if (phase === 'mid') {
      // Active 12-bar — higher energy, more motion
      _crossfadeTo(this, () => {
        this.setFaction?.('section:battle');
        if (this._factionConfig) {
          this._factionConfig.tempo = 0.58;
          this._factionConfig.base  = 123;
        }
        this._intensity      = 1.0;
        this._intensityLevel = 'active';
      }, 600);

    } else if (phase === 'last_stand') {
      // Dramatic — faster BPM, higher base frequency, maximum intensity
      _crossfadeTo(this, () => {
        this.setFaction?.('section:battle');
        if (this._factionConfig) {
          this._factionConfig.tempo = 0.70;
          this._factionConfig.base  = 138;
        }
        this._intensity      = 1.3;
        this._intensityLevel = 'intense';
      }, 400);
    }
  };

  /** Stop combat music and reset phase tracking */
  engine.stopCombatMusic = function(): void {
    this._combatPhase = null;
    if (this._combatLoopTimeout) { clearTimeout(this._combatLoopTimeout); this._combatLoopTimeout = null; }
    try { this.stopMusic?.(); } catch { /* silent */ }
  };

})(AudioEngine as any);
