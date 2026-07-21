// ─────────────────────────────────────────────────────────────
// GENERAL preferences — your coaching style, applies to everyone
// ─────────────────────────────────────────────────────────────
export const DEFAULT_GENERAL_PREFS = {
  longRunDay: 'Sat',
  restDays: {
    days: ['Sun', 'Wed'],
    low: 3,
    mid: 2,
    high: 1,
  },
  hardWorkoutDays: ['Tue', 'Thu'],
  noBackToBackHard: true,
  walkRunIntervals: { progressWeeks: 8 },
  fartlekDescription: 'Alternate 1 min hard / 2 min easy for [MILES] miles',
  longRunNote: 'Long run — keep easy. Goal race pace is [RACE_PACE]. Focus on time on feet.',
  allowedTypes: {
    beginner:     ['easy', 'fartlek', 'recovery', 'long', 'walk'],
    intermediate: ['easy', 'tempo', 'race', 'fartlek', 'recovery', 'long'],
    advanced:     ['easy', 'tempo', 'race', 'fartlek', 'intervals', 'recovery', 'long'],
  },
}

// ─────────────────────────────────────────────────────────────
// RACE-SPECIFIC preferences — the dials that differ by distance
// ─────────────────────────────────────────────────────────────
export const DEFAULT_RACE_PREFS = {
  '5k': {
    label: '5K',
    weeklyIncreaseRate: 0.10,
    minWeeklyIncreaseMiles: 1,
    taperWeeks: 1,            // ~1 week
    taperReductionPct: 0.40,
    postRaceRestWeeks: 0,
    longRunCap: { beginner: 5, intermediate: 7, advanced: 9 },
    weeklyMileageCap: { beginner: 12, intermediate: 22, advanced: 35 },
    // Long run still exists but is de-emphasized — speed work (Tue) is the focus
    longRunEmphasis: 'low',
    paceDistribution: {
      beginner:     { easy: 0.80, tempo: 0.10, race: 0.00, fartlek: 0.10, intervals: 0.00, recovery: 0.00, long: 0.00, walk: 0.00 },
      intermediate: { easy: 0.55, tempo: 0.15, race: 0.05, fartlek: 0.10, intervals: 0.10, recovery: 0.00, long: 0.05, walk: 0.00 },
      advanced:     { easy: 0.45, tempo: 0.15, race: 0.10, fartlek: 0.10, intervals: 0.15, recovery: 0.00, long: 0.05, walk: 0.00 },
    },
  },
  '10k': {
    label: '10K',
    weeklyIncreaseRate: 0.10,
    minWeeklyIncreaseMiles: 1.5,
    taperWeeks: 1,
    taperReductionPct: 0.40,
    postRaceRestWeeks: 0,
    longRunCap: { beginner: 7, intermediate: 10, advanced: 13 },
    weeklyMileageCap: { beginner: 15, intermediate: 28, advanced: 42 },
    // Long run matters slightly more than 5K, but speed work still significant
    longRunEmphasis: 'medium-low',
    paceDistribution: {
      beginner:     { easy: 0.80, tempo: 0.10, race: 0.00, fartlek: 0.10, intervals: 0.00, recovery: 0.00, long: 0.00, walk: 0.00 },
      intermediate: { easy: 0.60, tempo: 0.15, race: 0.05, fartlek: 0.10, intervals: 0.05, recovery: 0.00, long: 0.05, walk: 0.00 },
      advanced:     { easy: 0.50, tempo: 0.15, race: 0.10, fartlek: 0.10, intervals: 0.10, recovery: 0.00, long: 0.05, walk: 0.00 },
    },
  },
  'half': {
    label: 'Half Marathon',
    weeklyIncreaseRate: 0.10,
    minWeeklyIncreaseMiles: 2,
    taperWeeks: 1.5,           // 10 days
    taperReductionPct: 0.40,
    postRaceRestWeeks: 1,
    longRunCap: { beginner: 9, intermediate: 13, advanced: 16 },
    weeklyMileageCap: { beginner: 22, intermediate: 35, advanced: 50 },
    longRunEmphasis: 'high',
    paceDistribution: {
      beginner:     { easy: 0.75, tempo: 0.05, race: 0.00, fartlek: 0.10, intervals: 0.00, recovery: 0.05, long: 0.05, walk: 0.00 },
      intermediate: { easy: 0.65, tempo: 0.10, race: 0.05, fartlek: 0.10, intervals: 0.00, recovery: 0.05, long: 0.05, walk: 0.00 },
      advanced:     { easy: 0.55, tempo: 0.10, race: 0.10, fartlek: 0.10, intervals: 0.05, recovery: 0.00, long: 0.10, walk: 0.00 },
    },
  },
  'full': {
    label: 'Full Marathon',
    weeklyIncreaseRate: 0.10,
    minWeeklyIncreaseMiles: 2,
    taperWeeks: 2,
    taperReductionPct: 0.40,
    postRaceRestWeeks: 1,
    longRunCap: { beginner: 10, intermediate: 16, advanced: 22 },
    weeklyMileageCap: { beginner: 25, intermediate: 40, advanced: 60 },
    longRunEmphasis: 'high',
    paceDistribution: {
      beginner:     { easy: 0.70, tempo: 0.00, race: 0.00, fartlek: 0.10, intervals: 0.00, recovery: 0.10, long: 0.10, walk: 0.00 },
      intermediate: { easy: 0.60, tempo: 0.10, race: 0.05, fartlek: 0.10, intervals: 0.05, recovery: 0.05, long: 0.05, walk: 0.00 },
      advanced:     { easy: 0.55, tempo: 0.10, race: 0.10, fartlek: 0.10, intervals: 0.10, recovery: 0.00, long: 0.05, walk: 0.00 },
    },
  },
}

export const RACE_TYPES = ['5k', '10k', 'half', 'full']
export const RACE_LABELS = { '5k': '5K', '10k': '10K', half: 'Half Marathon', full: 'Full Marathon' }

// Backwards-compat: full merged prefs object for a given race type
export function getMergedPrefs(generalPrefs, racePrefsAll, raceType) {
  const general = { ...DEFAULT_GENERAL_PREFS, ...generalPrefs }
  const racePrefs = { ...DEFAULT_RACE_PREFS[raceType], ...(racePrefsAll?.[raceType] || {}) }
  return { ...general, ...racePrefs }
}

// Legacy export kept so nothing else breaks if referenced
export const DEFAULT_PREFS = { ...DEFAULT_GENERAL_PREFS, ...DEFAULT_RACE_PREFS.full }
