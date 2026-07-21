// VexForge Particle Engine v2.0 — Epic I: VEXFORGE DOMINION
// Attack arc bezier trails + Faction ambient + Card entry + Screen shake.
// Backward-compatible with all v1.0 callers.
// Canvas 2D only — zero external assets.

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; size: number;
  color: string; alpha: number; gravity: number;
  shape?: 'circle' | 'diamond' | 'spark' | 'square';
  glow?: string;
  trail?: { x: number; y: number }[];
}

// v2.0 screen-shake state
interface ShakeState { x: number; y: number; dur: number; startTime: number }

// Faction ambient configs
const FACTION_AMBIENT: Record<string, { color: string; shape: Particle['shape']; size: [number, number]; speed: number }> = {
  Guerrero:    { color: '#c0392b', shape: 'spark',   size: [1, 3],   speed: 1.8 },
  Mago:        { color: '#8e44ad', shape: 'diamond', size: [2, 5],   speed: 0.9 },
  Explorador:  { color: '#27ae60', shape: 'circle',  size: [1.5, 4], speed: 1.2 },
  Comerciante: { color: '#f39c12', shape: 'square',  size: [2, 4],   speed: 1.4 },
};

class VexForgeParticleEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx2d: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];
  private raf: number | null = null;
  private shake: ShakeState | null = null;

  // ─── Lifecycle ─────────────────────────────────────────────────────────────
  mount(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx2d = canvas.getContext('2d');
    this.particles = [];
    this.startLoop();
  }

  unmount(): void {
    if (this.raf !== null) cancelAnimationFrame(this.raf);
    this.raf = null;
    this.particles = [];
    this.canvas = null;
    this.ctx2d = null;
  }

  private startLoop(): void {
    const tick = () => {
      this.raf = requestAnimationFrame(tick);
      const c = this.ctx2d; const cv = this.canvas;
      if (!c || !cv) return;

      // Screen shake transform
      let sx = 0; let sy = 0;
      if (this.shake) {
        const elapsed = performance.now() - this.shake.startTime;
        const progress = elapsed / (this.shake.dur * 1000);
        if (progress < 1) {
          const decay = 1 - progress;
          sx = (Math.random() - 0.5) * this.shake.x * decay * 2;
          sy = (Math.random() - 0.5) * this.shake.y * decay * 2;
        } else {
          this.shake = null;
        }
      }

      c.save();
      c.clearRect(0, 0, cv.width, cv.height);
      if (sx || sy) c.translate(sx, sy);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx; p.y += p.vy;
        p.vy += p.gravity ?? 0;
        p.life--;
        const ratio = p.life / p.maxLife;
        p.alpha = Math.max(0, ratio);

        if (p.life <= 0) { this.particles.splice(i, 1); continue; }

        // Trail history
        if (p.trail) {
          p.trail.push({ x: p.x, y: p.y });
          if (p.trail.length > 6) p.trail.shift();
        }

        c.save();
        c.globalAlpha = p.alpha;
        if (p.glow) {
          c.shadowBlur = 10;
          c.shadowColor = p.glow;
        }
        c.fillStyle = p.color;

        // Draw trail
        if (p.trail && p.trail.length > 1) {
          c.beginPath();
          c.strokeStyle = p.color;
          c.lineWidth = p.size * 0.4;
          c.globalAlpha = p.alpha * 0.4;
          c.moveTo(p.trail[0].x, p.trail[0].y);
          p.trail.forEach(t => c.lineTo(t.x, t.y));
          c.stroke();
          c.globalAlpha = p.alpha;
        }

        // Draw particle
        c.beginPath();
        switch (p.shape) {
          case 'diamond':
            c.moveTo(p.x, p.y - p.size); c.lineTo(p.x + p.size * 0.6, p.y);
            c.lineTo(p.x, p.y + p.size); c.lineTo(p.x - p.size * 0.6, p.y);
            c.closePath(); break;
          case 'spark':
            c.moveTo(p.x, p.y - p.size * 0.3); c.lineTo(p.x + p.size, p.y + p.size);
            c.lineTo(p.x - p.size, p.y + p.size); c.closePath(); break;
          case 'square':
            c.rect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); break;
          default:
            c.arc(p.x, p.y, p.size, 0, Math.PI * 2); break;
        }
        c.fill();
        c.restore();
      }
      c.restore();
    };
    this.raf = requestAnimationFrame(tick);
  }

  private add(p: Particle): void { this.particles.push(p); }

  // ─── v2.0: Screen shake ────────────────────────────────────────────────────
  screenShake(intensity = 6, duration = 0.3): void {
    this.shake = { x: intensity, y: intensity * 0.6, dur: duration, startTime: performance.now() };
  }

  // ─── v2.0: Attack arc (bezier curve particle trail) ────────────────────────
  attackArc(fromX: number, fromY: number, toX: number, toY: number, color: string, isCrit = false): void {
    const steps = isCrit ? 18 : 12;
    const cpX = (fromX + toX) / 2;
    const cpY = Math.min(fromY, toY) - (Math.abs(toX - fromX) * 0.4 + 50);

    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const bx = (1 - t) * (1 - t) * fromX + 2 * (1 - t) * t * cpX + t * t * toX;
      const by = (1 - t) * (1 - t) * fromY + 2 * (1 - t) * t * cpY + t * t * toY;
      const delay = i * (isCrit ? 18 : 25);

      setTimeout(() => {
        const spread = isCrit ? 3 : 1.5;
        const count = isCrit ? 4 : 2;
        for (let j = 0; j < count; j++) {
          this.add({
            x: bx + (Math.random() - 0.5) * spread,
            y: by + (Math.random() - 0.5) * spread,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            life: isCrit ? 40 : 28,
            maxLife: isCrit ? 40 : 28,
            size: Math.random() * (isCrit ? 4.5 : 3) + 1.5,
            color,
            alpha: 1,
            gravity: 0,
            glow: color,
            shape: 'circle',
            trail: [],
          });
        }
      }, delay);
    }

    // Impact burst at landing
    const impactDelay = steps * (isCrit ? 18 : 25);
    setTimeout(() => {
      const count = isCrit ? 20 : 10;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = Math.random() * (isCrit ? 5 : 3) + 1.5;
        this.add({
          x: toX, y: toY,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          life: isCrit ? 50 : 32, maxLife: isCrit ? 50 : 32,
          size: Math.random() * (isCrit ? 5 : 3.5) + 1,
          color, alpha: 1, gravity: 0.05, glow: color,
          shape: isCrit ? 'spark' : 'circle',
        });
      }
      if (isCrit) this.screenShake(8, 0.25);
    }, impactDelay);
  }

  // ─── v2.0: Faction ambient particles ──────────────────────────────────────
  factionAmbient(faction: string, W: number, H: number): void {
    const cfg = FACTION_AMBIENT[faction];
    if (!cfg) return;
    const count = 6;
    for (let i = 0; i < count; i++) {
      const size = cfg.size[0] + Math.random() * (cfg.size[1] - cfg.size[0]);
      const speed = cfg.speed;
      const side = Math.floor(Math.random() * 4);
      let x: number; let y: number; let vx: number; let vy: number;
      switch (side) {
        case 0: x = Math.random() * W; y = H + 8; vx = (Math.random() - 0.5); vy = -speed - Math.random(); break;
        case 1: x = -8; y = Math.random() * H; vx = speed + Math.random(); vy = (Math.random() - 0.5); break;
        case 2: x = W + 8; y = Math.random() * H; vx = -speed - Math.random(); vy = (Math.random() - 0.5); break;
        default: x = Math.random() * W; y = -8; vx = (Math.random() - 0.5); vy = speed + Math.random(); break;
      }
      this.add({ x, y, vx, vy, life: 120, maxLife: 120, size, color: cfg.color, alpha: 0.7, gravity: 0, shape: cfg.shape, glow: cfg.color });
    }
  }

  // ─── v2.0: Card entry flash ────────────────────────────────────────────────
  cardEntry(x: number, y: number, faction?: string): void {
    const color = (faction && FACTION_AMBIENT[faction]?.color) ?? '#e8b84b';
    const count = 20;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = Math.random() * 4 + 2;
      this.add({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 35, maxLife: 35, size: Math.random() * 4 + 1.5,
        color, alpha: 1, gravity: 0.04, glow: color,
        shape: Math.random() > 0.5 ? 'diamond' : 'circle',
      });
    }
    // Center flash
    for (let i = 0; i < 8; i++) {
      this.add({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: 0, vy: -0.5, life: 20, maxLife: 20,
        size: Math.random() * 6 + 3,
        color: '#ffffff', alpha: 0.8, gravity: 0, glow: color,
      });
    }
  }

  // ─── v1.0 VFX (fully preserved) ───────────────────────────────────────────
  hit(x: number, y: number): void {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3.5 + 1;
      this.add({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 28, maxLife: 28, size: Math.random() * 4 + 1.5, color: '#ff6b35', alpha: 1, gravity: 0.04 });
    }
  }

  crit(x: number, y: number): void {
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 * i) / 24;
      const speed = Math.random() * 5.5 + 2;
      this.add({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 45, maxLife: 45, size: Math.random() * 5.5 + 2, color: i % 3 === 0 ? '#ffcc00' : '#ff4444', alpha: 1, gravity: 0.06, glow: '#ff8800', shape: 'diamond' });
    }
    this.screenShake(6, 0.2);
  }

  death(x: number, y: number): void {
    for (let i = 0; i < 32; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4.5 + 1.5;
      this.add({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 60, maxLife: 60, size: Math.random() * 6 + 2, color: i % 2 === 0 ? '#888' : '#333', alpha: 0.9, gravity: 0.03, shape: 'circle' });
    }
  }

  heal(x: number, y: number): void {
    for (let i = 0; i < 14; i++) {
      this.add({ x: x + (Math.random() - 0.5) * 30, y: y + (Math.random() - 0.5) * 30, vx: (Math.random() - 0.5) * 1.5, vy: -(Math.random() * 2 + 1), life: 40, maxLife: 40, size: Math.random() * 4 + 2, color: '#3ddc84', alpha: 0.9, gravity: -0.02, glow: '#55ff99', shape: 'circle' });
    }
  }

  shield(x: number, y: number): void {
    for (let i = 0; i < 18; i++) {
      const angle = (Math.PI * 2 * i) / 18;
      this.add({ x: x + Math.cos(angle) * 22, y: y + Math.sin(angle) * 22, vx: Math.cos(angle) * 0.8, vy: Math.sin(angle) * 0.8, life: 35, maxLife: 35, size: Math.random() * 3 + 1.5, color: '#4a9eff', alpha: 0.85, gravity: 0, glow: '#88ccff', shape: 'diamond' });
    }
  }

  poison(x: number, y: number): void {
    for (let i = 0; i < 12; i++) {
      this.add({ x: x + (Math.random() - 0.5) * 20, y, vx: (Math.random() - 0.5) * 1.2, vy: -(Math.random() * 1.8 + 0.5), life: 50, maxLife: 50, size: Math.random() * 4 + 2, color: '#a855f7', alpha: 0.8, gravity: -0.01, glow: '#cc77ff' });
    }
  }

  // ─── Keyword VFX (v1.0 — fully preserved) ─────────────────────────────────
  private vfxGuard(x: number, y: number): void { this.shield(x, y); for (let i = 0; i < 8; i++) { const a = (Math.PI * 2 * i) / 8; this.add({ x: x + Math.cos(a) * 28, y: y + Math.sin(a) * 28, vx: Math.cos(a) * 0.5, vy: Math.sin(a) * 0.5, life: 40, maxLife: 40, size: Math.random() * 3.5 + 1.5, color: '#2980b9', alpha: 0.9, gravity: 0, glow: '#4a9eff', shape: 'diamond' }); } }
  private vfxSurge(x: number, y: number): void { for (let i = 0; i < 16; i++) { const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.2; this.add({ x, y, vx: Math.cos(a) * (Math.random() * 5 + 2), vy: Math.sin(a) * (Math.random() * 5 + 2) - 2, life: 30, maxLife: 30, size: Math.random() * 4.5 + 1.5, color: i % 2 === 0 ? '#f5d585' : '#e8b84b', alpha: 1, gravity: 0.05, glow: '#ffcc00', shape: 'spark' }); } }
  private vfxFlux(x: number, y: number): void { for (let i = 0; i < 22; i++) { const angle = Math.random() * Math.PI * 2; const r = Math.random() * 35 + 10; this.add({ x: x + Math.cos(angle) * r, y: y + Math.sin(angle) * r, vx: (Math.random() - 0.5) * 2.5, vy: (Math.random() - 0.5) * 2.5, life: 45, maxLife: 45, size: Math.random() * 3.5 + 1.5, color: ['#a855f7', '#4a9eff', '#3ddc84'][i % 3], alpha: 0.85, gravity: 0, glow: '#cc88ff' }); } }
  private vfxConse(x: number, y: number): void { for (let i = 0; i < 20; i++) { this.add({ x: x + (Math.random() - 0.5) * 50, y: y - Math.random() * 50, vx: (Math.random() - 0.5) * 1, vy: -(Math.random() * 2 + 0.5), life: 55, maxLife: 55, size: Math.random() * 4.5 + 1.5, color: i % 2 === 0 ? '#f5d585' : '#ffffff', alpha: 0.9, gravity: -0.015, glow: '#ffffaa', shape: 'diamond' }); } }
  private vfxDrain(x: number, y: number): void { for (let i = 0; i < 14; i++) { const angle = Math.random() * Math.PI * 2; const r = Math.random() * 40 + 15; this.add({ x: x + Math.cos(angle) * r, y: y + Math.sin(angle) * r, vx: Math.cos(angle + Math.PI) * 1.8, vy: Math.sin(angle + Math.PI) * 1.8, life: 40, maxLife: 40, size: Math.random() * 4 + 1.5, color: '#3ddc84', alpha: 0.85, gravity: 0, glow: '#55ff88' }); } }
  private vfxVeil(x: number, y: number): void { for (let i = 0; i < 18; i++) { const a = (Math.PI * 2 * i) / 18; this.add({ x: x + Math.cos(a) * 30, y: y + Math.sin(a) * 30, vx: Math.cos(a) * -0.3, vy: Math.sin(a) * -0.3, life: 50, maxLife: 50, size: Math.random() * 5 + 2, color: i % 2 === 0 ? '#a855f7' : '#c084fc', alpha: 0.7, gravity: 0, glow: '#cc88ff', shape: 'circle' }); } }
  private vfxForge(x: number, y: number): void { for (let i = 0; i < 18; i++) { const a = -Math.PI / 2 + (Math.random() - 0.5) * 2; this.add({ x, y: y + 15, vx: Math.cos(a) * (Math.random() * 3 + 1), vy: Math.sin(a) * (Math.random() * 3 + 1) - 1, life: 35, maxLife: 35, size: Math.random() * 5 + 2, color: i % 2 === 0 ? '#ff6b35' : '#e8b84b', alpha: 0.95, gravity: 0.08, glow: '#ff8800', shape: 'spark' }); } }
  private vfxRes(x: number, y: number): void { for (let i = 0; i < 28; i++) { const angle = (Math.PI * 2 * i) / 28; const r = 15 + Math.sin(i * 1.8) * 18; this.add({ x: x + Math.cos(angle) * r, y: y + Math.sin(angle) * r, vx: Math.cos(angle) * 0.6, vy: Math.sin(angle) * 0.6, life: 55, maxLife: 55, size: Math.random() * 3 + 1.5, color: i % 3 === 0 ? '#4a9eff' : '#a855f7', alpha: 0.8, gravity: 0, glow: '#8888ff', shape: 'circle' }); } }

  triggerKeyword(keyword: string, x: number, y: number): void {
    const fx: Record<string, () => void> = {
      Guard: () => this.vfxGuard(x, y), Surge: () => this.vfxSurge(x, y), Flux: () => this.vfxFlux(x, y),
      Consecrate: () => this.vfxConse(x, y), Drain: () => this.vfxDrain(x, y), Veil: () => this.vfxVeil(x, y),
      Forge: () => this.vfxForge(x, y), Resonance: () => this.vfxRes(x, y),
      Lifesteal: () => this.heal(x, y), Shield: () => this.shield(x, y), Poison: () => this.poison(x, y),
      Rush: () => this.vfxSurge(x, y), DoubleStrike: () => { this.hit(x, y); setTimeout(() => this.hit(x + 8, y - 5), 100); },
    };
    fx[keyword]?.();
  }

  // ─── Endgame VFX (v1.0 — fully preserved) ─────────────────────────────────
  victoryRain(W: number, H: number): void {
    for (let i = 0; i < 18; i++) {
      const life = Math.floor(Math.random() * 80 + 60);
      this.add({ x: Math.random() * W, y: -8, vx: (Math.random() - 0.5) * 2.2, vy: Math.random() * 3.2 + 1.2, life, maxLife: life, size: Math.random() * 3.5 + 2, color: Math.random() > 0.5 ? '#e8b84b' : '#f5d585', alpha: 1, gravity: 0.04, shape: Math.random() > 0.5 ? 'diamond' : 'circle', glow: '#ffcc44' });
    }
  }

  defeatAsh(W: number, H: number): void {
    for (let i = 0; i < 10; i++) {
      const life = Math.floor(Math.random() * 100 + 70);
      this.add({ x: Math.random() * W, y: -8, vx: (Math.random() - 0.5) * 1.4, vy: Math.random() * 1.6 + 0.5, life, maxLife: life, size: Math.random() * 4 + 2, color: Math.random() > 0.6 ? '#555' : '#888', alpha: 0.72, gravity: 0.018, shape: 'circle' });
    }
  }
}

export const particleEngine = new VexForgeParticleEngine();
