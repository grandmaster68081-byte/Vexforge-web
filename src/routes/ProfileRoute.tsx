import { useState } from "react";
import { useProfile } from "../domains/profile/useProfile";
import { SkeletonProfile } from "../shared/components/Skeleton";
import { Link } from "react-router-dom";
import { getRank, tierProgress } from "../lib/rankUtils";

const BG_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/heroes/hero_profile.jpg";
const ROLE_COLOR: Record<string, string> = { founder: "#e8702a", admin: "#a855f7", player: "#3ddc84" };
const ROLE_LABEL: Record<string, string> = { founder: "Founder", admin: "Forgemaster", player: "Forge Player" };
const STATUS_COLOR: Record<string, string> = { active: "#3ddc84", banned: "#e3573f", suspended: "#e8702a" };

export function ProfileRoute() {
const { profile, loading, reason, signedIn } = useProfile();
const [playerRank] = useState<{ mmr: number; wins: number; losses: number; shields: number } | null>(null);
const equippedCosmetics: any[] = [];
return (
  <section>
    <div className="hero-banner" style={{ backgroundImage: `url(${BG_URL})` }}>
      <div className="hero-banner-overlay" style={{ alignItems: "flex-start", padding: "40px 48px" }}>
        <p style={{ fontSize: 11, letterSpacing: "0.14em", color: "var(--ember-gold)", textTransform: "uppercase", fontFamily: '"Rajdhani",sans-serif', fontWeight: 700, marginBottom: 10 }}>─── Forge Identity ───</p>
        <h1 style={{ fontFamily: '"Cinzel Decorative",serif', fontSize: "clamp(2.4rem,5vw,3.8rem)", fontWeight: 900, margin: 0 }}>Profile</h1>
        <p style={{ marginTop: 14, fontSize: 15, color: "var(--fg-muted)", maxWidth: 400 }}>Your legend in the iron realm.</p>
      </div>
    </div>
    <div style={{ padding: "40px 48px 48px", maxWidth: 800 }}>
      {loading ? <SkeletonProfile /> : !signedIn ? (
        <div style={{ textAlign: "center", padding: "60px 24px" }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🔐</div>
          <p style={{ fontFamily: '"Cinzel Decorative",serif', fontSize: 16, color: "var(--ember-gold)", marginBottom: 8 }}>Sign In Required</p>
          <p className="muted" style={{ fontSize: 13, marginBottom: 24 }}>Sign in to view your forge profile.</p>
          <Link to="/account" className="btn btn-primary" style={{ fontSize: 13 }}>Sign In</Link>
        </div>
      ) : !profile ? (
        <p className="muted" style={{ textAlign: "center", padding: "48px 0" }}>{reason ?? "Profile not found."}</p>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "28px 32px", marginBottom: 32, background: "var(--layer-1)", border: "1px solid rgba(201,144,31,0.2)", borderRadius: "var(--radius-lg)" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,rgba(201,144,31,0.3),rgba(201,144,31,0.08))", border: "2px solid rgba(201,144,31,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "var(--ember-gold)", fontFamily: '"Cinzel Decorative",serif', fontWeight: 900, flexShrink: 0 }}>
              {(profile.display_name ?? profile.email ?? "?")[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: '"Cinzel Decorative",serif', fontSize: 22, margin: "0 0 6px" }}>{profile.display_name ?? "Unnamed Forger"}</h2>
              <p className="muted" style={{ fontSize: 13, margin: "0 0 10px" }}>{profile.email}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ padding: "3px 12px", borderRadius: 99, fontSize: 11, fontFamily: '"Rajdhani",sans-serif', fontWeight: 700, letterSpacing: "0.08em", background: `${ROLE_COLOR[profile.role] ?? "#8a8a9e"}20`, color: ROLE_COLOR[profile.role] ?? "#8a8a9e", border: `1px solid ${ROLE_COLOR[profile.role] ?? "#8a8a9e"}40`, textTransform: "uppercase" }}>{ROLE_LABEL[profile.role] ?? profile.role}</span>
                <span style={{ padding: "3px 12px", borderRadius: 99, fontSize: 11, fontFamily: '"Rajdhani",sans-serif', fontWeight: 700, letterSpacing: "0.08em", background: `${STATUS_COLOR[profile.status] ?? "#8a8a9e"}20`, color: STATUS_COLOR[profile.status] ?? "#8a8a9e", border: `1px solid ${STATUS_COLOR[profile.status] ?? "#8a8a9e"}40`, textTransform: "uppercase" }}>{profile.status ?? "active"}</span>
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p style={{ fontSize: 11, color: "var(--fg-muted)", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: '"Rajdhani",sans-serif', marginBottom: 4 }}>Member since</p>
              <p style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 13 }}>{profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}</p>
            </div>
          </div>
          {/* ── Rank Badge Section ── */}
            {playerRank && (() => {
              const tier = getRank(playerRank.mmr);
              const prog = tierProgress(playerRank.mmr);
              return (
                <div style={{background:"var(--layer-1)",border:`1px solid ${tier.color}44`,borderRadius:12,
                  padding:"16px 20px",marginBottom:20,display:"flex",alignItems:"center",gap:16}}>
                  <div style={{textAlign:"center",minWidth:54}}>
                    <div style={{fontSize:36}}>{tier.icon}</div>
                    <div style={{color:tier.color,fontWeight:800,fontSize:10,letterSpacing:"0.08em",marginTop:3}}>
                      {tier.name.toUpperCase()}
                    </div>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                      <span style={{color:"#e8e8f0",fontWeight:700,fontSize:14}}>{playerRank.mmr} MMR</span>
                      <span style={{color:"#555",fontSize:10}}>{playerRank.wins}W · {playerRank.losses}L</span>
                    </div>
                    <div style={{background:"#1a1a2e",borderRadius:20,height:5,overflow:"hidden"}}>
                      <div style={{width:`${prog}%`,height:"100%",background:`linear-gradient(90deg,${tier.color}88,${tier.color})`,transition:"width 0.6s"}}/>
                    </div>
                    {playerRank.shields > 0 && (
                      <div style={{marginTop:5,display:"flex",gap:3,alignItems:"center"}}>
                        {Array.from({length:playerRank.shields}).map((_,i)=><span key={i} style={{fontSize:11}}>🛡️</span>)}
                        <span style={{color:"#a855f7",fontSize:8,fontWeight:700}}>SHIELDS</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* ── Equipped Cosmetics ── */}
            {equippedCosmetics.length > 0 && (
              <>
                <h2 className="forge-section-header">✨ Loadout activo</h2>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8,marginBottom:20}}>
                  {equippedCosmetics.map((ec:any) => {
                    const cos = ec.cosmetics as any;
                    return (
                      <div key={ec.slot} style={{background:"var(--layer-1)",border:"1px solid rgba(255,255,255,0.06)",
                        borderRadius:10,padding:"12px 14px"}}>
                        <div style={{color:"#555",fontSize:9,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>
                          {ec.slot.replace(/_/g," ")}
                        </div>
                        <div style={{color:"#e8e8f0",fontWeight:600,fontSize:13}}>
                          {cos?.name ?? ec.cosmetic_id?.substring(0,8)}
                        </div>
                        {cos?.rarity && (
                          <div style={{color:"#e8b84b",fontSize:9,marginTop:3,fontWeight:700}}>
                            {cos.rarity.toUpperCase()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <h2 className="forge-section-header">Your Forge</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10 }}>
            {[{ to: "/progress", icon: "📈", label: "Progress", desc: "XP, level, stats" }, { to: "/economy", icon: "💰", label: "Economy", desc: "Wallet & ledger" }, { to: "/inventory", icon: "🎒", label: "Inventory", desc: "Your items" }, { to: "/cards", icon: "🃏", label: "Cards", desc: "Your collection" }, { to: "/settings", icon: "⚙️", label: "Settings", desc: "Preferences" }].map(link => (
              <Link key={link.to} to={link.to} style={{ textDecoration: "none" }}>
                <div style={{ padding: "18px 20px", borderRadius: "var(--radius-lg)", background: "var(--layer-1)", border: "1px solid rgba(255,255,255,0.06)", transition: "border-color 0.18s" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(201,144,31,0.3)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}>
                  <span style={{ fontSize: 22, display: "block", marginBottom: 8 }}>{link.icon}</span>
                  <p style={{ fontFamily: '"Rajdhani",sans-serif', fontWeight: 700, fontSize: 14, margin: "0 0 3px" }}>{link.label}</p>
                  <p className="muted" style={{ fontSize: 12, margin: 0 }}>{link.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  </section>
);
}