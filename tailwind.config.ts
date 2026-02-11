import type { Config } from 'tailwindcss';

const config: Config = {
    darkMode: 'class',
    content: [
        './src/**/*.{ts,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                // === BLACKGEM STEALTH WEALTH PALETTE ===
                // Primary Backgrounds
                'midnight-ink': '#11141D',      // Dark mode background
                'deep-surface': '#0D0D12',      // Alternating dark sections
                'soft-parchment': '#F9FAFB',    // Light mode background

                // Accent Colors
                'heritage-sapphire': '#3E5CFF', // Primary accent, CTAs, links
                'emerald-forest': '#059669',    // Success, growth, positive IRR

                // Neutrals (Slate scale)
                slate: {
                    50: '#F8FAFC',
                    100: '#F1F5F9',
                    200: '#E2E8F0',
                    300: '#CBD5E1',
                    400: '#94A3B8',
                    500: '#64748B',
                    600: '#475569',
                    700: '#334155',
                    800: '#1E293B',
                    900: '#0F172A',
                },

                // Semantic colors (used sparingly)
                error: '#DC2626',
                success: '#059669',    // Emerald Forest
                warning: '#D97706',
                info: '#2563EB',

                // shadcn/ui variable mapping (hex values in CSS vars)
                background: 'var(--background)',
                foreground: 'var(--foreground)',
                card: {
                    DEFAULT: 'var(--card)',
                    foreground: 'var(--card-foreground)',
                },
                popover: {
                    DEFAULT: 'var(--popover)',
                    foreground: 'var(--popover-foreground)',
                },
                primary: {
                    DEFAULT: 'var(--primary)',
                    foreground: 'var(--primary-foreground)',
                },
                secondary: {
                    DEFAULT: 'var(--secondary)',
                    foreground: 'var(--secondary-foreground)',
                },
                muted: {
                    DEFAULT: 'var(--muted)',
                    foreground: 'var(--muted-foreground)',
                },
                accent: {
                    DEFAULT: 'var(--accent)',
                    foreground: 'var(--accent-foreground)',
                },
                destructive: {
                    DEFAULT: 'var(--destructive)',
                    foreground: 'var(--destructive-foreground)',
                },
                border: 'var(--border)',
                input: 'var(--input)',
                ring: 'var(--ring)',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                serif: ['Source Serif 4 Variable', 'Source Serif 4', 'Georgia', 'serif'],
                display: ['Fraunces Variable', 'Fraunces', 'Georgia', 'serif'],
                mono: ['JetBrains Mono Variable', 'JetBrains Mono', 'Consolas', 'monospace'],
            },
            borderRadius: {
                lg: '8px',
                md: '6px',
                sm: '4px',
            },
            boxShadow: {
                // Minimal shadows - "stealth wealth" aesthetic
                card: '0 1px 3px rgba(0, 0, 0, 0.05)',
                'card-dark': '0 1px 3px rgba(0, 0, 0, 0.2)',
            },
        },
    },
    plugins: [require('tailwindcss-animate')],
};

export default config;
