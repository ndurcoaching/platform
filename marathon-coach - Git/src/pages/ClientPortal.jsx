import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { DOW, PACE_LABELS, PACE_COLORS, PACE_BG, DEFAULT_GLOSSARY, toKey, buildCalendar, parsePlan } from '../lib/plan'
import { getStravaConnectUrl } from '../lib/strava'

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 12px 56px', boxSizing: 'border-box' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '28px 20px', width: '100%', maxWidth: 420, boxShadow: 'var(--shadow)', boxSizing: 'border-box' },
  wideCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px 14px', width: '100%', maxWidth: 880, boxShadow: 'var(--shadow)', boxSizing: 'border-box' },
  logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 },
  logoMark: { width: 36, height: 36, borderRadius: 8, background: '#0a5fd4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-fg)', fontWeight: 500, fontSize: 15, letterSpacing: '-0.5px' },
  logoText: { fontSize: 16, fontWeight: 500, letterSpacing: '-0.3px' },
  title: { fontSize: 22, fontWeight: 500, letterSpacing: '-0.5px', marginBottom: 6 },
  subtitle: { fontSize: 14, color: 'var(--text-2)', marginBottom: 28, lineHeight: 1.6 },
  group: { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: 500, color: 'var(--text-2)' },
  btn: { width: '100%', padding: '11px 20px', background: '#0a5fd4', color: 'var(--accent-fg)', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 500, marginTop: 8, transition: 'opacity 0.15s' },
  ghostBtn: { width: '100%', padding: '11px 20px', background: 'var(--surface-2)', color: 'var(--text)', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 500, marginTop: 8, border: '1px solid var(--border)' },
  error: { background: 'var(--red-bg)', border: '1px solid #f0b8b8', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, color: 'var(--red-text)', marginTop: 12 },
  notice: { background: 'var(--green-bg)', border: '1px solid #b8dcb6', borderRadius: 'var(--radius-sm)', padding: '14px 16px', fontSize: 13, color: 'var(--green-text)', marginTop: 4, lineHeight: 1.6 },
  stravaBanner: { display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20 },
  stravaText: { fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, textAlign: 'center' },
  stravaBtn: { flexShrink: 0, padding: '8px 14px', background: '#fc4c02', color: '#fff', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500, textDecoration: 'none', textAlign: 'center' },
  stravaConnectedBadge: { flexShrink: 0, fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 999, background: 'var(--green-bg)', color: 'var(--green-text)', textAlign: 'center', alignSelf: 'center' },
  toggleRow: { display: 'flex', gap: 4, background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: 3, marginBottom: 24 },
  toggleBtn: (active) => ({ flex: 1, padding: '8px 12px', borderRadius: 5, fontSize: 13, fontWeight: 500, background: active ? 'var(--surface)' : 'transparent', color: active ? 'var(--text)' : 'var(--text-3)', boxShadow: active ? 'var(--shadow)' : 'none' }),
  backLink: { textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-3)' },
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  signOutBtn: { fontSize: 13, color: 'var(--text-2)', textDecoration: 'underline' },
  waitingBox: { textAlign: 'center', padding: '48px 24px' },
  waitingIcon: { fontSize: 36, marginBottom: 14 },
  waitingTitle: { fontSize: 18, fontWeight: 500, marginBottom: 8 },
  waitingText: { fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, maxWidth: 420, margin: '0 auto' },
  monthNotReady: { textAlign: 'center', padding: '40px 20px', background: 'var(--surface-2)', borderRadius: 'var(--radius)', marginBottom: 20 },
  monthNav: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, flexWrap: 'wrap', rowGap: 8, justifyContent: 'center' },
  navBtn: { fontSize: 13, color: 'var(--text-2)', padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' },
  monthLabel: { fontSize: 15, fontWeight: 500, minWidth: 0, textAlign: 'center' },
  calGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 20 },
  dayOfWeekHeader: { fontSize: 11, fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'center', padding: '4px 0' },
  calCell: (isToday, inMonth) => ({
    minHeight: 76, borderRadius: 'var(--radius-sm)', border: isToday ? '1px solid var(--accent)' : '1px solid var(--border)',
    background: inMonth ? 'var(--surface)' : 'var(--surface-2)', opacity: inMonth ? 1 : 0.45, padding: '5px 6px', display: 'flex', flexDirection: 'column', gap: 3,
  }),
  calCellHeader: (isToday) => ({ fontSize: 11, fontWeight: isToday ? 700 : 500, color: isToday ? 'var(--accent)' : 'var(--text-3)' }),
  paceBadge: (pace) => ({ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px', padding: '1px 5px', borderRadius: 3, background: PACE_BG[pace] || 'var(--surface-2)', color: PACE_COLORS[pace] || 'var(--text-3)', display: 'inline-block', width: 'fit-content' }),
  milesText: { fontSize: 12, fontWeight: 500 },
  dayNotes: { fontSize: 10, color: 'var(--text-2)', lineHeight: 1.4, wordBreak: 'break-word' },
  sectionTitle: { fontSize: 12, fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 },
  weeklyTotals: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 },
  weeklyTotalCard: { flex: 1, minWidth: 100, background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', textAlign: 'center' },
  strengthGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 20 },
  strengthCell: { border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px', minHeight: 60 },
  strengthDayHeader: { fontSize: 10, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 },
  strengthText: { fontSize: 11, color: 'var(--text-2)', lineHeight: 1.4, whiteSpace: 'pre-wrap' },
  notesBox: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' },
  glossaryRow: { display: 'flex', gap: 10, marginBottom: 8 },
  glossaryDot: (pace) => ({ width: 8, height: 8, borderRadius: 4, background: PACE_COLORS[pace], flexShrink: 0, marginTop: 5 }),
  glossaryText: { fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 },
}

function fmtMonth(year, month) {
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

// ── Auth screen (sign in or create an account) ────────────────────────────────
function AuthScreen() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [signedUp, setSignedUp] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) { setError('Please enter your email and password.'); return }
    if (mode === 'signup' && password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setError('')
    setLoading(true)
    if (mode === 'signin') {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)
      if (err) setError(err.message)
      // On success, ClientPortal detects the new session and renders automatically
    } else {
      const { error: err } = await supabase.auth.signUp({ email, password })
      setLoading(false)
      if (err) setError(err.message)
      else setSignedUp(true)
    }
  }

  if (signedUp) return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}><div style={styles.logoMark}>N</div><span style={styles.logoText}>Ndur</span></div>
        <div style={styles.notice}>
          <strong>Check your email.</strong> We sent a confirmation link to {email}. Click it, then come back here and sign in.
        </div>
        <p style={styles.backLink}>
          <a href="#/portal" onClick={() => setSignedUp(false)} style={{ color: 'var(--text-2)', textDecoration: 'underline' }}>← Back to sign in</a>
        </p>
      </div>
    </div>
  )

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}><div style={styles.logoMark}>N</div><span style={styles.logoText}>Ndur</span></div>
        <h1 style={styles.title}>Your training portal</h1>
        <p style={styles.subtitle}>Sign in to view your training plan. Use the same email you submitted on your intake form.</p>

        <div style={styles.toggleRow}>
          <button type="button" style={styles.toggleBtn(mode === 'signin')} onClick={() => { setMode('signin'); setError('') }}>Sign in</button>
          <button type="button" style={styles.toggleBtn(mode === 'signup')} onClick={() => { setMode('signup'); setError('') }}>Create account</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.group}>
            <label style={styles.label}>Email</label>
            <input type="email" placeholder="jane@email.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? (mode === 'signin' ? 'Signing in…' : 'Creating account…') : (mode === 'signin' ? 'Sign in →' : 'Create account →')}
          </button>
        </form>
        <p style={styles.backLink}>
          <a href="#/" style={{ color: 'var(--text-2)', textDecoration: 'underline' }}>← Back to intake form</a>
        </p>
      </div>
    </div>
  )
}

// ── Strava connect banner — shared between the waiting screen and plan view ──
function StravaConnect({ clientId }) {
  const [connected, setConnected] = useState(false)
  const [flash, setFlash] = useState(
    window.location.hash.includes('strava=connected') ? 'connected'
      : window.location.hash.includes('strava=error') ? 'error'
      : null
  )

  useEffect(() => {
    if (flash) window.history.replaceState(null, '', window.location.pathname + '#/portal')
    fetch(`/api/strava-status?client_id=${clientId}`)
      .then(r => r.json())
      .then(d => setConnected(!!d.connected))
      .catch(() => {})
  }, [clientId])

  return (
    <>
      {flash === 'connected' && <div style={{ ...styles.notice, marginBottom: 16 }}>✓ Strava connected — your coach can now see your actual runs.</div>}
      {flash === 'error' && <div style={{ ...styles.error, marginBottom: 16, marginTop: 0 }}>Something went wrong connecting Strava. Please try again.</div>}
      <div style={styles.stravaBanner}>
        {connected ? (
          <span style={styles.stravaConnectedBadge}>● Connected to Strava</span>
        ) : (
          <>
            <span style={styles.stravaText}>Connect Strava so your coach can see your actual runs — your plan adjusts based on real training, not just check-ins.</span>
            <a href={getStravaConnectUrl(clientId)} style={styles.stravaBtn}>Connect Strava</a>
          </>
        )}
      </div>
    </>
  )
}

// ── "Your coach is still working on it" screen ────────────────────────────────
function WaitingScreen({ onSignOut, name, clientId }) {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.topbar}>
          <div style={styles.logo}><div style={styles.logoMark}>N</div><span style={styles.logoText}>Ndur</span></div>
          <button style={styles.signOutBtn} onClick={onSignOut}>Sign out</button>
        </div>
        <StravaConnect clientId={clientId} />
        <div style={styles.waitingBox}>
          <div style={styles.waitingIcon}>🏃</div>
          <div style={styles.waitingTitle}>{name ? `Hang tight, ${name.split(' ')[0]}` : 'Hang tight'}</div>
          <p style={styles.waitingText}>Your coach is still working on your training plan. Check back soon — you'll see it here as soon as it's ready.</p>
        </div>
      </div>
    </div>
  )
}

// ── "We couldn't match your account to a client record" screen ──────────────
function NotFoundScreen({ onSignOut }) {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.topbar}>
          <div style={styles.logo}><div style={styles.logoMark}>N</div><span style={styles.logoText}>Ndur</span></div>
          <button style={styles.signOutBtn} onClick={onSignOut}>Sign out</button>
        </div>
        <div style={styles.waitingBox}>
          <div style={styles.waitingIcon}>🔍</div>
          <div style={styles.waitingTitle}>We couldn't find your profile</div>
          <p style={styles.waitingText}>
            Make sure you signed up with the exact same email you used on your intake form. If you haven't submitted an intake form yet, do that first — then sign in here.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Read-only plan view ───────────────────────────────────────────────────────
function PlanView({ client, onSignOut }) {
  const { days, notes, glossary, strengthEnabled, strengthDays } = parsePlan(client.training_plan)
  const now = new Date()
  const dayKeys = Object.keys(days).filter(k => days[k] && (days[k].miles || days[k].pace || days[k].notes)).sort()

  // Default to the month of today, or the first month that has plan data, whichever is earlier
  const initialKey = dayKeys.find(k => k >= toKey(now)) || dayKeys[0] || toKey(now)
  const initialDate = new Date(initialKey + 'T00:00:00')
  const [viewYear, setViewYear] = useState(initialDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth())

  function changeMonth(delta) {
    const d = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
  }

  const calCells = buildCalendar(viewYear, viewMonth)
  const todayKey = toKey(now)

  // Weekly mileage totals for fully-visible weeks in this month view
  const weeks = []
  for (let i = 0; i < calCells.length; i += 7) weeks.push(calCells.slice(i, i + 7))
  const weeklyTotals = weeks
    .filter(w => w.some(c => c.isCurrentMonth))
    .map(w => Math.round(w.reduce((sum, c) => sum + (Number(days[c.key]?.miles) || 0), 0) * 10) / 10)
    .filter(total => total > 0)

  const usedPaceTypes = Array.from(new Set(Object.values(days).map(d => d?.pace).filter(Boolean)))

  const monthHasData = dayKeys.some(k => {
    const d = new Date(k + 'T00:00:00')
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth
  })

  return (
    <div style={styles.page}>
      <div style={styles.wideCard}>
        <div style={styles.topbar}>
          <div style={styles.logo}><div style={styles.logoMark}>N</div><span style={styles.logoText}>Ndur</span></div>
          <button style={styles.signOutBtn} onClick={onSignOut}>Sign out</button>
        </div>

        <h1 style={styles.title}>{client.name ? `${client.name.split(' ')[0]}'s training plan` : 'Your training plan'}</h1>
        <p style={styles.subtitle}>Your coach builds this month by month — check back as your race gets closer for upcoming weeks.</p>

        <StravaConnect clientId={client.id} />

        <div style={styles.monthNav}>
          <button style={styles.navBtn} onClick={() => changeMonth(-1)}>← Prev</button>
          <span style={styles.monthLabel}>{fmtMonth(viewYear, viewMonth)}</span>
          <button style={styles.navBtn} onClick={() => changeMonth(1)}>Next →</button>
        </div>

        {monthHasData ? (
          <>
            <div style={styles.calGrid}>
              {DOW.map(d => <div key={d} style={styles.dayOfWeekHeader}>{d}</div>)}
              {calCells.map(cell => {
                const day = days[cell.key] || {}
                const isToday = cell.key === todayKey
                return (
                  <div key={cell.key} style={styles.calCell(isToday, cell.isCurrentMonth)}>
                    <div style={styles.calCellHeader(isToday)}>{cell.date.getDate()}</div>
                    {cell.isCurrentMonth && (day.miles || day.pace || day.notes) && (
                      <>
                        {(day.miles || day.pace) && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {day.miles ? <span style={styles.milesText}>{day.miles} mi</span> : null}
                            {day.pace ? <span style={styles.paceBadge(day.pace)}>{PACE_LABELS[day.pace] || day.pace}</span> : null}
                          </div>
                        )}
                        {day.notes ? <div style={styles.dayNotes}>{day.notes}</div> : null}
                      </>
                    )}
                  </div>
                )
              })}
            </div>

            {weeklyTotals.length > 0 && (
              <div style={styles.weeklyTotals}>
                {weeklyTotals.map((total, i) => (
                  <div key={i} style={styles.weeklyTotalCard}>
                    <div style={{ fontSize: 16, fontWeight: 500 }}>{total} mi</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: 2 }}>Week {i + 1}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={styles.monthNotReady}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>🗓️</div>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>{fmtMonth(viewYear, viewMonth)} isn't ready yet</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Your coach hasn't built this month's plan. Check back soon, or look at a different month above.</div>
          </div>
        )}

        {strengthEnabled && Object.values(strengthDays || {}).some(v => v && v.trim()) && (
          <div style={{ marginBottom: 20 }}>
            <div style={styles.sectionTitle}>Weekly strength plan — same every week</div>
            <div style={styles.strengthGrid}>
              {DOW.map(d => (
                <div key={d} style={styles.strengthCell}>
                  <div style={styles.strengthDayHeader}>{d}</div>
                  <div style={styles.strengthText}>{strengthDays[d] || '—'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {notes && notes.trim() && (
          <div style={{ marginBottom: 20 }}>
            <div style={styles.sectionTitle}>Notes from your coach</div>
            <div style={styles.notesBox}>{notes}</div>
          </div>
        )}

        {usedPaceTypes.length > 0 && (
          <div>
            <div style={styles.sectionTitle}>Pace guide</div>
            {usedPaceTypes.map(pace => (
              (glossary?.[pace] || DEFAULT_GLOSSARY[pace]) && (
                <div key={pace} style={styles.glossaryRow}>
                  <div style={styles.glossaryDot(pace)} />
                  <div style={styles.glossaryText}><strong>{PACE_LABELS[pace] || pace}:</strong> {glossary?.[pace] || DEFAULT_GLOSSARY[pace]}</div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Top-level portal: figures out which screen to show ───────────────────────
export default function ClientPortal() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [client, setClient] = useState(null)
  const [clientLoading, setClientLoading] = useState(false)
  const [clientError, setClientError] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) { setClient(null); return }
    let cancelled = false
    setClientLoading(true)
    setClientError(false)
    // Only ever fetch the row matching the signed-in user's own email.
    // Row Level Security on the `clients` table is the real security
    // boundary (see supabase-setup.sql) — this filter is a belt-and-
    // suspenders match so the portal can never show the wrong
    // person's plan even if a policy is ever loosened by mistake.
    supabase
      .from('clients')
      .select('*')
      .ilike('email', session.user.email)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data, error }) => {
        if (cancelled) return
        setClientLoading(false)
        if (error || !data || data.length === 0) setClientError(true)
        else setClient(data[0])
      })
    return () => { cancelled = true }
  }, [session])

  async function signOut() {
    await supabase.auth.signOut()
    setClient(null)
  }

  if (authLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-3)', fontSize: 14 }}>Loading…</div>
  )

  if (!session) return <AuthScreen />

  if (clientLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-3)', fontSize: 14 }}>Loading…</div>
  )

  if (clientError || !client) return <NotFoundScreen onSignOut={signOut} />

  if (!client.training_plan) return <WaitingScreen onSignOut={signOut} name={client.name} clientId={client.id} />

  return <PlanView client={client} onSignOut={signOut} />
}
