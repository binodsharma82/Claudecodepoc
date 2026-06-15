import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function KPICard({ label, value, delta, format = 'number', accentColor }) {

  /* ── Format display value ── */
  const fmt = (v) => {
    if (v === undefined || v === null) return '—'
    if (format === 'pct') return `${typeof v === 'number' ? v.toFixed(2) : v}%`
    if (format === 'currency') return `$${Number(v).toLocaleString()}`
    if (typeof v === 'number') return v.toLocaleString()
    return String(v)
  }

  /* ── Delta direction ── */
  const dir = (delta === undefined || delta === null)
    ? null
    : delta > 0.5 ? 'up' : delta < -0.5 ? 'down' : 'flat'

  const deltaColor = dir === 'up' ? '#22c55e' : dir === 'down' ? '#ef4444' : '#94a3b8'
  const deltaBg    = dir === 'up' ? 'rgba(34,197,94,0.12)' : dir === 'down' ? 'rgba(239,68,68,0.12)' : 'rgba(148,163,184,0.1)'

  return (
    <div
      style={{
        position:   'relative',
        background: '#0f2040',
        border:     '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        padding:    '14px 16px 12px',
        cursor:     'default',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'
        e.currentTarget.style.boxShadow   = '0 4px 20px rgba(0,0,0,0.35)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
        e.currentTarget.style.boxShadow   = 'none'
      }}
    >
      {/* ── Coloured accent strip (absolutely positioned, does NOT affect flow) ── */}
      <div style={{
        position:     'absolute',
        top: 0, left: 0, right: 0,
        height:       3,
        background:   accentColor || '#1e68d4',
        borderRadius: '12px 12px 0 0',
      }} />

      {/* ── Label — sits in normal flow, guaranteed visible ── */}
      <div style={{
        fontSize:      '0.73rem',
        fontWeight:    600,
        color:         '#dce8f5',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        lineHeight:    1.2,
        marginBottom:  7,
        paddingTop:    2,
      }}>
        {label}
      </div>

      {/* ── Primary value ── */}
      <div style={{
        fontSize:      '1.6rem',
        fontWeight:    700,
        color:         '#e2e8f0',
        lineHeight:    1,
        letterSpacing: '-0.01em',
      }}>
        {fmt(value)}
      </div>

      {/* ── Delta badge ── */}
      {dir !== null && (
        <div style={{
          display:       'inline-flex',
          alignItems:    'center',
          gap:           3,
          fontSize:      '0.72rem',
          fontWeight:    600,
          marginTop:     8,
          padding:       '2px 7px',
          borderRadius:  5,
          color:         deltaColor,
          background:    deltaBg,
        }}>
          {dir === 'up'   && <TrendingUp   size={11} />}
          {dir === 'down' && <TrendingDown size={11} />}
          {dir === 'flat' && <Minus        size={11} />}
          {dir === 'up' ? '+' : dir === 'down' ? '−' : ''}
          {Math.abs(delta).toFixed(1)}%
        </div>
      )}
    </div>
  )
}
