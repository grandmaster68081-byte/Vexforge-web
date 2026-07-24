// VexForge KeywordTooltip v1.0 — EPICA Q.4 (chat76)
// Keyword definitions + tooltip overlay + chip for interactive battle board.

import { useState, useCallback, type ReactNode } from 'react';

export const KEYWORD_DEFS: Record<string, { icon: string; title: string; desc: string; color: string }> = {
  guard:        { icon: '🛡️', title: 'Guard',          desc: 'Este aliado debe ser atacado primero. Protege a los demás.',              color: '#3ddc84' },
  surge:        { icon: '⚡',  title: 'Surge',          desc: 'Alta iniciativa — actúa antes que la mayoría de unidades.',              color: '#e8b84b' },
  flux:         { icon: '🌀',  title: 'Flux',           desc: 'Efecto caótico: puede ganar un bonus aleatorio en combate.',             color: '#4a9eff' },
  consecrate:   { icon: '✝️', title: 'Consecrate',     desc: 'Sagrado — inflige daño adicional a unidades de facción oscura.',         color: '#ffe066' },
  drain:        { icon: '💚',  title: 'Drain',          desc: 'Roba vida al atacar: recupera 30% del daño causado como HP.',           color: '#a855f7' },
  veil:         { icon: '🔮',  title: 'Veil',           desc: 'Barrera mágica — absorbe el primer ataque recibido sin daño.',          color: '#60a5fa' },
  forge:        { icon: '🔨',  title: 'Forge',          desc: 'Potencia de forja: aumenta ATK en cada combate consecutivo.',           color: '#fb923c' },
  resonance:    { icon: '🎵',  title: 'Resonance',      desc: 'Resonancia — otorga +ATK a todos los aliados de la misma facción.',     color: '#f472b6' },
  lifesteal:    { icon: '💚',  title: 'Lifesteal',      desc: 'Roba vida al atacar — recupera HP igual al daño causado.',             color: '#a855f7' },
  poison:       { icon: '☠️',  title: 'Poison',         desc: 'El veneno causa 5 de daño por turno hasta que la unidad muere.',       color: '#22c55e' },
  shield:       { icon: '✨',  title: 'Shield',         desc: 'Absorbe el primer golpe recibido. Se rompe tras el primer ataque.',    color: '#60a5fa' },
  rush:         { icon: '⚡',  title: 'Rush',           desc: 'Puede atacar en el mismo turno en que entra al campo de batalla.',     color: '#e8b84b' },
  doublestrike: { icon: '⚔️',  title: 'Double Strike', desc: 'Ataca dos veces por turno. El segundo golpe hace 50% de daño.',        color: '#ff6b35' },
};

function normKey(k: string) { return k.toLowerCase().replace(/[^a-z]/g, ''); }

interface TooltipProps { keyword: string; children: ReactNode; }

export function KeywordTooltip({ keyword, children }: TooltipProps) {
  const def = KEYWORD_DEFS[normKey(keyword)];
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [vis, setVis] = useState(false);

  if (!def) return <>{children}</>;

  const onEnter = useCallback((e: React.MouseEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPos({ x: r.left + r.width / 2, y: r.top });
    setVis(true);
  }, []);

  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={onEnter} onMouseLeave={() => setVis(false)}>
      {children}
      {vis && (
        <div style={{
          position: 'fixed', left: pos.x, top: pos.y - 8,
          transform: 'translate(-50%, -100%)',
          background: 'rgba(6,6,16,0.97)',
          border: `1px solid ${def.color}55`,
          borderRadius: 10, padding: '10px 14px',
          zIndex: 9999, pointerEvents: 'none',
          minWidth: 190, maxWidth: 240,
          boxShadow: `0 6px 28px rgba(0,0,0,0.85), 0 0 18px ${def.color}18`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <span style={{ fontSize: 16 }}>{def.icon}</span>
            <span style={{ color: def.color, fontWeight: 800, fontSize: 12,
              fontFamily: '"Cinzel",serif', letterSpacing: '0.05em' }}>
              {def.title}
            </span>
          </div>
          <p style={{ color: '#c0c0d0', fontSize: 11, margin: 0, lineHeight: 1.55,
            fontFamily: '"Rajdhani",sans-serif' }}>
            {def.desc}
          </p>
        </div>
      )}
    </span>
  );
}

export function KeywordChip({ keyword }: { keyword: string }) {
  const def = KEYWORD_DEFS[normKey(keyword)];
  if (!def) return (
    <span style={{ fontSize: 9, color: '#555', background: '#141420',
      border: '1px solid #1e1e30', borderRadius: 4, padding: '1px 5px',
      fontFamily: '"Rajdhani",sans-serif' }}>
      {keyword}
    </span>
  );
  return (
    <KeywordTooltip keyword={keyword}>
      <span style={{
        fontSize: 9, fontWeight: 700, fontFamily: '"Rajdhani",sans-serif',
        color: def.color, background: `${def.color}14`,
        border: `1px solid ${def.color}35`, borderRadius: 4, padding: '1px 6px',
        display: 'inline-flex', alignItems: 'center', gap: 3,
        cursor: 'help', userSelect: 'none',
      }}>
        <span style={{ fontSize: 10 }}>{def.icon}</span>{def.title}
      </span>
    </KeywordTooltip>
  );
}
