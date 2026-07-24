import { useState } from "react";
import { useOnboarding } from "../../domains/onboarding/useOnboarding";

const C = { bg1:"#12121f", b2:"#2a2a3a", gold:"#E8B84B", green:"#3DC96B", blue:"#4A9EFF", muted:"#7a7a9a", dim:"#4a4a6a", main:"#e8e8f0" };

const STEPS = [
  { icon:"⚒️", title:"Bienvenido a VEXFORGE",
    body:"El universo de la forja te espera. Colecciona cartas únicas, domina misiones, desafía jefes mundiales y asciende en el clasificatorio.",
    accent:C.gold, chips:[] },
  { icon:"🃏", title:"Tu arsenal está listo",
    body:"Recibirás 16 cartas iniciales — Guerreros, Magos, Paladines y Pícaros — y energía renovable para ejecutar misiones cada día.",
    accent:C.blue, chips:[["⚡","Energía","se regenera"],["🃏","16 cartas","iniciales"],["🌍","Misiones","ilimitadas"]] },
  { icon:"🎯", title:"Empieza a forjar tu leyenda",
    body:"El tutorial te guiará paso a paso. Explora misiones, gestiona tu energía y usa el mercado para intercambiar VEX con otros forjadores.",
    accent:C.green, chips:[] },
];

/**
 * V.1 chat79 — Modal de bienvenida 3 pasos para nuevos forjadores.
 * Visible cuando tutorial_step=0 y no hay flag localStorage.
 * Backdrop clickable y botón saltar no bloquean la app.
 */
export function OnboardingModal() {
  const { show, playerName, dismiss } = useOnboarding();
  const [step, setStep] = useState(0);
  if (!show) return null;
  const cur = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <>
      <div onClick={dismiss} style={{ position:"fixed",inset:0,zIndex:9000,background:"rgba(0,0,0,0.78)",backdropFilter:"blur(4px)" }}/>
      <div style={{
        position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:9001,
        width:"min(480px,94vw)",borderRadius:20,overflow:"hidden",
        background:`linear-gradient(160deg,${C.bg1} 0%,#0e0e1c 100%)`,
        border:`1px solid ${cur.accent}28`,
        boxShadow:`0 0 60px ${cur.accent}14,0 24px 60px rgba(0,0,0,0.6)`,
      }}>
        <div style={{height:3,background:`linear-gradient(90deg,transparent,${cur.accent},transparent)`}}/>
        <div style={{padding:"32px 28px 28px"}}>

          {/* Progress dots */}
          <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:24}}>
            {STEPS.map((_,i)=>(
              <div key={i} style={{width:i===step?20:6,height:6,borderRadius:3,transition:"all 0.3s",
                background:i===step?cur.accent:C.b2}}/>
            ))}
          </div>

          {/* Icon */}
          <div style={{width:72,height:72,borderRadius:20,margin:"0 auto 20px",fontSize:34,
            background:`${cur.accent}12`,border:`1px solid ${cur.accent}30`,
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            {cur.icon}
          </div>

          {step===0 && (
            <div style={{textAlign:"center",fontSize:11,letterSpacing:"0.12em",
              color:cur.accent,textTransform:"uppercase",marginBottom:6,fontFamily:"Rajdhani,sans-serif",fontWeight:600}}>
              {playerName}
            </div>
          )}
          <h2 style={{textAlign:"center",margin:"0 0 14px",fontSize:20,fontWeight:900,
            color:C.main,fontFamily:"Cinzel,serif",letterSpacing:"0.05em"}}>
            {cur.title}
          </h2>
          <p style={{textAlign:"center",margin:"0 0 24px",fontSize:13,color:C.muted,
            lineHeight:1.7,maxWidth:360,marginLeft:"auto",marginRight:"auto"}}>
            {cur.body}
          </p>

          {cur.chips.length > 0 && (
            <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:20,flexWrap:"wrap"}}>
              {cur.chips.map(([icon,label,sub])=>(
                <div key={label} style={{padding:"8px 14px",borderRadius:10,textAlign:"center",
                  background:`${C.blue}10`,border:`1px solid ${C.blue}22`}}>
                  <div style={{fontSize:16}}>{icon}</div>
                  <div style={{fontSize:11,fontWeight:700,color:C.blue,marginTop:2}}>{label}</div>
                  <div style={{fontSize:10,color:C.dim}}>{sub}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            {step>0 && (
              <button onClick={()=>setStep(s=>s-1)} style={{flex:1,padding:"11px 0",borderRadius:10,
                border:`1px solid ${C.b2}`,background:"transparent",color:C.muted,
                fontSize:13,cursor:"pointer",fontFamily:"Rajdhani,sans-serif",fontWeight:600}}>
                ← Atrás
              </button>
            )}
            <button onClick={isLast?dismiss:()=>setStep(s=>s+1)} style={{flex:2,padding:"12px 0",
              borderRadius:10,background:cur.accent,color:"#0a0a12",
              border:"none",fontSize:13,fontWeight:800,cursor:"pointer",
              fontFamily:"Cinzel,serif",letterSpacing:"0.05em"}}>
              {isLast ? "⚒️ Comenzar a forjar" : "Siguiente →"}
            </button>
          </div>

          <div style={{textAlign:"center",marginTop:14}}>
            <button onClick={dismiss} style={{background:"none",border:"none",
              color:C.dim,fontSize:11,cursor:"pointer"}}>
              Saltar introducción
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
