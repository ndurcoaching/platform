import { useState, useEffect, useCallback } from 'react'
import { buildMonthPlan } from '../lib/planBuilder'
import { DEFAULT_GENERAL_PREFS, DEFAULT_RACE_PREFS, getMergedPrefs, RACE_LABELS } from '../lib/defaultPrefs'
import { supabase } from '../supabase'

const s = {
  layout: { minHeight: '100vh', display: 'grid', gridTemplateRows: 'auto 1fr' },
  topbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 28px', height: 56, background: 'var(--surface)', borderBottom: '1px solid var(--border)',
  },
  topLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  logoMark: {
    width: 30, height: 30, borderRadius: 7, background: '#0a5fd4',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--accent-fg)', fontWeight: 500, fontSize: 13, letterSpacing: '-0.5px',
  },
  logoText: { fontSize: 15, fontWeight: 500, letterSpacing: '-0.3px' },
  topRight: { display: 'flex', alignItems: 'center', gap: 16 },
  signOutBtn: {
    fontSize: 13, color: 'var(--text-3)', cursor: 'pointer', padding: '4px 8px',
    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'transparent',
  },
  main: { display: 'grid', gridTemplateColumns: '268px 1fr', height: '100%', overflow: 'hidden' },
  sidebar: { borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--surface)' },
  sidebarHeader: { padding: '16px 16px 12px', borderBottom: '1px solid var(--border)' },
  sidebarTitle: { fontSize: 13, fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 },
  statsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  statBox: { background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' },
  statNum: { fontSize: 20, fontWeight: 500, lineHeight: 1, marginBottom: 2 },
  statLabel: { fontSize: 11, color: 'var(--text-3)' },
  clientList: { flex: 1, overflowY: 'auto', padding: 8 },
  clientItem: (active) => ({
    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
    borderRadius: 'var(--radius)', cursor: 'pointer',
    background: active ? 'var(--surface-2)' : 'transparent',
    border: active ? '1px solid var(--border)' : '1px solid transparent',
    marginBottom: 2,
  }),
  avatar: (color) => ({
    width: 34, height: 34, borderRadius: '50%', background: color,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 500, color: '#fff', flexShrink: 0,
  }),
  clientName: { fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  clientSub: { fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  badge: (hasPlan) => ({
    marginLeft: 'auto', flexShrink: 0, fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 999,
    background: hasPlan ? 'var(--green-bg)' : 'var(--amber-bg)',
    color: hasPlan ? 'var(--green-text)' : 'var(--amber-text)',
  }),
  emptyList: { padding: '24px 16px', fontSize: 13, color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.7 },
  detail: { overflowY: 'auto', padding: '24px 28px', background: 'var(--bg)' },
  noneSelected: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-3)', fontSize: 14 },
  clientHeader: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 },
  clientHeaderAvatar: (color) => ({
    width: 44, height: 44, borderRadius: '50%', background: color,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 15, fontWeight: 500, color: '#fff', flexShrink: 0,
  }),
  clientHeaderName: { fontSize: 19, fontWeight: 500, letterSpacing: '-0.5px', marginBottom: 2 },
  clientHeaderSub: { fontSize: 13, color: 'var(--text-2)' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 22px', marginBottom: 14 },
  cardTitleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle: { fontSize: 13, fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  editToggleBtn: {
    fontSize: 12, padding: '3px 10px', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer',
  },
  profileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 },
  profileItem: { display: 'flex', flexDirection: 'column', gap: 4 },
  profileLabel: { fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.4px' },
  profileVal: { fontSize: 14, fontWeight: 500 },
  profileInput: {
    fontSize: 14, padding: '5px 8px', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', color: 'var(--text)', outline: 'none', width: '100%',
  },
  profileSelect: {
    fontSize: 14, padding: '5px 8px', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', color: 'var(--text)', outline: 'none', width: '100%',
  },
  saveProfileBtn: {
    marginTop: 14, padding: '7px 16px', background: 'var(--accent)', color: 'var(--accent-fg)',
    borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer',
  },
  // Glossary
  glossaryGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },
  glossaryItem: { display: 'flex', flexDirection: 'column', gap: 4 },
  glossaryLabel: (type) => ({
    fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
    color: type === 'easy' ? '#2a6e3a' : type === 'tempo' ? '#7a5a00' : '#7a2222',
  }),
  glossaryInput: {
    fontSize: 13, padding: '7px 10px', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', color: 'var(--text)',
    outline: 'none', width: '100%', resize: 'none', fontFamily: 'var(--font)', lineHeight: 1.5,
  },
  // Calendar
  monthNav: { display: 'flex', alignItems: 'center' },
  monthLabel: { fontSize: 14, fontWeight: 500, margin: '0 10px' },
  navBtn: { padding: '3px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'transparent', cursor: 'pointer', fontSize: 13, color: 'var(--text-2)' },
  calGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 14,
  },
  dayOfWeekHeader: {
    padding: '6px 4px', fontSize: 11, fontWeight: 500, textAlign: 'center',
    background: 'var(--surface-2)', color: 'var(--text-3)',
    borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.3px',
    borderRight: '1px solid var(--border)',
  },
  calCell: (isToday, isCurrentMonth) => ({
    borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
    background: isToday ? 'rgba(26,24,20,0.04)' : !isCurrentMonth ? 'var(--surface-2)' : 'var(--surface)',
    opacity: isCurrentMonth ? 1 : 0.35,
    minHeight: 110, display: 'flex', flexDirection: 'column',
  }),
  calCellHeader: (isToday) => ({
    padding: '4px 6px', fontSize: 11, fontWeight: isToday ? 600 : 400,
    color: isToday ? 'var(--accent)' : 'var(--text-3)',
    borderBottom: '1px solid var(--border)',
  }),
  paceTypeBadge: (type) => {
    const bg = { easy: '#edf5ec', tempo: '#fdf3e3', race: '#fdeeed', fartlek: '#e8f0fd', intervals: '#f3edf8', recovery: '#f0f0f0', long: '#e8f4f8', walk: '#f0f0f8' }
    const color = { easy: '#2a6e3a', tempo: '#7a5a00', race: '#7a2222', fartlek: '#0a5fd4', intervals: '#5a2a7a', recovery: '#5a5650', long: '#2a5a6e', walk: '#3a3a7a' }
    return { fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', padding: '1px 5px', borderRadius: 3, display: 'inline-block', background: bg[type] || 'transparent', color: color[type] || 'transparent' }
  },
  notesTextarea: {
    width: '100%', minHeight: 90, padding: '12px 14px',
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', fontSize: 13, lineHeight: 1.7,
    color: 'var(--text)', resize: 'vertical', outline: 'none', fontFamily: 'var(--font)',
  },
  // Strength training
  strengthToggleWrap: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 },
  strengthToggleTrack: (on) => ({
    width: 38, height: 22, borderRadius: 999, position: 'relative', cursor: 'pointer',
    background: on ? 'var(--accent)' : 'var(--border)', border: 'none', padding: 0, flexShrink: 0,
    transition: 'background 0.15s',
  }),
  strengthToggleDot: (on) => ({
    position: 'absolute', top: 2, left: on ? 18 : 2, width: 18, height: 18, borderRadius: '50%',
    background: '#fff', transition: 'left 0.15s', boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
  }),
  strengthToggleLabel: { fontSize: 13, fontWeight: 500, color: 'var(--text-2)', cursor: 'pointer', userSelect: 'none' },
  strengthSection: { marginBottom: 14 },
  strengthSectionLabel: {
    fontSize: 12, fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase',
    letterSpacing: '0.4px', marginBottom: 8,
  },
  strengthGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden',
  },
  strengthCell: { borderRight: '1px solid var(--border)', background: 'var(--surface)' },
  strengthDayHeader: {
    padding: '6px 4px', fontSize: 11, fontWeight: 500, textAlign: 'center',
    background: 'var(--surface-2)', color: 'var(--text-3)', borderBottom: '1px solid var(--border)',
    textTransform: 'uppercase', letterSpacing: '0.3px',
  },
  strengthInput: {
    width: '100%', minHeight: 92, border: 'none', padding: '8px 8px', fontSize: 11.5, lineHeight: 1.45,
    background: 'transparent', color: 'var(--text)', resize: 'vertical', outline: 'none', fontFamily: 'var(--font)',
  },
  btnRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' },
  saveBtn: {
    padding: '8px 16px', background: 'var(--accent)', color: 'var(--accent-fg)',
    borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500,
    display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', cursor: 'pointer',
  },
  aiBtn: {
    padding: '8px 16px', background: 'transparent', color: 'var(--text-2)',
    borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500,
    border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
  },
  exportBtn: {
    padding: '8px 16px', background: 'transparent', color: 'var(--text-2)',
    borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500,
    border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
  },
  savedMsg: { fontSize: 13, color: 'var(--green-text)', marginLeft: 4 },
  deleteBtn: {
    marginLeft: 'auto', padding: '7px 12px', background: 'transparent',
    color: 'var(--red-text)', borderRadius: 'var(--radius-sm)', fontSize: 13,
    border: '1px solid var(--border)', cursor: 'pointer',
  },
}

const COLORS = ['#5b7fa6', '#7a6fa6', '#6fa68a', '#a67a6f', '#a69d6f', '#6f8ea6']
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const PACE_TYPES = ['', 'easy', 'tempo', 'race', 'fartlek', 'intervals', 'recovery', 'long', 'walk']
const PACE_LABELS = { '': '— type', easy: 'Easy', tempo: 'Tempo', race: 'Race pace', fartlek: 'Fartlek', intervals: 'Intervals', recovery: 'Recovery', long: 'Long run', walk: 'Walk/Run' }

const DEFAULT_GLOSSARY = {
  easy: 'Conversational pace. You should be able to speak in full sentences. Typically 60–90 seconds per mile slower than race pace.',
  tempo: 'Comfortably hard. You can speak in short phrases only. Roughly 25–30 seconds per mile slower than 10K race pace.',
  race: 'Goal marathon pace. The pace you plan to run on race day based on your target finish time.',
}

function avatarColor(name) {
  let hash = 0
  for (let c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}
function initials(name) {
  return name.split(' ').filter(Boolean).map(p => p[0]).join('').toUpperCase().slice(0, 2)
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function weeksUntil(dateStr) {
  if (!dateStr) return 16
  const diff = new Date(dateStr + 'T00:00:00') - new Date()
  return Math.max(4, Math.round(diff / (7 * 24 * 60 * 60 * 1000)))
}
function toKey(date) { return date.toISOString().slice(0, 10) }

function buildCalendar(year, month) {
  const first = new Date(year, month, 1)
  let startDow = (first.getDay() + 6) % 7
  const cells = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, 1 - startDow + i)
    cells.push({ date: d, key: toKey(d), isCurrentMonth: d.getMonth() === month })
  }
  return cells
}

// Day data: { miles, pace, notes }
function parsePlan(raw) {
  if (!raw) return { days: {}, notes: '', glossary: DEFAULT_GLOSSARY, strengthEnabled: false, strengthDays: {} }
  try {
    const p = JSON.parse(raw)
    if (p && typeof p === 'object' && 'days' in p) {
      return {
        days: p.days || {},
        notes: p.notes || '',
        glossary: p.glossary || DEFAULT_GLOSSARY,
        strengthEnabled: p.strengthEnabled || false,
        strengthDays: p.strengthDays || {},
      }
    }
  } catch {}
  return { days: {}, notes: raw, glossary: DEFAULT_GLOSSARY, strengthEnabled: false, strengthDays: {} }
}
function serializePlan(days, notes, glossary, strengthEnabled, strengthDays) {
  return JSON.stringify({ days, notes, glossary, strengthEnabled, strengthDays })
}

// ── PDF Export ───────────────────────────────────────────────────────────────
function exportPDF(client, days, notes, glossary, year, month, strengthEnabled, strengthDays) {
  const monthName = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const cells = buildCalendar(year, month)
  const dowHeaders = DOW.map(d => `<th>${d}</th>`).join('')

  const paceColor = { easy: '#2a6e3a', tempo: '#7a5a00', race: '#7a2222' }
  const paceBg = { easy: '#edf5ec', tempo: '#fdf3e3', race: '#fdeeed' }

  const weeks = []
  for (let w = 0; w < 6; w++) {
    const weekCells = cells.slice(w * 7, w * 7 + 7).map(cell => {
      const inMonth = cell.isCurrentMonth
      const day = inMonth ? (days[cell.key] || {}) : {}
      const miles = day.miles || ''
      const pace = day.pace || ''
      const note = day.notes || ''
      let content = ''
      if (inMonth) {
        if (miles || pace) {
          content += `<div style="display:flex;align-items:center;gap:4px;margin-bottom:3px;">`
          if (miles) content += `<span style="font-size:13px;font-weight:500;">${miles} mi</span>`
          if (pace) content += `<span style="font-size:9px;font-weight:600;text-transform:uppercase;padding:1px 5px;border-radius:3px;background:${paceBg[pace]};color:${paceColor[pace]};">${PACE_LABELS[pace]}</span>`
          content += `</div>`
        }
        if (note) content += `<div style="font-size:10px;line-height:1.5;color:#5a5650;">${note.replace(/\n/g, '<br/>')}</div>`
        if (!miles && !pace && !note) content += `<div style="font-size:10px;color:#ccc;">Rest</div>`
      }
      return `<td class="${inMonth ? '' : 'out'}"><div class="date-num">${cell.date.getDate()}</div>${content}</td>`
    }).join('')
    weeks.push(`<tr>${weekCells}</tr>`)
  }

  const glossaryHtml = Object.entries(glossary).map(([type, def]) => `
    <div style="display:flex;flex-direction:column;gap:3px;">
      <span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:${paceColor[type]};">${type}</span>
      <span style="font-size:12px;color:#5a5650;line-height:1.5;">${def}</span>
    </div>`).join('')

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>${client.name} — ${monthName} Training Plan</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: #fff; color: #1a1814; padding: 28px 32px; font-size: 13px; }
  .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1.5px solid #1a1814; }
  .logo { width: 30px; height: 30px; border-radius: 7px; background: #0a5fd4; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 600; font-size: 12px; }
  .brand { font-size: 14px; font-weight: 500; margin-left: 8px; }
  .athlete-name { font-size: 17px; font-weight: 500; }
  .athlete-meta { font-size: 11px; color: #888; margin-top: 2px; }
  .profile-row { display: flex; gap: 20px; margin-bottom: 14px; flex-wrap: wrap; }
  .pi-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #aaa; }
  .pi-val { font-size: 12px; font-weight: 500; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 14px; }
  th { background: #1a1814; color: #fff; padding: 6px 6px; font-size: 10px; font-weight: 500; text-align: left; letter-spacing: 0.3px; text-transform: uppercase; border-right: 1px solid #333; }
  th:last-child { border-right: none; }
  td { border: 1px solid #e0dbd0; vertical-align: top; padding: 5px 6px; height: 68px; background: #fff; }
  td.out { background: #f7f5f0; }
  .date-num { font-size: 10px; color: #bbb; margin-bottom: 3px; font-weight: 500; }
  td.out .date-num { color: #ddd; }
  .glossary { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; background: #f7f5f0; border-radius: 8px; padding: 12px 14px; margin-bottom: 12px; }
  .glossary-title { font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.8px; color: #aaa; margin-bottom: 8px; }
  .notes-label { font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.8px; color: #aaa; margin-bottom: 6px; }
  .notes-box { background: #f7f5f0; border-radius: 6px; padding: 10px 12px; font-size: 12px; line-height: 1.7; color: #5a5650; }
  @media print { body { padding: 12px 16px; } @page { margin: 0.3in; size: letter landscape; } }
</style>
</head>
<body>
<div class="header">
  <div style="display:flex;align-items:center;">
    <div class="logo">N</div>
    <span class="brand">Ndur</span>
  </div>
  <div style="text-align:right;">
    <div class="athlete-name">${client.name}</div>
    <div class="athlete-meta">${monthName} Training Plan</div>
  </div>
</div>
<div class="profile-row">
  ${client.goal_race ? `<div><div class="pi-label">Goal race</div><div class="pi-val">${client.goal_race}</div></div>` : ''}
  ${client.race_date ? `<div><div class="pi-label">Race date</div><div class="pi-val">${fmtDate(client.race_date)}</div></div>` : ''}
  ${client.race_date ? `<div><div class="pi-label">Weeks to race</div><div class="pi-val">${weeksUntil(client.race_date)} wks</div></div>` : ''}
  ${client.experience ? `<div><div class="pi-label">Experience</div><div class="pi-val">${client.experience}</div></div>` : ''}
  ${client.weekly_mileage ? `<div><div class="pi-label">Base mileage</div><div class="pi-val">${client.weekly_mileage} mi/wk</div></div>` : ''}
</div>
<div class="glossary-title">Pace guide</div>
<div class="glossary">${glossaryHtml}</div>
<table>
  <thead><tr>${dowHeaders}</tr></thead>
  <tbody>${weeks.join('')}</tbody>
</table>
${strengthEnabled ? `<div class="notes-label">Weekly strength plan (same every week)</div>
<table style="margin-bottom:14px;">
  <thead><tr>${dowHeaders}</tr></thead>
  <tbody><tr>${DOW.map(d => `<td style="height:54px;font-size:11px;line-height:1.4;">${(strengthDays[d] || '').replace(/\n/g, '<br/>')}</td>`).join('')}</tr></tbody>
</table>` : ''}
${notes ? `<div class="notes-label">Coach notes</div><div class="notes-box">${notes.replace(/\n/g, '<br/>')}</div>` : ''}
<script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`

  const printWin = window.open('', '_blank', 'width=1100,height=800')
  printWin.document.write(html)
  printWin.document.close()
}

// ── Agreement text ───────────────────────────────────────────────────────────
const AGREEMENT_HTML = `
<div style="font-size:13px;line-height:1.8;color:#5a5650;max-height:320px;overflow-y:auto;padding-right:8px;">
  <p style="font-weight:500;color:#1a1814;margin-bottom:12px;">Coaching Services Agreement, Privacy Policy & Liability Waiver</p>

  <p style="font-weight:500;color:#1a1814;margin-top:14px;margin-bottom:4px;">1. Coaching Services Agreement</p>
  <p>Ndur agrees to provide personalized marathon training coaching services including customized monthly training plans, regular updates, and communication via agreed channels. Services are billed monthly and either party may cancel with 14 days written notice. No refunds for partial months in progress.</p>
  <p style="margin-top:6px;">The Athlete agrees to provide accurate intake information, obtain medical clearance from a licensed physician before beginning training, and communicate any injuries or significant changes that may affect training.</p>
  <p style="margin-top:6px;font-style:italic;">Coaching services are fitness and performance coaching only and do not constitute medical advice, diagnosis, or treatment.</p>

  <p style="font-weight:500;color:#1a1814;margin-top:14px;margin-bottom:4px;">2. Privacy Policy</p>
  <p>Ndur collects your name, contact information, and fitness data solely to provide coaching services. Your data is stored securely and is never sold, rented, or shared with third parties for any commercial purpose. You may request access to or deletion of your data at any time.</p>

  <p style="font-weight:500;color:#1a1814;margin-top:14px;margin-bottom:4px;">3. Liability Waiver & Release</p>
  <p>I acknowledge that marathon training involves inherent risks including musculoskeletal injury, cardiovascular events, and heat-related illness. I voluntarily assume all such risks and confirm I have or will obtain medical clearance before beginning this program.</p>
  <p style="margin-top:6px;">I hereby release Ndur, its owners, coaches, and affiliates from any and all claims arising from my participation in training activities, including claims arising from negligence, to the fullest extent permitted by law.</p>
  <p style="margin-top:6px;">I confirm I am at least 18 years of age and am signing this agreement voluntarily and of my own free will.</p>
</div>`

// ────────────────────────────────────────────────────────────────────────────

export default function Dashboard({ session }) {
  const now = new Date()
  const [clients, setClients] = useState([])
  const [selected, setSelected] = useState(null)
  const [days, setDays] = useState({})
  const [notes, setNotes] = useState('')
  const [glossary, setGlossary] = useState(DEFAULT_GLOSSARY)
  const [editingGlossary, setEditingGlossary] = useState(false)
  const [monthOffset, setMonthOffset] = useState(0)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)
  const [loadingClients, setLoadingClients] = useState(true)
  const [generalPrefs, setGeneralPrefs] = useState(DEFAULT_GENERAL_PREFS)
  const [racePrefs, setRacePrefs] = useState(DEFAULT_RACE_PREFS)
  const [weeklyTotals, setWeeklyTotals] = useState([])
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileDraft, setProfileDraft] = useState({})
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSavedMsg, setProfileSavedMsg] = useState(false)
  const [strengthEnabled, setStrengthEnabled] = useState(false)
  const [strengthDays, setStrengthDays] = useState({})

  const viewYear  = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1).getFullYear()
  const viewMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1).getMonth()
  const calCells  = buildCalendar(viewYear, viewMonth)
  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const todayKey  = toKey(now)

  useEffect(() => {
    async function loadPrefs() {
      const { data } = await supabase.from('coach_prefs').select('prefs').eq('coach_id', session.user.id).single()
      if (data?.prefs) {
        if (data.prefs.general) setGeneralPrefs(p => ({ ...DEFAULT_GENERAL_PREFS, ...data.prefs.general }))
        if (data.prefs.race) {
          setRacePrefs(p => {
            const merged = { ...DEFAULT_RACE_PREFS }
            for (const key of Object.keys(DEFAULT_RACE_PREFS)) {
              merged[key] = { ...DEFAULT_RACE_PREFS[key], ...(data.prefs.race[key] || {}) }
            }
            return merged
          })
        }
      }
    }
    loadPrefs()
  }, [])

  const fetchClients = useCallback(async () => {
    setLoadingClients(true)
    const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    if (!error) setClients(data || [])
    setLoadingClients(false)
  }, [])

  useEffect(() => { fetchClients() }, [fetchClients])

  useEffect(() => {
    if (selected) {
      const fresh = clients.find(c => c.id === selected.id)
      if (fresh) setSelected(fresh)
    }
  }, [clients])

  function selectClient(c) {
    setSelected(c)
    const p = parsePlan(c.training_plan)
    setDays(p.days)
    setNotes(p.notes)
    setGlossary(p.glossary || DEFAULT_GLOSSARY)
    setStrengthEnabled(p.strengthEnabled)
    setStrengthDays(p.strengthDays)
    setWeeklyTotals([])
    setSavedMsg(false)
    setEditingProfile(false)
    setEditingGlossary(false)
  }

  function setDayField(key, field, value) {
    setDays(d => ({ ...d, [key]: { ...(d[key] || {}), [field]: value } }))
    setSavedMsg(false)
  }

  function setStrengthDayField(day, value) {
    setStrengthDays(d => ({ ...d, [day]: value }))
    setSavedMsg(false)
  }

  function toggleStrengthTraining() {
    setStrengthEnabled(en => !en)
    setSavedMsg(false)
  }

  function startEditProfile() {
    setProfileDraft({
      name: selected.name || '', email: selected.email || '', phone: selected.phone || '',
      gender: selected.gender || '', age: selected.age || '', experience: selected.experience || '',
      weekly_mileage: selected.weekly_mileage || '', goal_race: selected.goal_race || '', race_date: selected.race_date || '',
      race_type: selected.race_type || 'full',
    })
    setEditingProfile(true)
    setProfileSavedMsg(false)
  }

  function setProfile(field, value) { setProfileDraft(d => ({ ...d, [field]: value })) }

  async function saveProfile() {
    setSavingProfile(true)
    const update = {
      name: profileDraft.name.trim(), email: profileDraft.email.trim(),
      phone: profileDraft.phone.trim() || null, gender: profileDraft.gender || null,
      age: profileDraft.age ? parseInt(profileDraft.age) : null,
      experience: profileDraft.experience || null,
      weekly_mileage: profileDraft.weekly_mileage ? parseInt(profileDraft.weekly_mileage) : null,
      goal_race: profileDraft.goal_race.trim() || null, race_date: profileDraft.race_date || null,
      race_type: profileDraft.race_type || 'full',
    }
    const { error } = await supabase.from('clients').update(update).eq('id', selected.id)
    setSavingProfile(false)
    if (!error) { setProfileSavedMsg(true); setTimeout(() => setProfileSavedMsg(false), 2500); setEditingProfile(false); fetchClients() }
  }

  async function savePlan() {
    if (!selected) return
    setSaving(true)
    const { error } = await supabase.from('clients').update({ training_plan: serializePlan(days, notes, glossary, strengthEnabled, strengthDays) }).eq('id', selected.id)
    setSaving(false)
    if (!error) { setSavedMsg(true); setTimeout(() => setSavedMsg(false), 2500); fetchClients() }
  }

  function buildPlan() {
    if (!selected) return
    const now = new Date()
    const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth()
    const raceType = selected.race_type || 'full'
    const mergedPrefs = getMergedPrefs(generalPrefs, racePrefs, raceType)
    const result = buildMonthPlan(selected, mergedPrefs, viewYear, viewMonth, isCurrentMonth)
    setDays(prev => ({ ...prev, ...result.days }))
    setNotes(result.notes)
    setWeeklyTotals(result.weeklyTotals || [])
    if (result.endMiles && selected) {
      setSelected(s => ({ ...s, weekly_mileage: result.endMiles }))
    }
    setSavedMsg(false)
  }

  async function deleteClient(client) {
    if (!window.confirm(`Remove ${client.name}? This cannot be undone.`)) return
    await supabase.from('clients').delete().eq('id', client.id)
    setSelected(null); setDays({}); setNotes(''); fetchClients()
  }

  async function signOut() { await supabase.auth.signOut() }

  const planCount = clients.filter(c => c.training_plan).length

  return (
    <div style={s.layout}>
      <style>{`
        .client-item:hover { background: var(--surface-2) !important; }
        .nav-btn:hover, .edit-toggle-btn:hover { border-color: var(--border-strong) !important; }
        .ai-btn:hover, .export-btn:hover { border-color: var(--border-strong) !important; color: var(--text) !important; }
        .cal-input:focus, .cal-select:focus, .cal-notes:focus { background: rgba(0,0,0,0.02) !important; outline: none; }
        .strength-input:focus { background: rgba(0,0,0,0.02) !important; outline: none; }
        .profile-input:focus, .profile-select:focus, .glossary-input:focus { border-color: var(--border-strong) !important; box-shadow: 0 0 0 2px rgba(26,24,20,0.05); }
        .cal-select { appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%23999'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 4px center; padding-right: 16px !important; }
      `}</style>

      <div style={s.topbar}>
        <div style={s.topLeft}>
          <div style={s.logoMark}>N</div>
          <span style={s.logoText}>Ndur</span>
        </div>
        <div style={s.topRight}>
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{session.user.email}</span>
          <a href="#/coach/preferences" style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'underline', cursor: 'pointer' }}>Preferences</a>
          <button style={s.signOutBtn} onClick={signOut}>Sign out</button>
        </div>
      </div>

      <div style={s.main}>
        <div style={s.sidebar}>
          <div style={s.sidebarHeader}>
            <div style={s.sidebarTitle}>Clients</div>
            <div style={s.statsRow}>
              <div style={s.statBox}><div style={s.statNum}>{clients.length}</div><div style={s.statLabel}>Total</div></div>
              <div style={s.statBox}><div style={s.statNum}>{planCount}</div><div style={s.statLabel}>Plans ready</div></div>
            </div>
          </div>
          <div style={s.clientList}>
            {loadingClients && <div style={s.emptyList}>Loading…</div>}
            {!loadingClients && clients.length === 0 && (
              <div style={s.emptyList}>No clients yet.<br /><a href="#/intake" style={{ color: 'var(--text-2)', textDecoration: 'underline' }}>Share the intake form →</a></div>
            )}
            {clients.map(c => (
              <div key={c.id} className="client-item" style={s.clientItem(selected?.id === c.id)} onClick={() => selectClient(c)}>
                <div style={s.avatar(avatarColor(c.name))}>{initials(c.name)}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={s.clientName}>{c.name}</div>
                  <div style={s.clientSub}>{c.goal_race || 'No race set'}</div>
                </div>
                <span style={s.badge(!!c.training_plan)}>{c.training_plan ? 'Ready' : 'New'}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={s.detail}>
          {!selected ? (
            <div style={s.noneSelected}>← Select a client to view their profile and build a training plan</div>
          ) : (
            <>
              <div style={s.clientHeader}>
                <div style={s.clientHeaderAvatar(avatarColor(selected.name))}>{initials(selected.name)}</div>
                <div>
                  <div style={s.clientHeaderName}>{selected.name}</div>
                  <div style={s.clientHeaderSub}>{selected.email}{selected.phone ? ` · ${selected.phone}` : ''}</div>
                </div>
              </div>

              {/* Profile Card */}
              <div style={s.card}>
                <div style={s.cardTitleRow}>
                  <div style={s.cardTitle}>Athlete profile</div>
                  {!editingProfile
                    ? <button className="edit-toggle-btn" style={s.editToggleBtn} onClick={startEditProfile}>Edit</button>
                    : <button className="edit-toggle-btn" style={s.editToggleBtn} onClick={() => setEditingProfile(false)}>Cancel</button>
                  }
                </div>
                {!editingProfile ? (
                  <>
                    <div style={s.profileGrid}>
                      {[
                        ['Age', selected.age ? `${selected.age} yrs` : '—'],
                        ['Gender', selected.gender || '—'],
                        ['Experience', selected.experience || '—'],
                        ['Weekly mileage', selected.weekly_mileage ? `${selected.weekly_mileage} mi` : '—'],
                        ['Goal race', selected.goal_race || '—'],
                        ['Race date', fmtDate(selected.race_date)],
                        ['Weeks to race', selected.race_date ? `${weeksUntil(selected.race_date)} wks` : '—'],
                      ].map(([label, val]) => (
                        <div key={label} style={s.profileItem}>
                          <span style={s.profileLabel}>{label}</span>
                          <span style={s.profileVal}>{val}</span>
                        </div>
                      ))}
                    </div>
                    {(selected.years_running || selected.pr_5k || selected.pr_10k || selected.pr_half || selected.pr_full || selected.past_injuries || selected.typical_weekly_structure) && (
                      <>
                        <div style={{ borderTop: '1px solid var(--border)', margin: '16px 0' }} />
                        <div style={s.profileGrid}>
                          <div style={s.profileItem}><span style={s.profileLabel}>Race distance</span><span style={s.profileVal}>{RACE_LABELS[selected.race_type || 'full']}</span></div>
                      {selected.years_running ? <div style={s.profileItem}><span style={s.profileLabel}>Years running</span><span style={s.profileVal}>{selected.years_running}</span></div> : null}
                          {selected.pr_5k ? <div style={s.profileItem}><span style={s.profileLabel}>5K PR</span><span style={s.profileVal}>{selected.pr_5k}</span></div> : null}
                          {selected.pr_10k ? <div style={s.profileItem}><span style={s.profileLabel}>10K PR</span><span style={s.profileVal}>{selected.pr_10k}</span></div> : null}
                          {selected.pr_half ? <div style={s.profileItem}><span style={s.profileLabel}>Half PR</span><span style={s.profileVal}>{selected.pr_half}</span></div> : null}
                          {selected.pr_full ? <div style={s.profileItem}><span style={s.profileLabel}>Full PR</span><span style={s.profileVal}>{selected.pr_full}</span></div> : null}
                        </div>
                        {selected.past_injuries && (
                          <div style={{ marginTop: 12 }}>
                            <span style={s.profileLabel}>Past injuries</span>
                            <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.6 }}>{selected.past_injuries}</div>
                          </div>
                        )}
                        {selected.typical_weekly_structure && (
                          <div style={{ marginTop: 12 }}>
                            <span style={s.profileLabel}>Typical weekly structure</span>
                            <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.6 }}>{selected.typical_weekly_structure}</div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <div style={s.profileGrid}>
                      {[['Full name','name','text'],['Email','email','email'],['Phone','phone','tel'],['Age','age','number']].map(([label, field, type]) => (
                        <div key={field} style={s.profileItem}>
                          <span style={s.profileLabel}>{label}</span>
                          <input className="profile-input" style={s.profileInput} type={type} value={profileDraft[field]} onChange={e => setProfile(field, e.target.value)} />
                        </div>
                      ))}
                      <div style={s.profileItem}>
                        <span style={s.profileLabel}>Gender</span>
                        <select className="profile-select" style={s.profileSelect} value={profileDraft.gender} onChange={e => setProfile('gender', e.target.value)}>
                          <option value="">Select…</option><option>Male</option><option>Female</option>
                        </select>
                      </div>
                      <div style={s.profileItem}>
                        <span style={s.profileLabel}>Experience</span>
                        <select className="profile-select" style={s.profileSelect} value={profileDraft.experience} onChange={e => setProfile('experience', e.target.value)}>
                          <option value="">Select…</option>
                          <option value="Beginner (less than 1 year)">Beginner — less than 1 year</option>
                          <option value="Intermediate (1–3 years)">Intermediate — 1–3 years</option>
                          <option value="Experienced (3–7 years)">Experienced — 3–7 years</option>
                          <option value="Advanced (7+ years)">Advanced — 7+ years</option>
                        </select>
                      </div>
                      <div style={s.profileItem}>
                        <span style={s.profileLabel}>Weekly mileage</span>
                        <input className="profile-input" style={s.profileInput} type="number" value={profileDraft.weekly_mileage} onChange={e => setProfile('weekly_mileage', e.target.value)} />
                      </div>
                      <div style={s.profileItem}>
                        <span style={s.profileLabel}>Goal race</span>
                        <input className="profile-input" style={s.profileInput} value={profileDraft.goal_race} onChange={e => setProfile('goal_race', e.target.value)} />
                      </div>
                      <div style={s.profileItem}>
                        <span style={s.profileLabel}>Race date</span>
                        <input className="profile-input" style={s.profileInput} type="date" value={profileDraft.race_date} onChange={e => setProfile('race_date', e.target.value)} />
                      </div>
                      <div style={s.profileItem}>
                        <span style={s.profileLabel}>Race distance</span>
                        <select className="profile-select" style={s.profileSelect} value={profileDraft.race_type} onChange={e => setProfile('race_type', e.target.value)}>
                          <option value="5k">5K</option>
                          <option value="10k">10K</option>
                          <option value="half">Half Marathon</option>
                          <option value="full">Full Marathon</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
                      <button style={{ ...s.saveProfileBtn, opacity: savingProfile ? 0.6 : 1 }} disabled={savingProfile} onClick={saveProfile}>
                        {savingProfile ? 'Saving…' : '✓ Save changes'}
                      </button>
                      {profileSavedMsg && <span style={s.savedMsg}>✓ Saved!</span>}
                    </div>
                  </>
                )}
              </div>

              {/* Pace Glossary Card */}
              <div style={s.card}>
                <div style={s.cardTitleRow}>
                  <div style={s.cardTitle}>Pace glossary</div>
                  {!editingGlossary
                    ? <button className="edit-toggle-btn" style={s.editToggleBtn} onClick={() => setEditingGlossary(true)}>Edit</button>
                    : <button className="edit-toggle-btn" style={s.editToggleBtn} onClick={() => setEditingGlossary(false)}>Done</button>
                  }
                </div>
                <div style={s.glossaryGrid}>
                  {['easy', 'tempo', 'race'].map(type => (
                    <div key={type} style={s.glossaryItem}>
                      <span style={s.glossaryLabel(type)}>{type === 'race' ? 'Race pace' : type.charAt(0).toUpperCase() + type.slice(1)}</span>
                      {editingGlossary ? (
                        <textarea
                          className="glossary-input"
                          style={{ ...s.glossaryInput, minHeight: 72 }}
                          value={glossary[type]}
                          onChange={e => setGlossary(g => ({ ...g, [type]: e.target.value }))}
                        />
                      ) : (
                        <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{glossary[type]}</span>
                      )}
                    </div>
                  ))}
                </div>
                {editingGlossary && (
                  <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 10 }}>Changes save automatically when you save the training plan.</p>
                )}
              </div>

              {/* Monthly Calendar */}
              <div style={s.card}>
                <div style={s.cardTitleRow}>
                  <div style={s.cardTitle}>Training plan</div>
                  <div style={s.monthNav}>
                    <button className="nav-btn" style={s.navBtn} onClick={() => setMonthOffset(m => m - 1)}>← Prev</button>
                    <span style={s.monthLabel}>{monthName}</span>
                    <button className="nav-btn" style={s.navBtn} onClick={() => setMonthOffset(m => m + 1)}>Next →</button>
                  </div>
                </div>

                <div style={s.strengthToggleWrap}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={strengthEnabled}
                    className="strength-toggle-track"
                    onClick={toggleStrengthTraining}
                    style={s.strengthToggleTrack(strengthEnabled)}
                  >
                    <span style={s.strengthToggleDot(strengthEnabled)} />
                  </button>
                  <span style={s.strengthToggleLabel} onClick={toggleStrengthTraining}>Strength Training</span>
                </div>

                <div style={s.calGrid}>
                  {DOW.map(d => <div key={d} style={s.dayOfWeekHeader}>{d}</div>)}
                  {calCells.map((cell) => {
                    const isToday = cell.key === todayKey
                    const day = days[cell.key] || {}
                    return (
                      <div key={cell.key} style={s.calCell(isToday, cell.isCurrentMonth)}>
                        <div style={s.calCellHeader(isToday)}>{cell.date.getDate()}</div>
                        {cell.isCurrentMonth && (
                          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '4px 5px', gap: 3 }}>
                            {/* Miles row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <input
                                className="cal-input"
                                type="number"
                                min="0"
                                step="0.5"
                                placeholder="0"
                                value={day.miles || ''}
                                onChange={e => setDayField(cell.key, 'miles', e.target.value)}
                                style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 3, padding: '2px 4px', fontSize: 11, background: 'var(--surface-2)', color: 'var(--text)', minWidth: 0 }}
                              />
                              <span style={{ fontSize: 10, color: 'var(--text-3)', flexShrink: 0 }}>mi</span>
                            </div>
                            {/* Pace dropdown */}
                            <select
                              className="cal-select"
                              value={day.pace || ''}
                              onChange={e => setDayField(cell.key, 'pace', e.target.value)}
                              style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 3, padding: '2px 4px', fontSize: 10, background: 'var(--surface-2)', color: ({ easy: '#2a6e3a', tempo: '#7a5a00', race: '#7a2222', fartlek: '#0a5fd4', intervals: '#5a2a7a', recovery: '#5a5650', long: '#2a5a6e', walk: '#3a3a7a' })[day.pace] || 'var(--text-3)' }}
                            >
                              {PACE_TYPES.map(pt => <option key={pt} value={pt}>{PACE_LABELS[pt]}</option>)}
                            </select>
                            {/* Notes */}
                            <textarea
                              className="cal-notes"
                              placeholder="Notes…"
                              value={day.notes || ''}
                              onChange={e => setDayField(cell.key, 'notes', e.target.value)}
                              style={{ flex: 1, width: '100%', border: '1px solid var(--border)', borderRadius: 3, padding: '2px 4px', fontSize: 10, lineHeight: 1.4, background: 'transparent', color: 'var(--text)', resize: 'none', fontFamily: 'var(--font)', minHeight: 32 }}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Strength training — one row, repeats every week */}
                {strengthEnabled && (
                  <div style={s.strengthSection}>
                    <div style={s.strengthSectionLabel}>
                      Weekly strength plan <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— same every week</span>
                    </div>
                    <div style={s.strengthGrid}>
                      {DOW.map(d => (
                        <div key={d} style={s.strengthCell}>
                          <div style={s.strengthDayHeader}>{d}</div>
                          <textarea
                            className="strength-input"
                            placeholder="—"
                            value={strengthDays[d] || ''}
                            onChange={e => setStrengthDayField(d, e.target.value)}
                            style={s.strengthInput}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weekly mileage totals */}
                {weeklyTotals.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                    {weeklyTotals.map((w, i) => (
                      <div key={i} style={{ flex: 1, minWidth: 110, background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 500 }}>{w.total} mi</div>
                        <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: 2 }}>Week {i + 1}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Coach notes */}
                <div style={{ marginBottom: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>Coach notes</div>
                  <textarea style={s.notesTextarea} placeholder="Add notes, observations, or instructions for this athlete…" value={notes} onChange={e => { setNotes(e.target.value); setSavedMsg(false) }} />
                </div>

                <div style={s.btnRow}>
                  <button style={{ ...s.saveBtn, opacity: saving ? 0.6 : 1 }} disabled={saving} onClick={savePlan}>
                    {saving ? 'Saving…' : '✓ Save plan'}
                  </button>
                  <button className="ai-btn" style={s.aiBtn} onClick={buildPlan}>
                    ⚙ Build month
                  </button>
                  <button className="export-btn" style={s.exportBtn} onClick={() => exportPDF(selected, days, notes, glossary, viewYear, viewMonth, strengthEnabled, strengthDays)}>
                    ↓ Export PDF
                  </button>
                  {savedMsg && <span style={s.savedMsg}>✓ Saved!</span>}
                  <button style={s.deleteBtn} onClick={() => deleteClient(selected)}>Remove client</button>
                </div>
              </div>

              {/* Agreements Card */}
              <div style={s.card}>
                <div style={s.cardTitleRow}>
                  <div style={s.cardTitle}>Signed agreements</div>
                  {selected.agreed_to_terms
                    ? <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 999, background: 'var(--green-bg)', color: 'var(--green-text)', fontWeight: 500 }}>✓ Agreed {selected.agreed_at ? new Date(selected.agreed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
                    : <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 999, background: 'var(--amber-bg)', color: 'var(--amber-text)', fontWeight: 500 }}>Pending</span>
                  }
                </div>
                <div dangerouslySetInnerHTML={{ __html: AGREEMENT_HTML }} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
