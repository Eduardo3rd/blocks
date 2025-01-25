import { colors } from './tokens/colors';
import { typography } from './tokens/typography';
import { spacing } from './tokens/spacing';
import { effects } from './tokens/effects';

export const theme = {
  colors,
  typography,
  spacing,
  effects,
} as const;

// Type for theme
export type Theme = typeof theme; 