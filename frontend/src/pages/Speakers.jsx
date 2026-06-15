import { useState, useEffect } from 'react'
import { api } from '../api/client'

const TIER_CLASS = { Gold: 'tier-gold', Silver: 'tier-silver', Bronze: 'tier-bronze' }

export default function Speakers() {
  const [speakers, setSpeakers] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState('programs')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    api.speakers().then(setSpeakers).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20"><div className="iq-spinner" /></div>
  )

  const sorted = [...speakers].sort((a, b) => {
    const v = sortDir === 'asc' ? 1 : -1
    return a[sortKey] < b[sortKey] ? -v : a[sortKey] > b[sortKey] ? v : 0
  })

  const handleSort = (k) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setSortDir('desc') }
  }

  const totalHonorariums = speakers.reduce((s, sp) => s + sp.honorarium, 0)
  const totalPrograms    = speakers.reduce((s, sp) => s + sp.programs, 0)
  const avgAttendees     = speakers.length
    ? Math.round(speakers.reduce((s, sp) => s + sp.attendees, 0) / speakers.length) : 0

  const kpis = [
    { label: 'Total Programs',    value: totalPrograms,                           accent: 'var(--orange)' },
    { label: 'Total Honorariums', value: `$${totalHonorariums.toLocaleString()}`, accent: 'var(--blue)' },
    { label: 'Avg Attendees',     value: avgAttendees,                            accent: 'var(--green)' },
    { label: 'Active Speakers',   value: speakers.length,                         accent: 'var(--purple)' },
  ]

  return (
    <div>
      <div className="flex items-end justify-between flex-wrap gap-2 mb-5">
        <div>
          <h1 className="text-[1.3rem] font-bold text-iq-text">Speaker Programs</h1>
          <p className="text-xs text-iq-muted mt-1">{speakers.length} active speakers</p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="kpi-grid">
        {kpis.map(({ label, value, accent }) => (
          <div key={label} className="relative overflow-hidden bg-iq-card border border-white/[0.07] rounded-xl p-4 kpi-accent" style={{ '--accent-color': accent }}>
            <p className="text-[0.7rem] text-iq-muted uppercase tracking-widest mb-2 font-medium">{label}</p>
            <p className="text-[1.5rem] font-bold text-iq-text leading-none">{value}</p>
          </div>
        ))}
      </div>

      {/* Speaker cards */}
      <div className="grid gap-3">
        {sorted.map(sp => (
          <div key={sp.sid} className="bg-iq-card border border-white/[0.07] rounded-xl p-4 hover:border-white/[0.14] transition-all">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-bold text-[0.92rem] text-iq-text">{sp.name}</p>
                <p className="text-[0.75rem] text-iq-muted mt-0.5">{sp.specialty}</p>
              </div>
              <span className={`text-[0.7rem] font-bold px-2 py-0.5 rounded ${TIER_CLASS[sp.tier] || 'tier-bronze'}`}>{sp.tier}</span>
            </div>

            <div className="grid grid-cols-4 gap-3 mt-1">
              <div>
                <p className="text-[0.68rem] text-iq-faint mb-0.5">Programs</p>
                <p className="font-bold text-iq-orange">{sp.programs}</p>
              </div>
              <div>
                <p className="text-[0.68rem] text-iq-faint mb-0.5">Avg Attend</p>
                <p className="font-bold text-iq-text">{sp.attendees}</p>
              </div>
              <div>
                <p className="text-[0.68rem] text-iq-faint mb-0.5">Honorarium</p>
                <p className="font-bold text-iq-green text-[0.82rem]">${sp.honorarium.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[0.68rem] text-iq-faint mb-0.5">Last Prog</p>
                <p className="text-[0.75rem] text-iq-muted">{String(sp.last_prog).slice(0, 10)}</p>
              </div>
            </div>

            <p className="mt-2.5 text-[0.75rem] text-iq-muted">
              <span className="text-iq-faint">Products: </span>{sp.products}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
