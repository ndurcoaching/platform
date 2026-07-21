import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import IntakeForm from './pages/IntakeForm'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Preferences from './pages/Preferences'
import ClientPortal from './pages/ClientPortal'

function getRoute() {
  const hash = window.location.hash
  if (hash.startsWith('#/coach/preferences')) return 'preferences'
  if (hash.startsWith('#/coach')) return 'coach'
  if (hash.startsWith('#/portal')) return 'portal'
  return 'intake'
}

export default function App() {
  const [route, setRoute] = useState(getRoute)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    const onHashChange = () => setRoute(getRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => { subscription.unsubscribe(); window.removeEventListener('hashchange', onHashChange) }
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-3)', fontSize: 14 }}>Loading…</div>
  )

  if (route === 'intake') return <IntakeForm />
  if (route === 'portal') return <ClientPortal />
  if (route === 'coach' || route === 'preferences') {
    if (!session) return <Login />
    if (route === 'preferences') return <Preferences session={session} onBack={() => { window.location.hash = '#/coach'; setRoute('coach') }} />
    return <Dashboard session={session} />
  }
  return <IntakeForm />
}
