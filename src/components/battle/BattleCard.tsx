import { useEffect, useRef } from 'react';
import type { BattleUnit } from '../../lib/battleTypes';
import { RARITY_COLOR, RARITY_GLOW, FACTION_BG, KEYWORD_ICON } from '../../lib/battleTypes';

export interface BattleCardAnimState {
  isAttacking:   boolean;
  isTakingHit:   boolean;
  isDying:       boolean;
  isShielding:   boolean;
  isLifestealing:boolean;
  currentHp:     number;
  floatDamage:   number | null;
  floatText:     string | null;
}

interface BattleCardProps {
  unit:     BattleUnit;
  anim:     BattleCardAnimState;
  side:     'a' | 'b';
  isActive: boolean;
  /** optional div ref forwarded from BattleCinematicScreen for particle positioning */
  cardRef?: (el: HTMLDivElement | null) => void;
}

// ─── HP Bar ──────────────────────────────────────────────────────────────────
function HpBar({ hp, max, color }: { hp: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(100, max > 0 ? (hp / max) * 100 : 0));
  const critical = pct < 25;
  const low      = pct < 50;
  return (
    <div style={{ background: '#08080f', borderRadius: 3, height: 7, width: '100%',
      overflow: 'hidden', border: '1px solid #14142a' }}>
      <div style={{
        width: `${pct}%`, height: '100%', borderRadius: 3,
        background: critical
          ? 'linear-gradient(90deg,#ff1a1a,#ff6b35)'
          : low
            ? 'linear-gradient(90deg,#e8b84b,#ff8800)'
            : `linear-gradient(90deg,${color},${color}99)`,
        transition: 'width 0.38s ease',
        boxShadow: critical ? '0 0 7px rgba(255,30,30,0.7)' : undefined,
      }} />
    </div>
  );
}

// ─── Keyword badge with glow ──────────────────────────────────────────────────
function KeywordBadge({ kw, active }: { kw: string; active?: boolean }) {
  return (
    <span
      title={kw}
      style={{
        fontSize: 9, display: 'inline-flex', alignItems: 'center',
        background: active ? 'rgba(255,255,100,0.12)' : 'transparent',
        borderRadius: 3,
        filter: active ? 'drop-shadow(0 0 3px rgba(255,220,50,0.8))' : undefined,
      }}
    >
      {KEYWORD_ICON[kw] ?? '•'}
    </span>
  );
}

// ─── BattleCard ───────────────────────────────────────────────────────────────
export function BattleCard({ unit, anim, side, isActive, cardRef }: BattleCardProps) {
  const color = RARITY_COLOR[unit.rarity] ?? '#8b8b9e';
  const glow  = RARITY_GLOW[unit.rarity]  ?? 'rgba(139,139,158,0.3)';
  const bg    = FACTION_BG[unit.faction]  ?? 'linear-gradient(135deg,#1a1a2e 0%,#0f0f1a 100%)';

  const floatRef = useRef<HTMLDivElement>(null);

  // Float damage/text animation
  useEffect(() => {
    if (!floatRef.current) return;
    const el  = floatRef.current;
    const val = anim.floatDamage ?? anim.floatText;
    if (val === null) { el.style.opacity = '0'; return; }
    el.style.transition = 'none';
    el.style.opacity    = '1';
    el.style.transform  = 'translateY(0) scale(1.3)';
    const t = setTimeout(() => {
      el.style.transition = 'opacity 0.55s, transform 0.55s';
      el.style.opacity    = '0';
      el.style.transform  = 'translateY(-44px) scale(0.75)';
    }, 55);
    return () => clearTimeout(t);
  }, [anim.floatDamage, anim.floatText]);

  // — Composite transform style —
  const attackMove = side === 'a'
    ? 'translateX(10px) translateY(-4px) scale(1.06)'
    : 'translateX(-10px) translateY(4px) scale(1.06)';

  const cardStyle: React.CSSProperties = {
    position:  'relative',
    width:     96,
    minHeight: 138,
    borderRadius: 10,
    background: bg,
    border: `2px solid ${isActive ? color : '#22223a'}`,
    boxShadow: isActive
      ? `0 0 18px ${glow}, inset 0 0 8px rgba(0,0,0,0.55)`
      : '0 2px 8px rgba(0,0,0,0.55)',
    transition: 'transform 0.22s ease, filter 0.22s ease, opacity 0.4s ease, box-shadow 0.22s ease',
    overflow:  'hidden',
    userSelect:'none',
    // Priority: dying > shield > attacking > taking-hit > lifestealing
    ...(anim.isDying ? {
      opacity: 0.22,
      filter:  'grayscale(1) brightness(0.32)',
      transform: 'scale(0.78) rotate(-3deg)',
    } : anim.isShielding ? {
      filter:    `drop-shadow(0 0 14px rgba(74,158,255,0.95))`,
      transform: 'scale(1.04)',
    } : anim.isAttacking ? {
      transform: attackMove,
      filter:    `drop-shadow(0 0 14px ${color})`,
    } : anim.isTakingHit ? {
      animation: 'vf-shake 0.34s ease',
      filter:    'brightness(2.2) sepia(0.6) saturate(4)',
    } : anim.isLifestealing ? {
      filter: 'drop-shadow(0 0 12px rgba(61,220,132,0.9)) brightness(1.15)',
    } : {}),
  };

  return (
    <div style={cardStyle} ref={cardRef}>
      {/* Card image */}
      <div style={{ height: 78, overflow: 'hidden', position: 'relative' }}>
        {unit.image_url ? (
          <img
            src={unit.image_url}
            alt={unit.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
            ⚔️
          </div>
        )}

        {/* Rarity badge */}
        <div style={{
          position: 'absolute', top: 4, left: 4,
          fontSize: 8, fontWeight: 700, color,
          background: 'rgba(0,0,0,0.75)', borderRadius: 3, padding: '1px 4px',
          textTransform: 'uppercase', letterSpacing: '0.4px',
        }}>{unit.rarity}</div>

        {/* Poison indicator */}
        {unit.poisoned && (
          <div style={{ position: 'absolute', top: 4, right: 4, fontSize: 10 }}>☠️</div>
        )}

        {/* Active glow overlay on image */}
        {isActive && !anim.isDying && (
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(ellipse at center, ${color}22 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '4px 6px 6px' }}>
        {/* Name */}
        <div style={{
          fontSize: 8.5, fontWeight: 700, color: '#e8e8f0', marginBottom: 4,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{unit.name}</div>

        {/* HP bar */}
        <HpBar hp={anim.currentHp} max={unit.max_hp} color={color} />
        <div style={{ fontSize: 7.5, color: '#9a9ab8', marginTop: 2, textAlign: 'center' }}>
          ❤ {anim.currentHp}/{unit.max_hp}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 3, marginTop: 4, justifyContent: 'center' }}>
          <span style={{ fontSize: 8, color: '#ff7b7b', fontWeight: 700 }}>⚔{unit.atk}</span>
          <span style={{ fontSize: 8, color: '#5aafff', fontWeight: 700 }}>🛡{unit.def}</span>
          <span style={{ fontSize: 8, color: '#e8b84b', fontWeight: 700 }}>⚡{unit.spd}</span>
        </div>

        {/* Keywords */}
        {unit.keywords && unit.keywords.length > 0 && (
          <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
            {unit.keywords.slice(0, 3).map(kw => (
              <KeywordBadge key={kw} kw={kw} active={isActive && !anim.isDying} />
            ))}
          </div>
        )}
      </div>

      {/* Float overlay */}
      <div ref={floatRef} style={{
        position: 'absolute', top: '28%', left: '50%',
        transform: 'translate(-50%, 0)',
        fontSize: anim.floatText ? 11 : 17,
        fontWeight: 900,
        color: anim.floatText
          ? (anim.floatText.startsWith('+') ? '#3ddc84' : '#ffaa44')
          : '#ff3344',
        textShadow: '0 0 10px currentColor, 0 2px 4px rgba(0,0,0,0.9)',
        pointerEvents: 'none', zIndex: 10,
        opacity: 0,
        whiteSpace: 'nowrap',
      }}>
        {anim.floatText ?? (anim.floatDamage !== null ? `-${anim.floatDamage}` : '')}
      </div>

      {/* Shield shimmer */}
      {unit.shielded && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 8,
          background: 'rgba(74,158,255,0.07)',
          border: '1px solid rgba(74,158,255,0.28)',
          boxShadow: 'inset 0 0 10px rgba(74,158,255,0.15)',
          pointerEvents: 'none',
        }} />
      )}

      {/* Death X overlay */}
      {anim.isDying && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 32, pointerEvents: 'none', zIndex: 8,
          opacity: 0.55,
        }}>💀</div>
      )}
    </div>
  );
}

// ─── Global keyframe injection ─────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('vf-anim-style')) {
  const s = document.createElement('style');
  s.id = 'vf-anim-style';
  s.textContent = `
    @keyframes vf-shake {
      0%,100% { transform: translateX(0); }
      18%     { transform: translateX(-7px) rotate(-1.5deg); }
      36%     { transform: translateX(7px)  rotate(1.5deg);  }
      54%     { transform: translateX(-5px); }
      72%     { transform: translateX(5px);  }
    }
    @keyframes vf-intro-left {
      from { opacity:0; transform: translateX(-80px) scale(0.85); }
      to   { opacity:1; transform: translateX(0)     scale(1);    }
    }
    @keyframes vf-intro-right {
      from { opacity:0; transform: translateX(80px)  scale(0.85); }
      to   { opacity:1; transform: translateX(0)     scale(1);    }
    }
    @keyframes vf-pulse-border {
      0%,100% { box-shadow: 0 0 8px  var(--vf-glow); }
      50%     { box-shadow: 0 0 24px var(--vf-glow); }
    }
  `;
  document.head.appendChild(s);
}
