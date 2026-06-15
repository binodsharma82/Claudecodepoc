import { useState, useEffect } from 'react'
import {
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { api } from '../api/client'
import { useApp } from '../context/AppContext'
import KPICard from '../components/KPICard'
import { TrendingUp, Users } from 'lucide-react'

/* ── Colour palette ─────────────────────────────────────────────── */
const PRODUCT_COLORS = {
  NEXOLID: '#1e68d4', VERITONEX: '#F36F21', CLAROZEPT: '#22c55e', DEPTRAZOL: '#a855f7',
}
const PAYER_COLORS = ['#1e68d4', '#F36F21', '#22c55e', '#a855f7', '#f59e0b', '#06b6d4']
const TS = { background: '#112035', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }

/* ── Shared inline-style helpers ────────────────────────────────── */
const CARD_STYLE = {
  background: '#0f2040',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 12,
  padding: 16,
}
const CARD_HDR_STYLE = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 16,
  paddingBottom: 12,
  borderBottom: '1px solid rgba(255,255,255,0.07)',
}
const TITLE_STYLE  = { fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0' }
const SUB_STYLE    = { fontSize: '0.75rem', color: '#94a3b8', marginTop: 3 }

/* ── Custom Pareto tooltip ──────────────────────────────────────── */
function ParetoTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div style={{ background: '#112035', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px 12px', fontSize: '0.78rem' }}>
      <p style={{ color: '#94a3b8', marginBottom: 4 }}>Cumulative</p>
      <p style={{ color: '#e2e8f0', fontWeight: 600 }}>
        Top <span style={{ color: '#1e68d4' }}>{d.x}%</span> of HCPs
      </p>
      <p style={{ color: '#e2e8f0', fontWeight: 600 }}>
        write <span style={{ color: '#F36F21' }}>{d.pareto}%</span> of TRx
      </p>
    </div>
  )
}

export default function Executive() {
  const { territory, period, bu } = useApp()

  const [kpis,    setKpis]    = useState(null)
  const [trend,   setTrend]   = useState(null)
  const [payer,   setPayer]   = useState([])
  const [conc,    setConc]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)

    /* ── Independent calls — one failure won't block the rest ── */
    Promise.allSettled([
      api.kpis({ territory, period, bu }),
      api.trend({ territory, bu }),
      api.payerMix({ period, bu }),
      api.hcpConcentration({ territory, bu }),
    ]).then(([k, t, p, c]) => {
      if (k.status === 'fulfilled') setKpis(k.value)
      if (t.status === 'fulfilled') setTrend(t.value)
      if (p.status === 'fulfilled') setPayer(p.value)
      if (c.status === 'fulfilled') setConc(c.value)
    }).finally(() => setLoading(false))
  }, [territory, period, bu])

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: 12, color: '#94a3b8' }}>
      <div className="iq-spinner" />
      <span style={{ fontSize: '0.85rem' }}>Loading…</span>
    </div>
  )

  /* ── Derived chart data ── */
  const trendData = trend?.labels?.map((l, i) => ({
    month: l, TRx: trend.trx[i], NRx: trend.nrx[i],
  })) ?? []

  const productData = trend?.labels?.map((l, i) => ({
    month: l,
    NEXOLID:   trend.nexolid[i],
    VERITONEX: trend.veritonex[i],
    CLAROZEPT: trend.clarozept[i],
    DEPTRAZOL: trend.deptrazol[i],
  })) ?? []

  const paretoData  = conc?.curve ?? []
  const pct80       = conc?.pct_hcps_80pct ?? '—'
  const decileStats = conc?.decile_stats ?? []
  const topTwoDecilePct = decileStats.slice(0, 2).reduce((s, d) => s + d.pct_trx,  0).toFixed(1)
  const topTwoHcpPct    = decileStats.slice(0, 2).reduce((s, d) => s + d.pct_hcps, 0).toFixed(1)

  return (
    <div>
      {/* ── Page header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#e2e8f0' }}>Executive Summary</h1>
          <p  style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 4 }}>Current Month Performance · {period}</p>
        </div>
        <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: 'rgba(30,104,212,0.2)', color: '#60a5fa', border: '1px solid rgba(30,104,212,0.3)' }}>
          ● Live
        </span>
      </div>

      {/* ── KPI cards ───────────────────────────────────────────── */}
      <div className="kpi-grid">
        <KPICard label="Total TRx"    value={kpis?.trx}          delta={kpis?.trx_delta}   accentColor="#1e68d4" />
        <KPICard label="Total NRx"    value={kpis?.nrx}          delta={kpis?.nrx_delta}   accentColor="#06b6d4" />
        <KPICard label="Calls"        value={kpis?.calls}        delta={kpis?.calls_delta} accentColor="#F36F21" />
        <KPICard label="Attainment"   value={kpis?.attainment}   format="pct"              accentColor="#22c55e" />
        <KPICard label="New Patients" value={kpis?.new_patients}                           accentColor="#a855f7" />
        <KPICard label="TRx Share"    value={kpis?.trx_share}    format="pct"              accentColor="#f59e0b" />
        <KPICard label="HCP Called"   value={kpis?.hcp_called}   format="pct"              accentColor="#06b6d4" />
        <KPICard label="Market TRx"   value={kpis?.market_trx}                             accentColor="#64748b" />
      </div>

      {/* ── TRx Trend + Payer Mix ────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>

        {/* TRx / NRx trend */}
        <div style={CARD_STYLE}>
          <div style={CARD_HDR_STYLE}>
            <div>
              <p style={TITLE_STYLE}>TRx / NRx Monthly Trend</p>
              <p style={SUB_STYLE}>Total portfolio prescriptions</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={trendData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="gTRx" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1e68d4" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#1e68d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gNRx" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#F36F21" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#F36F21" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TS} />
              <Legend />
              <Area type="monotone" dataKey="TRx" stroke="#1e68d4" fill="url(#gTRx)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="NRx" stroke="#F36F21" fill="url(#gNRx)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Payer mix */}
        <div style={CARD_STYLE}>
          <div style={CARD_HDR_STYLE}>
            <div>
              <p style={TITLE_STYLE}>Payer Mix</p>
              <p style={SUB_STYLE}>TRx by payer type · {period}</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={payer} dataKey="trx" nameKey="payer" cx="50%" cy="50%"
                innerRadius={55} outerRadius={85} paddingAngle={2}>
                {payer.map((_, i) => <Cell key={i} fill={PAYER_COLORS[i % PAYER_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={TS} formatter={(v, n) => [v.toLocaleString(), n]} />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Prescriber Concentration (IQ2020 Pareto) ─────────────── */}
      <div style={{ ...CARD_STYLE, marginBottom: 16 }}>
        <div style={CARD_HDR_STYLE}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} color="#1e68d4" />
            <div>
              <p style={TITLE_STYLE}>Prescriber Concentration Analysis</p>
              <p style={SUB_STYLE}>% of HCPs vs % of Total TRx — IQ2020 Pareto view</p>
            </div>
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, background: 'rgba(243,111,33,0.12)', color: '#fb923c', border: '1px solid rgba(243,111,33,0.25)', whiteSpace: 'nowrap' }}>
            <TrendingUp size={12} />
            Top {pct80}% HCPs = 80% of TRx
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}
          className="lg:grid-cols-3">
          <div style={{ gridColumn: 'span 2' }}>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={paretoData} margin={{ top: 10, right: 20, bottom: 25, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="x" type="number" domain={[0, 100]} tickCount={6}
                  tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false}
                  label={{ value: '% of HCPs', position: 'insideBottom', offset: -15, fill: '#64748b', fontSize: 11 }}
                />
                <YAxis
                  domain={[0, 100]} tickCount={6} unit="%"
                  tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false}
                  label={{ value: '% of TRx', angle: -90, position: 'insideLeft', offset: 10, fill: '#64748b', fontSize: 11 }}
                />
                <Tooltip content={<ParetoTooltip />} />
                {/* Equal-distribution diagonal */}
                <Line dataKey="equal" stroke="rgba(148,163,184,0.2)" strokeWidth={1} strokeDasharray="5 4" dot={false} legendType="none" />
                {/* 80% TRx threshold */}
                <ReferenceLine y={80} stroke="rgba(243,111,33,0.5)" strokeDasharray="4 3" strokeWidth={1}
                  label={{ value: '80% TRx', position: 'right', fill: '#F36F21', fontSize: 10 }} />
                {typeof pct80 === 'number' && (
                  <ReferenceLine x={pct80} stroke="rgba(30,104,212,0.45)" strokeDasharray="4 3" strokeWidth={1}
                    label={{ value: `${pct80}%`, position: 'top', fill: '#60a5fa', fontSize: 10 }} />
                )}
                {/* Pareto curve */}
                <Line type="monotone" dataKey="pareto" stroke="#1e68d4" strokeWidth={2.5} dot={false} name="Prescriber Concentration" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Decile breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', marginBottom: 12 }}>
                Decile Breakdown
              </p>
              <table style={{ width: '100%', fontSize: '0.76rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Decile','HCPs','%HCP','%TRx'].map(h => (
                      <th key={h} style={{ textAlign: h === 'Decile' ? 'left' : 'right', paddingBottom: 8, color: '#64748b', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {decileStats.map(d => (
                    <tr key={d.decile} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <td style={{ padding: '6px 0' }}>
                        <span className={`decile decile-${d.decile}`}>{d.decile}</span>
                      </td>
                      <td style={{ textAlign: 'right', color: '#e2e8f0', fontWeight: 500 }}>{d.hcps}</td>
                      <td style={{ textAlign: 'right', color: '#94a3b8' }}>{d.pct_hcps}%</td>
                      <td style={{ textAlign: 'right', color: '#1e68d4', fontWeight: 700 }}>{d.pct_trx}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 16, padding: 12, borderRadius: 10, background: 'rgba(30,104,212,0.08)', border: '1px solid rgba(30,104,212,0.15)' }}>
              <p style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', marginBottom: 5 }}>Key Insight</p>
              <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0' }}>Deciles 9–10 ({topTwoHcpPct}% of HCPs)</p>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 3 }}>
                drive <span style={{ fontWeight: 700, color: '#F36F21' }}>{topTwoDecilePct}%</span> of total TRx
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Product TRx Trend ────────────────────────────────────── */}
      <div style={CARD_STYLE}>
        <div style={CARD_HDR_STYLE}>
          <div>
            <p style={TITLE_STYLE}>Product TRx Trend</p>
            <p style={SUB_STYLE}>Monthly breakdown by product family</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={210}>
          <LineChart data={productData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TS} />
            <Legend />
            {Object.entries(PRODUCT_COLORS).map(([name, color]) => (
              <Line key={name} type="monotone" dataKey={name} stroke={color} strokeWidth={2} dot={{ r: 3 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
