// ContextualHint.tsx — TU.2 Contextual hint system
// Muestra hints de "primera visita" por ruta, guardados en localStorage.
// Uso: <ContextualHint hintKey="pvp_lobby" hints={[...]} />

import { useState, useEffect } from 'react';
import { ForgeIcon, type ForgeIconName } from '../../shared/components/ForgeIcon';

export interface HintStep {
  icon: ForgeIconName;
  title: string;
  desc: string;
  accentColor?: string;
}

interface ContextualHintProps {
  hintKey: string;          // Unique key per route/feature — stored in localStorage
  hints: HintStep[];
  force?: boolean;          // Show even if already seen (for debug/reset)
  onDone?: () => void;
}

const STORAGE_KEY = 'vex_hints_seen_v1';

function getSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function markSeen(key: string) {
  try {
    const seen = getSeen();
    seen.add(key);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
  } catch { /* ok */ }
}

export function useContextualHint(hintKey: string): { seen: boolean; reset: () => void } {
  const [seen, setSeen] = useState(() => getSeen().has(hintKey));
  return {
    seen,
    reset: () => {
      try {
        const s = getSeen();
        s.delete(hintKey);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...s]));
      } catch { /* ok */ }
      setSeen(false);
    },
  };
}

export function ContextualHint({ hintKey, hints, force = false, onDone }: ContextualHintProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (force || !getSeen().has(hintKey)) {
      setVisible(true);
    }
  }, [hintKey, force]);

  if (!visible || hints.length === 0) return null;

  const hint = hints[step];
  const isLast = step === hints.length - 1;
  const ac = hint.accentColor ?? '#e8b84b';

  const dismiss = () => {
    markSeen(hintKey);
    setVisible(false);
    onDone?.();
  };

  const next = () => {
    if (isLast) {
      dismiss();
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(3,3,10,0.88)',
      backdropFilter: 'blur(6px)',
      animation: 'modal-overlay-in 0.3s ease-out both',
    }} onClick={e => { if (e.target === e.currentTarget) dismiss(); }}>
      <div style={{
        width: 'min(420px,92vw)', borderRadius: 20,
        padding: '36px 32px', textAlign: 'center',
        background: 'linear-gradient(160deg,#0d0d1e 0%,#0a0a18 100%)',
        border: `1px solid ${ac}44`,
        boxShadow: `0 0 60px ${ac}22, 0 24px 48px rgba(0,0,0,0.6)`,
        animation: 'modal-scale-in 0.35s cubic-bezier(0.22,1,0.36,1) both',
      }}>
        {/* Icon */}
        <div style={{
          fontSize: 56, marginBottom: 16,
          filter: `drop-shadow(0 0 16px ${ac}88)`,
          animation: 'hint-bounce 0.8s cubic-bezier(0.22,1,0.36,1) both',
        }}>
          <ForgeIcon name={hint.icon} size={56} />
        </div>

        {/* Title */}
        <h2 style={{
          fontFamily: '"Cinzel",serif', fontSize: 18, fontWeight: 700,
          color: ac, marginBottom: 12, letterSpacing: '0.06em',
          textShadow: `0 0 16px ${ac}66`,
        }}>{hint.title}</h2>

        {/* Description */}
        <p style={{
          fontFamily: '"Rajdhani",sans-serif', fontSize: 14, lineHeight: 1.6,
          color: 'rgba(255,255,255,0.72)', marginBottom: 28,
        }}>{hint.desc}</p>

        {/* Step dots */}
        {hints.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
            {hints.map((_, i) => (
              <div key={i} style={{
                width: i === step ? 20 : 7, height: 7, borderRadius: 4,
                background: i <= step ? ac : 'rgba(255,255,255,0.1)',
                transition: 'all 0.3s ease',
                boxShadow: i === step ? `0 0 10px ${ac}88` : 'none',
              }} />
            ))}
          </div>
        )}

        {/* Next / Done */}
        <button onClick={next} style={{
          width: '100%', padding: '13px 20px', borderRadius: 12, marginBottom: 10,
          background: `linear-gradient(135deg,${ac}dd,${ac}99)`,
          border: `1px solid ${ac}`,
          color: '#0a0a12', fontFamily: '"Cinzel",serif', fontSize: 13, fontWeight: 700,
          letterSpacing: '0.08em', cursor: 'pointer',
          boxShadow: `0 4px 20px ${ac}44`,
        }}>{isLast ? '¡Entendido!' : <><span>Siguiente</span><ForgeIcon name="chevron-right" size={13} style={{ verticalAlign: 'middle', marginLeft: 6 }} /></>}</button>

        {/* Skip */}
        <button onClick={dismiss} style={{
          width: '100%', padding: 8, border: 'none', background: 'transparent',
          color: 'rgba(255,255,255,0.3)', fontFamily: '"Rajdhani",sans-serif',
          fontSize: 11, cursor: 'pointer', letterSpacing: '0.1em',
        }}>No mostrar de nuevo</button>
      </div>
    </div>
  );
}

// ─── Pre-built hints per major route ──────────────────────────────────────────
export const ROUTE_HINTS: Record<string, HintStep[]> = {
  pvp_lobby: [
    { icon: 'arena', title: 'Arena PvP', accentColor: '#4a9eff',
      desc: 'Aquí desafías a otros Forjadores y compites por MMR. Tu rango sube con cada victoria.' },
    { icon: 'cards', title: 'Forge Formation', accentColor: '#e8b84b',
      desc: 'Antes de cada batalla, selecciona tu Campeón y dos cartas de apoyo. Si el Campeón cae, la partida termina.' },
    { icon: 'trophy', title: 'Desafío del Día', accentColor: '#a855f7',
      desc: 'Cada día aparece un nuevo oponente especial. Derrótalo para ganar VEX y badges exclusivos.' },
  ],
  deck_builder: [
    { icon: 'deck', title: 'Constructor de Mazos', accentColor: '#4a9eff',
      desc: 'Combina hasta 30 cartas de tu colección. Un mazo más grande aumenta el poder de tu Campeón.' },
    { icon: 'crown', title: 'Elige tu Campeón', accentColor: '#e8b84b',
      desc: 'La carta que marques como Campeón será el núcleo de tu formación. Elige con cuidado — si cae, pierdes.' },
  ],
  cards: [
    { icon: 'collection', title: 'Tu Colección', accentColor: '#a855f7',
      desc: 'Aquí están todas las cartas que has conseguido. Filtra por facción, rareza o keyword para encontrar las mejores.' },
    { icon: 'spark', title: 'Rarezas', accentColor: '#e8b84b',
      desc: 'Common > Uncommon > Rare > Epic > Legendary > Mythic. Las cartas de mayor rareza tienen keywords más poderosos y estadísticas superiores.' },
  ],
  raids: [
    { icon: 'boss', title: 'Raids de Jefe', accentColor: '#e84040',
      desc: 'Únete con otros jugadores para derrotar a jefes épicos. Cada raid tiene timer y recompensas de grupo.' },
    { icon: 'shield', title: 'Estrategia de Raid', accentColor: '#4a9eff',
      desc: 'Coordina con tu clan para maximizar el daño. Las cartas con keywords Guard y Lifesteal son clave en raids.' },
  ],
};
