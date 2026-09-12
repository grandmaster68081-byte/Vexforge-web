/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#EDF0F7',
    tint: '#C9901F',

    // Core surfaces
    background: '#05050D',
    foreground: '#EDF0F7',

    // Cards / elevated surfaces
    card: '#141428',
    cardForeground: '#EDF0F7',

    // Primary action color (buttons, links, active states)
    primary: '#C9901F',
    primaryForeground: '#05050D',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#1C1C38',
    secondaryForeground: '#EDF0F7',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#0D0D1A',
    mutedForeground: '#8891A0',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#F0C050',
    accentForeground: '#05050D',

    // Destructive actions (delete, error states)
    destructive: '#E3573F',
    destructiveForeground: '#FFFFFF',

    // Borders and input outlines
    border: '#242448',
    input: '#242448',
    success: '#3DC96B',
    danger: '#E3573F',
    rarityCommon: '#8891A0',
    rarityUncommon: '#3DC96B',
    rarityRare: '#6EA8FE',
    rarityEpic: '#A78BFA',
    rarityLegendary: '#F0C050',
    rarityMythic: '#E3573F',
    ink: '#05050D',
    panel: '#0D0D1A',
    panelStrong: '#141428',
    shadow: '#000000',
  },

  dark: {
    text: '#EDF0F7',
    tint: '#C9901F',
    background: '#05050D',
    foreground: '#EDF0F7',
    card: '#141428',
    cardForeground: '#EDF0F7',
    primary: '#C9901F',
    primaryForeground: '#05050D',
    secondary: '#1C1C38',
    secondaryForeground: '#EDF0F7',
    muted: '#0D0D1A',
    mutedForeground: '#8891A0',
    accent: '#F0C050',
    accentForeground: '#05050D',
    destructive: '#E3573F',
    destructiveForeground: '#FFFFFF',
    border: '#242448',
    input: '#242448',
    success: '#3DC96B',
    danger: '#E3573F',
    rarityCommon: '#8891A0',
    rarityUncommon: '#3DC96B',
    rarityRare: '#6EA8FE',
    rarityEpic: '#A78BFA',
    rarityLegendary: '#F0C050',
    rarityMythic: '#E3573F',
    ink: '#05050D',
    panel: '#0D0D1A',
    panelStrong: '#141428',
    shadow: '#000000',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 12,
};

export default colors;
