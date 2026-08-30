import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/**
 * Native rendering of the web ForgeIcon language.
 *
 * The Android app used to import Feather/Ionicons for convenience. Those
 * libraries are system-like icon sets and make the mobile surface feel
 * disconnected from the official VEXFORGE identity. This component keeps the
 * existing screen contracts intact while rendering the same authored
 * silhouettes used by the web product.
 */
type ForgeIconProps = {
  name: string;
  size?: number;
  color?: string;
  tintColor?: string;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
};

const GLYPH_MAP = {
  account: 1,
  achievements: 1,
  activity: 1,
  ads: 1,
  admin: 1,
  'alert-circle': 1,
  'alert-circle-outline': 1,
  'alert-triangle': 1,
  'albums-outline': 1,
  'arrow-back': 1,
  'arrow-down': 1,
  'arrow-down-outline': 1,
  'arrow-forward': 1,
  'arrow-forward-circle-outline': 1,
  'arrow-forward-outline': 1,
  'arrow-right': 1,
  'arrow-up': 1,
  'arrow-up-circle-outline': 1,
  'arrow-up-outline': 1,
  arena: 1,
  assets: 1,
  attack: 1,
  award: 1,
  banner: 1,
  boss: 1,
  card: 1,
  cards: 1,
  chain: 1,
  check: 1,
  'check-circle': 1,
  'checkmark-circle': 1,
  'checkmark-circle-outline': 1,
  'chevron-forward': 1,
  'chevron-left': 1,
  'chevron-right': 1,
  clans: 1,
  close: 1,
  'close-circle-outline': 1,
  cloud: 1,
  'cloud-outline': 1,
  coin: 1,
  collection: 1,
  columns: 1,
  compass: 1,
  'compass-outline': 1,
  cosmetics: 1,
  'color-palette-outline': 1,
  crosshair: 1,
  crown: 1,
  'cube-outline': 1,
  deck: 1,
  deposit: 1,
  diamond: 1,
  'diamond-outline': 1,
  economy: 1,
  ellipse: 1,
  'ellipse-outline': 1,
  energy: 1,
  evolution: 1,
  flame: 1,
  flash: 1,
  'flash-outline': 1,
  'flag-outline': 1,
  flux: 1,
  friends: 1,
  fusion: 1,
  gear: 1,
  gem: 1,
  gift: 1,
  globe: 1,
  'globe-outline': 1,
  heart: 1,
  home: 1,
  'home-outline': 1,
  hourglass: 1,
  house: 1,
  inbox: 1,
  key: 1,
  'key-outline': 1,
  layers: 1,
  'layers-outline': 1,
  leaderboard: 1,
  ledger: 1,
  loader: 1,
  lock: 1,
  'lock-closed-outline': 1,
  'log-out-outline': 1,
  'logo-bitcoin': 1,
  lore: 1,
  mail: 1,
  map: 1,
  market: 1,
  medal: 1,
  'medal-outline': 1,
  missions: 1,
  more: 1,
  nft: 1,
  notification: 1,
  notifications: 1,
  'notifications-outline': 1,
  packs: 1,
  pause: 1,
  person: 1,
  'person-outline': 1,
  play: 1,
  profile: 1,
  progress: 1,
  quests: 1,
  raid: 1,
  radio: 1,
  'radio-button-off-outline': 1,
  'radio-outline': 1,
  rankings: 1,
  refresh: 1,
  'refresh-outline': 1,
  relics: 1,
  resonance: 1,
  ribbon: 1,
  'ribbon-outline': 1,
  save: 1,
  search: 1,
  season: 1,
  settings: 1,
  shield: 1,
  'shield-checkmark-outline': 1,
  'shield-half-outline': 1,
  'shield-outline': 1,
  signout: 1,
  skull: 1,
  spark: 1,
  'sparkles-outline': 1,
  star: 1,
  'storefront-outline': 1,
  shop: 1,
  target: 1,
  'trending-up-outline': 1,
  trophy: 1,
  'trophy-outline': 1,
  user: 1,
  'volume-off': 1,
  'volume-on': 1,
  wallet: 1,
  'wallet-outline': 1,
  warning: 1,
  'warning-outline': 1,
  withdrawal: 1,
  x: 1,
  'x-circle': 1,
  zap: 1,
} as const;

export type ForgeIconName = keyof typeof GLYPH_MAP;

const ALIASES: Partial<Record<ForgeIconName, ForgeIconName>> = {
  activity: 'resonance',
  'alert-circle': 'warning',
  'alert-circle-outline': 'warning',
  'alert-triangle': 'warning',
  'albums-outline': 'collection',
  'arrow-back': 'chevron-left',
  'arrow-forward': 'chevron-right',
  'arrow-forward-circle-outline': 'chevron-right',
  'arrow-forward-outline': 'chevron-right',
  'arrow-right': 'chevron-right',
  'arrow-down-outline': 'arrow-down',
  'arrow-up-circle-outline': 'arrow-up',
  'arrow-up-outline': 'arrow-up',
  award: 'achievements',
  check: 'check',
  'check-circle': 'check',
  'checkmark-circle': 'check',
  'checkmark-circle-outline': 'check',
  'chevron-forward': 'chevron-right',
  'close-circle-outline': 'close',
  'cloud-outline': 'resonance',
  columns: 'deck',
  'color-palette-outline': 'cosmetics',
  compass: 'map',
  'compass-outline': 'map',
  'crosshair': 'target',
  'cube-outline': 'packs',
  diamond: 'gem',
  'diamond-outline': 'gem',
  'ellipse-outline': 'spark',
  'flash': 'attack',
  'flash-outline': 'attack',
  'flag-outline': 'banner',
  'git-merge-outline': 'fusion',
  globe: 'map',
  'globe-outline': 'map',
  home: 'home',
  'home-outline': 'home',
  house: 'home',
  inbox: 'collection',
  key: 'key',
  'key-outline': 'key',
  layers: 'collection',
  'layers-outline': 'collection',
  loader: 'refresh',
  lock: 'lock',
  'lock-closed-outline': 'lock',
  'log-out-outline': 'signout',
  'logo-bitcoin': 'coin',
  medal: 'achievements',
  'medal-outline': 'achievements',
  notifications: 'notification',
  'notifications-outline': 'notification',
  person: 'profile',
  'person-outline': 'profile',
  radio: 'resonance',
  'radio-button-off-outline': 'target',
  'radio-outline': 'resonance',
  'refresh-outline': 'refresh',
  'ribbon-outline': 'achievements',
  save: 'check',
  search: 'search',
  shield: 'shield',
  'shield-checkmark-outline': 'shield',
  'shield-half-outline': 'shield',
  'shield-outline': 'shield',
  'sparkles-outline': 'spark',
  'storefront-outline': 'shop',
  'target': 'target',
  'trending-up-outline': 'arrow-up',
  trophy: 'trophy',
  'trophy-outline': 'trophy',
  user: 'profile',
  'wallet-outline': 'wallet',
  'warning-outline': 'warning',
  x: 'close',
  'x-circle': 'close',
  zap: 'attack',
};

function IconBody({ name, color, strokeWidth }: { name: string; color: string; strokeWidth: number }) {
  const pathProps = {
    fill: 'none' as const,
    stroke: color,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth,
  };
  const icon = ALIASES[name] ?? name;

  switch (icon) {
    case 'wallet':
      return <><Path {...pathProps} d="M3.5 7.5A2 2 0 0 1 5.5 5.5h11.8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2z" /><Path {...pathProps} d="M19.3 10.5h1.9v3h-1.9a1.5 1.5 0 0 1 0-3zM6.5 5.5 15 2.8l1.2 2.7" /></>;
    case 'gem':
      return <><Path {...pathProps} d="m12 3.2 6.6 5.1-6.6 12.5L5.4 8.3z" /><Path {...pathProps} d="M5.4 8.3h13.2M12 3.2 8.9 8.3 12 20.8 15.1 8.3z" /></>;
    case 'flame':
      return <Path {...pathProps} d="M12 3.2c3.6 3.4 5.6 6.3 5.6 9.4a5.6 5.6 0 1 1-11.2 0c0-1.7.7-3.3 2-4.9.5 1.3 1.2 2.1 2.1 2.4-.3-2.4.2-4.7 1.5-6.9z" />;
    case 'resonance':
      return <><Path {...pathProps} d="M12 6v12M8.4 8.6v6.8M16 8.6v6.8M4.8 10.7v2.6M19.6 10.7v2.6" /></>;
    case 'search':
      return <><Circle {...pathProps} cx="10.8" cy="10.8" r="6.3" /><Path {...pathProps} d="m15.4 15.4 4.4 4.4" /></>;
    case 'arrow-up':
      return <Path {...pathProps} d="M12 20V4M6 10l6-6 6 6" />;
    case 'arrow-down':
      return <Path {...pathProps} d="M12 4v16M6 14l6 6 6-6" />;
    case 'star':
      return <Path {...pathProps} d="m12 3.2 2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 17.1l-5.6 3.1 1.3-6.2L3 9.7l6.3-.7z" />;
    case 'attack':
      return <><Path {...pathProps} d="m4 20 7.4-7.4M13.6 10.4 20 4l-1.8 5.4L13 11.2z" /><Path {...pathProps} d="m5.5 5.5 4 4M4 9l1.5-3.5L9 4" /></>;
    case 'shield':
      return <><Path {...pathProps} d="M12 3 20 6v5.8c0 4.4-3.2 7.4-8 9.2-4.8-1.8-8-4.8-8-9.2V6z" /><Path {...pathProps} d="m8.5 12 2.2 2.2 4.8-5" /></>;
    case 'crown':
      return <><Path {...pathProps} d="m4 7 4 3 4-6 4 6 4-3-1.5 11H5.5z" /><Path {...pathProps} d="M6 21h12M7 17.5h10" /></>;
    case 'warning':
      return <><Path {...pathProps} d="m12 3 9 17H3z" /><Path {...pathProps} d="M12 9v4M12 17h.1" /></>;
    case 'energy':
      return <Path {...pathProps} d="m13 2-8 12h6l-1 8 8-12h-6z" />;
    case 'coin':
      return <><Circle {...pathProps} cx="12" cy="12" r="8.5" /><Path {...pathProps} d="M14.6 8.2c-.7-.8-1.5-1.2-2.7-1.2-1.5 0-2.5.8-2.5 1.9 0 3.1 5.8 1.3 5.8 4.4 0 1.3-1.1 2.2-2.8 2.2-1.2 0-2.3-.4-3.1-1.4M12 5.5v13" /></>;
    case 'spark':
      return <><Path {...pathProps} d="m12 3 2.1 5.8L20 11l-5.9 2.2L12 19l-2.1-5.8L4 11l5.9-2.2z" /><Path {...pathProps} d="m19 3 .6 2.1L22 6l-2.4.9L19 9l-.6-2.1L16 6l2.4-.9z" /></>;
    case 'refresh':
      return <Path {...pathProps} d="M20 11a8 8 0 0 0-14.8-3L3 11M4 5v6h6M4 13a8 8 0 0 0 14.8 3L21 13M20 19v-6h-6" />;
    case 'lock':
      return <><Rect {...pathProps} x="5" y="10" width="14" height="11" rx="2" /><Path {...pathProps} d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>;
    case 'trophy':
    case 'achievements':
      return <><Path {...pathProps} d="M7 4h10v5.5c0 3.2-2.1 5.5-5 6.4-2.9-.9-5-3.2-5-6.4z" /><Path {...pathProps} d="M7 6H4v2c0 2.2 1.2 3.8 3.3 4.4M17 6h3v2c0 2.2-1.2 3.8-3.3 4.4M12 16v4M8.5 21h7" /></>;
    case 'check':
      return <Path {...pathProps} d="m5 12 4.2 4.2L19 6.5" />;
    case 'target':
      return <><Circle {...pathProps} cx="12" cy="12" r="8.5" /><Circle {...pathProps} cx="12" cy="12" r="4.2" /><Circle cx="12" cy="12" r="1" fill={color} /></>;
    case 'close':
      return <Path {...pathProps} d="m6 6 12 12M18 6 6 18" />;
    case 'chevron-left':
      return <Path {...pathProps} d="m15 5-7 7 7 7" />;
    case 'chevron-right':
      return <Path {...pathProps} d="m9 5 7 7-7 7" />;
    case 'home':
      return <><Path {...pathProps} d="m3.5 10.7 8.5-7 8.5 7" /><Path {...pathProps} d="M5.5 9.3v10.4h13V9.3M9.2 19.7v-5.2h5.6v5.2M12 6.2v1.9" /></>;
    case 'cards':
      return <><Path {...pathProps} d="m6.5 3.8 11.2 2.7a1.5 1.5 0 0 1 1.1 1.8l-2.5 10.3a1.5 1.5 0 0 1-1.8 1.1L3.3 17a1.5 1.5 0 0 1-1.1-1.8L4.7 5a1.5 1.5 0 0 1 1.8-1.2Z" /><Path {...pathProps} d="m8.1 8.4 4.5 1.1M7.2 12l6.6 1.6M9.6 15.7l2.8.7" /></>;
    case 'collection':
      return <><Rect {...pathProps} x="3" y="5" width="13" height="15" rx="1.5" /><Path {...pathProps} d="M7 5V3.5h12a1.5 1.5 0 0 1 1.5 1.5v13H19M6.5 9h6M6.5 12h6M6.5 15h3.5M16.7 9.5v4M14.7 11.5h4" /></>;
    case 'missions':
    case 'quests':
      return <><Rect {...pathProps} x="5" y="3.5" width="14" height="17" rx="1.7" /><Path {...pathProps} d="M9 3.5v-1h6v1M8.5 8.5h7M8.5 12h7M8.5 15.5h4M14.5 16.5l1.2 1.2 2.7-3" /></>;
    case 'arena':
      return <><Path {...pathProps} d="m3.5 5.5 5.8 5.8M14.7 12.7l5.8 5.8M9.4 4.2 19.8 14.6l-5.2 5.2L4.2 9.4z" /><Path {...pathProps} d="m6.3 17.7-2 2M17.7 6.3l2-2M8 8l-2.8-2.8M16 16l2.8 2.8" /></>;
    case 'deck':
      return <><Path {...pathProps} d="M5.2 4.1 17 2.5l2 14.6-11.8 1.6z" /><Path {...pathProps} d="m4.4 7.4-1.7.3 2 14 10.4-1.4M8.2 8l6.2-.8M8.7 11.5l4.7-.7" /></>;
    case 'packs':
      return <><Path {...pathProps} d="m4 7 8-4 8 4-8 4zM4 7v10l8 4 8-4V7M12 11v10M8 5l8 4" /><Path {...pathProps} d="m17.5 11.2.6 1.5 1.6.1-1.2 1 .4 1.6-1.4-.9-1.4.9.4-1.6-1.2-1 1.6-.1z" /></>;
    case 'shop':
      return <><Path {...pathProps} d="M4 9.2v10.3h16V9.2M3 9.2h18l-1.5-5H4.5zM8 9.2v2.2M12 9.2v2.2M16 9.2v2.2M8 19.5v-5h8v5" /></>;
    case 'fusion':
      return <><Path {...pathProps} d="m12 3 2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z" /><Path {...pathProps} d="m19 3 .7 2.3L22 6l-2.3.7L19 9l-.7-2.3L16 6l2.3-.7z" /></>;
    case 'cosmetics':
      return <><Path {...pathProps} d="m4 16 8-12 8 12-8 5z" /><Path {...pathProps} d="M8.2 10.5h7.6M6.3 13.5h11.4M12 4v17" /></>;
    case 'profile':
      return <><Circle {...pathProps} cx="12" cy="8" r="3.5" /><Path {...pathProps} d="M4.5 21c.5-4.2 3-6.3 7.5-6.3s7 2.1 7.5 6.3M4 4.5h2M18 4.5h2" /></>;
    case 'signout':
      return <Path {...pathProps} d="M14 4H5v16h9M11 12h10M17 8l4 4-4 4" />;
    case 'map':
      return <><Path {...pathProps} d="m3.5 6.5 5.5-2.5 6 2.5 5.5-2.5v13.5L15 20l-6-2.5L3.5 20z" /><Path {...pathProps} d="M9 4v13.5M15 6.5V20" /></>;
    case 'gear':
      return <><Circle {...pathProps} cx="12" cy="12" r="3.1" /><Path {...pathProps} d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.9 1.9M16.6 16.6l1.9 1.9M18.5 5.5l-1.9 1.9M7.4 16.6l-1.9 1.9" /></>;
    case 'mail':
      return <><Rect {...pathProps} x="3" y="5.5" width="18" height="13" rx="2" /><Path {...pathProps} d="m3.6 7 8.4 6 8.4-6" /></>;
    case 'gift':
      return <><Rect {...pathProps} x="3.5" y="9" width="17" height="11" rx="1.5" /><Path {...pathProps} d="M2.5 9h19v3.2h-19zM12 9v11M12 9C10.6 6.4 9.4 5 8 5a2 2 0 0 0 0 4M12 9c1.4-2.6 2.6-4 4-4a2 2 0 0 1 0 4" /></>;
    case 'card':
      return <><Rect {...pathProps} x="2.8" y="5.5" width="18.4" height="13" rx="2.2" /><Path {...pathProps} d="M2.8 10h18.4M6.5 14.5h4" /></>;
    case 'ledger':
      return <><Path {...pathProps} d="M6 3.5h11.5a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H6zM6 3.5A1.8 1.8 0 0 0 4.2 5.3v13.4A1.8 1.8 0 0 0 6 20.5M9 8h7M9 11.5h7M9 15h4" /></>;
    default:
      return <Path {...pathProps} d="M12 3.5 20.5 12 12 20.5 3.5 12zM8.5 12h7" />;
  }
}

const VexIconBase = ({ name, size = 16, color, tintColor, strokeWidth = 1.7, style }: ForgeIconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={style} accessibilityElementsHidden>
    <IconBody name={name} color={color ?? tintColor ?? '#ffffff'} strokeWidth={strokeWidth} />
  </Svg>
);

export const VexIcon = Object.assign(VexIconBase, { glyphMap: GLYPH_MAP });

// Compatibility aliases keep the first visual migration small and safe:
// callers retain their existing name contracts, but no external icon font is
// rendered anywhere in the Android surface.
export const Feather = VexIcon;
export const Ionicons = VexIcon;