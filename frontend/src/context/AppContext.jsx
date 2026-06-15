import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api/client'
import { useAuth } from './AuthContext'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const { user } = useAuth()
  const allowedBus = user?.bus?.length ? user.bus : ['AIR', 'SBU', 'Vaccines']

  const [territory, setTerritory] = useState('ALL')
  const [period, setPeriod] = useState('2025-06')
  const [bu, setBu] = useState(() => allowedBus[0] || 'AIR')
  const [territories, setTerritories] = useState([])

  useEffect(() => {
    api.territories().then(setTerritories).catch(console.error)
  }, [])


  const periods = [
    { value: '2025-01', label: 'Jan 2025' },
    { value: '2025-02', label: 'Feb 2025' },
    { value: '2025-03', label: 'Mar 2025' },
    { value: '2025-04', label: 'Apr 2025' },
    { value: '2025-05', label: 'May 2025' },
    { value: '2025-06', label: 'Jun 2025' },
  ]

  return (
    <AppContext.Provider value={{ territory, setTerritory, period, setPeriod, bu, setBu, territories, periods, allowedBus }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
