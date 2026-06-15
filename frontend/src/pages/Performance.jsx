import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { api } from '../api/client'
import { useApp } from '../context/AppContext'

/* ── Hardcoded colours — no CSS variables, no Tailwind custom utils ── */
const C = {
  card:    '#0f2040',
  header:  '#0c1a2e',
  hover:   '#162a50',
  border:  'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.05)',
  text:    '#e2e8f0',
  muted:   '#94a3b8',
  faint:   '#64748b',
  green:   '#22c55e',
  orange:  '#f59e0b',
  red:     '#ef4444',
}

const PRODUCT_COLORS  = ['#1e68d4', '#F36F21', '#22c55e', '#a855f7']
const TOOLTIP_STYLE   = { background: '#112035', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }

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
  padding:       '10px 12px',
  borderBottom:  `1px solid ${C.border2}`,
  verticalAlign: 'middle',
  whiteSpace:    'nowrap',
  fontSize:      '0.82rem',
  color:         C.text,
}

export default function Performance() {
  const { territory, period } = useApp()
  const [terrPerf, setTerrPerf] = useState([])
  const [prodShare, setProdShare] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [sortKey,   setSortKey]   = useState('attain')
  const [sortDir,   setSortDir]   = useState('desc')
  const [hoveredRow, setHoveredRow] = useState(null)

  useEffect(() => {
    setLoading(true)
    Promise.allSettled([
      api.territoryPerf({ period }),
      api.productShare({ period, territory }),
    ]).then(([t, p]) => {
      if (t.status === 'fulfilled') setTerrPerf(t.value)
      if (p.status === 'fulfilled') setProdShare(p.value)
    }).finally(() => setLoading(false))
  }, [territory, period])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 20px' }}>
      <div className="iq-spinner" />
    </div>
  )

  const sorted = [...terrPerf].sort((a, b) => {
    const v = sortDir === 'asc' ? 1 : -1
    return a[sortKey] < b[sortKey] ? -v : a[sortKey] > b[sortKey] ? v : 0
  })

  const handleSort = (k) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setSortDir('desc') }
  }

  const sortIcon = (k) => sortKey === k ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''
  const attainBar = sorted.map(t => ({ name: t.tid, Attainment: t.attain }))

  const attainColor = (v) => v >= 100 ? C.green : v >= 85 ? C.orange : C.red

  return (
    <div>
      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: C.text }}>Performance</h1>
          <p  style={{ fontSize: '0.75rem', color: C.muted, marginTop: 4 }}>Territory &amp; product analysis · {period}</p>
        </div>
      </div>

      {/* ── Charts row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16 }}>

        {/* Portfolio share */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
            <div>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: C.text }}>Portfolio Share</p>
              <p style={{ fontSize: '0.75rem', color: C.muted, marginTop: 3 }}>TRx by product family</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={prodShare} dataKey="trx" nameKey="product" cx="50%" cy="50%"
                innerRadius={50} outerRadius={80} paddingAngle={3}>
                {prodShare.map((_, i) => <Cell key={i} fill={PRODUCT_COLORS[i % PRODUCT_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, n) => [v.toLocaleString() + ' TRx', n]} />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            {prodShare.map((p, i) => (
              <div key={p.product} style={{ fontSize: '0.78rem' }}>
                <span style={{ fontWeight: 700, color: PRODUCT_COLORS[i] }}>{p.product}</span>
                <div style={{ color: C.muted, marginTop: 2 }}>
                  {p.portfolio_pct.toFixed(1)}% share · Mkt {p.market_share.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Territory attainment bar */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
            <div>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: C.text }}>Territory Attainment</p>
              <p style={{ fontSize: '0.75rem', color: C.muted, marginTop: 3 }}>TRx quota % by territory</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={attainBar} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" domain={[0, 120]} tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
              <YAxis type="category" dataKey="name" tick={{ fill: C.muted, fontSize: 10 }} width={55} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v}%`, 'Attainment']} />
              <Bar dataKey="Attainment" radius={[0, 4, 4, 0]}>
                {attainBar.map((entry, i) => (
                  <Cell key={i} fill={attainColor(entry.Attainment)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Performance detail table ── */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
          <p style={{ fontSize: '0.9rem', fontWeight: 600, color: C.text }}>Territory Performance Detail</p>
        </div>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ minWidth: 700, width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
            <thead>
              <tr>
                <th style={{ ...TH_BASE, minWidth: 100 }} onClick={() => handleSort('tid')}>Territory{sortIcon('tid')}</th>
                {/* Rep name column — explicit min-width */}
                <th style={{ ...TH_BASE, minWidth: 130 }} onClick={() => handleSort('rep')}>Rep{sortIcon('rep')}</th>
                <th style={{ ...TH_BASE, width: 90 }}  onClick={() => handleSort('region')}>Region{sortIcon('region')}</th>
                <th style={{ ...TH_BASE, width: 80, textAlign: 'right' }} onClick={() => handleSort('trx')}>TRx{sortIcon('trx')}</th>
                <th style={{ ...TH_BASE, width: 70, textAlign: 'right' }} onClick={() => handleSort('nrx')}>NRx{sortIcon('nrx')}</th>
                <th style={{ ...TH_BASE, width: 72, textAlign: 'right' }} onClick={() => handleSort('trx_chg')}>TRx Δ%{sortIcon('trx_chg')}</th>
                <th style={{ ...TH_BASE, width: 110, textAlign: 'right' }} onClick={() => handleSort('attain')}>Attain%{sortIcon('attain')}</th>
                <th style={{ ...TH_BASE, width: 65, textAlign: 'right' }} onClick={() => handleSort('calls')}>Calls{sortIcon('calls')}</th>
                <th style={{ ...TH_BASE, width: 80, textAlign: 'right' }} onClick={() => handleSort('hcp_cvg')}>HCP Cvg%{sortIcon('hcp_cvg')}</th>
                <th style={{ ...TH_BASE, width: 70, textAlign: 'right' }} onClick={() => handleSort('new_pts')}>New Pts{sortIcon('new_pts')}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(t => (
                <tr
                  key={t.tid}
                  style={{ background: hoveredRow === t.tid ? C.hover : 'transparent', transition: 'background 0.15s' }}
                  onMouseEnter={() => setHoveredRow(t.tid)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td style={{ ...TD_BASE, minWidth: 100 }}>
                    <span style={{ fontWeight: 600, color: C.text }}>{t.tid}</span>
                    <div style={{ fontSize: '0.7rem', color: C.muted, marginTop: 2 }}>{t.name}</div>
                  </td>
                  {/* Rep name — explicit visible color */}
                  <td style={{ ...TD_BASE, minWidth: 130, color: C.text, fontWeight: 500 }}>{t.rep}</td>
                  <td style={TD_BASE}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 600, background: 'rgba(255,255,255,0.07)', color: C.muted }}>
                      {t.region}
                    </span>
                  </td>
                  <td style={{ ...TD_BASE, textAlign: 'right', fontWeight: 700 }}>{t.trx.toLocaleString()}</td>
                  <td style={{ ...TD_BASE, textAlign: 'right' }}>{t.nrx.toLocaleString()}</td>
                  <td style={{ ...TD_BASE, textAlign: 'right' }}>
                    <span style={{ fontWeight: 600, color: t.trx_chg >= 0 ? C.green : C.red }}>
                      {t.trx_chg >= 0 ? '+' : ''}{t.trx_chg.toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ ...TD_BASE, textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                      <span style={{ fontWeight: 700, color: attainColor(t.attain) }}>
                        {t.attain.toFixed(1)}%
                      </span>
                      {/* Progress bar */}
                      <div style={{ height: 6, width: 52, background: C.header, borderRadius: 3, overflow: 'hidden', flexShrink: 0 }}>
                        <div style={{ height: '100%', borderRadius: 3, background: attainColor(t.attain), width: `${Math.min(t.attain / 1.2, 100)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ ...TD_BASE, textAlign: 'right' }}>{t.calls}</td>
                  <td style={{ ...TD_BASE, textAlign: 'right' }}>{t.hcp_cvg.toFixed(1)}%</td>
                  <td style={{ ...TD_BASE, textAlign: 'right' }}>{t.new_pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
