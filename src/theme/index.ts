// Système de design PadelConnect — sobre, épuré, sensation « luxe + sport ».
// Base sombre, accent or champagne (luxe) et vert émeraude (sport).

export const colors = {
  // Thème CLAIR — ambiance « court de padel ensoleillé ».
  bg: '#F1F5F3',
  bgElevated: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#E9EFEC',
  border: '#C7D6CF',
  borderSoft: 'rgba(0,0,0,0.06)',

  // Couleur principale = vert profond du terrain (CTA, niveau, premium). Texte blanc dessus.
  gold: '#0A6B5D',
  goldDark: '#00544D',
  goldSoft: 'rgba(10,107,93,0.12)',
  // Vert vif — états positifs, disponibilité, victoire.
  green: '#1E9E73',
  greenDark: '#167A58',
  greenSoft: 'rgba(30,158,115,0.14)',
  // Bleu du court — accent secondaire / info.
  blue: '#3C85D4',
  blueSoft: 'rgba(60,133,212,0.14)',
  // Balle de padel (vert lime/fluo) — touche d'énergie / logo.
  lime: '#C6F24A',

  text: '#0C1A16',
  textMuted: '#586862',
  textFaint: '#93A39B',

  danger: '#E5484D',
  dangerSoft: 'rgba(229,72,77,0.12)',
  white: '#FFFFFF',
  black: '#000000',
  onGold: '#FFFFFF', // texte / icône posés sur la couleur principale (vert profond)
  overlay: 'rgba(0,0,0,0.45)',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 } as const;

export const font = {
  size: { xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 26, display: 34 },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
  },
} as const;

export const shadowCard = {
  shadowColor: '#0C1A16',
  shadowOpacity: 0.1,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 8 },
  elevation: 3,
} as const;

export const theme = { colors, spacing, radius, font, shadowCard };
export default theme;
