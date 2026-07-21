import { useState } from 'react'
import { supabase } from '../supabase'

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 16px 80px' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '40px', width: '100%', maxWidth: 580, boxShadow: 'var(--shadow)' },
  logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 },
  logoMark: { width: 36, height: 36, borderRadius: 8, background: '#0a5fd4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-fg)', fontWeight: 500, fontSize: 15, letterSpacing: '-0.5px' },
  logoText: { fontSize: 16, fontWeight: 500, letterSpacing: '-0.3px' },
  title: { fontSize: 24, fontWeight: 500, letterSpacing: '-0.5px', marginBottom: 6 },
  subtitle: { fontSize: 14, color: 'var(--text-2)', marginBottom: 32, lineHeight: 1.6 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  full: { gridColumn: '1 / -1' },
  group: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 13, fontWeight: 500, color: 'var(--text-2)' },
  req: { color: 'var(--red-text)', marginLeft: 2 },
  divider: { borderTop: '1px solid var(--border)', margin: '24px 0' },
  agreementBox: {
    border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px',
    background: 'var(--bg)', maxHeight: 240, overflowY: 'auto', marginBottom: 14,
    fontSize: 13, lineHeight: 1.75, color: 'var(--text-2)',
  },
  agreementSection: { marginBottom: 14 },
  agreementTitle: { fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 4 },
  agreementText: { fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 },
  checkRow: { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' },
  checkbox: { marginTop: 2, width: 16, height: 16, accentColor: 'var(--accent)', flexShrink: 0, cursor: 'pointer' },
  checkLabel: { fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, cursor: 'pointer' },
  submitBtn: { width: '100%', padding: '11px 20px', background: 'var(--accent)', color: 'var(--accent-fg)', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 500, marginTop: 14, transition: 'opacity 0.15s', border: 'none', cursor: 'pointer' },
  successBox: { background: 'var(--green-bg)', border: '1px solid #b8dcb6', borderRadius: 'var(--radius)', padding: '20px 24px', textAlign: 'center' },
  errorBox: { background: 'var(--red-bg)', border: '1px solid #f0b8b8', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, color: 'var(--red-text)', marginTop: 12 },
  coachLink: { textAlign: 'center', marginTop: 28, fontSize: 13, color: 'var(--text-3)' },
  notice: { background: 'var(--green-bg)', border: '1px solid #b8dcb6', borderRadius: 'var(--radius-sm)', padding: '14px 16px', fontSize: 13, color: 'var(--green-text)', marginTop: 4, lineHeight: 1.6 },
  accountTitle: { fontSize: 17, fontWeight: 500, marginBottom: 6 },
  accountSubtitle: { fontSize: 13, color: 'var(--text-2)', marginBottom: 18, lineHeight: 1.6 },
  readOnlyInput: { opacity: 0.65, cursor: 'not-allowed' },
}

const EMPTY = {
  name: '', email: '', phone: '', gender: '', age: '', experience: '',
  weekly_mileage: '', goal_race: '', race_date: '', race_type: 'full',
  years_running: '', pr_5k: '', pr_10k: '', pr_half: '', pr_full: '',
  past_injuries: '', typical_weekly_structure: '',
}

export default function IntakeForm() {
  const [form, setForm] = useState(EMPTY)
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const [password, setPassword] = useState('')
  const [accountLoading, setAccountLoading] = useState(false)
  const [accountError, setAccountError] = useState('')
  const [accountCreated, setAccountCreated] = useState(false)

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

  async function handleCreateAccount(e) {
    e.preventDefault()
    if (password.length < 6) { setAccountError('Password must be at least 6 characters.'); return }
    setAccountError('')
    setAccountLoading(true)
    const { error: err } = await supabase.auth.signUp({ email: form.email.trim(), password })
    setAccountLoading(false)
    if (err) setAccountError(err.message)
    else setAccountCreated(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required.'); return }
    if (!agreed) { setError('You must read and agree to the coaching agreement, privacy policy, and liability waiver to continue.'); return }
    setError('')
    setSubmitting(true)
    const { error: err } = await supabase.from('clients').insert([{
      name: form.name.trim(), email: form.email.trim(),
      phone: form.phone.trim() || null, gender: form.gender || null,
      age: form.age ? parseInt(form.age) : null, experience: form.experience || null,
      weekly_mileage: form.weekly_mileage ? parseInt(form.weekly_mileage) : null,
      goal_race: form.goal_race.trim() || null, race_date: form.race_date || null,
      race_type: form.race_type || 'full',
      years_running: form.years_running ? parseFloat(form.years_running) : null,
      pr_5k: form.pr_5k.trim() || null, pr_10k: form.pr_10k.trim() || null,
      pr_half: form.pr_half.trim() || null, pr_full: form.pr_full.trim() || null,
      past_injuries: form.past_injuries.trim() || null,
      typical_weekly_structure: form.typical_weekly_structure.trim() || null,
      agreed_to_terms: true, agreed_at: new Date().toISOString(), agreement_version: 'v1.0',
    }])
    setSubmitting(false)
    if (err) { setError('Something went wrong. Please try again.'); console.error(err) }
    else setSubmitted(true)
  }

  if (submitted) return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}><div style={styles.logoMark}>N</div><span style={styles.logoText}>Ndur</span></div>
        <div style={styles.successBox}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 6 }}>You're all set, {form.name.split(' ')[0]}!</div>
          <div style={{ fontSize: 14, color: 'var(--text-2)' }}>Your coach will review your details and be in touch shortly.</div>
        </div>

        <div style={styles.divider} />

        {accountCreated ? (
          <div style={styles.notice}>
            <strong>Check your email.</strong> We sent a confirmation link to {form.email}. Click it, then come back and sign in at <a href="#/portal" style={{ color: 'var(--green-text)', textDecoration: 'underline' }}>your training portal</a> any time — your plan will be there once your coach has built it.
          </div>
        ) : (
          <>
            <div style={styles.accountTitle}>Create your portal account</div>
            <p style={styles.accountSubtitle}>Set a password now so you're ready to sign in and view your plan the moment your coach has it built.</p>
            <form onSubmit={handleCreateAccount}>
              <div style={styles.group}>
                <label style={styles.label}>Email</label>
                <input type="email" value={form.email} readOnly style={styles.readOnlyInput} />
              </div>
              <div style={{ ...styles.group, marginTop: 14 }}>
                <label style={styles.label}>Create a password</label>
                <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoFocus />
              </div>
              {accountError && <div style={styles.errorBox}>{accountError}</div>}
              <button type="submit" style={{ ...styles.submitBtn, opacity: accountLoading ? 0.6 : 1 }} disabled={accountLoading}>
                {accountLoading ? 'Creating account…' : 'Create account →'}
              </button>
            </form>
            <p style={styles.coachLink}>
              Already have a portal account? <a href="#/portal" style={{ color: 'var(--text-2)', textDecoration: 'underline' }}>Sign in →</a>
            </p>
          </>
        )}
      </div>
    </div>
  )

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}><div style={styles.logoMark}>N</div><span style={styles.logoText}>Ndur</span></div>
        <h1 style={styles.title}>Athlete intake form</h1>
        <p style={styles.subtitle}>Fill this out so your coach can build a training plan tailored to your goals and experience.</p>

        <form onSubmit={handleSubmit}>
          <div style={styles.grid}>
            <div style={styles.group}>
              <label style={styles.label}>Full name <span style={styles.req}>*</span></label>
              <input type="text" placeholder="Jane Smith" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div style={styles.group}>
              <label style={styles.label}>Email address <span style={styles.req}>*</span></label>
              <input type="email" placeholder="jane@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div style={styles.group}>
              <label style={styles.label}>Phone number</label>
              <input type="tel" placeholder="+1 (555) 000-0000" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div style={styles.group}>
              <label style={styles.label}>Gender</label>
              <select value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="">Select…</option>
                <option>Male</option>
                <option>Female</option>
              </select>
            </div>
            <div style={styles.group}>
              <label style={styles.label}>Age</label>
              <input type="number" placeholder="32" min="10" max="99" value={form.age} onChange={e => set('age', e.target.value)} />
            </div>
            <div style={styles.group}>
              <label style={styles.label}>Running experience</label>
              <select value={form.experience} onChange={e => set('experience', e.target.value)}>
                <option value="">Select…</option>
                <option value="Beginner (less than 1 year)">Beginner — less than 1 year</option>
                <option value="Intermediate (1–3 years)">Intermediate — 1–3 years</option>
                <option value="Experienced (3–7 years)">Experienced — 3–7 years</option>
                <option value="Advanced (7+ years)">Advanced — 7+ years</option>
              </select>
            </div>
            <div style={styles.group}>
              <label style={styles.label}>Current weekly mileage</label>
              <input type="number" placeholder="25" min="0" value={form.weekly_mileage} onChange={e => set('weekly_mileage', e.target.value)} />
            </div>
            <div style={styles.group}>
              <label style={styles.label}>Goal race</label>
              <input type="text" placeholder="Chicago Marathon" value={form.goal_race} onChange={e => set('goal_race', e.target.value)} />
            </div>
            <div style={styles.group}>
              <label style={styles.label}>Race distance</label>
              <select value={form.race_type} onChange={e => set('race_type', e.target.value)}>
                <option value="5k">5K</option>
                <option value="10k">10K</option>
                <option value="half">Half Marathon</option>
                <option value="full">Full Marathon</option>
              </select>
            </div>
            <div style={{ ...styles.group, ...styles.full }}>
              <label style={styles.label}>Goal race date</label>
              <input type="date" value={form.race_date} onChange={e => set('race_date', e.target.value)} style={{ maxWidth: 200 }} />
            </div>
          </div>

          <div style={styles.divider} />

          {/* Running history */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 14 }}>Running history</div>
            <div style={styles.grid}>
              <div style={styles.group}>
                <label style={styles.label}>Years running</label>
                <input type="number" min="0" max="60" step="0.5" placeholder="3" value={form.years_running} onChange={e => set('years_running', e.target.value)} />
              </div>
              <div style={styles.group}>
                <label style={styles.label}>5K PR (if known)</label>
                <input type="text" placeholder="24:30" value={form.pr_5k} onChange={e => set('pr_5k', e.target.value)} />
              </div>
              <div style={styles.group}>
                <label style={styles.label}>10K PR (if known)</label>
                <input type="text" placeholder="51:00" value={form.pr_10k} onChange={e => set('pr_10k', e.target.value)} />
              </div>
              <div style={styles.group}>
                <label style={styles.label}>Half marathon PR (if known)</label>
                <input type="text" placeholder="1:52:00" value={form.pr_half} onChange={e => set('pr_half', e.target.value)} />
              </div>
              <div style={{ ...styles.group, ...styles.full }}>
                <label style={styles.label}>Marathon PR (if known)</label>
                <input type="text" placeholder="3:58:00" value={form.pr_full} onChange={e => set('pr_full', e.target.value)} style={{ maxWidth: 200 }} />
              </div>
              <div style={{ ...styles.group, ...styles.full }}>
                <label style={styles.label}>Past injuries</label>
                <textarea placeholder="e.g. IT band syndrome (2023), recovered fully" value={form.past_injuries} onChange={e => set('past_injuries', e.target.value)} style={{ minHeight: 70, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div style={{ ...styles.group, ...styles.full }}>
                <label style={styles.label}>Typical weekly training structure</label>
                <textarea placeholder="e.g. I run 4 days a week, usually Tue/Thu/Sat/Sun, with Saturday as my long run" value={form.typical_weekly_structure} onChange={e => set('typical_weekly_structure', e.target.value)} style={{ minHeight: 70, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
            </div>
          </div>

          <div style={styles.divider} />

          {/* Agreements */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 10 }}>Agreements <span style={styles.req}>*</span></div>
            <div style={styles.agreementBox}>
              <div style={styles.agreementSection}>
                <div style={styles.agreementTitle}>1. Coaching Services Agreement</div>
                <div style={styles.agreementText}>Ndur will provide personalized marathon training services including customized monthly training plans, regular updates, and communication via agreed channels. Services are billed monthly. Either party may cancel with 14 days written notice. No refunds are issued for partial months already in progress. The Athlete agrees to provide accurate intake information, obtain medical clearance from a licensed physician before beginning training, and communicate any injuries or life changes that may affect training. Coaching services are fitness and performance coaching only and do not constitute medical advice, diagnosis, or treatment.</div>
              </div>
              <div style={styles.agreementSection}>
                <div style={styles.agreementTitle}>2. Privacy Policy</div>
                <div style={styles.agreementText}>Ndur collects your name, contact information, and fitness data solely to provide coaching services. Your data is stored securely and is never sold, rented, or shared with third parties for any commercial purpose. You may request access to or deletion of your data at any time by contacting your coach directly.</div>
              </div>
              <div style={styles.agreementSection}>
                <div style={styles.agreementTitle}>3. Liability Waiver & Release</div>
                <div style={styles.agreementText}>I acknowledge that marathon training involves inherent risks including musculoskeletal injury, cardiovascular events, heat-related illness, and other physical risks. I voluntarily assume all such risks and confirm I have obtained or will obtain medical clearance from a licensed physician before beginning this program. I hereby release Ndur, its owners, coaches, and affiliates from any and all claims arising from my participation in training activities, including claims arising from negligence, to the fullest extent permitted by applicable law. I confirm I am at least 18 years of age and am entering this agreement voluntarily.</div>
              </div>
            </div>
            <div style={styles.checkRow}>
              <input
                type="checkbox"
                id="agree-checkbox"
                style={styles.checkbox}
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
              />
              <label htmlFor="agree-checkbox" style={styles.checkLabel}>
                I have read and agree to the Ndur{' '}
                <a href="https://ndurcoaching.github.io/webpage/ndur_athlete_agreements.html#coaching-agreement" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Coaching Services Agreement</a>,{' '}
                <a href="https://ndurcoaching.github.io/webpage/ndur_athlete_agreements.html#privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Privacy Policy</a>, and{' '}
                <a href="https://ndurcoaching.github.io/webpage/ndur_athlete_agreements.html#liability-waiver" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Liability Waiver</a>.{' '}
                I understand that checking this box serves as my electronic signature and constitutes a legally binding agreement.
              </label>
            </div>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          <button type="submit" style={{ ...styles.submitBtn, opacity: (submitting || !agreed) ? 0.6 : 1 }} disabled={submitting || !agreed}>
            {submitting ? 'Submitting…' : 'Submit intake form →'}
          </button>
        </form>

        <p style={styles.coachLink}>
          Already submitted? <a href="#/portal" style={{ color: 'var(--text-2)', textDecoration: 'underline' }}>View your training plan →</a>
        </p>
        <p style={styles.coachLink}>
          Are you the coach? <a href="#/coach" style={{ color: 'var(--text-2)', textDecoration: 'underline' }}>Go to dashboard →</a>
        </p>
      </div>
    </div>
  )
}
