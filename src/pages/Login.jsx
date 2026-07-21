import { useState } from 'react'
import { supabase } from '../supabase'

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '40px',
    width: '100%',
    maxWidth: 400,
    boxShadow: 'var(--shadow)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 32,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 8,
    background: '#0a5fd4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--accent-fg)',
    fontWeight: 500,
    fontSize: 15,
    letterSpacing: '-0.5px',
  },
  logoText: {
    fontSize: 16,
    fontWeight: 500,
    letterSpacing: '-0.3px',
  },
  title: {
    fontSize: 22,
    fontWeight: 500,
    letterSpacing: '-0.5px',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: 'var(--text-2)',
    marginBottom: 28,
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-2)',
  },
  btn: {
    width: '100%',
    padding: '11px 20px',
    background: '#0a5fd4',
    color: 'var(--accent-fg)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 14,
    fontWeight: 500,
    marginTop: 8,
    transition: 'opacity 0.15s',
  },
  error: {
    background: 'var(--red-bg)',
    border: '1px solid #f0b8b8',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 14px',
    fontSize: 13,
    color: 'var(--red-text)',
    marginTop: 12,
  },
  backLink: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 13,
    color: 'var(--text-3)',
  },
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) setError(err.message)
    // On success, App.jsx detects the new session and renders Dashboard automatically
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.logoMark}>N</div>
          <span style={styles.logoText}>Ndur</span>
        </div>
        <h1 style={styles.title}>Coach sign in</h1>
        <p style={styles.subtitle}>Your clients' data is private. Only you can access this dashboard.</p>
        <form onSubmit={handleLogin}>
          <div style={styles.group}>
            <label style={styles.label}>Email</label>
            <input type="email" placeholder="coach@email.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>
        <p style={styles.backLink}>
          <a href="#/intake" style={{ color: 'var(--text-2)', textDecoration: 'underline' }}>← Back to intake form</a>
        </p>
      </div>
    </div>
  )
}
