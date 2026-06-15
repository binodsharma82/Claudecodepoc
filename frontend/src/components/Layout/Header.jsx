import { useState } from 'react'
import { LogOut, ChevronDown } from 'lucide-react'
import { useApp }  from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import gskLogo from '../../assets/gsk1.png'

const ROLE_COLOR = {
  'Admin':        '#F36F21',
  'Dist Manager': '#1e68d4',
  'Field Rep':    '#22c55e',
}

const SEL = {
  background:   '#0f2040',
  border:       '1px solid rgba(255,255,255,0.12)',
  color:        '#e2e8f0',
  borderRadius: 8,
  padding:      '5px 8px',
  fontSize:     '0.8rem',
  cursor:       'pointer',
  maxWidth:     160,
  outline:      'none',
}

export default function Header() {
  const { territory, setTerritory, period, setPeriod, bu, setBu, territories, periods } = useApp()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const roleColor = ROLE_COLOR[user?.role] || '#1e68d4'
  const initials  = user?.initials || user?.name?.split(' ').map(p => p[0]).join('').slice(0, 2) || '?'

  return (
    <header style={{
      position:      'fixed',
      top: 0, left: 0, right: 0,
      height:        60,
      background:    '#081425',
      borderBottom:  '1px solid rgba(255,255,255,0.07)',
      display:       'flex',
      alignItems:    'center',
      padding:       '0 16px',
      gap:           12,
      zIndex:        100,
      backdropFilter:'blur(8px)',
    }}>

      {/* ── Brand ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <img src={gskLogo} alt="GSK" style={{ height: 30, width: 'auto', borderRadius: 4 }} />
        <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#e2e8f0', whiteSpace: 'nowrap' }}>
          Sample IQ2020 Model
        </span>
      </div>

      {/* ── BU pills ── */}
      <div style={{ display: 'flex', gap: 4 }}>
        {['AIR', 'SBU', 'Vaccines'].map(b => (
          <button
            key={b}
            onClick={() => setBu(b)}
            style={{
              padding:      '3px 10px',
              borderRadius: 20,
              fontSize:     '0.73rem',
              fontWeight:   700,
              cursor:       'pointer',
              border:       bu === b ? '1px solid #F36F21' : '1px solid rgba(255,255,255,0.12)',
              background:   bu === b ? '#F36F21' : 'transparent',
              color:        bu === b ? '#fff' : '#94a3b8',
              transition:   'all 0.15s',
            }}
          >
            {b}
          </button>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      {/* ── Territory + Period selectors ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <select style={SEL} value={territory} onChange={e => setTerritory(e.target.value)}>
          {territories.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select style={SEL} value={period} onChange={e => setPeriod(e.target.value)}>
          {periods.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      {/* ── User menu ── */}
      {user && (
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          8,
              background:   'rgba(255,255,255,0.05)',
              border:       '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              padding:      '5px 10px 5px 6px',
              cursor:       'pointer',
              transition:   'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            {/* Avatar circle */}
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: `${roleColor}28`,
              border:     `1.5px solid ${roleColor}80`,
              display:    'flex', alignItems: 'center', justifyContent: 'center',
              fontSize:   '0.65rem', fontWeight: 800, color: roleColor,
              flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '0.65rem', color: roleColor }}>
                {user.role}
              </div>
            </div>
            <ChevronDown size={13} color="#64748b" style={{ marginLeft: 2, transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <>
              {/* Backdrop to close menu */}
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 199 }}
                onClick={() => setMenuOpen(false)}
              />
              <div style={{
                position:   'absolute',
                top:        '100%',
                right:      0,
                marginTop:  6,
                background: '#0f2040',
                border:     '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                boxShadow:  '0 8px 32px rgba(0,0,0,0.5)',
                minWidth:   200,
                zIndex:     200,
                overflow:   'hidden',
              }}>
                {/* User info panel */}
                <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%',
                      background: `${roleColor}28`, border: `2px solid ${roleColor}60`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.8rem', fontWeight: 800, color: roleColor,
                    }}>
                      {initials}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0' }}>{user.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
                        {user.role} · <span style={{ color: '#64748b' }}>{user.username}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 5, fontWeight: 700, background: `${roleColor}22`, color: roleColor }}>
                      {user.role}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                      Territory: {user.territory}
                    </span>
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={() => { logout(); setMenuOpen(false) }}
                  style={{
                    width:       '100%',
                    display:     'flex',
                    alignItems:  'center',
                    gap:         9,
                    padding:     '10px 14px',
                    background:  'none',
                    border:      'none',
                    cursor:      'pointer',
                    fontSize:    '0.82rem',
                    fontWeight:  600,
                    color:       '#ef4444',
                    textAlign:   'left',
                    transition:  'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  )
}
