// ─────────────────────────────────────────────────────────────
// NDUR PLAN BUILDER — rule-based monthly training plan engine
// ─────────────────────────────────────────────────────────────

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HARD_TYPES = new Set(['tempo', 'race', 'fartlek', 'intervals'])

const TYPE_NOTES = {
  easy:      'Conversational pace throughout. You should be able to speak in full sentences.',
  tempo:     'Comfortably hard effort. Short phrases only. Sustained effort for the full distance.',
  race:      'Run at goal marathon/half marathon race pace.',
  intervals: 'Hard intervals with easy recovery jogs between each rep.',
  recovery:  'Very easy pace — shake out the legs. This run should feel almost too easy.',
}

function r5(n) { return Math.round(Math.max(0, n) * 2) / 2 }
function toKey(d) { return d.toISOString().slice(0, 10) }

function getMonthDays(year, month) {
  const days = []
  const d = new Date(year, month, 1)
  while (d.getMonth() === month) {
    days.push({ date: new Date(d), key: toKey(d), dow: ALL_DAYS[(d.getDay() + 6) % 7] })
    d.setDate(d.getDate() + 1)
  }
  return days
}

function getCompleteWeeks(days) {
  if (days.length === 0) return []
  const weeks = []
  let week = []
  for (const day of days) {
    week.push(day)
    if (day.dow === 'Sun') { weeks.push(week); week = [] }
  }
  if (week.length > 0) weeks.push(week)
  return weeks
}

function weeksUntilRace(year, month, raceDateStr) {
  if (!raceDateStr) return 20
  const from = new Date(year, month, 1)
  const to = new Date(raceDateStr + 'T00:00:00')
  return Math.max(0, Math.round((to - from) / (7 * 24 * 60 * 60 * 1000)))
}

// Negative = race already happened this many weeks ago
function weeksSinceRace(year, month, raceDateStr) {
  if (!raceDateStr) return -999
  const from = new Date(year, month, 1)
  const raceDate = new Date(raceDateStr + 'T00:00:00')
  return Math.round((from - raceDate) / (7 * 24 * 60 * 60 * 1000))
}

function getPhase(weeksToRace, taperWeeks, weeksAfterRace, postRaceRestWeeks) {
  if (weeksAfterRace >= 0 && weeksAfterRace < postRaceRestWeeks) return 'post_race_rest'
  if (weeksToRace <= 0) return 'post'
  if (weeksToRace <= taperWeeks) return 'taper'
  if (weeksToRace <= taperWeeks + 4) return 'peak'
  return 'base'
}

function getTier(miles) {
  if (miles < 10) return 'beginner'
  if (miles <= 25) return 'intermediate'
  return 'advanced'
}

function estimateRacePace(client) {
  const miles = parseFloat(client.weekly_mileage) || 0
  const exp = (client.experience || '').toLowerCase()
  let secPerMile
  if (exp.includes('advanced') || miles > 40) secPerMile = 7 * 60 + 30
  else if (exp.includes('experienced') || miles > 25) secPerMile = 8 * 60 + 30
  else if (exp.includes('intermediate') || miles > 10) secPerMile = 9 * 60 + 30
  else secPerMile = 11 * 60
  const min = Math.floor(secPerMile / 60)
  const sec = secPerMile % 60
  return `${min}:${sec.toString().padStart(2, '0')}/mile`
}

function getWalkRunNote(weekIdx, progressWeeks) {
  const progress = Math.min(1, weekIdx / (progressWeeks || 8))
  const runMins = Math.round(1 + progress * 4)
  const walkMins = Math.max(0, Math.round(1 - progress * 1))
  if (walkMins === 0) return 'Run continuously at easy pace — you\'ve earned it!'
  return `Run ${runMins} min / Walk ${walkMins} min — repeat for the full distance`
}

// KEY: weekly increase now uses the GREATER of (% increase) or (minimum mile increase)
// and long run scales proportionally with it
function nextWeekMiles(currentMiles, increaseRate, minIncreaseMiles) {
  const pctIncrease = currentMiles * increaseRate
  const actualIncrease = Math.max(pctIncrease, minIncreaseMiles)
  return r5(currentMiles + actualIncrease)
}

function assignWorkouts(runDays, prefs, targetWeekMiles, phase, tier, racePace, weekIdx) {
  const result = {}
  if (runDays.length === 0) return result

  const longRunDay = prefs.longRunDay || 'Sat'
  const hardDays = new Set(prefs.hardWorkoutDays || ['Tue', 'Thu'])
  const allowed = new Set(prefs.allowedTypes?.[tier] || ['easy'])
  const noBackToBack = prefs.noBackToBackHard !== false
  const longRunCap = prefs.longRunCap?.[tier] || 22
  const progressWeeks = prefs.walkRunIntervals?.progressWeeks || 8
  const fartlekDesc = prefs.fartlekDescription || 'Alternate 1 min hard / 2 min easy for [MILES] miles'

  // Long run emphasis shifts how much weekly mileage the long run carries.
  // 'low' (5K): long run is de-emphasized in favor of speed days
  // 'medium' (10K): slightly more than 5K, still secondary
  // 'high' (Half/Full): classic 30% long-run share
  const emphasis = prefs.longRunEmphasis || 'high'
  const longRunShare = emphasis === 'low' ? 0.20 : emphasis === 'medium' ? 0.25 : 0.30

  const hasLongRunDay = runDays.some(d => d.dow === longRunDay)
  const longMiles = hasLongRunDay
    ? Math.min(longRunCap, Math.max(2, r5(targetWeekMiles * longRunShare)))
    : 0

  const nonLongRunDays = runDays.filter(d => d.dow !== longRunDay)
  const remainingMiles = Math.max(0, targetWeekMiles - longMiles)
  const shortMiles = nonLongRunDays.length > 0 ? r5(remainingMiles / nonLongRunDays.length) : 0

  const taperMult = phase === 'taper' ? (1 - (prefs.taperReductionPct ?? 0.40)) : 1.0

  const hardRotation = ['intervals', 'fartlek', 'tempo', 'race'].filter(t => allowed.has(t) && (t !== 'race' || phase !== 'base'))
  let hardIdx = weekIdx
  let lastType = 'easy'

  for (const day of runDays) {
    const isLong = day.dow === longRunDay
    let miles = isLong ? Math.max(2, r5(longMiles * taperMult)) : Math.max(1, r5(shortMiles * taperMult))

    let type = 'easy'
    let note = TYPE_NOTES.easy

    if (isLong && hasLongRunDay) {
      type = 'long'
      note = (prefs.longRunNote || 'Long run — keep easy. Goal race pace is [RACE_PACE]. Focus on time on feet.').replace('[RACE_PACE]', racePace)
    } else if (allowed.has('walk') && tier === 'beginner' && !isLong) {
      type = 'walk'
      note = getWalkRunNote(weekIdx, progressWeeks)
    } else if (hardDays.has(day.dow) && hardRotation.length > 0) {
      const candidate = hardRotation[hardIdx % hardRotation.length]
      if (noBackToBack && HARD_TYPES.has(lastType)) {
        type = 'easy'; note = TYPE_NOTES.easy
      } else {
        type = candidate
        hardIdx++
        note = type === 'fartlek' ? fartlekDesc.replace('[MILES]', miles) : (TYPE_NOTES[type] || '')
      }
    } else if (allowed.has('recovery') && lastType === 'long') {
      type = 'recovery'
      miles = Math.max(1, r5(miles * 0.6))
      note = TYPE_NOTES.recovery
    }

    lastType = type
    result[day.key] = { miles, pace: type, notes: note }
  }

  return result
}

// ── Main export ──────────────────────────────────────────────
// prefs: already-merged general + race-specific preferences
// (the caller is responsible for merging via getMergedPrefs from defaultPrefs.js)
export function buildMonthPlan(client, prefs, year, month, startFromToday = false) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const raceDateStr = client.race_date || null
  const raceKey = raceDateStr || null

  let allMonthDays = getMonthDays(year, month)
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()
  if (startFromToday && isCurrentMonth) {
    allMonthDays = allMonthDays.filter(d => d.date >= today)
  }

  const weeksLeft = weeksUntilRace(year, month, raceDateStr)
  const weeksAfter = weeksSinceRace(year, month, raceDateStr)
  const taperWeeks = prefs.taperWeeks || 2
  const postRaceRestWeeks = prefs.postRaceRestWeeks ?? 1
  const baseMiles = parseFloat(client.weekly_mileage) || 10
  const tier = getTier(baseMiles)
  const racePace = estimateRacePace(client)
  const preferredRestDays = prefs.restDays?.days || ['Sun', 'Wed']
  const weeklyCap = prefs.weeklyMileageCap?.[tier] || 999

  let restCount
  if (baseMiles < 10) restCount = prefs.restDays?.low ?? 3
  else if (baseMiles <= 25) restCount = prefs.restDays?.mid ?? 2
  else restCount = prefs.restDays?.high ?? 1

  const weeks = getCompleteWeeks(allMonthDays)
  const days = {}
  let weekMiles = baseMiles
  let endMiles = baseMiles
  const weeklyTotals = [] // NEW: track for summary

  if (raceKey) {
    const raceInMonth = allMonthDays.find(d => d.key === raceKey)
    if (raceInMonth) {
      days[raceKey] = { miles: 26.2, pace: 'race', notes: `🏁 RACE DAY — ${client.goal_race || 'Marathon'}! All your training has led to this.` }
    }
  }

  weeks.forEach((week, weekIdx) => {
    const weeksToRaceThisWeek = weeksLeft - weekIdx
    const weeksAfterThisWeek = weeksAfter + weekIdx
    const phase = getPhase(weeksToRaceThisWeek, taperWeeks, weeksAfterThisWeek, postRaceRestWeeks)
    const isCutback = (weekIdx + 1) % 4 === 0

    const daysInWeek = week.length
    const weekFraction = daysInWeek / 7

    // Cap weekly mileage at the tier ceiling
    weekMiles = Math.min(weekMiles, weeklyCap)

    let targetMiles = r5(weekMiles * weekFraction)
    if (phase === 'taper') targetMiles = r5(targetMiles * (1 - (prefs.taperReductionPct ?? 0.40)))
    else if (isCutback) targetMiles = r5(targetMiles * 0.75)

    const restDays = new Set()
    for (const d of preferredRestDays) { if (restDays.size < restCount) restDays.add(d) }
    if (restDays.size < restCount) {
      for (const d of ALL_DAYS) { if (restDays.size >= restCount) break; if (!restDays.has(d) && d !== prefs.longRunDay) restDays.add(d) }
    }

    let weekTotal = 0

    if (phase === 'post_race_rest') {
      // Mandatory rest week: optional light cross-training only, no running
      for (const day of week) {
        if (days[day.key]) continue
        days[day.key] = { miles: 0, pace: '', notes: 'Recovery week — optional light walking or cross-training (bike, swim). No running.' }
      }
    } else {
      for (const day of week) {
        if (days[day.key]) continue
        if (restDays.has(day.dow)) days[day.key] = { miles: 0, pace: '', notes: 'Rest' }
      }
      const runDays = week.filter(d => !restDays.has(d.dow) && !days[d.key])
      const assignments = assignWorkouts(runDays, prefs, targetMiles, phase, tier, racePace, weekIdx)
      Object.assign(days, assignments)

      const firstRun = week.find(d => !restDays.has(d.dow) && days[d.key] && days[d.key].pace !== '')
      if (firstRun && days[firstRun.key]) {
        const phaseNote = phase === 'taper' ? '📉 Taper week — trust your training. '
          : phase === 'peak' ? '📈 Peak week — prioritise consistency. '
          : isCutback ? '🔄 Cutback week — planned recovery. '
          : ''
        if (phaseNote) days[firstRun.key].notes = phaseNote + (days[firstRun.key].notes || '')
      }
    }

    // Calculate actual week total from assigned days
    for (const day of week) {
      if (days[day.key]) weekTotal += days[day.key].miles || 0
    }
    weeklyTotals.push({
      weekStart: week[0].key,
      weekEnd: week[week.length - 1].key,
      total: r5(weekTotal),
      phase,
    })

    endMiles = r5(weekMiles)

    // KEY FIX: minimum mile increase OR 10%, whichever is greater. Skip during taper/cutback/rest.
    if (phase !== 'taper' && phase !== 'post_race_rest' && !isCutback) {
      weekMiles = nextWeekMiles(weekMiles, prefs.weeklyIncreaseRate || 0.10, prefs.minWeeklyIncreaseMiles ?? 2)
      weekMiles = Math.min(weekMiles, weeklyCap)
    }
  })

  const monthName = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const phase = getPhase(weeksLeft, taperWeeks, weeksAfter, postRaceRestWeeks)
  const phaseDesc = phase === 'post_race_rest' ? 'mandatory post-race recovery week — no running'
    : phase === 'taper' ? 'taper phase — reduce effort and trust your training'
    : phase === 'peak' ? 'peak training phase — prioritise consistency and recovery'
    : 'base building phase — keep easy runs truly easy'

  const totalMonthMiles = r5(weeklyTotals.reduce((sum, w) => sum + w.total, 0))
  const notes = `${monthName} plan for ${client.name}. Currently in ${phaseDesc}. Long runs on Saturdays, rest on ${preferredRestDays.join(' and ')}. Hard workouts on Tuesdays and Thursdays — never back to back. Estimated goal pace: ${racePace}. Total month mileage: ${totalMonthMiles} mi.`

  return { days, notes, endMiles, weeklyTotals }
}
