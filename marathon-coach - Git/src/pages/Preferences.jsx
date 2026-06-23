import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { DEFAULT_GENERAL_PREFS, DEFAULT_RACE_PREFS, RACE_TYPES, RACE_LABELS } from '../lib/defaultPrefs'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const ALL_TYPES = ['easy', 'tempo', 'race', 'fartlek', 'intervals', 'recovery', 'long', 'walk']
const TYPE_LABELS = { easy: 'Easy', tempo: 'Tempo', race: 'Race pace', fartlek: 'Fartlek', intervals: 'Intervals', recovery: 'Recovery', long: 'Long run', walk: 'Walk/Run' }
const TIERS = [['beginner', 'Beginner', 'Under 10 mi/wk'], ['intermediate', 'Intermediate', '10–25 mi/wk'], ['advanced', 'Advanced', '25+ mi/wk']]

const s = {
  page: { padding: '32px', maxWidth: 800, margin: '0 auto' },
  title: { fontSize: 22, fontWeight: 500, letterSpacing: '-0.5px', marginBottom: 6 },
  subtitle: { fontSize: 14, color: 'var(--text-2)', marginBottom: 24 },
  tabRow: { display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid var(--border)', paddingBottom: 0 },
  tab: (active) => ({
    padding: '10px 18px', fontSize: 14, fontWeight: active ? 500 : 400, cursor: 'pointer',
    color: active ? 'var(--text)' : 'var(--text-3)', background: 'none', border: 'none',
    borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
    marginBottom: -1,
  }),
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '22px 26px', marginBottom: 16 },
  cardTitle: { fontSize: 13, fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 },
  row: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 16, flexWrap: 'wrap' },
  rowLabel: { fontSize: 14, color: 'var(--text)', fontWeight: 400 },
  rowSub: { fontSize: 12, color: 'var(--text-3)', marginTop: 2, maxWidth: 380 },
  select: { fontSize: 13, padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', color: 'var(--text)', outline: 'none', minWidth: 120 },
  numInput: { fontSize: 13, padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', color: 'var(--text)', outline: 'none', width: 72, textAlign: 'center' },
  textarea: { fontSize: 13, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', color: 'var(--text)', outline: 'none', width: '100%', resize: 'vertical', minHeight: 60, lineHeight: 1.6, fontFamily: 'var(--font)' },
  dayGrid: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  dayBtn: (active) => ({
    padding: '5px 12px', borderRadius: 'var(--radius-sm)', fontSize: 13, cursor: 'pointer', border: '1px solid',
    fontWeight: active ? 500 : 400,
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? 'var(--accent-fg)' : 'var(--text-2)',
    borderColor: active ? 'var(--accent)' : 'var(--border)',
  }),
  divider: { borderTop: '1px solid var(--border)', margin: '16px 0' },
  tierGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },
  tierCard: (tier) => ({
    border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px',
    borderTop: `3px solid ${tier === 'beginner' ? '#2a6e3a' : tier === 'intermediate' ? '#7a5a00' : '#0a5fd4'}`,
  }),
  tierLabel: (tier) => ({
    fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4,
    color: tier === 'beginner' ? '#2a6e3a' : tier === 'intermediate' ? '#7a5a00' : '#0a5fd4',
  }),
  tierSub: { fontSize: 11, color: 'var(--text-3)', marginBottom: 12 },
  paceRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  paceLabel: { fontSize: 12, color: 'var(--text-2)' },
  paceInput: { fontSize: 12, padding: '4px 6px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--surface-2)', color: 'var(--text)', outline: 'none', width: 52, textAlign: 'center' },
  totalRow: (valid) => ({ fontSize: 11, marginTop: 8, color: valid ? 'var(--green-text)' : 'var(--red-text)', fontWeight: 500 }),
  typeGrid: { display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 },
  typeBtn: (active, type) => {
    const colors = { easy: '#2a6e3a', tempo: '#7a5a00', race: '#7a2222', fartlek: '#0a5fd4', intervals: '#5a2a7a', recovery: '#5a5650', long: '#2a5a6e', walk: '#3a3a7a' }
    const bgs = { easy: '#edf5ec', tempo: '#fdf3e3', race: '#fdeeed', fartlek: '#e8f0fd', intervals: '#f3edf8', recovery: '#f0f0f0', long: '#e8f4f8', walk: '#f0f0f8' }
    return { padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: 12, cursor: 'pointer', border: `1px solid ${active ? colors[type] : 'var(--border)'}`, background: active ? bgs[type] : 'transparent', color: active ? colors[type] : 'var(--text-3)', fontWeight: active ? 500 : 400 }
  },
  saveBtn: { padding: '10px 24px', background: 'var(--accent)', color: 'var(--accent-fg)', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', marginTop: 8 },
  savedMsg: { fontSize: 13, color: 'var(--green-text)', marginLeft: 12, display: 'inline-block' },
  resetBtn: { fontSize: 13, color: 'var(--text-3)', background: 'transparent', border: 'none', cursor: 'pointer', marginLeft: 12, textDecoration: 'underline' },
  infoBox: { background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, marginTop: 8 },
  emphasisBtn: (active) => ({
    padding: '6px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13, cursor: 'pointer', border: '1px solid',
    fontWeight: active ? 500 : 400,
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? 'var(--accent-fg)' : 'var(--text-2)',
    borderColor: active ? 'var(--accent)' : 'var(--border)',
  }),
}

function pct(val) { return Math.round((val || 0) * 100) }
function dec(val) { return parseFloat(val) / 100 }
function totalPct(dist) { return Math.round(Object.values(dist || {}).reduce((a, b) => a + b, 0) * 100) }

export default function Preferences({ session, onBack }) {
  const [tab, setTab] = useState('general') // 'general' | '5k' | '10k' | 'half' | 'full'
  const [general, setGeneral] = useState(DEFAULT_GENERAL_PREFS)
  const [raceAll, setRaceAll] = useState(DEFAULT_RACE_PREFS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('coach_prefs').select('prefs').eq('coach_id', session.user.id).single()
      if (data?.prefs) {
        if (data.prefs.general) setGeneral(p => ({ ...DEFAULT_GENERAL_PREFS, ...data.prefs.general }))
        if (data.prefs.race) {
          setRaceAll(prev => {
            const merged = { ...DEFAULT_RACE_PREFS }
            for (const key of RACE_TYPES) merged[key] = { ...DEFAULT_RACE_PREFS[key], ...(data.prefs.race[key] || {}) }
            return merged
          })
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  function setG(path, value) {
    setGeneral(p => {
      const clone = JSON.parse(JSON.stringify(p))
      const keys = path.split('.')
      let obj = clone
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]]
      obj[keys[keys.length - 1]] = value
      return clone
    })
  }

  function setR(raceType, path, value) {
    setRaceAll(p => {
      const clone = JSON.parse(JSON.stringify(p))
      const keys = path.split('.')
      let obj = clone[raceType]
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]]
      obj[keys[keys.length - 1]] = value
      return clone
    })
  }

  function toggleGeneralDay(field, day) {
    setGeneral(p => {
      const arr = p[field] || []
      return { ...p, [field]: arr.includes(day) ? arr.filter(d => d !== day) : [...arr, day] }
    })
  }

  function toggleRestDay(day) {
    setGeneral(p => {
      const days = p.restDays.days.includes(day) ? p.restDays.days.filter(d => d !== day) : [...p.restDays.days, day]
      return { ...p, restDays: { ...p.restDays, days } }
    })
  }

  function toggleAllowedType(tier, type) {
    setGeneral(p => {
      const arr = p.allowedTypes[tier] || []
      return { ...p, allowedTypes: { ...p.allowedTypes, [tier]: arr.includes(type) ? arr.filter(t => t !== type) : [...arr, type] } }
    })
  }

  async function save() {
    setSaving(true)
    await supabase.from('coach_prefs').upsert({
      coach_id: session.user.id,
      prefs: { general, race: raceAll },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'coach_id' })
    setSaving(false)
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2500)
  }

  function resetGeneral() {
    if (window.confirm('Reset general preferences to defaults?')) setGeneral(DEFAULT_GENERAL_PREFS)
  }
  function resetRace(raceType) {
    if (window.confirm(`Reset ${RACE_LABELS[raceType]} preferences to defaults?`)) {
      setRaceAll(p => ({ ...p, [raceType]: DEFAULT_RACE_PREFS[raceType] }))
    }
  }

  if (loading) return <div style={{ padding: 32, color: 'var(--text-3)', fontSize: 14 }}>Loading preferences…</div>

  const race = raceAll[tab] // undefined when tab === 'general'

  return (
    <div style={s.page}>
      <button onClick={onBack} style={{ fontSize: 13, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 20 }}>← Back to dashboard</button>
      <h1 style={s.title}>Coaching preferences</h1>
      <p style={s.subtitle}>General preferences apply to every athlete. Race-specific tabs override the dials that genuinely differ by distance.</p>

      <div style={s.tabRow}>
        <button style={s.tab(tab === 'general')} onClick={() => setTab('general')}>General</button>
        {RACE_TYPES.map(rt => (
          <button key={rt} style={s.tab(tab === rt)} onClick={() => setTab(rt)}>{RACE_LABELS[rt]}</button>
        ))}
      </div>

      {/* ══════════ GENERAL TAB ══════════ */}
      {tab === 'general' && (
        <>
          <div style={s.card}>
            <div style={s.cardTitle}>Weekly structure</div>
            <div style={s.row}>
              <div><div style={s.rowLabel}>Long run day</div><div style={s.rowSub}>Gets the longest run of the week, across all race distances</div></div>
              <select style={s.select} value={general.longRunDay} onChange={e => setG('longRunDay', e.target.value)}>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div style={s.divider} />
            <div style={{ marginBottom: 14 }}>
              <div style={s.rowLabel}>Preferred rest days</div>
              <div style={{ ...s.rowSub, marginBottom: 10 }}>These days get rest first; extra rest days fill from remaining days</div>
              <div style={s.dayGrid}>{DAYS.map(d => <button key={d} style={s.dayBtn(general.restDays.days.includes(d))} onClick={() => toggleRestDay(d)}>{d}</button>)}</div>
            </div>
            <div style={s.divider} />
            <div style={{ marginBottom: 14 }}>
              <div style={s.rowLabel}>Hard workout days</div>
              <div style={{ ...s.rowSub, marginBottom: 10 }}>Tempo, intervals, fartlek, and race pace runs land on these days</div>
              <div style={s.dayGrid}>{DAYS.map(d => <button key={d} style={s.dayBtn((general.hardWorkoutDays || []).includes(d))} onClick={() => toggleGeneralDay('hardWorkoutDays', d)}>{d}</button>)}</div>
            </div>
            <div style={s.divider} />
            <div style={s.row}>
              <div><div style={s.rowLabel}>No back-to-back hard workouts</div><div style={s.rowSub}>Never assign two hard efforts on consecutive days</div></div>
              <select style={s.select} value={general.noBackToBackHard ? 'yes' : 'no'} onChange={e => setG('noBackToBackHard', e.target.value === 'yes')}>
                <option value="yes">Enforced</option><option value="no">Not enforced</option>
              </select>
            </div>
            <div style={s.divider} />
            <div>
              <div style={s.rowLabel}>Rest days per week by mileage</div>
              <div style={{ ...s.rowSub, marginBottom: 12 }}>How many days off per week based on current weekly mileage</div>
              {[['low', 'Under 10 mi/wk'], ['mid', '10–25 mi/wk'], ['high', '25+ mi/wk']].map(([key, label]) => (
                <div key={key} style={{ ...s.row, marginBottom: 10 }}>
                  <span style={s.rowSub}>{label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="number" min="0" max="6" style={s.numInput} value={general.restDays[key]} onChange={e => setG(`restDays.${key}`, parseInt(e.target.value) || 0)} />
                    <span style={{ fontSize: 13, color: 'var(--text-3)' }}>days</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={s.card}>
            <div style={s.cardTitle}>Allowed workout types by tier</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>Which run types are introduced at each experience level, across all race distances.</div>
            <div style={s.tierGrid}>
              {TIERS.map(([tier, label, sub]) => (
                <div key={tier} style={s.tierCard(tier)}>
                  <div style={s.tierLabel(tier)}>{label}</div>
                  <div style={s.tierSub}>{sub}</div>
                  <div style={s.typeGrid}>
                    {ALL_TYPES.map(type => (
                      <button key={type} style={s.typeBtn((general.allowedTypes?.[tier] || []).includes(type), type)} onClick={() => toggleAllowedType(tier, type)}>{TYPE_LABELS[type]}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={s.card}>
            <div style={s.cardTitle}>Long run auto-note</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 10 }}>Use <code style={{ background: 'var(--surface-2)', padding: '1px 5px', borderRadius: 3 }}>[RACE_PACE]</code> to insert the athlete's estimated goal pace.</div>
            <textarea style={s.textarea} value={general.longRunNote || ''} onChange={e => setG('longRunNote', e.target.value)} />
          </div>

          <div style={s.card}>
            <div style={s.cardTitle}>Fartlek auto-note</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 10 }}>Use <code style={{ background: 'var(--surface-2)', padding: '1px 5px', borderRadius: 3 }}>[MILES]</code> to insert the day's mileage.</div>
            <textarea style={s.textarea} value={general.fartlekDescription || ''} onChange={e => setG('fartlekDescription', e.target.value)} />
          </div>

          <div style={s.card}>
            <div style={s.cardTitle}>Walk / run progression</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>For beginner athletes with Walk/Run enabled. Starts at 1 min run / 1 min walk and progresses toward continuous running.</div>
            <div style={s.row}>
              <div><div style={s.rowLabel}>Weeks to reach full running</div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="number" min="2" max="24" style={s.numInput} value={general.walkRunIntervals?.progressWeeks ?? 8} onChange={e => setG('walkRunIntervals.progressWeeks', parseInt(e.target.value) || 8)} />
                <span style={{ fontSize: 13, color: 'var(--text-3)' }}>weeks</span>
              </div>
            </div>
          </div>

          <div>
            <button style={s.saveBtn} onClick={save} disabled={saving}>{saving ? 'Saving…' : '✓ Save all preferences'}</button>
            <button style={s.resetBtn} onClick={resetGeneral}>Reset general to defaults</button>
            {savedMsg && <span style={s.savedMsg}>✓ Saved!</span>}
          </div>
        </>
      )}

      {/* ══════════ RACE-SPECIFIC TABS ══════════ */}
      {tab !== 'general' && race && (
        <>
          <div style={s.card}>
            <div style={s.cardTitle}>{RACE_LABELS[tab]} — mileage progression</div>
            <div style={s.row}>
              <div><div style={s.rowLabel}>Weekly increase rate</div><div style={s.rowSub}>How much mileage grows each non-cutback week</div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="number" min="0" max="30" style={s.numInput} value={Math.round((race.weeklyIncreaseRate || 0.10) * 100)} onChange={e => setR(tab, 'weeklyIncreaseRate', dec(e.target.value))} />
                <span style={{ fontSize: 13, color: 'var(--text-3)' }}>%</span>
              </div>
            </div>
            <div style={s.divider} />
            <div style={s.row}>
              <div><div style={s.rowLabel}>Minimum weekly increase</div><div style={s.rowSub}>Uses the greater of this minimum or the % rate above</div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="number" min="0" max="10" step="0.5" style={s.numInput} value={race.minWeeklyIncreaseMiles ?? 2} onChange={e => setR(tab, 'minWeeklyIncreaseMiles', parseFloat(e.target.value) || 0)} />
                <span style={{ fontSize: 13, color: 'var(--text-3)' }}>miles min</span>
              </div>
            </div>
            <div style={s.divider} />
            <div>
              <div style={s.rowLabel}>Max weekly mileage by tier</div>
              <div style={{ ...s.rowSub, marginBottom: 12 }}>Hard ceiling for {RACE_LABELS[tab]} training</div>
              {TIERS.map(([tier, label]) => (
                <div key={tier} style={{ ...s.row, marginBottom: 10 }}>
                  <span style={s.rowSub}>{label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="number" min="3" max="100" style={s.numInput} value={race.weeklyMileageCap?.[tier] ?? 20} onChange={e => setR(tab, `weeklyMileageCap.${tier}`, parseInt(e.target.value) || 10)} />
                    <span style={{ fontSize: 13, color: 'var(--text-3)' }}>mi/wk max</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={s.card}>
            <div style={s.cardTitle}>{RACE_LABELS[tab]} — long run</div>
            <div style={s.row}>
              <div><div style={s.rowLabel}>Long run emphasis</div><div style={s.rowSub}>How central the long run is vs. speed work. Lower emphasis means a smaller % of weekly miles goes to the long run.</div></div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['low', 'medium-low', 'high'].map(level => (
                  <button key={level} style={s.emphasisBtn(race.longRunEmphasis === level)} onClick={() => setR(tab, 'longRunEmphasis', level)}>
                    {level === 'low' ? 'Low' : level === 'medium-low' ? 'Medium' : 'High'}
                  </button>
                ))}
              </div>
            </div>
            <div style={s.divider} />
            <div>
              <div style={s.rowLabel}>Max long run distance by tier</div>
              <div style={{ ...s.rowSub, marginBottom: 12 }}>Caps the longest run regardless of weekly mileage</div>
              {TIERS.map(([tier, label]) => (
                <div key={tier} style={{ ...s.row, marginBottom: 10 }}>
                  <span style={s.rowSub}>{label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="number" min="2" max="26" style={s.numInput} value={race.longRunCap?.[tier] ?? 10} onChange={e => setR(tab, `longRunCap.${tier}`, parseInt(e.target.value) || 5)} />
                    <span style={{ fontSize: 13, color: 'var(--text-3)' }}>mi max</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={s.card}>
            <div style={s.cardTitle}>{RACE_LABELS[tab]} — taper & recovery</div>
            <div style={s.row}>
              <div><div style={s.rowLabel}>Taper length</div><div style={s.rowSub}>Weeks before race day to begin reducing mileage</div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="number" min="0.5" max="4" step="0.5" style={s.numInput} value={race.taperWeeks ?? 1} onChange={e => setR(tab, 'taperWeeks', parseFloat(e.target.value) || 1)} />
                <span style={{ fontSize: 13, color: 'var(--text-3)' }}>weeks out</span>
              </div>
            </div>
            <div style={s.divider} />
            <div style={s.row}>
              <div><div style={s.rowLabel}>Taper mileage reduction</div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="number" min="0" max="80" style={s.numInput} value={Math.round((race.taperReductionPct ?? 0.40) * 100)} onChange={e => setR(tab, 'taperReductionPct', dec(e.target.value))} />
                <span style={{ fontSize: 13, color: 'var(--text-3)' }}>% reduction</span>
              </div>
            </div>
            <div style={s.divider} />
            <div style={s.row}>
              <div><div style={s.rowLabel}>Mandatory rest after race day</div><div style={s.rowSub}>Weeks of no running — optional light walking/cross-training only</div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="number" min="0" max="4" style={s.numInput} value={race.postRaceRestWeeks ?? 0} onChange={e => setR(tab, 'postRaceRestWeeks', parseInt(e.target.value) || 0)} />
                <span style={{ fontSize: 13, color: 'var(--text-3)' }}>weeks</span>
              </div>
            </div>
          </div>

          <div style={s.card}>
            <div style={s.cardTitle}>{RACE_LABELS[tab]} — pace distribution by tier</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>Percentage of running days assigned each workout type for this distance. Must total 100% per tier.</div>
            <div style={s.tierGrid}>
              {TIERS.map(([tier, label, sub]) => {
                const dist = race.paceDistribution?.[tier] || {}
                const total = totalPct(dist)
                const valid = total === 100
                return (
                  <div key={tier} style={s.tierCard(tier)}>
                    <div style={s.tierLabel(tier)}>{label}</div>
                    <div style={s.tierSub}>{sub}</div>
                    {ALL_TYPES.map(type => (
                      <div key={type} style={s.paceRow}>
                        <span style={s.paceLabel}>{TYPE_LABELS[type]}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input type="number" min="0" max="100" style={s.paceInput} value={pct(dist[type] || 0)} onChange={e => setR(tab, `paceDistribution.${tier}.${type}`, dec(e.target.value))} />
                          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>%</span>
                        </div>
                      </div>
                    ))}
                    <div style={s.totalRow(valid)}>Total: {total}% {valid ? '✓' : '— must equal 100%'}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <button style={s.saveBtn} onClick={save} disabled={saving}>{saving ? 'Saving…' : '✓ Save all preferences'}</button>
            <button style={s.resetBtn} onClick={() => resetRace(tab)}>Reset {RACE_LABELS[tab]} to defaults</button>
            {savedMsg && <span style={s.savedMsg}>✓ Saved!</span>}
          </div>
        </>
      )}
    </div>
  )
}
