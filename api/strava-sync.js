import { createClient } from '@supabase/supabase-js'
 
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
 
export default async (req) => {
  const { clientId } = Object.fromEntries(new URL(req.url).searchParams)
 
  if (!clientId) {
    return Response.json({ error: 'Missing clientId' }, { status: 400 })
  }
 
  // 1. Load stored connection
  const { data: conn, error: connError } = await supabaseAdmin
    .from('strava_connections')
    .select('*')
    .eq('client_id', clientId)
    .single()
 
  if (connError || !conn) {
    return Response.json({ error: 'No Strava connection found' }, { status: 404 })
  }
 
  let accessToken = conn.access_token
 
  // 2. Refresh token if expired
  const nowInSeconds = Math.floor(Date.now() / 1000)
  if (conn.expires_at < nowInSeconds) {
    const refreshRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: conn.refresh_token,
      }),
    })
 
    const refreshData = await refreshRes.json()
 
    if (!refreshData.access_token) {
      console.error('strava-sync: token refresh failed', refreshData)
      return Response.json({ error: 'Token refresh failed' }, { status: 401 })
    }
 
    // Save refreshed tokens back to Supabase
    await supabaseAdmin
      .from('strava_connections')
      .update({
        access_token: refreshData.access_token,
        refresh_token: refreshData.refresh_token,
        expires_at: refreshData.expires_at,
      })
      .eq('client_id', clientId)
 
    accessToken = refreshData.access_token
  }
 
  // 3. Fetch recent activities from Strava (last 60)
  const activitiesRes = await fetch(
    'https://www.strava.com/api/v3/athlete/activities?per_page=60',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
 
  if (!activitiesRes.ok) {
    console.error('strava-sync: Strava activities fetch failed', activitiesRes.status)
    return Response.json({ error: 'Failed to fetch activities from Strava' }, { status: 502 })
  }
 
  const activities = await activitiesRes.json()
 
  if (!Array.isArray(activities) || activities.length === 0) {
    return Response.json({ synced: 0 })
  }
 
  // 4. Upsert into strava_activities
  const rows = activities.map((a) => ({
    client_id: clientId,
    strava_activity_id: String(a.id),
    name: a.name,
    activity_type: a.type,
    distance_miles: a.distance ? parseFloat((a.distance / 1609.344).toFixed(2)) : null,
    moving_time_sec: a.moving_time ?? null,
    activity_date: a.start_date,
  }))
 
  const { error: upsertError } = await supabaseAdmin
    .from('strava_activities')
    .upsert(rows, { onConflict: 'strava_activity_id' })
 
  if (upsertError) {
    console.error('strava-sync: upsert failed', upsertError)
    return Response.json({ error: 'Failed to save activities' }, { status: 500 })
  }
 
  return Response.json({ synced: rows.length })
}
 
export const config = { runtime: 'edge' }
 
