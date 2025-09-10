/**
 * Colors for the Sri Lankan FoodSaverr app with red-white/red-black theme
 */

const primaryRed = '#DC2626'; // Red-600
const primaryRedDark = '#EF4444'; // Red-500 for dark mode
const accentRed = '#FEE2E2'; // Red-100 for light backgrounds
const accentRedDark = '#7F1D1D'; // Red-900 for dark backgrounds

export const Colors = {
  light: {
    text: '#11181C',
    background: '#FFFFFF',
    tint: primaryRed,
    icon: '#6B7280',
    tabIconDefault: '#6B7280',
    tabIconSelected: primaryRed,
    primary: primaryRed,
    primaryBackground: accentRed,
    cardBackground: '#FFFFFF',
    border: '#E5E7EB',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    surface: '#F9FAFB',
    onSurface: '#374151',
  },
  dark: {
    text: '#F9FAFB',
    background: '#000000',
    tint: primaryRedDark,
    icon: '#9CA3AF',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: primaryRedDark,
    primary: primaryRedDark,
    primaryBackground: accentRedDark,
    cardBackground: '#1F2937',
    border: '#374151',
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
    surface: '#111827',
    onSurface: '#D1D5DB',
  },
};
