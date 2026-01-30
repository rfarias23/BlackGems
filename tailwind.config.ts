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

                // shadcn/ui variable mapping
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
                popover: {
                    DEFAULT: 'var(--popover)',
                    foreground: 'var(--popover-foreground)',
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
            },
            fontFamily: {
                // Primary sans-serif for UI
                sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
                // Serif for headings and reports
                serif: ['var(--font-source-serif)', 'Georgia', 'serif'],
                // Monospace for financial data
                mono: ['var(--font-jetbrains)', 'Consolas', 'monospace'],
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
