import { NavLink } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { LayoutDashboard, TrendingUp, Users, Bell, Mic, Syringe } from 'lucide-react'

const tabs = [
  { to: '/',            label: 'Executive',   icon: LayoutDashboard, bus: ['AIR','SBU','Vaccines'] },
  { to: '/performance', label: 'Performance', icon: TrendingUp,      bus: ['AIR','SBU'] },
  { to: '/hcp-tracker', label: 'HCP Tracker', icon: Users,           bus: ['AIR','SBU'] },
  { to: '/alerts',      label: 'Alerts',      icon: Bell,            bus: ['AIR','SBU','Vaccines'] },
  { to: '/speakers',    label: 'Speakers',    icon: Mic,             bus: ['AIR','SBU'] },
  { to: '/vaccines',    label: 'Vaccines BU', icon: Syringe,         bus: ['Vaccines'] },
]

export default function TabNav() {
  const { bu } = useApp()
  const visible = tabs.filter(t => t.bus.includes(bu))

  return (
    <nav style={{
      position:       'fixed',
      top:            60,
      left:           0,
      right:          0,
      height:         40,
      background:     '#0c1a2e',
      borderBottom:   '1px solid rgba(255,255,255,0.07)',
      display:        'flex',
      alignItems:     'center',
      padding:        '0 8px',
      gap:            2,
      zIndex:         90,
      overflowX:      'auto',
      scrollbarWidth: 'none',
    }}>
      {visible.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          style={({ isActive }) => ({
            display:        'flex',
            alignItems:     'center',
            gap:            5,
            padding:        '4px 10px',
            borderRadius:   7,
            fontSize:       '0.76rem',
            fontWeight:     500,
            whiteSpace:     'nowrap',
            textDecoration: 'none',
            transition:     'background 0.15s, color 0.15s',
            background:     isActive ? '#1e68d4' : 'transparent',
            color:          isActive ? '#ffffff' : '#94a3b8',
            boxShadow:      isActive ? '0 2px 8px rgba(30,104,212,0.28)' : 'none',
          })}
        >
          {({ isActive }) => (
            <>
              <Icon size={13} color={isActive ? '#ffffff' : '#64748b'} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
