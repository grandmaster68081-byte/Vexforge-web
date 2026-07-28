import{j as e}from"./index-Us5341YL.js";import{r as i,L as c}from"./vendor-router-DWDfcQVL.js";import"./vendor-supabase-CAdwmRbE.js";const p="▓░▒█▄▀■□▪▫◆◇●○",g=["✦","◈","⬡","✧","◆","⊕","★","⟐","⊗","⬢"],f=["Este sector del multiverso fue sellado por la Forja.","Las coordenadas no existen en ningún plano conocido.","Los registros han sido borrados por los Forjadores.","Ruta destruida en la Gran Fragmentación del Arco IV.","Acceso denegado por el Consejo de la Forja Antigua."];function m(n,o){const[d,l]=i.useState(n);return i.useEffect(()=>{if(!o){l(n);return}let s=0;const a=setInterval(()=>{s++;const t=n.split("").map((r,x)=>r===" "?" ":Math.sin(s*.4+x)>.3?p[Math.floor(Math.random()*p.length)]:r).join("");l(s>18?n:t),s>22&&clearInterval(a)},60);return()=>clearInterval(a)},[n,o]),d}function v(){const[n,o]=i.useState(!1),[d]=i.useState(()=>Math.floor(Math.random()*f.length)),l=m("404",n),s=m("RUTA PERDIDA",n);return i.useEffect(()=>{o(!0);const a=setTimeout(()=>o(!1),1600);return()=>clearTimeout(a)},[]),i.useEffect(()=>{const a=setInterval(()=>{o(!0),setTimeout(()=>o(!1),1400)},7e3);return()=>clearInterval(a)},[]),e.jsxs("div",{style:{minHeight:"calc(100vh - 60px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden",background:"linear-gradient(160deg, #05050d 0%, #0a0a18 50%, #06060f 100%)",padding:"40px 24px"},children:[e.jsx("style",{children:`
        @keyframes nf-float-rune {
          0%   { opacity: 0; transform: translateY(0) scale(0.7) rotate(0deg); }
          20%  { opacity: 0.35; }
          80%  { opacity: 0.2; }
          100% { opacity: 0; transform: translateY(-120px) scale(1.1) rotate(15deg); }
        }
        @keyframes nf-scan {
          0%   { transform: translateY(-100%); opacity: 0.07; }
          100% { transform: translateY(100vh);  opacity: 0.04; }
        }
        @keyframes nf-pulse-border {
          0%, 100% { box-shadow: 0 0 0px rgba(232,64,64,0), 0 0 30px rgba(232,64,64,0.06); }
          50%       { box-shadow: 0 0 20px rgba(232,64,64,0.18), 0 0 60px rgba(232,64,64,0.08); }
        }
        @keyframes nf-shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-5px) skewX(-2deg); }
          40%     { transform: translateX(5px)  skewX(2deg); }
          60%     { transform: translateX(-3px) skewX(-1deg); }
          80%     { transform: translateX(3px); }
        }
        @keyframes nf-glow-404 {
          0%, 100% { text-shadow: 0 0 30px rgba(232,64,64,0.4), 0 0 80px rgba(232,64,64,0.15); }
          50%       { text-shadow: 0 0 50px rgba(232,64,64,0.65), 0 0 120px rgba(232,64,64,0.25); }
        }
        @keyframes nf-reveal-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nf-glitching { animation: nf-shake 0.12s steps(1) infinite; }
        .nf-btn-back:hover {
          background: rgba(232,64,64,0.15) !important;
          border-color: rgba(232,64,64,0.6) !important;
          transform: translateY(-2px);
        }
        .nf-btn-home:hover {
          filter: brightness(1.15);
          transform: translateY(-2px);
        }
      `}),Array.from({length:12}).map((a,t)=>e.jsx("div",{style:{position:"absolute",left:`${(t*17+5)%90+5}%`,bottom:`${(t*13+8)%40}%`,fontSize:`${t%3+9}px`,color:"#e84040",opacity:0,animation:`nf-float-rune ${t%4+5}s ease-in-out ${t*.6}s infinite`,pointerEvents:"none",userSelect:"none"},children:g[t%g.length]},t)),e.jsx("div",{style:{position:"absolute",left:0,right:0,height:2,background:"linear-gradient(90deg, transparent, rgba(232,64,64,0.08), transparent)",animation:"nf-scan 4s linear infinite",pointerEvents:"none"}}),e.jsxs("div",{style:{position:"relative",zIndex:10,width:"min(520px, 96vw)",background:"linear-gradient(160deg, #0e0e1e 0%, #0a0a16 100%)",border:"1px solid rgba(232,64,64,0.22)",borderRadius:20,padding:"48px 40px 44px",textAlign:"center",animation:"nf-pulse-border 3.5s ease-in-out infinite"},children:[e.jsx("div",{style:{height:2,background:"linear-gradient(90deg, transparent, #e84040, transparent)",marginBottom:32}}),e.jsx("div",{className:n?"nf-glitching":"",style:{fontFamily:"'Cinzel Decorative', serif",fontSize:"clamp(72px, 18vw, 112px)",fontWeight:900,lineHeight:1,color:"#e84040",letterSpacing:"-2px",animation:"nf-glow-404 2.8s ease-in-out infinite",marginBottom:8},children:l}),e.jsx("div",{style:{fontFamily:"'IBM Plex Mono', monospace",fontSize:12,letterSpacing:"0.25em",color:"rgba(232,64,64,0.7)",textTransform:"uppercase",marginBottom:24,animation:"nf-reveal-up 0.6s ease 0.2s both"},children:s}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:12,marginBottom:24,animation:"nf-reveal-up 0.6s ease 0.4s both"},children:[e.jsx("div",{style:{flex:1,height:1,background:"linear-gradient(90deg, transparent, rgba(232,64,64,0.3))"}}),e.jsx("span",{style:{color:"rgba(232,64,64,0.5)",fontSize:14},children:"◆"}),e.jsx("div",{style:{flex:1,height:1,background:"linear-gradient(90deg, rgba(232,64,64,0.3), transparent)"}})]}),e.jsx("p",{style:{fontFamily:"'Rajdhani', sans-serif",fontSize:14,lineHeight:1.65,color:"#6a7080",maxWidth:380,margin:"0 auto 8px",animation:"nf-reveal-up 0.6s ease 0.5s both"},children:f[d]}),e.jsxs("p",{style:{fontFamily:"'IBM Plex Mono', monospace",fontSize:10,color:"rgba(255,255,255,0.14)",margin:"0 0 36px",letterSpacing:"0.1em",animation:"nf-reveal-up 0.6s ease 0.6s both"},children:["ERR_ROUTE_NOT_FOUND · VEXFORGE_WEB · ",new Date().getFullYear()]}),e.jsxs("div",{style:{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",animation:"nf-reveal-up 0.6s ease 0.7s both"},children:[e.jsx(c,{to:"/",className:"nf-btn-home",style:{display:"inline-flex",alignItems:"center",gap:8,padding:"13px 28px",background:"linear-gradient(135deg, #e84040dd, #e84040)",color:"#fff",borderRadius:10,fontFamily:"'Cinzel', serif",fontWeight:700,fontSize:13,letterSpacing:"0.08em",textDecoration:"none",transition:"all 0.2s ease",boxShadow:"0 4px 20px rgba(232,64,64,0.3)"},children:"← Volver a la Forja"}),e.jsx(c,{to:"/cards",className:"nf-btn-back",style:{display:"inline-flex",alignItems:"center",gap:8,padding:"13px 28px",background:"transparent",color:"#8891a0",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,fontFamily:"'Rajdhani', sans-serif",fontWeight:700,fontSize:13,letterSpacing:"0.08em",textDecoration:"none",transition:"all 0.2s ease"},children:"Ver Cartas →"})]}),e.jsx("div",{style:{height:2,background:"linear-gradient(90deg, transparent, rgba(232,64,64,0.25), transparent)",marginTop:40}})]}),e.jsx("div",{style:{marginTop:28,display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",animation:"nf-reveal-up 0.6s ease 0.9s both"},children:[{to:"/pvp",label:"⚔️ Arena PvP"},{to:"/packs",label:"📦 Packs"},{to:"/missions",label:"🗺️ Misiones"},{to:"/leaderboard",label:"🏆 Ranking"}].map(({to:a,label:t})=>e.jsx(c,{to:a,style:{padding:"7px 14px",borderRadius:8,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"#5a6275",fontFamily:"'Rajdhani', sans-serif",fontWeight:600,fontSize:12,textDecoration:"none",transition:"color 0.15s, background 0.15s"},onMouseEnter:r=>{r.currentTarget.style.color="#e8e8f0",r.currentTarget.style.background="rgba(255,255,255,0.08)"},onMouseLeave:r=>{r.currentTarget.style.color="#5a6275",r.currentTarget.style.background="rgba(255,255,255,0.04)"},children:t},a))})]})}export{v as NotFoundRoute};
