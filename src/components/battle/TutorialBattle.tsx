// TutorialBattle.tsx — TU.0 (Chat 96)
    // Guided first battle for new players inside the tutorial flow.
    // Uses 'tutorial' difficulty AI. Shows 3 hint cards, then the full battle.

    import { useState, useEffect, useCallback } from "react";
    import { supabase } from "../../lib/supabase";
    import { simulateAIBattle, loadPlayerBattleUnits } from "../../lib/aiBattleEngine";
    import type { RealBattleResult } from "../../lib/battleTypes";
    import { AIBattleWithEffects } from "./AIBattleWithEffects";

    interface TutorialBattleProps {
    onComplete: (won: boolean) => void;
    onSkip: () => void;
    }

    type TBPhase = 'loading' | 'hint' | 'battle' | 'error';
    interface Hint { icon: string; title: string; desc: string; accentColor: string; }

    const HINTS: Hint[] = [
    { icon: "⚔️", title: "Tu Primera Batalla",
      desc: "Vas a enfrentar a un oponente de entrenamiento en modo Tutorial. No hay nada que perder — ¡solo aprender!",
      accentColor: "#e8b84b" },
    { icon: "🃏", title: "Tus Cartas Atacan",
      desc: "Cada carta usa su Ataque ⚔️ contra la Defensa 🛡️ del enemigo. Las habilidades especiales se activan automáticamente.",
      accentColor: "#4a9eff" },
    { icon: "🏆", title: "¡Derrota al Enemigo!",
      desc: "Elimina todas las cartas del oponente antes de que destruyan las tuyas. La Velocidad ⚡ determina quién ataca primero.",
      accentColor: "#a855f7" },
    ];

    function HintCard({ hint, index, total, onNext, onSkip }: {
    hint: Hint; index: number; total: number; onNext: () => void; onSkip: () => void;
    }) {
    const isLast = index === total - 1;
    const { icon, title, desc, accentColor: ac } = hint;
    return (
      <div style={{ position:"fixed",inset:0,zIndex:9998,display:"flex",alignItems:"center",justifyContent:"center",
        background:"rgba(3,3,10,0.92)",backdropFilter:"blur(8px)" }}>
        <div style={{ width:"min(420px,92vw)",borderRadius:20,padding:"36px 32px",
          background:"linear-gradient(160deg,#0d0d1e 0%,#0a0a18 100%)",
          border:`1px solid ${ac}44`,boxShadow:`0 0 60px ${ac}22,0 24px 48px rgba(0,0,0,0.6)`,textAlign:"center" }}>
          <div style={{ fontSize:56,marginBottom:16,filter:`drop-shadow(0 0 12px ${ac}88)` }}>{icon}</div>
          <h2 style={{ fontFamily:'"Cinzel",serif',fontSize:20,fontWeight:700,color:ac,marginBottom:12,letterSpacing:"0.06em" }}>{title}</h2>
          <p style={{ fontFamily:'"Rajdhani",sans-serif',fontSize:15,lineHeight:1.6,color:"rgba(255,255,255,0.72)",marginBottom:28 }}>{desc}</p>
          <div style={{ display:"flex",justifyContent:"center",gap:6,marginBottom:28 }}>
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} style={{ width:i===index?20:7,height:7,borderRadius:4,
                background:i<=index?ac:"rgba(255,255,255,0.1)",transition:"all 0.3s ease",
                boxShadow:i===index?`0 0 10px ${ac}88`:"none" }} />
            ))}
          </div>
          <button onClick={onNext} style={{ width:"100%",padding:"14px 20px",borderRadius:12,marginBottom:12,
            background:`linear-gradient(135deg,${ac}dd,${ac}99)`,border:`1px solid ${ac}`,
            color:isLast?"#0a0a12":"#fff",fontFamily:'"Cinzel",serif',fontSize:14,fontWeight:700,
            letterSpacing:"0.08em",cursor:"pointer",boxShadow:`0 4px 20px ${ac}44` }}>
            {isLast ? "⚔️ ¡Comenzar Batalla!" : "Siguiente →"}
          </button>
          <button onClick={onSkip} style={{ width:"100%",padding:10,border:"none",background:"transparent",
            color:"rgba(255,255,255,0.3)",fontFamily:'"Rajdhani",sans-serif',fontSize:12,cursor:"pointer",letterSpacing:"0.1em" }}>
            SALTAR TUTORIAL
          </button>
        </div>
      </div>
    );
    }

    function TBLoading() {
    return (
      <div style={{ position:"fixed",inset:0,zIndex:9998,display:"flex",flexDirection:"column",
        alignItems:"center",justifyContent:"center",background:"#0a0a12" }}>
        <style>{`@keyframes tb-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ fontSize:48,marginBottom:20,animation:"tb-spin 2s linear infinite" }}>⚔️</div>
        <p style={{ fontFamily:'"Cinzel",serif',color:"#e8b84b",fontSize:15,letterSpacing:"0.06em" }}>Preparando batalla tutorial…</p>
      </div>
    );
    }

    function TBError({ message, onSkip }: { message: string | null; onSkip: () => void }) {
    return (
      <div style={{ position:"fixed",inset:0,zIndex:9998,display:"flex",flexDirection:"column",
        alignItems:"center",justifyContent:"center",background:"#0a0a12",textAlign:"center",padding:28 }}>
        <div style={{ fontSize:40,marginBottom:16 }}>⚠️</div>
        <p style={{ color:"#f87171",fontFamily:'"Rajdhani",sans-serif',fontSize:14,marginBottom:24,maxWidth:300 }}>
          {message || "No se pudo cargar la batalla tutorial."}
        </p>
        <button onClick={onSkip} style={{ padding:"12px 24px",borderRadius:10,border:"1px solid #e8b84b44",
          background:"rgba(232,184,75,0.1)",color:"#e8b84b",fontFamily:'"Cinzel",serif',fontSize:13,cursor:"pointer" }}>
          Continuar tutorial
        </button>
      </div>
    );
    }

    export function TutorialBattle({ onComplete, onSkip }: TutorialBattleProps) {
    const [phase, setPhase] = useState<TBPhase>('loading');
    const [hintIdx, setHintIdx] = useState(0);
    const [result, setResult] = useState<RealBattleResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      async function prepare() {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) { setError("Inicia sesión para jugar la batalla tutorial."); setPhase('error'); return; }
          const playerUnits = await loadPlayerBattleUnits(session.user.id);
          if (!playerUnits || playerUnits.length === 0) { onComplete(true); return; }
          const battleResult = simulateAIBattle(playerUnits, 'tutorial');
          setResult(battleResult);
          setPhase('hint');
        } catch (_) {
          setError("Error cargando tu mazo. Puedes continuar el tutorial sin la batalla.");
          setPhase('error');
        }
      }
      prepare();
    }, []);

    const handleNextHint = useCallback(() => {
      if (hintIdx < HINTS.length - 1) setHintIdx(i => i + 1); else setPhase('battle');
    }, [hintIdx]);

    const handleBattleEnd = useCallback(() => {
      onComplete((result as any)?.winner === 'player' || (result?.playerWon ?? false));
    }, [result, onComplete]);

    if (phase === 'loading') return <TBLoading />;
    if (phase === 'error') return <TBError message={error} onSkip={onSkip} />;
    if (phase === 'hint') return <HintCard hint={HINTS[hintIdx]} index={hintIdx} total={HINTS.length} onNext={handleNextHint} onSkip={onSkip} />;
    if (!result) return <TBError message="Sin resultado de batalla." onSkip={onSkip} />;

    return (
      <div style={{ position:"fixed",inset:0,zIndex:9990,background:"#0a0a12" }}>
        <div style={{ position:"absolute",top:12,left:"50%",transform:"translateX(-50%)",zIndex:9995,
          background:"rgba(232,184,75,0.12)",border:"1px solid #e8b84b44",borderRadius:20,padding:"5px 16px",
          whiteSpace:"nowrap",fontFamily:'"Cinzel",serif',fontSize:11,color:"#e8b84b",letterSpacing:"0.1em" }}>
          ⚔️ BATALLA TUTORIAL
        </div>
        <button onClick={onSkip} style={{ position:"absolute",top:12,right:12,zIndex:9995,padding:"6px 14px",
          borderRadius:8,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",
          color:"rgba(255,255,255,0.35)",fontFamily:'"Rajdhani",sans-serif',fontSize:12,cursor:"pointer" }}>
          Saltar
        </button>
        <AIBattleWithEffects result={result} difficulty="tutorial" opponentName="Forjador Sombra (Tutorial)"
          onDismiss={handleBattleEnd} onRevenge={handleBattleEnd} />
      </div>
    );
    }