// ─────────────────────────────────────────────────────────────
// STRAVA INTEGRATION — adherence helpers
// Turns raw strava_activities rows into "did they actually do the plan"
// numbers, and (optionally) nudges next month's progression rate based
// on that. No API calls, no AI — just arithmetic against data you
// already have once activities are flowing in.
// ─────────────────────────────────────────────────────────────

export function getStravaConnectUrl(clientId) {
  return `/api/strava-connect?client_id=${clientId}`
}

// Monday–Sunday bounds for the week containing `date`, as ISO date strings.
export function weekBoundsContaining(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const dow = (d.getDay() + 6) % 7 // 0 = Mon … 6 = Sun
  const monday = new Date(d)
  monday.setDate(d.getDate() - dow)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { start: monday.toISOString().slice(0, 10), end: sunday.toISOString().slice(0, 10) }
}

function sumMilesByDate(activities) {
  const byDate = {}
  for (const a of activities) {
    byDate[a.activity_date] = (byDate[a.activity_date] || 0) + Number(a.distance_miles || 0)
  }
  return byDate
}

// plannedDays: the `days` map from a parsed training plan (date -> {miles, pace, notes})
// activities: rows from strava_activities for one client (any date range — this filters)
// Returns null fields gracefully so the UI can say "nothing planned" vs "0% compliance".
export function computeWeekAdherence(plannedDays, activities, weekStartKey, weekEndKey) {
  const actualByDate = sumMilesByDate(activities || [])

  let plannedMiles = 0
  let actualMiles = 0
  let daysPlanned = 0
  let daysRun = 0

  for (const key of Object.keys(plannedDays || {})) {
    if (key < weekStartKey || key > weekEndKey) continue
    const day = plannedDays[key]
    if (day?.pace && day.miles) {
      plannedMiles += Number(day.miles)
      daysPlanned++
    }
  }

  for (const key of Object.keys(actualByDate)) {
    if (key < weekStartKey || key > weekEndKey) continue
    actualMiles += actualByDate[key]
    if (actualByDate[key] > 0) daysRun++
  }

  const complianceRate = plannedMiles > 0 ? Math.round((actualMiles / plannedMiles) * 100) : null

  return {
    plannedMiles: Math.round(plannedMiles * 10) / 10,
    actualMiles: Math.round(actualMiles * 10) / 10,
    daysPlanned,
    daysRun,
    complianceRate, // null = nothing was planned that week, so there's nothing to judge
  }
}

export function mostRecentActivity(activities) {
  if (!activities || activities.length === 0) return null
  return activities.reduce((latest, a) => (a.activity_date > latest.activity_date ? a : latest), activities[0])
}

export function daysAgo(dateStr) {
  if (!dateStr) return null
  const ms = new Date().setHours(0, 0, 0, 0) - new Date(dateStr + 'T00:00:00').getTime()
  return Math.round(ms / (24 * 60 * 60 * 1000))
}

// Nudges next cycle's progression rate based on how well the client actually
// hit LAST week's plan (pass in a completed week's adherence, not the live one).
// Deliberately conservative: it only ever holds back or dials down the increase
// when adherence is low — it never increases mileage beyond what the coach's
// own preferences already specify.
export function adjustPrefsForAdherence(mergedPrefs, complianceRate) {
  if (complianceRate === null || complianceRate === undefined) return mergedPrefs

  let factor = 1
  if (complianceRate < 60) factor = 0 // big miss last week — hold mileage flat this cycle
  else if (complianceRate < 85) factor = 0.5 // partial miss — half the usual bump
  // 85%+ compliance — trust the coach's configured rate as-is

  if (factor === 1) return mergedPrefs

  return {
    ...mergedPrefs,
    weeklyIncreaseRate: (mergedPrefs.weeklyIncreaseRate || 0.1) * factor,
    minWeeklyIncreaseMiles: (mergedPrefs.minWeeklyIncreaseMiles ?? 2) * factor,
  }
}
