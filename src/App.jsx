import { useState } from 'react'
import { useApp } from './contexts/AppContext'
import Login   from './pages/Login'
import Home    from './pages/Home'
import Entries from './pages/Entries'
import Report  from './pages/Report'
import Admin   from './pages/Admin'
import Toast   from './components/Toast'
import BottomNav from './components/BottomNav'
import TopBar    from './components/TopBar'
import { C } from './utils/helpers'

export default function App() {
  const { user } = useApp()
  const [page, setPage] = useState('home')

  if (!user) return <><Login /><Toast /></>

  const renderPage = () => {
    switch (page) {
      case 'home':    return <Home />
      case 'entries': return <Entries />
      case 'report':  return <Report />
      case 'admin':   return <Admin setPage={setPage} />
      default:        return <Home />
    }
  }

  return (
    <div style={{
      maxWidth: 430, margin: '0 auto',
      minHeight: '100dvh', background: C.bg,
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      <TopBar page={page} setPage={setPage} />
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
        {renderPage()}
      </div>
      {page !== 'admin' && <BottomNav page={page} setPage={setPage} />}
      <Toast />
    </div>
  )
}
