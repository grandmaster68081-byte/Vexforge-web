// TutorialBattle.tsx — primera batalla guiada dentro de ForgeFormation.
// Usa exclusivamente cartas oficiales del jugador y comparte el mismo
// selector, motor y tablero que las batallas de producción.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { loadPlayerBattleUnits } from "../../lib/aiBattleEngine";
import type { BattleUnit } from "../../lib/battleTypes";
import type { FormationState } from "../../lib/forgeFormation";
import { FormationSelector } from "./FormationSelector";
import { ForgeFormationBoard } from "./ForgeFormationBoard";
import { ForgeIcon, type ForgeIconName } from "../../shared/components/ForgeIcon";

interface TutorialBattleProps {
  onComplete: (won: boolean) => void;
  onSkip: () => void;
}

type TutorialPhase = "loading" | "hint" | "formation" | "battle" | "error";

interface Hint {
  icon: ForgeIconName;
  title: string;
  desc: string;
  accentColor: string;
}

const HINTS: Hint[] = [
  {
    icon: "attack",
    title: "Tu Primera Batalla",
    desc: "Vas a enfrentar a un oponente de entrenamiento en modo Tutorial. No hay nada que perder: aquí aprenderás a usar tu formación.",
    accentColor: "#e8b84b",
  },
  {
    icon: "cards",
    title: "Construye tu Formación",
    desc: "Elige un Campeón, una Vanguardia y un Centinela de tu propia colección. La Reserva amplifica el poder del Campeón.",
    accentColor: "#4a9eff",
  },
  {
    icon: "trophy",
    title: "Protege el Núcleo",
    desc: "La Vanguardia y el Centinela reciben la presión inicial. Si cae el Campeón, la batalla termina.",
    accentColor: "#a855f7",
  },
];

function HintCard({
  hint,
  index,
  total,
  onNext,
  onSkip,
}: {
  hint: Hint;
  index: number;
  total: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  const isLast = index === total - 1;
  const { icon, title, desc, accentColor: accent } = hint;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(3,3,10,0.92)",
        backdropFilter: "blur(8px)",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "min(420px, 92vw)",
          borderRadius: 20,
          padding: "36px 32px",
          background: "linear-gradient(160deg,#0d0d1e 0%,#0a0a18 100%)",
          border: `1px solid ${accent}44`,
          boxShadow: `0 0 60px ${accent}22,0 24px 48px rgba(0,0,0,0.6)`,
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: 16, filter: `drop-shadow(0 0 12px ${accent}88)` }}>
          <ForgeIcon name={icon} size={56} />
        </div>
        <h2
          style={{
            fontFamily: '"Cinzel",serif',
            fontSize: 20,
            fontWeight: 700,
            color: accent,
            margin: "0 0 12px",
            letterSpacing: "0.06em",
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontFamily: '"Rajdhani",sans-serif',
            fontSize: 15,
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.72)",
            margin: "0 0 28px",
          }}
        >
          {desc}
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 28 }}>
          {Array.from({ length: total }).map((_, step) => (
            <div
              key={step}
              style={{
                width: step === index ? 20 : 7,
                height: 7,
                borderRadius: 4,
                background: step <= index ? accent : "rgba(255,255,255,0.1)",
                transition: "all 0.3s ease",
                boxShadow: step === index ? `0 0 10px ${accent}88` : "none",
              }}
            />
          ))}
        </div>
        <button
          onClick={onNext}
          style={{
            width: "100%",
            padding: "14px 20px",
            borderRadius: 12,
            marginBottom: 12,
            background: `linear-gradient(135deg,${accent}dd,${accent}99)`,
            border: `1px solid ${accent}`,
            color: isLast ? "#0a0a12" : "#fff",
            fontFamily: '"Cinzel",serif',
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.08em",
            cursor: "pointer",
            boxShadow: `0 4px 20px ${accent}44`,
          }}
        >
          {isLast ? <><ForgeIcon name="attack" size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />¡Elegir Formación!</> : "Siguiente →"}
        </button>
        <button
          onClick={onSkip}
          style={{
            width: "100%",
            padding: 10,
            border: "none",
            background: "transparent",
            color: "rgba(255,255,255,0.3)",
            fontFamily: '"Rajdhani",sans-serif',
            fontSize: 12,
            cursor: "pointer",
            letterSpacing: "0.1em",
          }}
        >
          SALTAR TUTORIAL
        </button>
      </div>
    </div>
  );
}

function TutorialLoading() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a12",
      }}
    >
      <style>{`@keyframes tutorial-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ marginBottom: 20, animation: "tutorial-spin 2s linear infinite" }}><ForgeIcon name="attack" size={48} /></div>
      <p style={{ fontFamily: '"Cinzel",serif', color: "#e8b84b", fontSize: 15, letterSpacing: "0.06em" }}>
        Cargando tus cartas oficiales…
      </p>
    </div>
  );
}

function TutorialError({ message, onSkip }: { message: string | null; onSkip: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a12",
        textAlign: "center",
        padding: 28,
      }}
    >
      <div style={{ marginBottom: 16 }}><ForgeIcon name="warning" size={40} /></div>
      <p style={{ color: "#f87171", fontFamily: '"Rajdhani",sans-serif', fontSize: 14, margin: "0 0 24px", maxWidth: 360 }}>
        {message || "No se pudo cargar la batalla tutorial."}
      </p>
      <button
        onClick={onSkip}
        style={{
          padding: "12px 24px",
          borderRadius: 10,
          border: "1px solid #e8b84b44",
          background: "rgba(232,184,75,0.1)",
          color: "#e8b84b",
          fontFamily: '"Cinzel",serif',
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        Continuar tutorial
      </button>
    </div>
  );
}

export function TutorialBattle({ onComplete, onSkip }: TutorialBattleProps) {
  const [phase, setPhase] = useState<TutorialPhase>("loading");
  const [hintIndex, setHintIndex] = useState(0);
  const [playerUnits, setPlayerUnits] = useState<BattleUnit[] | null>(null);
  const [formation, setFormation] = useState<FormationState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function prepare() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const authUserId = sessionData.session?.user.id;
        if (!authUserId) throw new Error("Inicia sesión para jugar la batalla tutorial.");

        const { data: player, error: playerError } = await supabase
          .from("players")
          .select("id")
          .eq("auth_user_id", authUserId)
          .maybeSingle();
        if (playerError || !player?.id) {
          throw new Error(playerError?.message ?? "No se encontró tu jugador.");
        }

        const units = await loadPlayerBattleUnits(supabase, player.id);
        if (cancelled) return;
        setPlayerUnits(units);
        setPhase("hint");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "No se pudo cargar tu colección.");
        setPhase("error");
      }
    }

    void prepare();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNextHint = useCallback(() => {
    if (hintIndex < HINTS.length - 1) {
      setHintIndex((index) => index + 1);
    } else {
      setPhase("formation");
    }
  }, [hintIndex]);

  const handleFormationConfirm = useCallback((nextFormation: FormationState) => {
    setFormation(nextFormation);
    setPhase("battle");
  }, []);

  if (phase === "loading") return <TutorialLoading />;
  if (phase === "error") return <TutorialError message={error} onSkip={onSkip} />;
  if (phase === "hint") {
    return (
      <HintCard
        hint={HINTS[hintIndex]}
        index={hintIndex}
        total={HINTS.length}
        onNext={handleNextHint}
        onSkip={onSkip}
      />
    );
  }
  if (phase === "formation" && playerUnits) {
    return (
      <FormationSelector
        playerUnits={playerUnits}
        difficulty="tutorial"
        onConfirm={handleFormationConfirm}
        onCancel={onSkip}
      />
    );
  }
  if (phase === "battle" && formation) {
    return (
      <ForgeFormationBoard
        initialFormation={formation}
        playerName="Tú"
        opponentName="Forjador Sombra (Tutorial)"
        difficulty="tutorial"
        onComplete={(won) => onComplete(won)}
        onDismiss={onSkip}
      />
    );
  }
  return <TutorialError message="No se pudo preparar la formación tutorial." onSkip={onSkip} />;
}