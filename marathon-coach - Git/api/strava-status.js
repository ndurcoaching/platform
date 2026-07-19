import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Deliberately returns only a boolean + timestamp — never the row itself,
// so tokens never travel to the browser even by accident.
export default async (req) => {
  const url = new URL(req.url)
  const clientId = url.searchParams.get('client_id')
  if (!clientId) return Response.json({ connected: false }, { status: 400 })

  const { data } = await supabaseAdmin
    .from('strava_connections')
    .select('connected_at, scope')
    .eq('client_id', clientId)
    .maybeSingle()

  const hasFullAccess = !!data?.scope && data.scope.split(',').includes('activity:read_all')

  return Response.json({
    connected: !!data,
    connected_at: data?.connected_at || null,
    // Lets the portal warn "connected, but private activities are hidden"
    // instead of just showing a green checkmark that isn't telling the
    // whole story.
    full_access: !!data && hasFullAccess,
  })
}

export const config = { runtime: 'edge' }
