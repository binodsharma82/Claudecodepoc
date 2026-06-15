import { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import { api } from '../api/client'

const CARD = 'bg-iq-card border border-white/[0.07] rounded-xl p-4'
const CARD_HDR = 'flex items-center justify-between mb-4 pb-3 border-b border-white/[0.07]'
const TH = 'bg-iq-bg2 text-iq-muted font-semibold uppercase text-[0.68rem] tracking-[0.04em] px-3 py-2.5 text-left whitespace-nowrap border-b border-white/[0.07]'
const TD = 'px-3 py-2.5 border-b border-white/[0.05] align-middle whitespace-nowrap text-[0.82rem]'
const TOOLTIP_STYLE = { background: '#112035', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }

export default function Vaccines() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.vaccines().then(setData).finally(() => setLoading(false)) }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20"><div className="iq-spinner" /></div>
  )
  if (!data) return null

  const { trend_labels, vaccines, territory_coverage } = data

  const trendData = trend_labels.map((l, i) => {
    const row = { month: l }
    Object.entries(vaccines).forEach(([name, vals]) => { row[name] = vals.doses[i] })
    return row
  })

  const totalDoses = Object.values(vaccines).reduce((s, v) => s + v.doses.reduce((a, b) => a + b, 0), 0)

  return (
    <div>
      <div className="flex items-end justify-between flex-wrap gap-2 mb-5">
        <div>
          <h1 className="text-[1.3rem] font-bold text-iq-text">Vaccines BU</h1>
          <p className="text-xs text-iq-muted mt-1">Immunization portfolio performance</p>
        </div>
        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-iq-green/15 text-green-400 border border-iq-green/25">
          {totalDoses.toLocaleString()} YTD Doses
        </span>
      </div>

      {/* Vaccine KPI cards */}
      <div className="vax-grid">
        {Object.entries(vaccines).map(([name, vals]) => {
          const totalV    = vals.doses.reduce((a, b) => a + b, 0)
          const lastMonth = vals.doses[vals.doses.length - 1]
          return (
            <div key={name} className="relative overflow-hidden bg-iq-card border border-white/[0.07] rounded-xl p-4 kpi-accent"
              style={{ '--accent-color': vals.color }}>
              <p className="text-[0.67rem] text-iq-muted uppercase tracking-widest mb-1.5 font-medium">{name}</p>
              <p className="text-[1.3rem] font-bold text-iq-text leading-none">{lastMonth.toLocaleString()}</p>
              <p className="text-[0.7rem] text-iq-muted mt-1">{totalV.toLocaleString()} YTD</p>
            </div>
          )
        })}
      </div>

      {/* Stacked area chart */}
      <div className={`${CARD} mb-4`}>
        <div className={CARD_HDR}>
          <div>
            <p className="text-sm font-semibold text-iq-text">Vaccine Dose Trend</p>
            <p className="text-xs text-iq-muted mt-0.5">Monthly doses by vaccine Jan–Jun 2025</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={trendData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <defs>
              {Object.entries(vaccines).map(([name, vals]) => (
                <linearGradient key={name} id={`g${name.replace(/\s/g,'')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={vals.color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={vals.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend iconType="circle" iconSize={8} />
            {Object.entries(vaccines).map(([name, vals]) => (
              <Area key={name} type="monotone" dataKey={name}
                stroke={vals.color} fill={`url(#g${name.replace(/\s/g,'')})`}
                strokeWidth={2} dot={false} stackId="doses" />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Territory coverage table */}
      <div className={CARD}>
        <div className={CARD_HDR}>
          <div>
            <p className="text-sm font-semibold text-iq-text">Territory Coverage</p>
            <p className="text-xs text-iq-muted mt-0.5">Shingrix doses &amp; HCP coverage by territory</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={TH}>Territory</th>
                <th className={TH}>Shingrix Doses</th>
                <th className={TH}>HCP Coverage</th>
              </tr>
            </thead>
            <tbody>
              {territory_coverage.map((t, i) => (
                <tr key={i} className="hover:bg-iq-hover/60 transition-colors">
                  <td className={TD}>{t.territory}</td>
                  <td className={TD}><strong>{t.shingrix_doses.toLocaleString()}</strong></td>
                  <td className={TD}>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold" style={{
                        color: t.coverage_pct >= 70 ? '#22c55e' : t.coverage_pct >= 50 ? '#f59e0b' : '#ef4444'
                      }}>{t.coverage_pct.toFixed(1)}%</span>
                      <div className="h-1.5 w-20 bg-iq-bg2 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-[width] duration-300" style={{
                          width: `${Math.min(t.coverage_pct, 100)}%`,
                          background: t.coverage_pct >= 70 ? '#22c55e' : t.coverage_pct >= 50 ? '#f59e0b' : '#ef4444'
                        }} />
                      </div>
                    </div>
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
