import { useProgress } from "../domains/progress/useProgress";
import { Link } from "react-router-dom";

const BG_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/heroes/hero_progress.jpg";

function ForgeBar({ label, value, max, color="#e8b84b", icon="" }:
{ label:string; value:number; max:number; color?:string; icon?:string }) {
const pct = max>0?Math.min(100,(value/max)*100):0;
return (
  <div style={{marginBottom:20}}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
      <span style={{fontSize:12,textTransform:"uppercase",letterSpacing:"0.07em",color:"var(--fg-muted)",fontFamily:'"Rajdhani",sans-serif',fontWeight:600}}>{icon} {label}</span>
      <span style={{fontFamily:'"IBM Plex Mono",monospace',fontSize:12,color}}>{value.toLocaleString()} / {max.toLocaleString()}</span>
    </div>
    <div style={{background:"#0f0f1a",borderRadius:6,height:10,overflow:"hidden",border:"1px solid #1a1a2e"}}>
      <div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,${color},${color}bb)`,
        transition:"width .5s ease",borderRadius:6}}/>
    </div>
  </div>
);
}

export function ProgressRoute() {
const { progress, loading, reason: error } = useProgress();

return (
  <main style={{
    minHeight:"100vh",
    background:`linear-gradient(rgba(10,10,18,0.82),rgba(10,10,18,0.97)),url('${BG_URL}') center/cover no-repeat fixed`,
  }}>
    <div style={{maxWidth:640,margin:"0 auto",padding:"40px 16px"}}>
      <div style={{marginBottom:32}}>
        <h1 style={{fontFamily:"Cinzel,serif",color:"#e8b84b",fontSize:26,margin:"0 0 4px"}}>📈 Progreso</h1>
        <p style={{color:"#888",margin:0,fontSize:12}}>Tu avance en VEXFORGE.</p>
      </div>

      {error && <div style={{background:"#2a1a1a",border:"1px solid #ff6b6b33",borderRadius:8,padding:"12px 16px",color:"#ff6b6b",marginBottom:16}}>{error}</div>}

      {loading && (
        <div style={{background:"#1a1a2e",borderRadius:12,padding:30}}>
          {[1,2,3].map(i=>(
            <div key={i} style={{height:16,background:"#2a2a3a",borderRadius:8,marginBottom:16,opacity:1-i*0.2}}/>
          ))}
        </div>
      )}

      {!loading && progress && (
        <div>
          {/* Level Badge */}
          <div style={{background:"linear-gradient(145deg,#1a1a2e,#12121a)",border:"1px solid #e8b84b44",
            borderRadius:16,padding:28,marginBottom:24,textAlign:"center"}}>
            <div style={{fontSize:52,marginBottom:8}}>⚡</div>
            <div style={{color:"#555",fontSize:12,letterSpacing:2,marginBottom:4}}>NIVEL</div>
            <div style={{fontFamily:"Cinzel,serif",color:"#e8b84b",fontSize:56,fontWeight:900,lineHeight:1}}>{progress.level}</div>
            <div style={{color:"#555",fontSize:11,marginTop:6}}>
              {progress.xp.toLocaleString()} XP totales acumulados
            </div>
          </div>

          {/* Bars */}
          <div style={{background:"#12121a",border:"1px solid #1a1a2e",borderRadius:12,padding:"24px 28px"}}>
            <ForgeBar label="XP al siguiente nivel" value={progress.xp % (progress.xp_to_next||1)} max={progress.xp_to_next||1000} color="#e8b84b" icon="⭐"/>
            <ForgeBar label="Energía" value={progress.energy} max={progress.max_energy||100} color="#3ddc84" icon="⚡"/>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:8}}>
              <div style={{background:"#0f0f1a",borderRadius:10,padding:"16px 18px",textAlign:"center"}}>
                <div style={{color:"#555",fontSize:10,letterSpacing:1,marginBottom:4}}>NIVEL ACTUAL</div>
                <div style={{color:"#e8b84b",fontSize:28,fontWeight:800,fontFamily:"Cinzel,serif"}}>{progress.level}</div>
              </div>
              <div style={{background:"#0f0f1a",borderRadius:10,padding:"16px 18px",textAlign:"center"}}>
                <div style={{color:"#555",fontSize:10,letterSpacing:1,marginBottom:4}}>XP PARA SUBIR</div>
                <div style={{color:"#3ddc84",fontSize:18,fontWeight:800,fontFamily:"Cinzel,serif"}}>
                  {Math.max(0, progress.xp_to_next - (progress.xp % progress.xp_to_next)).toLocaleString()}
                </div>
              </div>
            </div>

            {progress.energy < progress.max_energy && (
              <div style={{marginTop:16,background:"#1a2a1a",border:"1px solid #3ddc8422",borderRadius:8,padding:"10px 14px"}}>
                <p style={{color:"#3ddc84",fontSize:11,margin:0}}>
                  ⚡ La energía se recarga automáticamente. Completa misiones para gastar energía y ganar XP.
                </p>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:16}}>
            {[
              {to:"/missions",label:"Misiones",icon:"🗺️"},
              {to:"/quests",label:"Quests",icon:"📜"},
              {to:"/achievements",label:"Logros",icon:"🏆"},
            ].map(l=>(
              <Link key={l.to} to={l.to} style={{
                background:"#1a1a2e",border:"1px solid #2a2a3a",borderRadius:9,
                padding:"14px 0",textAlign:"center",textDecoration:"none",
                color:"#888",fontSize:12,display:"block",
              }}>
                <div style={{fontSize:22,marginBottom:4}}>{l.icon}</div>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {!loading && !progress && !error && (
        <div style={{textAlign:"center",padding:50,background:"#1a1a2e",borderRadius:12}}>
          <p style={{color:"#555"}}>Completa tu primera misión para ver tu progreso.</p>
          <Link to="/missions" style={{color:"#e8b84b",fontSize:13}}>Ir a Misiones →</Link>
        </div>
      )}
    </div>
  </main>
);
}