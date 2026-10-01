/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      colors: {
        // Semantic risk / status colors
        risk: {
          normal: 'rgb(var(--color-risk-normal) / <alpha-value>)',
          warning: 'rgb(var(--color-risk-warning) / <alpha-value>)',
          high: 'rgb(var(--color-risk-high) / <alpha-value>)',
          critical: 'rgb(var(--color-risk-critical) / <alpha-value>)',
        },
        info: 'rgb(var(--color-info) / <alpha-value>)',
        // Control-room surface palette
        surface: {
          base: 'rgb(var(--color-surface-base) / <alpha-value>)',
          panel: 'rgb(var(--color-surface-panel) / <alpha-value>)',
          raised: 'rgb(var(--color-surface-raised) / <alpha-value>)',
          border: 'rgb(var(--color-surface-border) / <alpha-value>)',
        },
      },
      boxShadow: {
        'panel-glow': '0 0 24px -8px rgb(var(--color-info) / 0.15)',
        'critical-glow': '0 0 24px -4px rgb(var(--color-risk-critical) / 0.25)',
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        'pulse-slow': 'pulse-slow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
