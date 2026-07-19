// One-off diagnostic script — NOT an API route.
// Run manually with: node strava-diagnose.js
// Checks every stored Strava connection and reports which clients have
// scope problems, expired/dead tokens, or zero activities coming back.

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function getValidAccessToken(conn) {
  const now = Math.floor(Date.now() / 1000)
  if (conn.expires_at > now + 60) return { accessToken: conn.access_token, refreshed: false }

  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: conn.refresh_token,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  if (!data.access_token) throw new Error(`refresh_failed: ${JSON.stringify(data)}`)
  return { accessToken: data.access_token, refreshed: true }
}

async function main() {
  const { data: connections, error } = await supabaseAdmin
    .from('strava_connections')
    .select('*')

  if (error) {
    console.error('Failed to load connections:', error)
    process.exit(1)
  }

  console.log(`Checking ${connections.length} Strava connection(s)...\n`)

  const results = []

  for (const conn of connections) {
    const row = { client_id: conn.client_id, athlete_id: conn.strava_athlete_id }

    // 1. Scope check
    const scopes = (conn.scope || '').split(',').filter(Boolean)
    row.scope = scopes.length ? scopes.join(',') : '(not recorded — connected before scope tracking was added)'
    row.full_access = scopes.includes('activity:read_all')

    // 2. Token validity
    try {
      const { accessToken, refreshed } = await getValidAccessToken(conn)
      row.token_ok = true
      row.token_refreshed = refreshed

      // 3. Activity fetch
      const actRes = await fetch(
        'https://www.strava.com/api/v3/athlete/activities?per_page=5',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      row.activities_http_status = actRes.status

      if (actRes.ok) {
        const activities = await actRes.json()
        row.activities_returned = Array.isArray(activities) ? activities.length : 0
      } else {
        row.activities_returned = null
        row.activities_error = await actRes.text()
      }
    } catch (err) {
      row.token_ok = false
      row.error = err.message
    }

    results.push(row)
  }

  console.table(
    results.map((r) => ({
      client_id: r.client_id,
      full_access: r.full_access,
      token_ok: r.token_ok,
      activities_returned: r.activities_returned,
      http_status: r.activities_http_status,
      issue: !r.token_ok
        ? `TOKEN FAILED: ${r.error}`
        : !r.full_access
        ? 'LIMITED SCOPE — client hid private activities'
        : r.activities_returned === 0
        ? 'ZERO ACTIVITIES — check if athlete actually has recent runs'
        : 'ok',
    }))
  )

  const problems = results.filter(
    (r) => !r.token_ok || !r.full_access || r.activities_returned === 0
  )
  console.log(`\n${problems.length} of ${results.length} connection(s) have an issue.`)
}

main()
