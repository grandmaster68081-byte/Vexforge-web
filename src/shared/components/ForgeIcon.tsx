import type { CSSProperties } from "react";

export type ForgeIconName =
  | "home"
  | "cards"
  | "collection"
  | "missions"
  | "quests"
  | "arena"
  | "deck"
  | "raid"
  | "boss"
  | "season"
  | "rankings"
  | "lore"
  | "relics"
  | "packs"
  | "shop"
  | "market"
  | "fusion"
  | "evolution"
  | "deposit"
  | "withdrawal"
  | "clans"
  | "friends"
  | "leaderboard"
  | "achievements"
  | "profile"
  | "economy"
  | "progress"
  | "cosmetics"
  | "referral"
  | "nft"
  | "ads"
  | "settings"
  | "account"
  | "assets"
  | "admin"
  | "signout"
  | "more"
  | "attack"
  | "shield"
  | "crown"
  | "warning"
  | "energy"
  | "coin"
   | "volume-on"
   | "volume-off"
  | "spark"
  | "skull"
  | "refresh"
  | "lock"
  | "trophy"
  | "check"
  | "heart"
  | "target"
  | "play"
  | "pause"
  | "notification"
  | "close"
  | "chevron-left"
  | "chevron-right"
  | "mail"
  | "gift"
  | "helmet"
  | "chestplate"
  | "ring"
  | "banner"
  | "amulet"
  | "map";

type ForgeIconProps = {
  name: ForgeIconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
};

const common = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function ForgeIcon({
  name,
  size = 16,
  strokeWidth = 1.7,
  className,
  style,
}: ForgeIconProps) {
  const props = {
    ...common,
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
    focusable: false,
    className,
    style,
    strokeWidth,
  };

  switch (name) {
    case "attack":
      return <svg {...props}><path d="m4 20 7.4-7.4M13.6 10.4 20 4l-1.8 5.4L13 11.2z" /><path d="m5.5 5.5 4 4M4 9l1.5-3.5L9 4" /></svg>;
    case "shield":
      return <svg {...props}><path d="M12 3 20 6v5.8c0 4.4-3.2 7.4-8 9.2-4.8-1.8-8-4.8-8-9.2V6z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></svg>;
    case "crown":
      return <svg {...props}><path d="m4 7 4 3 4-6 4 6 4-3-1.5 11H5.5z" /><path d="M6 21h12M7 17.5h10" /></svg>;
    case "warning":
      return <svg {...props}><path d="m12 3 9 17H3z" /><path d="M12 9v4M12 17h.1" /></svg>;
    case "energy":
      return <svg {...props}><path d="m13 2-8 12h6l-1 8 8-12h-6z" /></svg>;
    case "coin":
      return <svg {...props}><circle cx="12" cy="12" r="8.5" /><path d="M14.6 8.2c-.7-.8-1.5-1.2-2.7-1.2-1.5 0-2.5.8-2.5 1.9 0 3.1 5.8 1.3 5.8 4.4 0 1.3-1.1 2.2-2.8 2.2-1.2 0-2.3-.4-3.1-1.4M12 5.5v13" /></svg>;
    case "volume-on":
      return <svg {...props}><path d="M4 10v4h3l4 3V7l-4 3z" /><path d="M15 9.5a4 4 0 0 1 0 5M17.5 7a7 7 0 0 1 0 10" /></svg>;
    case "volume-off":
      return <svg {...props}><path d="M4 10v4h3l4 3V7l-4 3z" /><path d="m16 10 5 5M21 10l-5 5" /></svg>;
    case "spark":
      return <svg {...props}><path d="m12 3 2.1 5.8L20 11l-5.9 2.2L12 19l-2.1-5.8L4 11l5.9-2.2z" /><path d="m19 3 .6 2.1L22 6l-2.4.9L19 9l-.6-2.1L16 6l2.4-.9z" /></svg>;
    case "skull":
      return <svg {...props}><path d="M5 10.5a7 7 0 1 1 14 0c0 2.7-1.4 4.6-3.4 5.8V20H8.4v-3.7C6.4 15.1 5 13.2 5 10.5Z" /><path d="M8.5 10h.1M15.5 10h.1M9 14c1.8 1.1 4.2 1.1 6 0M9 20v-2M12 20v-2M15 20v-2" /></svg>;
    case "refresh":
      return <svg {...props}><path d="M20 11a8 8 0 0 0-14.8-3L3 11M4 5v6h6M4 13a8 8 0 0 0 14.8 3L21 13M20 19v-6h-6" /></svg>;
    case "lock":
      return <svg {...props}><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></svg>;
    case "trophy":
      return <svg {...props}><path d="M7 4h10v5.5c0 3.2-2.1 5.5-5 6.4-2.9-.9-5-3.2-5-6.4z" /><path d="M7 6H4v2c0 2.2 1.2 3.8 3.3 4.4M17 6h3v2c0 2.2-1.2 3.8-3.3 4.4M12 16v4M8.5 21h7" /></svg>;
    case "check":
      return <svg {...props}><path d="m5 12 4.2 4.2L19 6.5" /></svg>;
    case "heart":
      return <svg {...props}><path d="M20.5 8.8c0 5.2-8.5 10.2-8.5 10.2S3.5 14 3.5 8.8A4.3 4.3 0 0 1 12 6.6a4.3 4.3 0 0 1 8.5 2.2Z" /></svg>;
    case "target":
      return <svg {...props}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.2" /><circle cx="12" cy="12" r="1" /></svg>;
    case "play":
      return <svg {...props}><path d="m8 5 10 7-10 7z" /></svg>;
    case "pause":
      return <svg {...props}><path d="M8 5v14M16 5v14" /></svg>;
    case "notification":
      return <svg {...props}><path d="M6.5 10.5a5.5 5.5 0 0 1 11 0c0 4 1.5 5.2 2.3 6.2H4.2c.8-1 2.3-2.2 2.3-6.2Z" /><path d="M10 20h4M9.5 17a2.5 2.5 0 0 0 5 0" /></svg>;
    case "close":
      return <svg {...props}><path d="m6 6 12 12M18 6 6 18" /></svg>;
    case "chevron-left":
      return <svg {...props}><path d="m15 5-7 7 7 7" /></svg>;
    case "chevron-right":
      return <svg {...props}><path d="m9 5 7 7-7 7" /></svg>;
    case "home":
      return <svg {...props}><path d="m3.5 10.7 8.5-7 8.5 7" /><path d="M5.5 9.3v10.4h13V9.3M9.2 19.7v-5.2h5.6v5.2" /><path d="M12 6.2v1.9" /></svg>;
    case "cards":
      return <svg {...props}><path d="m6.5 3.8 11.2 2.7a1.5 1.5 0 0 1 1.1 1.8l-2.5 10.3a1.5 1.5 0 0 1-1.8 1.1L3.3 17a1.5 1.5 0 0 1-1.1-1.8L4.7 5a1.5 1.5 0 0 1 1.8-1.2Z" /><path d="m8.1 8.4 4.5 1.1M7.2 12l6.6 1.6M9.6 15.7l2.8.7" /><path d="m15.8 6.9-1.7 2.9-2.7.2 2 1.8-.6 2.7 2.4-1.4 2.4 1.4-.6-2.7 2-1.8-2.7-.2-1.1-2.9Z" /></svg>;
    case "collection":
      return <svg {...props}><rect x="3" y="5" width="13" height="15" rx="1.5" /><path d="M7 5V3.5h12a1.5 1.5 0 0 1 1.5 1.5v13H19M6.5 9h6M6.5 12h6M6.5 15h3.5" /><path d="M16.7 9.5v4M14.7 11.5h4" /></svg>;
    case "missions":
      return <svg {...props}><rect x="5" y="3.5" width="14" height="17" rx="1.7" /><path d="M9 3.5v-1h6v1M8.5 8.5h7M8.5 12h7M8.5 15.5h4" /><path d="m4 8.5-1.2 1.2 1.2 1.2M20 13l1.2 1.2-1.2 1.2" /></svg>;
    case "quests":
      return <svg {...props}><path d="M6 3.5h12v17H6z" /><path d="M9 3.5v-2M15 3.5v-2M9 8h6M9 11.5h6M9 15h3" /><path d="m14.5 16.5 1.2 1.2 2.7-3" /></svg>;
    case "arena":
      return <svg {...props}><path d="m3.5 5.5 5.8 5.8M14.7 12.7l5.8 5.8M9.4 4.2 19.8 14.6l-5.2 5.2L4.2 9.4z" /><path d="m6.3 17.7-2 2M17.7 6.3l2-2M8 8l-2.8-2.8M16 16l2.8 2.8" /></svg>;
    case "deck":
      return <svg {...props}><path d="M5.2 4.1 17 2.5l2 14.6-11.8 1.6z" /><path d="m4.4 7.4-1.7.3 2 14 10.4-1.4M8.2 8l6.2-.8M8.7 11.5l4.7-.7" /><path d="m13.9 12.3 1.1 2.2 2.4.3-1.8 1.7.5 2.4-2.2-1.2-2.2 1.2.5-2.4-1.8-1.7 2.4-.3z" /></svg>;
    case "raid":
      return <svg {...props}><path d="m4 18 6.2-6.2M9.8 7.6l6.6 6.6M12 3.5v4M5.6 6.2l2.8 2.8M18.4 6.2l-2.8 2.8M3.5 12h4" /><path d="M12 10.4 19.5 18l-3.5 3.5L8.5 14z" /><path d="m17.2 15.7 3.3-3.3 1.1 1.1-3.3 3.3" /></svg>;
    case "boss":
      return <svg {...props}><path d="m5.2 9.2-2.7-3 4.6.3L9.5 3l2.5 3 2.5-3 2.4 3.5 4.6-.3-2.7 3v5.2c0 3.6-3 6.1-6.8 6.1s-6.8-2.5-6.8-6.1z" /><path d="M8.3 13.4h.1M15.6 13.4h.1M9.2 16.2c1.8 1.1 3.8 1.1 5.6 0" /></svg>;
    case "season":
      return <svg {...props}><path d="m12 2.8 2 5.8 6.1.1-4.9 3.7 1.8 5.9-5-3.5-5 3.5 1.8-5.9-4.9-3.7 6.1-.1z" /><path d="M12 19v2.2M8.3 21.2h7.4" /></svg>;
    case "rankings":
      return <svg {...props}><path d="M4 20V11h4v9M10 20V5h4v15M16 20V8h4v12" /><path d="M3 20.5h18M5 7.5l4-3 3 1.2 5-3" /></svg>;
    case "lore":
      return <svg {...props}><path d="M4 4.2c2.8-1.1 5.4-.8 8 1v15c-2.6-1.8-5.2-2.1-8-1zM20 4.2c-2.8-1.1-5.4-.8-8 1v15c2.6-1.8 5.2-2.1 8-1z" /><path d="M12 5.2v15M6.5 8.2h2M15.5 8.2h2M6.5 11.5h2M15.5 11.5h2" /></svg>;
    case "relics":
      return <svg {...props}><path d="m12 2.8 2.1 5.1 5.1 2.1-5.1 2.1-2.1 5.1-2.1-5.1-5.1-2.1 5.1-2.1z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8zM5 3l.7 1.8L7.5 5l-1.8.7L5 7.5l-.7-1.8L2.5 5l1.8-.7z" /></svg>;
    case "packs":
      return <svg {...props}><path d="m4 7 8-4 8 4-8 4zM4 7v10l8 4 8-4V7M12 11v10M8 5l8 4" /><path d="m17.5 11.2.6 1.5 1.6.1-1.2 1 .4 1.6-1.4-.9-1.4.9.4-1.6-1.2-1 1.6-.1z" /></svg>;
    case "shop":
      return <svg {...props}><path d="M4 9.2v10.3h16V9.2M3 9.2h18l-1.5-5H4.5zM8 9.2v2.2M12 9.2v2.2M16 9.2v2.2" /><path d="M8 19.5v-5h8v5" /></svg>;
    case "market":
      return <svg {...props}><path d="M3 20h18M5 20V9h14v11M3.5 9 5 4h14l1.5 5M8 9a2.5 2.5 0 0 0 4 0 2.5 2.5 0 0 0 4 0" /><path d="M9 13h6M9 16h4" /></svg>;
    case "fusion":
      return <svg {...props}><path d="m12 3 2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z" /><path d="m19 3 .7 2.3L22 6l-2.3.7L19 9l-.7-2.3L16 6l2.3-.7zM5 16l.7 2.3L8 19l-2.3.7L5 22l-.7-2.3L2 19l2.3-.7z" /></svg>;
    case "evolution":
      return <svg {...props}><path d="M5 19.5 9.5 15l3 3L21 9.5M15 9.5h6v6" /><path d="M3 5.5h7v4H3zM3 9.5l3.5-2 3.5 2" /><path d="M14 4.5h6M17 2.5v4" /></svg>;
    case "deposit":
      return <svg {...props}><path d="M4 4.5h16v15H4zM8 8.5h8M8 12h5" /><path d="M12 22V13M8.5 16.5 12 13l3.5 3.5" /></svg>;
    case "withdrawal":
      return <svg {...props}><path d="M4 4.5h16v15H4zM8 8.5h8M8 12h5" /><path d="M12 22v-9M8.5 16.5 12 20l3.5-3.5" /></svg>;
    case "clans":
      return <svg {...props}><path d="M12 3 20 6v5.8c0 4.4-3.2 7.4-8 9.2-4.8-1.8-8-4.8-8-9.2V6z" /><path d="m12 7 1.2 2.8 3 .3-2.2 2 0.6 3-2.6-1.5-2.6 1.5.6-3-2.2-2 3-.3z" /></svg>;
    case "friends":
      return <svg {...props}><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.3" /><path d="M3.5 20c.3-3.5 2.2-5.2 5.5-5.2s5.2 1.7 5.5 5.2M15 14.5c2.9-.1 4.6 1.5 5 4.5" /><path d="M16 4v4M14 6h4" /></svg>;
    case "leaderboard":
      return <svg {...props}><path d="M5 19V10h4v9M10 19V5h4v14M15 19v-7h4v7" /><path d="M3 21h18M6.5 7 10 4l2.7 1.3 4.8-3" /><path d="m18 2.3.5 1.4 1.5.5-1.5.5-.5 1.4-.5-1.4-1.5-.5 1.5-.5z" /></svg>;
    case "achievements":
      return <svg {...props}><path d="M7 3h10v5.6c0 3.2-2.1 5.5-5 6.4-2.9-.9-5-3.2-5-6.4z" /><path d="M7 5H4v2.2c0 2.2 1.2 3.8 3.3 4.4M17 5h3v2.2c0 2.2-1.2 3.8-3.3 4.4M12 15v4M8.5 21h7" /><path d="m12 5.2.8 1.7 1.9.3-1.4 1.3.3 1.9-1.6-.9-1.6.9.3-1.9-1.4-1.3 1.9-.3z" /></svg>;
    case "profile":
      return <svg {...props}><circle cx="12" cy="8" r="3.5" /><path d="M4.5 21c.5-4.2 3-6.3 7.5-6.3s7 2.1 7.5 6.3" /><path d="M4 4.5h2M18 4.5h2" /></svg>;
    case "economy":
      return <svg {...props}><circle cx="12" cy="12" r="8.5" /><path d="M14.6 8.2c-.7-.8-1.5-1.2-2.7-1.2-1.5 0-2.5.8-2.5 1.9 0 3.1 5.8 1.3 5.8 4.4 0 1.3-1.1 2.2-2.8 2.2-1.2 0-2.3-.4-3.1-1.4M12 5.5v13" /></svg>;
    case "progress":
      return <svg {...props}><path d="M4 20V9h4v11M10 20V4h4v16M16 20v-7h4v7" /><path d="M3 20.5h18M5 6l3-2 3 1 5-3" /></svg>;
    case "cosmetics":
      return <svg {...props}><path d="m4 16 8-12 8 12-8 5z" /><path d="M8.2 10.5h7.6M6.3 13.5h11.4" /><path d="M12 4v17" /></svg>;
    case "referral":
      return <svg {...props}><circle cx="7" cy="7" r="2.5" /><circle cx="17" cy="17" r="2.5" /><path d="m9 9 6 6M15 7h4v4M9 17H5v-4" /></svg>;
    case "nft":
      return <svg {...props}><path d="m12 2.8 8 4.6v9.2l-8 4.6-8-4.6V7.4z" /><path d="m4 7.4 8 4.6 8-4.6M12 12v9.2M8.5 5l7 4" /><path d="M9.7 14.2h4.6v3H9.7z" /></svg>;
    case "ads":
      return <svg {...props}><path d="M4 5.5h12a2 2 0 0 1 2 2v9H4zM18 10h2.5v4H18" /><path d="m7 9 5 3-5 3zM7 19v2M12 19v2" /></svg>;
    case "settings":
      return <svg {...props}><path d="m9.2 4.2.7-1.5h4.2l.7 1.5 1.5.9 1.6-.3 2.1 3.6-1.1 1.2v1.8l1.1 1.2-2.1 3.6-1.6-.3-1.5.9-.7 1.5H9.9l-.7-1.5-1.5-.9-1.6.3L4 13.4l1.1-1.2v-1.8L4 9.2l2.1-3.6 1.6.3z" /><circle cx="12" cy="11.3" r="2.7" /></svg>;
    case "account":
      return <svg {...props}><circle cx="12" cy="8" r="3" /><path d="M5 20c.5-3.4 2.8-5.2 7-5.2s6.5 1.8 7 5.2M4 5.5h2M18 5.5h2" /><path d="M3 3.5h3v3M21 3.5h-3v3" /></svg>;
    case "assets":
      return <svg {...props}><path d="M3.5 5.5h7l1.7 2h8.3v12h-17z" /><path d="m6.5 16 3.1-3.3 2.2 2.2 1.6-1.7 3.9 2.8" /><circle cx="8" cy="10" r="1" /></svg>;
    case "admin":
      return <svg {...props}><path d="m12 3 2 4.5 4.8.5-3.6 3.1 1 4.7-4.2-2.4-4.2 2.4 1-4.7-3.6-3.1 4.8-.5z" /><path d="M12 15v6M9 21h6" /></svg>;
    case "signout":
      return <svg {...props}><path d="M14 4H5v16h9M11 12h10M17 8l4 4-4 4" /></svg>;
    case "mail":
      return <svg {...props}><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="m3.6 7 8.4 6 8.4-6" /></svg>;
    case "gift":
      return <svg {...props}><rect x="3.5" y="9" width="17" height="11" rx="1.5" /><path d="M2.5 9h19v3.2h-19zM12 9v11" /><path d="M12 9C10.6 6.4 9.4 5 8 5a2 2 0 0 0 0 4M12 9c1.4-2.6 2.6-4 4-4a2 2 0 0 1 0 4" /></svg>;
    case "helmet":
      return <svg {...props}><path d="M5 13a7 7 0 0 1 14 0v5H5z" /><path d="M5 18h14v2.5H5zM9 13v5M15 13v5M12 6.2V3.5" /></svg>;
    case "chestplate":
      return <svg {...props}><path d="M6 4.5 12 7l6-2.5 1.5 5-2 1.5v6.5L12 21l-5.5-3.5V11l-2-1.5z" /><path d="M12 7v14M9 11h6" /></svg>;
    case "ring":
      return <svg {...props}><circle cx="12" cy="15" r="5.5" /><path d="m9.6 9.8 2.4-4 2.4 4" /><path d="m12 2.5 1.6 2.4L12 7.3 10.4 4.9z" /></svg>;
    case "banner":
      return <svg {...props}><path d="M6 3.5v17M6 4.5h12l-2.5 4 2.5 4H6" /><path d="M6 21.5h4" /></svg>;
    case "amulet":
      return <svg {...props}><path d="M7 3.5c-1.6 3.2-2.5 5.6-2.5 7.5M17 3.5c1.6 3.2 2.5 5.6 2.5 7.5" /><path d="M12 21a5.5 5.5 0 0 0 5.5-5.5c0-2-1-3.6-2.5-4.5h-6c-1.5.9-2.5 2.5-2.5 4.5A5.5 5.5 0 0 0 12 21Z" /><path d="M12 13.5v4M10 15.5h4" /></svg>;
    case "map":
      return <svg {...props}><path d="m3.5 6.5 5.5-2.5 6 2.5 5.5-2.5v13.5L15 20l-6-2.5L3.5 20z" /><path d="M9 4v13.5M15 6.5V20" /></svg>;
    case "more":
      return <svg {...props}><path d="M5 7h14M5 12h14M5 17h14" /></svg>;
  }
}