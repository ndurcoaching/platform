// Shared plan data model — used by both the coach Dashboard and the client Portal
// so a saved plan is always read back exactly the way it was written.

export const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const PACE_TYPES = ['', 'easy', 'tempo', 'race', 'fartlek', 'intervals', 'recovery', 'long', 'walk']

export const PACE_LABELS = {
  '': '— type', easy: 'Easy', tempo: 'Tempo', race: 'Race pace', fartlek: 'Fartlek',
  intervals: 'Intervals', recovery: 'Recovery', long: 'Long run', walk: 'Walk/Run',
}

export const PACE_COLORS = {
  easy: '#2a6e3a', tempo: '#7a5a00', race: '#7a2222', fartlek: '#0a5fd4',
  intervals: '#5a2a7a', recovery: '#5a5650', long: '#2a5a6e', walk: '#3a3a7a',
}

export const PACE_BG = {
  easy: '#edf5ec', tempo: '#fdf3e3', race: '#fdeeed', fartlek: '#e8f0fc',
  intervals: '#f1ecf7', recovery: '#f0eeec', long: '#eaf2f5', walk: '#ececf7',
}

export const DEFAULT_GLOSSARY = {
  easy: 'Conversational pace. You should be able to speak in full sentences. Typically 60–90 seconds per mile slower than race pace.',
  tempo: 'Comfortably hard. You can speak in short phrases only. Roughly 25–30 seconds per mile slower than 10K race pace.',
  race: 'Goal marathon pace. The pace you plan to run on race day based on your target finish time.',
}

export function toKey(date) { return date.toISOString().slice(0, 10) }

export function buildCalendar(year, month) {
  const first = new Date(year, month, 1)
  let startDow = (first.getDay() + 6) % 7
  const cells = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, 1 - startDow + i)
    cells.push({ date: d, key: toKey(d), isCurrentMonth: d.getMonth() === month })
  }
  return cells
}

// Day data: { miles, pace, notes }
export function parsePlan(raw) {
  if (!raw) return { days: {}, notes: '', glossary: DEFAULT_GLOSSARY, strengthEnabled: false, strengthDays: {} }
  try {
    const p = JSON.parse(raw)
    if (p && typeof p === 'object' && 'days' in p) {
      return {
        days: p.days || {},
        notes: p.notes || '',
        glossary: p.glossary || DEFAULT_GLOSSARY,
        strengthEnabled: p.strengthEnabled || false,
        strengthDays: p.strengthDays || {},
      }
    }
  } catch {}
  return { days: {}, notes: raw, glossary: DEFAULT_GLOSSARY, strengthEnabled: false, strengthDays: {} }
}

export function serializePlan(days, notes, glossary, strengthEnabled, strengthDays) {
  return JSON.stringify({ days, notes, glossary, strengthEnabled, strengthDays })
}
