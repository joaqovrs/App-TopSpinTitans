// Sistema de diseno — tomado del tema de la app en Base44.
// Tema oscuro. Fuente Inter. Estos tokens se usan en toda la app movil.

export const colors = {
  background: '#0D0D0D',
  foreground: '#F2F2F2',
  card: '#171717',
  cardForeground: '#F2F2F2',
  popover: '#171717',
  primary: '#E53734', // rojo
  primaryForeground: '#FFFFFF',
  secondary: '#242424',
  secondaryForeground: '#D9D9D9',
  muted: '#242424',
  mutedForeground: '#8C8C8C',
  accent: '#00E1FF', // cyan
  accentForeground: '#0D0D0D',
  win: '#2EB82E', // verde victoria (sets/partidos ganados)
  destructive: '#EF4343',
  destructiveForeground: '#FAFAFA',
  border: '#292929',
  input: '#292929',
  ring: '#E53734',

  // Colores del podio (1ro / 2do / 3ro).
  gold: '#FFCC33',
  silver: '#D9D9D9',
  bronze: '#E0922F',
} as const;

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;
