import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { api } from '../api/client'
import { useApp } from '../context/AppContext'
import { Search, ChevronRight } from 'lucide-react'

/* ── Hardcoded colours — no CSS variables, no Tailwind custom utils ── */
const C = {
  bg:       '#07111f',
  card:     '#0f2040',
  header:   '#0c1a2e',
  hover:    '#162a50',
  border:   'rgba(255,255,255,0.07)',
  border2:  'rgba(255,255,255,0.05)',
  text:     '#e2e8f0',
  muted:    '#94a3b8',
  faint:    '#64748b',
  blue:     '#1e68d4',
  green:    '#22c55e',
  red:      '#ef4444',
}

const TOOLTIP_STYLE = { background: '#112035', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }

/* ── Table cell base styles ── */
const TH_BASE = {
  background:    C.header,
  color:         C.muted,
  fontWeight:    600,
  fontSize:      '0.68rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  padding:       '10px 12px',
  textAlign:     'left',
  whiteSpace:    'nowrap',
  borderBottom:  `1px solid ${C.border}`,
  cursor:        'pointer',
  userSelect:    'none',
}
const TD_BASE = {
  padding:      '10px 12px',
  borderBottom: `1px solid ${C.border2}`,
  verticalAlign:'middle',
  whiteSpace:   'nowrap',
  fontSize:     '0.82rem',
  color:        C.text,
}

export default function HCPTracker() {
  const { territory, bu } = useApp()
  const navigate = useNavigate()
  const [hcps,         setHcps]         = useState([])
  const [decile,       setDecile]       = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [filterDecile, setFilterDecile] = useState('ALL')
  const [filterSeg,    setFilterSeg]    = useState('ALL')
  const [sortKey,      setSortKey]      = useState('trx')
  const [sortDir,      setSortDir]      = useState('desc')
  const [hoveredRow,   setHoveredRow]   = useState(null)

  useEffect(() => {
    setLoading(true)
    Promise.allSettled([api.hcpTracker({ territory, bu }), api.decile({ bu })])
      .then(([h, d]) => {
        if (h.status === 'fulfilled') setHcps(h.value)
        if (d.status === 'fulfilled') setDecile(d.value)
      })
      .finally(() => setLoading(false))
  }, [territory, bu])

  const segments = useMemo(() => ['ALL', ...new Set(hcps.map(h => h.segment))], [hcps])
  const deciles  = ['ALL','1','2','3','4','5','6','7','8','9','10']

  const filtered = useMemo(() => {
    let list = hcps
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(h =>
        h.name.toLowerCase().includes(q) ||
        h.specialty.toLowerCase().includes(q) ||
        h.city.toLowerCase().includes(q)
      )
    }
    if (filterDecile !== 'ALL') list = list.filter(h => h.decile === parseInt(filterDecile))
    if (filterSeg    !== 'ALL') list = list.filter(h => h.segment === filterSeg)
    return [...list].sort((a, b) => {
      const v = sortDir === 'asc' ? 1 : -1
      return a[sortKey] < b[sortKey] ? -v : a[sortKey] > b[sortKey] ? v : 0
    })
  }, [hcps, search, filterDecile, filterSeg, sortKey, sortDir])

  const handleSort = (k) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setSortDir('desc') }
  }

  const sortIcon = (k) => sortKey === k ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  const decileBarData = decile
    ? decile.deciles.map((d, i) => ({ name: `D${d}`, Total: decile.total[i], Called: decile.called[i] }))
    : []

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 20px' }}>
      <div className="iq-spinner" />
    </div>
  )

  const SEL_STYLE = {
    background:  C.card,
    border:      `1px solid ${C.border}`,
    color:       C.muted,
    borderRadius: 8,
    padding:     '6px 10px',
    fontSize:    '0.8rem',
    cursor:      'pointer',
    outline:     'none',
  }

  return (
    <div>
      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: C.text }}>HCP Tracker</h1>
          <p  style={{ fontSize: '0.75rem', color: C.muted, marginTop: 4 }}>
            {filtered.length} of {hcps.length} HCPs shown
          </p>
        </div>
      </div>

      {/* ── Decile call coverage chart ── */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
          <div>
            <p style={{ fontSize: '0.9rem', fontWeight: 600, color: C.text }}>Decile Call Coverage</p>
            <p style={{ fontSize: '0.75rem', color: C.muted, marginTop: 3 }}>HCPs called vs total by decile</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={decileBarData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend iconType="circle" iconSize={8} />
            <Bar dataKey="Total"  fill="#1e3a5f" radius={[3,3,0,0]} />
            <Bar dataKey="Called" fill={C.blue}  radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Search ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.card, border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 12, padding: '10px 12px', marginBottom: 12 }}>
        <Search size={16} color={C.faint} style={{ flexShrink: 0 }} />
        <input
          style={{ background: 'transparent', border: 'none', color: C.text, flex: 1, fontSize: '0.875rem', outline: 'none' }}
          placeholder="Search by name, specialty, city…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <select style={SEL_STYLE} value={filterDecile} onChange={e => setFilterDecile(e.target.value)}>
          {deciles.map(d => <option key={d} value={d}>{d === 'ALL' ? 'All Deciles' : `Decile ${d}`}</option>)}
        </select>
        <select style={SEL_STYLE} value={filterSeg} onChange={e => setFilterSeg(e.target.value)}>
          {segments.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Segments' : `Seg ${s}`}</option>)}
        </select>
      </div>

      {/* ── HCP table ── */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ minWidth: 760, width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
            <thead>
              <tr>
                {/* Name column — minimum width so it never gets squeezed */}
                <th style={{ ...TH_BASE, minWidth: 160 }}
                  onClick={() => handleSort('name')}>HCP Name{sortIcon('name')}</th>
                <th style={{ ...TH_BASE, minWidth: 110 }}
                  onClick={() => handleSort('specialty')}>Specialty{sortIcon('specialty')}</th>
                <th style={{ ...TH_BASE, width: 70, textAlign: 'center' }}
                  onClick={() => handleSort('decile')}>Decile{sortIcon('decile')}</th>
                <th style={{ ...TH_BASE, width: 70, textAlign: 'center' }}
                  onClick={() => handleSort('segment')}>Seg{sortIcon('segment')}</th>
                <th style={{ ...TH_BASE, width: 80, textAlign: 'right' }}
                  onClick={() => handleSort('trx')}>TRx{sortIcon('trx')}</th>
                <th style={{ ...TH_BASE, width: 70, textAlign: 'right' }}
                  onClick={() => handleSort('nrx')}>NRx{sortIcon('nrx')}</th>
                <th style={{ ...TH_BASE, width: 72, textAlign: 'right' }}
                  onClick={() => handleSort('trx_chg')}>TRx Δ%{sortIcon('trx_chg')}</th>
                <th style={{ ...TH_BASE, width: 72, textAlign: 'right' }}
                  onClick={() => handleSort('share')}>Share%{sortIcon('share')}</th>
                <th style={{ ...TH_BASE, width: 80, textAlign: 'center' }}
                  onClick={() => handleSort('calls_cm')}>CM Calls{sortIcon('calls_cm')}</th>
                <th style={{ ...TH_BASE, width: 90 }}
                  onClick={() => handleSort('last_call')}>Last Call{sortIcon('last_call')}</th>
                {/* Fixed-width arrow column — never grows to hide name column */}
                <th style={{ ...TH_BASE, width: 36, padding: '10px 8px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(h => (
                <tr
                  key={h.cid}
                  style={{ background: hoveredRow === h.cid ? C.hover : 'transparent', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={() => setHoveredRow(h.cid)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => navigate(`/profile/${h.cid}`)}
                >
                  {/* ── Name cell — always explicit visible color ── */}
                  <td style={{ ...TD_BASE, minWidth: 160 }}>
                    <div style={{ fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                      {h.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: C.muted, marginTop: 2 }}>
                      {h.city}, {h.state}
                    </div>
                  </td>
                  <td style={{ ...TD_BASE, color: C.muted }}>{h.specialty}</td>
                  <td style={{ ...TD_BASE, textAlign: 'center' }}>
                    <span className={`decile decile-${h.decile}`}>{h.decile}</span>
                  </td>
                  <td style={{ ...TD_BASE, textAlign: 'center' }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 600, background: 'rgba(255,255,255,0.07)', color: C.muted }}>
                      {h.segment}
                    </span>
                  </td>
                  <td style={{ ...TD_BASE, textAlign: 'right', fontWeight: 700 }}>{h.trx.toLocaleString()}</td>
                  <td style={{ ...TD_BASE, textAlign: 'right' }}>{h.nrx.toLocaleString()}</td>
                  <td style={{ ...TD_BASE, textAlign: 'right' }}>
                    <span style={{ fontWeight: 600, color: h.trx_chg >= 0 ? C.green : C.red }}>
                      {h.trx_chg >= 0 ? '+' : ''}{h.trx_chg.toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ ...TD_BASE, textAlign: 'right' }}>{h.share.toFixed(1)}%</td>
                  <td style={{ ...TD_BASE, textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 20,
                      fontSize: '0.68rem', fontWeight: 600,
                      background: h.calls_cm === 0 ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                      color:      h.calls_cm === 0 ? '#f87171' : '#4ade80',
                    }}>
                      {h.calls_cm}
                    </span>
                  </td>
                  <td style={{ ...TD_BASE, color: C.muted, fontSize: '0.78rem' }}>
                    {h.last_call !== 'NaT' ? h.last_call.slice(0, 10) : '—'}
                  </td>
                  {/* ── Redirect indicator — fixed width, never expands ── */}
                  <td style={{ ...TD_BASE, width: 36, padding: '10px 8px', textAlign: 'center' }}>
                    <ChevronRight size={14} color={C.faint} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
