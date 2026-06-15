import Header from './Header'
import TabNav from './TabNav'
import BottomNav from './BottomNav'

export default function Layout({ children }) {
  return (
    /* bg and text colour hardcoded — no Tailwind custom-colour utilities */
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#07111f', color: '#e2e8f0' }}>
      <Header />
      <TabNav />
      {/* Header 60px + TabNav 40px = 100px top offset */}
      <main style={{ marginTop: 100, flex: 1, padding: '16px 16px 80px', maxWidth: '100%' }}
        className="md:px-6 md:py-5 lg:pb-6">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
