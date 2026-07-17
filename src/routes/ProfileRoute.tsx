import { useProfile } from "../domains/profile/useProfile";
import { SkeletonProfile } from "../shared/components/Skeleton";
import { Link } from "react-router-dom";

const BG_URL =
"https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/heroes/hero_profile.jpg";

const ROLE_COLOR: Record<string, string> = {
founder: "#e8702a",
admin:   "#a855f7",
player:  "#3ddc84",
};

export function ProfileRoute() {
const { profile, loading, reason, signedIn } = useProfile();

const memberSince = profile?.created_at
  ? new Date(profile.created_at).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    })
  : null;

return (
  <section>
    <div className="hero-banner" style={{ backgroundImage: `url(${BG_URL})` }}>
      <div className="hero-banner-overlay">
        <h1>Profile</h1>
      </div>
    </div>

    {loading && <SkeletonProfile />}

    {!loading && !signedIn && (
      <div className="empty-state">
        <p>You are not signed in.</p>
        <p className="muted">
          <Link to="/account">Go to Account</Link> to sign in.
        </p>
      </div>
    )}

    {!loading && signedIn && !profile && reason && (
      <div className="empty-state">
        <p className="muted">{reason}</p>
      </div>
    )}

    {!loading && profile && (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── Avatar card ── */}
        <div className="profile-card">
          <div className="profile-avatar-ring">
            <span className="profile-avatar-letter">
              {(profile.display_name ?? profile.email ?? "?")[0].toUpperCase()}
            </span>
          </div>
          <div className="profile-info">
            <h2 style={{ marginBottom: 8 }}>
              {profile.display_name ?? profile.email ?? profile.id}
            </h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span
                className="mission-tag"
                style={{
                  color: ROLE_COLOR[profile.role] ?? "#e8e8e8",
                  borderColor: (ROLE_COLOR[profile.role] ?? "#ffffff22") + "55",
                }}
              >
                {profile.role}
              </span>
              <span className="mission-tag">{profile.status}</span>
            </div>
          </div>
        </div>

        {/* ── Details grid ── */}
        <div>
          <h2 style={{ marginBottom: 14 }}>Details</h2>
          <div className="profile-details-grid">
            {memberSince && (
              <div className="profile-detail-row">
                <span className="muted" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Member Since
                </span>
                <span style={{ fontSize: 14 }}>{memberSince}</span>
              </div>
            )}
            <div className="profile-detail-row">
              <span className="muted" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Role
              </span>
              <span style={{ fontSize: 14, color: ROLE_COLOR[profile.role] ?? "#e8e8e8", fontWeight: 600 }}>
                {profile.role}
              </span>
            </div>
            <div className="profile-detail-row">
              <span className="muted" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Account Status
              </span>
              <span style={{ fontSize: 14 }}>{profile.status}</span>
            </div>
            {profile.email && (
              <div className="profile-detail-row">
                <span className="muted" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Email
                </span>
                <span style={{ fontSize: 14 }}>{profile.email}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    )}
  </section>
);
}
