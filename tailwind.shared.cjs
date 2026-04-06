const sharedExtend = {
  colors: {
    primary: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
    secondary: 'rgb(var(--color-secondary-rgb) / <alpha-value>)',
    accent: 'rgb(var(--color-accent-rgb) / <alpha-value>)',
    success: 'rgb(var(--color-success-rgb) / <alpha-value>)',
    warning: 'rgb(var(--color-warning-rgb) / <alpha-value>)',
    error: 'rgb(var(--color-error-rgb) / <alpha-value>)',
    info: 'rgb(var(--color-info-rgb) / <alpha-value>)',
    neutral: 'rgb(var(--color-neutral-rgb) / <alpha-value>)',
    base: 'var(--bg-base)',
    surface: 'var(--bg-surface)',
    muted: 'var(--bg-muted)',
    elevated: 'var(--bg-elevated)',
    'text-primary': 'var(--text-primary)',
    'text-secondary': 'var(--text-secondary)',
    'text-muted': 'var(--text-muted)',
    'border-default': 'var(--border-default)',
    'border-subtle': 'var(--border-subtle)',
  },
  fontFamily: {
    display: ['var(--font-display)'],
    body: ['var(--font-body)'],
  },
  boxShadow: {
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
  },
  borderRadius: {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
  },
  transitionDuration: {
    fast: '150ms',
    normal: '200ms',
    slow: '250ms',
  },
};

function createConfig(content) {
  return {
    content,
    theme: {
      extend: sharedExtend,
    },
    plugins: [],
  };
}

module.exports = {
  createConfig,
  sharedExtend,
};
