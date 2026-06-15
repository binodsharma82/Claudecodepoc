import { NavLink } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { LayoutDashboard, TrendingUp, Users, Bell, Mic, Syringe } from 'lucide-react'

const items = [
  { to: '/',            label: 'Home',    icon: LayoutDashboard, bus: ['AIR','SBU','Vaccines'] },
  { to: '/performance', label: 'Perform', icon: TrendingUp,      bus: ['AIR','SBU'] },
  { to: '/hcp-tracker', label: 'HCPs',   icon: Users,           bus: ['AIR','SBU'] },
  { to: '/alerts',      label: 'Alerts', icon: Bell,            bus: ['AIR','SBU','Vaccines'] },
  { to: '/speakers',    label: 'Speakers',icon: Mic,            bus: ['AIR','SBU'] },
  { to: '/vaccines',    label: 'Vaccines',icon: Syringe,        bus: ['Vaccines'] },
]

export default function BottomNav() {
  const { bu } = useApp()
  const visible = items.filter(t => t.bus.includes(bu)).slice(0, 5)

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-iq-surface border-t border-white/[0.07] flex items-stretch z-[100] lg:hidden">
      {visible.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 text-[0.65rem] font-medium transition-colors ${
              isActive ? 'text-iq-orange' : 'text-iq-faint hover:text-iq-text'
            }`
          }
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
