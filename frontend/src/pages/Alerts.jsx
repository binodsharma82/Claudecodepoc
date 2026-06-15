import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useApp } from '../context/AppContext'
import { UserPlus, TrendingDown, PhoneOff, Target, AlertTriangle } from 'lucide-react'

const ICONS = {
  'person-plus': UserPlus,
  'trending-down': TrendingDown,
  'phone-off': PhoneOff,
  'target': Target,
}

function AlertCard({ a }) {
  const navigate = useNavigate()
  const Icon = ICONS[a.icon] || AlertTriangle
  return (
    <div
      className="flex gap-3 items-start bg-iq-card border border-white/[0.07] rounded-xl p-4 mb-3 hover:border-white/[0.12] transition-all"
      style={{ borderLeftColor: a.color, borderLeftWidth: 4 }}
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: a.color + '22' }}>
        <Icon size={16} color={a.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[0.88rem] font-semibold text-iq-text mb-1">{a.title}</p>
        <p className="text-[0.78rem] text-iq-muted leading-snug">{a.msg}</p>
      </div>
      {a.cid ? (
        <button
          className="px-3 py-1.5 rounded-lg text-[0.75rem] font-semibold border border-white/[0.12] text-iq-muted hover:bg-iq-hover hover:text-iq-text transition-all cursor-pointer whitespace-nowrap"
          onClick={() => navigate(`/profile/${a.cid}`)}
        >
          {a.action}
        </button>
      ) : (
        <span className="px-3 py-1.5 rounded-lg text-[0.75rem] font-semibold border border-white/[0.12] text-iq-muted whitespace-nowrap">
          {a.action}
        </span>
      )}
    </div>
  )
}

export default function Alerts() {
  const { period } = useApp()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.alerts({ period }).then(setAlerts).finally(() => setLoading(false))
  }, [period])

  if (loading) return (
    <div className="flex items-center justify-center py-20"><div className="iq-spinner" /></div>
  )

  const high   = alerts.filter(a => a.priority === 'HIGH')
  const medium = alerts.filter(a => a.priority === 'MEDIUM')

  return (
    <div>
      <div className="flex items-end justify-between flex-wrap gap-2 mb-5">
        <div>
          <h1 className="text-[1.3rem] font-bold text-iq-text">Active Alerts</h1>
          <p className="text-xs text-iq-muted mt-1">{alerts.length} alerts · {period}</p>
        </div>
        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-iq-red/15 text-red-400 border border-iq-red/25">
          {high.length} HIGH
        </span>
      </div>

      {high.length > 0 && (
        <>
          <div className="flex items-center gap-2 text-[0.78rem] font-bold uppercase tracking-[0.06em] text-iq-muted my-4">
            🔴 High Priority
            <div className="flex-1 h-px bg-white/[0.07]" />
          </div>
          {high.map((a, i) => <AlertCard key={i} a={a} />)}
        </>
      )}

      {medium.length > 0 && (
        <>
          <div className="flex items-center gap-2 text-[0.78rem] font-bold uppercase tracking-[0.06em] text-iq-muted my-4">
            🟡 Medium Priority
            <div className="flex-1 h-px bg-white/[0.07]" />
          </div>
          {medium.map((a, i) => <AlertCard key={i} a={a} />)}
        </>
      )}

      {alerts.length === 0 && (
        <div className="text-center py-16 text-iq-faint">
          <div className="text-4xl mb-3">✅</div>
          <p>No active alerts for this period</p>
        </div>
      )}
    </div>
  )
}
