/**
 * Chart color palettes for dark (Dashboard Cockpit) and light (LP Portal Library) themes.
 */

// ---------------------------------------------------------------------------
// Theme palettes
// ---------------------------------------------------------------------------

export const DARK_PALETTE = {
  // Primary series colors
  primary: '#6366f1',    // indigo-500
  secondary: '#22d3ee',  // cyan-400
  tertiary: '#a78bfa',   // violet-400
  quaternary: '#34d399',  // emerald-400
  quinary: '#fbbf24',    // amber-400

  // Semantic
  positive: '#22c55e',   // green-500
  negative: '#ef4444',   // red-500
  neutral: '#94a3b8',    // slate-400

  // Chart backgrounds
  background: '#11141D',
  cardBackground: '#11141D',
  gridLine: 'rgba(148, 163, 184, 0.1)',  // slate-400/10
  axisText: '#94a3b8',   // slate-400
  tooltipBg: '#1e293b',  // slate-800
  tooltipBorder: '#334155', // slate-700
  tooltipText: '#f8fafc', // slate-50

  // Series (for multi-series charts)
  series: [
    '#6366f1', // indigo-500
    '#22d3ee', // cyan-400
    '#a78bfa', // violet-400
    '#34d399', // emerald-400
    '#fbbf24', // amber-400
    '#f472b6', // pink-400
    '#fb923c', // orange-400
    '#38bdf8', // sky-400
  ],
} as const

export const LIGHT_PALETTE = {
  // Primary series colors
  primary: '#4f46e5',    // indigo-600
  secondary: '#0891b2',  // cyan-600
  tertiary: '#7c3aed',   // violet-600
  quaternary: '#059669',  // emerald-600
  quinary: '#d97706',    // amber-600

  // Semantic
  positive: '#16a34a',   // green-600
  negative: '#dc2626',   // red-600
  neutral: '#64748b',    // slate-500

  // Chart backgrounds
  background: '#f8fafc',  // slate-50
  cardBackground: '#ffffff',
  gridLine: 'rgba(100, 116, 139, 0.15)', // slate-500/15
  axisText: '#64748b',   // slate-500
  tooltipBg: '#ffffff',
  tooltipBorder: '#e2e8f0', // slate-200
  tooltipText: '#1e293b', // slate-800

  // Series
  series: [
    '#4f46e5', // indigo-600
    '#0891b2', // cyan-600
    '#7c3aed', // violet-600
    '#059669', // emerald-600
    '#d97706', // amber-600
    '#db2777', // pink-600
    '#ea580c', // orange-600
    '#0284c7', // sky-600
  ],
} as const

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

export type ChartTheme = 'dark' | 'light'

export function getChartPalette(theme: ChartTheme) {
  return theme === 'dark' ? DARK_PALETTE : LIGHT_PALETTE
}

/**
 * Waterfall-specific colors: LP vs GP visual differentiation.
 */
export function getWaterfallColors(theme: ChartTheme) {
  const palette = getChartPalette(theme)
  return {
    lp: palette.primary,      // indigo for LP
    gp: palette.quaternary,   // emerald for GP
    returnOfCapital: palette.neutral,
    preferredReturn: palette.secondary,
    catchUp: palette.quinary,
    carriedInterest: palette.tertiary,
  }
}
