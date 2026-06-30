import { createClient } from '@supabase/supabase-js'

// Service role key — bypasses RLS. Only ever used server-side, in functions.
// Never expose this key to the frontend bundle.
const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async (req) => {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const clientId = url.searchParams.get('state')
  const oauthError = url.searchParams.get('error') // set by Strava if the client hits "Cancel"

  const portalUrl = `${process.env.SITE_URL}/#/portal`

  if (oauthError || !code || !clientId) {
    return Response.redirect(`${portalUrl}?strava=error`, 302)
  }

  const tokenRes = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  })
  const tokenData = await tokenRes.json()

  if (!tokenData.access_token) {
    return Response.redirect(`${portalUrl}?strava=error`, 302)
  }

  const { access_token, refresh_token, expires_at, athlete } = tokenData

  const { error: dbError } = await supabaseAdmin
    .from('strava_connections')
    .upsert(
      {
        client_id: clientId,
        strava_athlete_id: athlete.id,
        access_token,
        refresh_token,
        expires_at,
      },
      { onConflict: 'client_id' }
    )

  if (dbError) {
    return Response.redirect(`${portalUrl}?strava=error`, 302)
  }

  return Response.redirect(`${portalUrl}?strava=connected`, 302)
}

export const config = { runtime: 'edge' }
