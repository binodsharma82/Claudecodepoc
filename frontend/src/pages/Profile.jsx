import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { api } from '../api/client'
import { ArrowLeft, MapPin } from 'lucide-react'

const PRODUCT_COLORS = {
  NEXOLID: '#1e68d4', VERITONEX: '#F36F21', CLAROZEPT: '#22c55e', DEPTRAZOL: '#a855f7'
}
const CARD = 'bg-iq-card border border-white/[0.07] rounded-xl p-4'
const CARD_HDR = 'flex items-center justify-between mb-4 pb-3 border-b border-white/[0.07]'
const TH = 'bg-iq-bg2 text-iq-muted font-semibold uppercase text-[0.68rem] tracking-[0.04em] px-3 py-2.5 text-left whitespace-nowrap border-b border-white/[0.07]'
const TD = 'px-3 py-2.5 border-b border-white/[0.05] align-middle whitespace-nowrap text-[0.82rem]'
const TOOLTIP_STYLE = { background: '#112035', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }

export default function Profile() {
  const { cid } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeProduct, setActiveProduct] = useState('NEXOLID')

  useEffect(() => {
    setLoading(true)
    api.hcp(cid).then(setData).finally(() => setLoading(false))
  }, [cid])

  if (loading) return (
    <div className="flex items-center justify-center py-20"><div className="iq-spinner" /></div>
  )
  if (!data || data.error) return (
    <div className="flex items-center justify-center py-20 text-iq-muted">HCP not found.</div>
  )

  const initials = data.name.split(' ').map(w => w[0]).slice(0, 2).join('')
  const trendChartData = data.trend[activeProduct]?.labels.map((l, i) => ({
    month: l, TRx: data.trend[activeProduct].trx[i], NRx: data.trend[activeProduct].nrx[i],
  })) ?? []
  const callHistory = data.calls ?? []

  return (
    <div>
      {/* Back button */}
      <button
        className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-4 rounded-lg text-[0.82rem] font-medium text-iq-muted bg-iq-card border border-white/[0.07] hover:bg-iq-hover hover:text-iq-text transition-all cursor-pointer"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={14} /> Back to HCP Tracker
      </button>

      {/* Profile header card */}
      <div className={`${CARD} mb-4`}>
        <div className="flex gap-4 flex-wrap items-start">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center text-xl font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #1e68d4, #06b6d4)' }}>
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-[1.1rem] font-bold text-iq-text">{data.name}</h2>
            <p className="text-[0.8rem] text-iq-muted mt-0.5">{data.specialty} · NPI: {data.npi}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`decile decile-${data.decile}`}>{data.decile}</span>
              <span className="inline-block px-2 py-0.5 rounded-full text-[0.68rem] font-semibold bg-iq-blue/20 text-blue-400">Seg {data.segment}</span>
              {data.speaker === 'Yes' && (
                <span className="inline-block px-2 py-0.5 rounded-full text-[0.68rem] font-semibold bg-iq-orange/15 text-orange-400">Speaker</span>
              )}
            </div>
            {data.address && (
              <div className="flex items-center gap-1 mt-1.5 text-[0.78rem] text-iq-muted">
                <MapPin size={12} />{data.address}
              </div>
            )}
          </div>
        </div>

        {/* Stat boxes */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-3 mt-4 pt-4 border-t border-white/[0.07]">
          {[
            { val: data.trx.toLocaleString(),  lbl: 'TRx CM',   color: '#1e68d4' },
            { val: data.nrx.toLocaleString(),  lbl: 'NRx CM',   color: '#F36F21' },
            { val: `${data.trx_chg >= 0 ? '+' : ''}${data.trx_chg.toFixed(1)}%`, lbl: 'TRx Chg', color: data.trx_chg >= 0 ? '#22c55e' : '#ef4444' },
            { val: data.calls_cm,              lbl: 'CM Calls'  },
            { val: data.calls_ytd,             lbl: 'YTD Calls' },
            { val: data.patients,              lbl: 'Patients'  },
          ].map(({ val, lbl, color }) => (
            <div key={lbl} className="text-center">
              <div className="text-[1.25rem] font-bold" style={{ color }}>{val}</div>
              <div className="text-[0.66rem] text-iq-muted uppercase tracking-widest mt-0.5">{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Product + trend charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Product grid */}
        <div className={CARD}>
          <div className={CARD_HDR}>
            <div>
              <p className="text-sm font-semibold text-iq-text">Product Performance</p>
              <p className="text-xs text-iq-muted mt-0.5">Current month by product family</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {Object.entries(data.products).map(([name, vals]) => (
              <button
                key={name}
                onClick={() => setActiveProduct(name)}
                className="rounded-xl p-3 text-left transition-all cursor-pointer bg-iq-bg2 hover:border-white/[0.15]"
                style={{ border: `1px solid ${activeProduct === name ? PRODUCT_COLORS[name] : 'transparent'}` }}
              >
                <div className="font-bold text-[0.82rem] mb-1.5" style={{ color: PRODUCT_COLORS[name] }}>{name}</div>
                <div className="text-[1.2rem] font-bold text-iq-text">{vals.trx}</div>
                <div className="text-[0.7rem] text-iq-muted">TRx · NRx {vals.nrx} · Shr {vals.share.toFixed(1)}%</div>
              </button>
            ))}
          </div>
          <p className="text-[0.72rem] text-iq-faint mt-2.5">↑ Click a product to view trend</p>
        </div>

        {/* Trend chart */}
        <div className={CARD}>
          <div className={CARD_HDR}>
            <div>
              <p className="text-sm font-semibold" style={{ color: PRODUCT_COLORS[activeProduct] }}>{activeProduct} — Monthly Trend</p>
              <p className="text-xs text-iq-muted mt-0.5">TRx and NRx over 6 months</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendChartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend />
              <Line type="monotone" dataKey="TRx" stroke={PRODUCT_COLORS[activeProduct]} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="NRx" stroke="#94a3b8" strokeWidth={1.5} dot={{ r: 3 }} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Call history */}
      <div className={CARD}>
        <div className={CARD_HDR}>
          <div>
            <p className="text-sm font-semibold text-iq-text">Call History</p>
            <p className="text-xs text-iq-muted mt-0.5">Recent interactions</p>
          </div>
        </div>
        {callHistory.length === 0 ? (
          <p className="text-iq-faint text-center py-5">No call history</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Date','Type','Outcome','Product','Samples'].map(h => (
                    <th key={h} className={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {callHistory.map((c, i) => (
                  <tr key={i} className="hover:bg-iq-hover/60 transition-colors">
                    <td className={`${TD} text-[0.8rem]`}>{c.date.slice(0, 10)}</td>
                    <td className={TD}>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[0.68rem] font-semibold bg-iq-blue/20 text-blue-400">{c.type}</span>
                    </td>
                    <td className={TD}>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[0.68rem] font-semibold ${
                        c.outcome === 'Detailed' ? 'bg-iq-green/15 text-green-400' : 'bg-white/[0.07] text-iq-muted'
                      }`}>{c.outcome}</span>
                    </td>
                    <td className={TD}>
                      <span className="font-semibold" style={{ color: PRODUCT_COLORS[c.product] || '#94a3b8' }}>{c.product}</span>
                    </td>
                    <td className={TD}>{c.samples > 0 ? c.samples : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
