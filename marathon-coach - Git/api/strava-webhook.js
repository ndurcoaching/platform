import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const METERS_PER_MILE = 1609.34

async function getValidAccessToken(connection) {
  const now = Math.floor(Date.now() / 1000)
  if (connection.expires_at > now + 60) return connection.access_token

  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: connection.refresh_token,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()

  await supabaseAdmin
    .from('strava_connections')
    .update({ access_token: data.access_token, refresh_token: data.refresh_token, expires_at: data.expires_at })
    .eq('client_id', connection.client_id)

  return data.access_token
}

export default async (req) => {
  const url = new URL(req.url)

  // Strava's one-time subscription verification (GET). Happens once, when
  // you register the webhook — see README-strava-setup.md.
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')
    if (mode === 'subscribe' && token === process.env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
      return Response.json({ 'hub.challenge': challenge })
    }
    return new Response('Forbidden', { status: 403 })
  }

  // Activity create/update events (POST). Strava expects a 200 within 2
  // seconds no matter what, so we always return ok at the end — errors are
  // swallowed rather than retried into a backlog.
  try {
    const event = await req.json()

    if (event.object_type === 'activity' && ['create', 'update'].includes(event.aggregate_type)) {
      const { data: connection } = await supabaseAdmin
        .from('strava_connections')
        .select('*')
        .eq('strava_athlete_id', event.owner_id)
        .maybeSingle()

      if (connection) {
        const accessToken = await getValidAccessToken(connection)
        const actRes = await fetch(`https://www.strava.com/api/v3/activities/${event.object_id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        const activity = await actRes.json()

        // Only running activities matter for a marathon training plan.
        // Drop this check if you ever want to ingest rides/swims too.
        if (activity.type === 'Run' || activity.sport_type === 'Run') {
          await supabaseAdmin.from('strava_activities').upsert(
            {
              strava_activity_id: activity.id,
              client_id: connection.client_id,
              activity_date: (activity.start_date_local || activity.start_date || '').slice(0, 10),
              distance_miles: Math.round((activity.distance / METERS_PER_MILE) * 100) / 100,
              moving_time_sec: activity.moving_time,
              activity_type: activity.type,
              name: activity.name,
            },
            { onConflict: 'strava_activity_id' }
          )
        }
      }
    }
  } catch (err) {
    console.error('strava-webhook error', err)
  }

  return Response.json({ status: 'ok' })
}

export const config = { runtime: 'edge' }
