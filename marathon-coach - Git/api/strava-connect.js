// Redirects a client to Strava's authorization screen. Called from a
// "Connect Strava" button in the client portal, passing their own client_id
// (it's a uuid, not a secret — knowing it only lets someone link THAT
// client's Strava account, nothing else).

export default async (req) => {
  const url = new URL(req.url)
  const clientId = url.searchParams.get('client_id')
  if (!clientId) return new Response('Missing client_id', { status: 400 })

  const redirectUri = `${process.env.SITE_URL}/api/strava-callback`

  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'activity:read_all',
    state: clientId,
  })

  return Response.redirect(`https://www.strava.com/oauth/authorize?${params.toString()}`, 302)
}

export const config = { runtime: 'edge' }
