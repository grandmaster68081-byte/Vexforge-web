import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useHome } from "../domains/home/useHome";
import { useHomeActivity } from "../domains/home/useHomeActivity";

const LOBBY_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/lobby/main.jpg";

interface HomeStats {
  active_players: number;
  total_battles: number;
  total_cards: number;
  packs_opened: number;
  season: { name: string; ends_at: string } | null;
  active_event: { id: string; name: string; type: string; ends_at: string; progress: number } | null;
  top3: Array<{ rank: number; display_name: string; mmr: number; wins: number }>;
}

const FEATURES = [
  { icon:"🃏", title:"127 Cartas Únicas",    desc:"4 facciones · 6 rarezas · Common a Mythic.", href:"/cards",        color:"#E84040" },
  { icon:"⚔️", title:"Combat PvP",           desc:"Motor turn-by-turn con sistema ELO. 7 tiers.", href:"/pvp",          color:"#5B8BF5" },
  { icon:"📦", title:"Pack Opening",         desc:"5 tipos de packs con probabilidades reales.", href:"/packs",        color:"#3DC96B" },
  { icon:"⚗️", title:"Fusión de Cartas",     desc:"Combina cartas con el keyword Forge.", href:"/fusion",       color:"#E8B84B" },
  { icon:"🏪", title:"Mercado P2P",          desc:"Compra y vende cartas. Fee del 5% por venta.", href:"/market",       color:"#E84040" },
  { icon:"🐉", title:"World Bosses",         desc:"10 bosses de T1 a T6. Recompensas épicas.", href:"/bosses",       color:"#5B8BF5" },
  { icon:"📜", title:"Misiones Diarias",     desc:"Completa misiones por tipo y región.", href:"/missions",     color:"#3DC96B" },
  { icon:"🏆", title:"25+ Logros",           desc:"Desbloquea logros permanentes.", href:"/achievements", color:"#E8B84B" },
  { icon:"🏰", title:"Clanes",               desc:"Únete o crea un clan. Sube el prestige.", href:"/clans",        color:"#E84040" },
  { icon:"💜", title:"Season Pass",          desc:"Temporada 1: El Despertar del Forjador.", href:"/season-pass",  color:"#A855F7" },
];

const MEDAL = ["🥇","🥈","🥉"];
const TIER_COLOR: Record<string,string> = { Iron:"#8b8b9e", Bronze:"#cd7f32", Silver:"#9e9e9e", Gold:"#f59e0b", Platinum:"#a855f7", Diamond:"#4a9eff", Mythic:"#ff4444" };
const DAILY_RARITY_COLORS: Record<string,string> = { Common:"#9A9AB0", Uncommon:"#3DC96B", Rare:"#4A9EFF", Epic:"#A855F7", Legendary:"#E8B84B", Mythic:"#FF4444" };
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "ahora";
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}
function getRankTier(mmr:number) {
  if(mmr>=3000) return "Mythic"; if(mmr>=2400) return "Diamond"; if(mmr>=2000) return "Platinum";
  if(mmr>=1600) return "Gold"; if(mmr>=1200) return "Silver"; if(mmr>=800) return "Bronze"; return "Iron";
}

function Particles() {
  return (
    <div className="hero-particles">
      {Array.from({length:18}).map((_,i)=>(
        <div key={i} className="hero-particle" style={{
          left:`${(i*17+7)%100}%`, bottom:`${(i*13+5)%40}%`,
          width:`${(i%3)+1}px`, height:`${(i%3)+1}px`,
          animationDuration:`${(i%4)+3}s`, animationDelay:`${(i%5)}s`
        }}/>
      ))}
    </div>
  );
}

function CountdownTimer({endsAt}: {endsAt:string}) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(()=>{
    const calc = ()=>{
      const diff = new Date(endsAt).getTime() - Date.now();
      if(diff<=0){setTimeLeft("Finalizado");return;}
      const d=Math.floor(diff/86400000), h=Math.floor((diff%86400000)/3600000), m=Math.floor((diff%3600000)/60000);
      setTimeLeft(`${d}d ${h}h ${m}m`);
    };
    calc();
    const id=setInterval(calc,60000);
    return ()=>clearInterval(id);
  },[endsAt]);
  return <span>{timeLeft}</span>;
}

export function HomeRoute() {
  const { profile, progress, wallet, nextMissions, signedIn, loading } = useHome();
  const { dailyCard, activity, loading: activityLoading } = useHomeActivity();
  const [stats, setStats] = useState<HomeStats|null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(()=>{
    supabase.rpc("get_home_stats").then(({data})=>{
      if(data) setStats(data as HomeStats);
      setStatsLoading(false);
    });
  },[]);

  const hasPlayerData = signedIn && profile;

  return (
    <div style={{minHeight:"100vh", background:"var(--bg-base, #0a0a14)"}}>
      {/* ─── HERO ─── */}
      <div style={{position:"relative", overflow:"hidden", minHeight:520,
        background:"linear-gradient(160deg, #0a0a14 0%, #0d0d22 40%, #100a1e 100%)",
        borderBottom:"1px solid rgba(201,144,31,0.15)"}}>
        {LOBBY_URL && (
          <div style={{position:"absolute",inset:0,
            backgroundImage:`url(${LOBBY_URL})`, backgroundSize:"cover", backgroundPosition:"center top",
            opacity:0.18, filter:"blur(1px)"}}/>
        )}
        <Particles/>
        <div style={{position:"relative",zIndex:1,maxWidth:900,margin:"0 auto",padding:"72px 24px 60px",textAlign:"center"}}>
          <p style={{fontSize:11,letterSpacing:"0.18em",color:"#e8b84b",textTransform:"uppercase",
            fontFamily:"Rajdhani,sans-serif",fontWeight:700,marginBottom:16}}>
            ⚔️ — VEXFORGE — ⚔️
          </p>
          <h1 style={{fontFamily:"Cinzel,serif",color:"#e8e8f0",
            fontSize:"clamp(32px,6vw,64px)",lineHeight:1.1,margin:"0 0 20px",
            textShadow:"0 0 60px rgba(201,144,31,0.4)"}}>
            Forja tu <span style={{background:"linear-gradient(135deg,#e8b84b,#c9901f)",
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Leyenda</span>
          </h1>
          <p style={{color:"#8888aa",fontSize:16,maxWidth:520,margin:"0 auto 36px",lineHeight:1.6}}>
            El juego de cartas coleccionables donde cada carta tiene valor real. Compite, forja y domina la arena.
          </p>
          <div className="hero-cta">
            {hasPlayerData ? (
              <>
                <Link to="/cards" className="btn-primary">🃏 Mi Colección</Link>
                <Link to="/pvp" className="btn-secondary">⚔️ Entrar a la Arena</Link>
              </>
            ) : (
              <>
                <Link to="/account" className="btn-primary">🔥 Comenzar gratis</Link>
                <Link to="/cards" className="btn-secondary">🃏 Ver Cartas</Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{maxWidth:960,margin:"0 auto",padding:"40px 20px 80px"}}>

        {/* ─── ACTIVE EVENT BANNER (Festival de la Forja) ─── */}
        {!statsLoading && stats?.active_event && (
          <div style={{position:"relative",overflow:"hidden",marginBottom:32,borderRadius:14,
            background:"linear-gradient(135deg,#1a0f00 0%,#2d1a00 55%,#1a0f00 100%)",
            border:"1px solid rgba(232,184,75,0.4)",padding:"22px 24px"}}>
            {/* Diagonal stripe shimmer */}
            <div style={{position:"absolute",inset:0,opacity:0.05,
              backgroundImage:"repeating-linear-gradient(45deg,#E8B84B 0,#E8B84B 1px,transparent 0,transparent 50%)",
              backgroundSize:"18px 18px",pointerEvents:"none"}}/>
            <div style={{position:"relative",zIndex:1}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
                <div style={{flex:"1 1 240px"}}>
                  <p style={{fontSize:9,letterSpacing:"0.2em",color:"#E8B84B",
                    textTransform:"uppercase",fontFamily:"IBM Plex Mono,monospace",fontWeight:700,margin:"0 0 6px"}}>
                    🔥 EVENTO ACTIVO · TEMPORADA 1
                  </p>
                  <h3 style={{fontFamily:"Cinzel,serif",color:"#F5C842",fontSize:20,margin:"0 0 6px",fontWeight:700}}>
                    {stats.active_event.name}
                  </h3>
                  <p style={{color:"rgba(245,200,66,0.6)",fontSize:12,margin:"0 0 14px"}}>
                    Completa misiones del Festival · Gana recompensas exclusivas
                  </p>
                  {/* Progress bar */}
                  <div style={{marginBottom:6}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:9,color:"rgba(232,184,75,0.5)",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"IBM Plex Mono,monospace"}}>
                        Progreso global
                      </span>
                      <span style={{fontSize:9,color:"#E8B84B",fontFamily:"IBM Plex Mono,monospace",fontWeight:700}}>
                        {stats.active_event.progress ?? 0}%
                      </span>
                    </div>
                    <div style={{background:"rgba(0,0,0,0.4)",borderRadius:4,height:6,overflow:"hidden"}}>
                      <div style={{
                        width:`${Math.max(2,stats.active_event.progress ?? 0)}%`,
                        height:"100%",borderRadius:4,
                        background:"linear-gradient(90deg,#C9901F,#E8B84B)",
                        transition:"width 0.6s ease",
                      }}/>
                    </div>
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:9,color:"rgba(245,200,66,0.5)",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"IBM Plex Mono,monospace",marginBottom:4}}>
                    Termina en
                  </div>
                  <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:24,fontWeight:800,color:"#E8B84B",marginBottom:12}}>
                    <CountdownTimer endsAt={stats.active_event.ends_at}/>
                  </div>
                  <Link to="/missions" className="btn-primary"
                    style={{fontSize:12,padding:"7px 16px",background:"linear-gradient(135deg,#C9901F,#E8B84B)",color:"#0a0a14",fontWeight:700,border:"none"}}>
                    ⭐ Misiones del Festival →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* ─── CARTA DEL DÍA ─── */}
        {!activityLoading && dailyCard && (
          <div style={{marginBottom:32}}>
            <p style={{fontSize:10,letterSpacing:"0.14em",color:"#e8b84b",
              textTransform:"uppercase",fontFamily:"Rajdhani,sans-serif",fontWeight:700,marginBottom:16}}>
              ─── Carta del Día ───
            </p>
            <div style={{display:"grid",gridTemplateColumns:"120px 1fr",gap:20,
              background:"var(--layer-1,rgba(255,255,255,0.03))",borderRadius:14,
              border:"1px solid rgba(201,144,31,0.2)",padding:"20px",overflow:"hidden",position:"relative"}}>
              {/* Glow accent */}
              <div style={{position:"absolute",top:0,left:0,right:0,height:"2px",
                background:DAILY_RARITY_COLORS[dailyCard.rarity as keyof typeof DAILY_RARITY_COLORS]
                  ? `linear-gradient(90deg,transparent,${DAILY_RARITY_COLORS[dailyCard.rarity as keyof typeof DAILY_RARITY_COLORS]}80,transparent)`
                  : "linear-gradient(90deg,transparent,#e8b84b80,transparent)"}}/>
              {/* Card image */}
              <div style={{borderRadius:10,overflow:"hidden",flexShrink:0,
                background:"linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))",
                border:`1px solid ${DAILY_RARITY_COLORS[dailyCard.rarity as keyof typeof DAILY_RARITY_COLORS] ?? "#e8b84b"}44`,
                display:"flex",alignItems:"center",justifyContent:"center",
                aspectRatio:"3/4",position:"relative"}}>
                {dailyCard.image_url ? (
                  <img src={dailyCard.image_url} alt={dailyCard.name}
                    style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                ) : (
                  <span style={{fontSize:36}}>🃏</span>
                )}
                <div style={{position:"absolute",bottom:5,left:0,right:0,textAlign:"center",
                  fontSize:9,fontWeight:700,letterSpacing:"0.1em",
                  color:DAILY_RARITY_COLORS[dailyCard.rarity as keyof typeof DAILY_RARITY_COLORS] ?? "#e8b84b",
                  fontFamily:"IBM Plex Mono,monospace",textTransform:"uppercase"}}>
                  {dailyCard.rarity}
                </div>
              </div>
              {/* Card info */}
              <div style={{display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontSize:9,letterSpacing:"0.12em",color:"rgba(232,184,75,0.6)",
                    textTransform:"uppercase",fontFamily:"IBM Plex Mono,monospace",marginBottom:6}}>
                    Destacada hoy · {dailyCard.faction}
                  </div>
                  <h3 style={{margin:"0 0 8px",fontSize:18,fontWeight:700,
                    fontFamily:"Rajdhani,sans-serif",color:"var(--fg-primary,#e8e8f0)",letterSpacing:"0.04em"}}>
                    {dailyCard.name}
                  </h3>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
                    <span style={{fontSize:12,fontFamily:"IBM Plex Mono,monospace",
                      color:DAILY_RARITY_COLORS[dailyCard.rarity as keyof typeof DAILY_RARITY_COLORS] ?? "#e8b84b",
                      fontWeight:700}}>⚡ {dailyCard.power}</span>
                    <span style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>·</span>
                    <span style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>Poder</span>
                  </div>
                  {dailyCard.lore && (
                    <p style={{fontSize:12,color:"rgba(255,255,255,0.4)",fontStyle:"italic",
                      margin:"0 0 14px",lineHeight:1.5,
                      display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",
                      overflow:"hidden"}}>
                      "{dailyCard.lore}"
                    </p>
                  )}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <Link to="/cards" style={{textDecoration:"none"}}>
                    <button style={{padding:"7px 16px",borderRadius:8,cursor:"pointer",
                      background:"linear-gradient(135deg,#C9901F,#E8B84B)",border:"none",
                      color:"#0a0a14",fontSize:12,fontFamily:"Rajdhani,sans-serif",
                      fontWeight:700,letterSpacing:"0.06em"}}>
                      🃏 Ver Colección
                    </button>
                  </Link>
                  <Link to="/packs" style={{textDecoration:"none"}}>
                    <button style={{padding:"7px 14px",borderRadius:8,cursor:"pointer",
                      background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",
                      color:"rgba(255,255,255,0.6)",fontSize:12,fontFamily:"Rajdhani,sans-serif",fontWeight:700}}>
                      📦 Abrir Pack
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── PLAYER DASHBOARD (signed in) ─── */}
        {hasPlayerData && !loading && (
          <div style={{marginBottom:40}}>
            <p style={{fontSize:10,letterSpacing:"0.14em",color:"#e8b84b",
              textTransform:"uppercase",fontFamily:"Rajdhani,sans-serif",fontWeight:700,marginBottom:16}}>
              ─── Tu Estado ───
            </p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:20}}>
              {[
                {label:"Jugador", value:profile.display_name ?? "Forjador", icon:"🎮"},
                {label:"Nivel", value:progress?.level ?? 1, icon:"⭐"},
                {label:"VEX Ingame", value:wallet?.vex_ingame?.toFixed(2) ?? "0.00", icon:"💰"},
                {label:"Energía", value:`${progress?.energy ?? 0}/${progress?.max_energy ?? 100}`, icon:"⚡"},
              ].map(item=>(
                <div key={item.label} style={{padding:"16px 20px",
                  background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",
                  borderRadius:10}}>
                  <div style={{fontSize:20,marginBottom:6}}>{item.icon}</div>
                  <div style={{fontSize:11,color:"#555",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>
                    {item.label}
                  </div>
                  <div style={{fontFamily:"Rajdhani,sans-serif",fontWeight:700,fontSize:20,color:"#e8e8f0"}}>
                    {String(item.value)}
                  </div>
                </div>
              ))}
            </div>
            {nextMissions.length > 0 && (
              <div style={{padding:"16px 20px",background:"rgba(255,255,255,0.02)",
                border:"1px solid rgba(255,255,255,0.05)",borderRadius:10}}>
                <p style={{fontSize:11,color:"#555",letterSpacing:"0.1em",
                  textTransform:"uppercase",margin:"0 0 10px"}}>Próximas misiones</p>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {nextMissions.slice(0,3).map(m=>(
                    <Link key={m.id} to="/missions"
                      style={{padding:"6px 14px",background:"rgba(232,184,75,0.08)",
                        border:"1px solid rgba(232,184,75,0.2)",borderRadius:6,
                        color:"#e8b84b",fontSize:12,textDecoration:"none"}}>
                      {m.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── LIVE STATS ─── */}
        {!statsLoading && stats && (
          <div style={{marginBottom:48}}>
            <p style={{fontSize:10,letterSpacing:"0.14em",color:"#e8b84b",
              textTransform:"uppercase",fontFamily:"Rajdhani,sans-serif",fontWeight:700,marginBottom:16}}>
              ─── Estadísticas Globales ───
            </p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12}}>
              {[
                {label:"Jugadores", value:stats.active_players, icon:"👥"},
                {label:"Cartas Únicas", value:stats.total_cards, icon:"🃏"},
                {label:"Batallas PvP", value:stats.total_battles, icon:"⚔️"},
                {label:"Packs Abiertos", value:stats.packs_opened, icon:"📦"},
              ].map(item=>(
                <div key={item.label} style={{padding:"20px 16px",textAlign:"center",
                  background:"linear-gradient(135deg,rgba(201,144,31,0.05),rgba(91,139,245,0.05))",
                  border:"1px solid rgba(201,144,31,0.1)",borderRadius:12}}>
                  <div style={{fontSize:24,marginBottom:8}}>{item.icon}</div>
                  <div style={{fontFamily:"Cinzel,serif",fontWeight:700,fontSize:26,
                    color:"#e8b84b",marginBottom:4}}>{item.value}</div>
                  <div style={{fontSize:11,color:"#555",letterSpacing:"0.08em",textTransform:"uppercase"}}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TOP 3 LEADERBOARD ─── */}
        {!statsLoading && stats?.top3 && stats.top3.length > 0 && (
          <div style={{marginBottom:48}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <p style={{fontSize:10,letterSpacing:"0.14em",color:"#e8b84b",
                textTransform:"uppercase",fontFamily:"Rajdhani,sans-serif",fontWeight:700,margin:0}}>
                ─── Top Arena ───
              </p>
              <Link to="/leaderboard" style={{fontSize:12,color:"#555",textDecoration:"none"}}>
                Ver ranking completo →
              </Link>
            </div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              {stats.top3.map((p,i)=>{
                const tier=getRankTier(p.mmr);
                return(
                  <div key={i} style={{flex:"1 1 220px",padding:"16px 20px",
                    background:"rgba(255,255,255,0.03)",
                    border:`1px solid ${i===0?"rgba(232,184,75,0.3)":"rgba(255,255,255,0.06)"}`,
                    borderRadius:10,display:"flex",alignItems:"center",gap:14}}>
                    <div style={{fontSize:24,lineHeight:1}}>{MEDAL[i]}</div>
                    <div>
                      <div style={{fontFamily:"Rajdhani,sans-serif",fontWeight:700,
                        fontSize:15,color:"#e8e8f0",marginBottom:2}}>{p.display_name}</div>
                      <div style={{display:"flex",gap:8,alignItems:"center"}}>
                        <span style={{fontSize:11,color:TIER_COLOR[tier],fontWeight:600}}>{tier}</span>
                        <span style={{fontSize:11,color:"#555"}}>{p.mmr} MMR</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}


        {/* ─── ACTIVIDAD RECIENTE ─── */}
        {!activityLoading && activity.length > 0 && (
          <div style={{marginBottom:40}}>
            <p style={{fontSize:10,letterSpacing:"0.14em",color:"#e8b84b",
              textTransform:"uppercase",fontFamily:"Rajdhani,sans-serif",fontWeight:700,marginBottom:16}}>
              ─── Actividad Reciente ───
            </p>
            <div style={{borderRadius:12,overflow:"hidden",
              border:"1px solid rgba(255,255,255,0.06)",
              background:"rgba(255,255,255,0.02)"}}>
              {activity.map((item,i)=>(
                <div key={item.id} style={{display:"flex",alignItems:"center",gap:12,
                  padding:"10px 16px",
                  borderBottom:i<activity.length-1?"1px solid rgba(255,255,255,0.04)":"none",
                  transition:"background 0.15s"}}
                  onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.03)")}
                  onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                  <span style={{fontSize:16,flexShrink:0}}>{item.icon}</span>
                  <span style={{fontSize:12,color:"rgba(255,255,255,0.6)",flex:1,
                    whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                    {item.text}
                  </span>
                  <span style={{fontSize:10,color:"rgba(255,255,255,0.25)",
                    fontFamily:"IBM Plex Mono,monospace",flexShrink:0,whiteSpace:"nowrap"}}>
                    {timeAgo(item.time)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── FEATURE GRID ─── */}
        <div>
          <p style={{fontSize:10,letterSpacing:"0.14em",color:"#e8b84b",
            textTransform:"uppercase",fontFamily:"Rajdhani,sans-serif",fontWeight:700,marginBottom:16}}>
            ─── Lo que ofrece VEXFORGE ───
          </p>
          <div className="features-grid">
            {FEATURES.map(f=>(
              <Link key={f.href} to={f.href} className="feature-card"
                style={{"--feature-color":f.color} as React.CSSProperties}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:"2px",
                  background:`linear-gradient(90deg,transparent,${f.color}80,transparent)`}}/>
                <div className="feature-card-icon">{f.icon}</div>
                <div className="feature-card-title">{f.title}</div>
                <div className="feature-card-desc">{f.desc}</div>
                <div className="feature-card-arrow">→</div>
              </Link>
            ))}
          </div>
        </div>

        {/* ─── CTA ─── */}
        {!signedIn && (
          <div style={{textAlign:"center",marginTop:72,padding:"60px 24px",
            background:"linear-gradient(135deg,rgba(201,144,31,0.06),rgba(123,79,212,0.06))",
            borderRadius:24,border:"1px solid rgba(201,144,31,0.15)"}}>
            <div className="section-label" style={{justifyContent:"center"}}>¿Listo para forjar?</div>
            <h2 className="section-title" style={{fontSize:"clamp(24px,4vw,42px)",marginBottom:16}}>
              Entra a la <span>Forja</span> hoy
            </h2>
            <p style={{color:"var(--fg-muted)",marginBottom:32,maxWidth:480,margin:"0 auto 32px"}}>
              Regístrate gratis. Sin compras obligatorias. Comienza con cartas básicas y asciende hasta Mythic.
            </p>
            <div className="hero-cta">
              <Link to="/account" className="btn-primary">🔥 Comenzar gratis</Link>
              <Link to="/missions" className="btn-secondary">📜 Ver misiones</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
