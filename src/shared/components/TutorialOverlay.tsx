// TutorialOverlay v3 — TU.0 (Chat 96)
    // Step 4 now triggers TutorialBattle (guided battle) instead of navigating to /pvp.
    // On battle complete or skip → advance to step 5.

    import { useState, useEffect, useCallback } from "react";
    import { useNavigate } from "react-router-dom";
    import { useTutorial, TUTORIAL_TOTAL_STEPS } from "../../domains/tutorial/useTutorial";
    import { TutorialBattle } from "../../components/battle/TutorialBattle";

    type TutorialStep = {
    step: number; title: string; subtitle: string; desc: string;
    icon: string; action: string | null; actionLabel: string; accentColor: string;
    bgPattern?: string; factionHint?: string;
    };

    const STEPS: TutorialStep[] = [
    { step:0, title:"Bienvenido a VEXFORGE", subtitle:"El mundo de las cartas te espera, Forjador",
      desc:"VEXFORGE es un juego de cartas coleccionables de primera línea. Batallas épicas, facciones, misiones y recompensas legendarias te esperan.",
      icon:"⚔️", action:null, actionLabel:"Comenzar tutorial", accentColor:"#e8b84b", factionHint:"La Forja despierta…" },
    { step:1, title:"Tu Colección de Cartas", subtitle:"4 Facciones · Cientos de cartas únicas",
      desc:"Cada carta tiene Ataque, Defensa, Coste de Energía y habilidades especiales. Explora Guerrero, Mago, Paladín y Pícaro.",
      icon:"🃏", action:"/cards", actionLabel:"Ver mi Colección →", accentColor:"#f87171", factionHint:"Descubre tu facción" },
    { step:2, title:"Abre tu Primer Pack", subtitle:"Nuevas cartas, nuevas posibilidades",
      desc:"Los packs contienen cartas de distintas raridades. Los packs premium garantizan mínimo una carta Épica.",
      icon:"📦", action:"/packs", actionLabel:"Ir a Packs →", accentColor:"#818cf8", factionHint:"¿Qué depara el destino?" },
    { step:3, title:"Ejecuta Misiones", subtitle:"Gana XP, VEX y cartas raras",
      desc:"Las misiones son tu fuente principal de progresión. Completa misiones diarias para ganar XP, moneda VEX y recompensas especiales.",
      icon:"🗺️", action:"/missions", actionLabel:"Ver Misiones →", accentColor:"#34d399", factionHint:"El camino del forjador" },
    { step:4, title:"Primera Batalla", subtitle:"Aprende combatiendo — modo Tutorial activado",
      desc:"Vas a jugar tu primera batalla guiada. El oponente está en modo Tutorial. ¡Es hora de forjar tu leyenda!",
      icon:"⚡", action:null, actionLabel:"⚔️ Jugar Batalla Tutorial →", accentColor:"#fbbf24", factionHint:"Que comience la batalla" },
    { step:5, title:"Construye tu Mazo", subtitle:"Diseña la estrategia perfecta",
      desc:"El Deck Builder te permite construir mazos optimizados por facción, rareza y sinergia entre habilidades especiales.",
      icon:"🔧", action:"/deck-builder", actionLabel:"Ir al Deck Builder →", accentColor:"#a78bfa", factionHint:"La estrategia lo es todo" },
    { step:6, title:"¡Forjador Iniciado!", subtitle:"VEXFORGE es tuyo ahora",
      desc:"Has completado el tutorial. Explora libremente: World Bosses, Clanes, Season Pass, Evolución de cartas y mucho más.",
      icon:"🏆", action:null, actionLabel:"Comenzar Aventura ⚡", accentColor:"#e8b84b", factionHint:"El legado comienza hoy" },
    ];

    export function TutorialOverlay() {
    const { tutorialStep, loading, advance, skip, showTutorial } = useTutorial();
    const navigate = useNavigate();
    const [animDir, setAnimDir] = useState<'in' | 'out-left' | 'out-right'>('in');
    const [displayStep, setDisplayStep] = useState(0);
    const [showBattle, setShowBattle] = useState(false); // TU.0

    useEffect(() => {
      if (tutorialStep !== displayStep) {
        setAnimDir('out-left');
        const t = setTimeout(() => { setDisplayStep(tutorialStep); setAnimDir('in'); }, 220);
        return () => clearTimeout(t);
      }
    }, [tutorialStep]);

    const handleBattleComplete = useCallback(async (_won: boolean) => {
      setShowBattle(false);
      await advance(5);
    }, [advance]);

    const handleBattleSkip = useCallback(async () => {
      setShowBattle(false);
      await advance(5);
    }, [advance]);

    if (loading || !showTutorial) return null;

    const step = STEPS[Math.min(displayStep, STEPS.length - 1)];
    const isLast = tutorialStep >= TUTORIAL_TOTAL_STEPS - 1;
    const progress = Math.round((tutorialStep / (TUTORIAL_TOTAL_STEPS - 1)) * 100);
    const accent = step.accentColor;

    async function handleAction() {
      if (isLast) { await skip(); return; }
      if (tutorialStep === 4) { setShowBattle(true); return; }
      if (step.action) navigate(step.action);
      await advance(tutorialStep + 1);
    }

    const cardTransform = animDir === 'out-left' ? 'translateX(-28px) scale(0.97)' : 'translateX(0) scale(1)';
    const cardOpacity = animDir === 'out-left' ? 0 : 1;

    return (
      <>
        {showBattle && <TutorialBattle onComplete={handleBattleComplete} onSkip={handleBattleSkip} />}
        <div style={{ position:"fixed",inset:0,zIndex:9999,background:"rgba(3,3,10,0.88)",backdropFilter:"blur(6px)",
          display:showBattle?"none":"flex",alignItems:"center",justifyContent:"center",padding:"20px 16px" }}>
          <style>{`
            @keyframes tu-slide-in { from{opacity:0;transform:translateX(28px) scale(0.97)} to{opacity:1;transform:translateX(0) scale(1)} }
            @keyframes tu-icon-bounce { 0%,100%{transform:scale(1) rotate(-2deg)} 50%{transform:scale(1.12) rotate(2deg)} }
            .tu-action-btn:hover { filter:brightness(1.12);transform:translateY(-2px) scale(1.02); }
            .tu-skip-btn:hover { color:#aaa; }
            .tu-dot { transition:all 0.3s ease; }
          `}</style>
          <div style={{ position:"absolute",inset:0 }} onClick={() => { if(!isLast) skip(); }} />
          <div style={{ position:"relative",zIndex:1,width:"100%",maxWidth:440,
            background:"linear-gradient(160deg,#0d0d1e 0%,#0a0a18 100%)",
            border:`1px solid ${accent}44`,borderRadius:20,
            boxShadow:`0 0 60px ${accent}22,0 24px 48px rgba(0,0,0,0.6)`,overflow:"hidden",
            transition:"transform 0.22s ease,opacity 0.22s ease",
            transform:cardTransform,opacity:cardOpacity,
            animation:animDir==='in'?'tu-slide-in 0.25s ease':'none' }}>
            <div style={{ height:3,background:`linear-gradient(90deg,${accent}00,${accent},${accent}00)` }} />
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 24px 0" }}>
              <span style={{ fontFamily:'"IBM Plex Mono",monospace',fontSize:10,color:`${accent}99`,letterSpacing:"0.2em",textTransform:"uppercase" }}>
                PASO {Math.min(displayStep, STEPS.length-1)+1} / {STEPS.length}
              </span>
              <button onClick={() => skip()} className="tu-skip-btn" style={{ background:"none",border:"none",color:"#555",
                fontFamily:'"Rajdhani",sans-serif',fontSize:11,cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase",transition:"color 0.2s" }}>
                Saltar tutorial ×
              </button>
            </div>
            <div style={{ textAlign:"center",padding:"28px 24px 16px" }}>
              <div style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:96,height:96,borderRadius:"50%",
                background:`radial-gradient(circle,${accent}22 0%,${accent}08 70%)`,border:`1px solid ${accent}33`,
                fontSize:48,lineHeight:1,animation:"tu-icon-bounce 2.4s ease-in-out infinite",boxShadow:`0 0 32px ${accent}33` }}>
                {step.icon}
              </div>
              <div style={{ marginTop:12,display:"inline-block",background:`${accent}18`,border:`1px solid ${accent}33`,
                borderRadius:20,padding:"3px 12px",fontFamily:'"Rajdhani",sans-serif',fontSize:10,
                color:`${accent}cc`,letterSpacing:"0.12em",textTransform:"uppercase" }}>
                {step.factionHint}
              </div>
            </div>
            <div style={{ padding:"0 28px 28px" }}>
              <h2 style={{ fontFamily:'"Cinzel",serif',fontSize:20,fontWeight:700,color:"#e8e8f0",margin:"0 0 6px",textAlign:"center" }}>
                {step.title}
              </h2>
              <p style={{ fontFamily:'"Rajdhani",sans-serif',fontSize:13,color:accent,textAlign:"center",margin:"0 0 16px",letterSpacing:"0.04em" }}>
                {step.subtitle}
              </p>
              <p style={{ fontFamily:'"Rajdhani",sans-serif',fontSize:14,lineHeight:1.6,color:"#8891a0",textAlign:"center",margin:"0 0 28px" }}>
                {step.desc}
              </p>
              <div style={{ display:"flex",justifyContent:"center",gap:7,marginBottom:24 }}>
                {STEPS.map((_,i) => (
                  <div key={i} className="tu-dot" style={{ width:i===Math.min(displayStep,STEPS.length-1)?20:7,height:7,borderRadius:4,
                    background:i<=Math.min(displayStep,STEPS.length-1)?accent:"rgba(255,255,255,0.1)",
                    boxShadow:i===Math.min(displayStep,STEPS.length-1)?`0 0 10px ${accent}88`:"none" }} />
                ))}
              </div>
              <div style={{ marginBottom:24 }}>
                <div style={{ background:"rgba(255,255,255,0.06)",borderRadius:4,height:4,overflow:"hidden" }}>
                  <div style={{ width:`${progress}%`,height:"100%",borderRadius:4,
                    background:`linear-gradient(90deg,${accent}88,${accent})`,transition:"width 0.5s ease" }} />
                </div>
              </div>
              <button onClick={handleAction} className="tu-action-btn" style={{ width:"100%",padding:"14px 20px",borderRadius:12,
                background:`linear-gradient(135deg,${accent}dd 0%,${accent}99 100%)`,border:`1px solid ${accent}`,
                color:isLast?"#0a0a12":"#fff",fontFamily:'"Cinzel",serif',fontSize:14,fontWeight:700,
                letterSpacing:"0.08em",cursor:"pointer",boxShadow:`0 4px 20px ${accent}44`,transition:"all 0.2s ease" }}>
                {step.actionLabel}
              </button>
            </div>
            <div style={{ height:2,background:`linear-gradient(90deg,transparent,${accent}66,transparent)`,opacity:0.5 }} />
          </div>
        </div>
      </>
    );
    }