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
    text: '#F4F8FF',
    tint: '#55C7FF',

    // Core surfaces
    background: '#07101C',
    foreground: '#F4F8FF',

    // Cards / elevated surfaces
    card: '#101F31',
    cardForeground: '#F4F8FF',

    // Primary action color (buttons, links, active states)
    primary: '#55C7FF',
    primaryForeground: '#07101C',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#162B43',
    secondaryForeground: '#DDEBFF',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#0D1A2B',
    mutedForeground: '#8EA5C0',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#E9B85B',
    accentForeground: '#07101C',

    // Destructive actions (delete, error states)
    destructive: '#FF6178',
    destructiveForeground: '#FFFFFF',

    // Borders and input outlines
    border: '#23405F',
    input: '#1A3451',
    success: '#5CE1B4',
    danger: '#FF6178',
    ink: '#07101C',
    panel: '#0B1727',
    panelStrong: '#13263D',
    shadow: '#000000',
  },

  dark: {
    text: '#F4F8FF',
    tint: '#55C7FF',
    background: '#07101C',
    foreground: '#F4F8FF',
    card: '#101F31',
    cardForeground: '#F4F8FF',
    primary: '#55C7FF',
    primaryForeground: '#07101C',
    secondary: '#162B43',
    secondaryForeground: '#DDEBFF',
    muted: '#0D1A2B',
    mutedForeground: '#8EA5C0',
    accent: '#E9B85B',
    accentForeground: '#07101C',
    destructive: '#FF6178',
    destructiveForeground: '#FFFFFF',
    border: '#23405F',
    input: '#1A3451',
    success: '#5CE1B4',
    danger: '#FF6178',
    ink: '#07101C',
    panel: '#0B1727',
    panelStrong: '#13263D',
    shadow: '#000000',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 8,
};

export default colors;
