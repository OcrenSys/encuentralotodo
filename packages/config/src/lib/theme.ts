export const themeTokens = {
    colors: {
        primary: '#1F3C5A',
        primaryHover: '#16324A',
        secondary: '#4FBF9F',
        accent: '#F4C542',
        background: '#F5F7F8',
        surface: '#FFFFFF',
        border: '#D8DEE4',
        text: '#13273B',
        textMuted: '#5C7084',
        success: '#2E8A68',
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        '2xl': 48,
    },
    radius: {
        pill: 999,
        card: 24,
        panel: 32,
    },
    shadows: {
        card: '0 12px 36px rgba(17, 39, 60, 0.08)',
        hover: '0 20px 48px rgba(17, 39, 60, 0.14)',
    },
    motion: {
        fast: 150,
        base: 240,
    },
} as const;

export type ThemeTokens = typeof themeTokens;