import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const NAV = [
  { path: '/',           icon: '🏠', label: 'Home'       },
  { path: '/members',    icon: '👥', label: 'Members'    },
  { path: '/entries',    icon: '📝', label: 'Entries'    },
  { path: '/attendance', icon: '✅', label: 'Attendance' },
  { path: '/report',     icon: '📊', label: 'Report'     },
]

export default function Layout() {
  const nav      = useNavigate()
  const { pathname } = useLocation()
  const { role } = useAuth()

  return (
    <>
      {/* Top bar */}
      <div className="topbar">
        <div className="topbar-row">
          <div>
            <div className="org-name">Niranam Chundan Vallasamithi</div>
            <div className="org-sub">നിരണം ചുണ്ടൻ വള്ളസമിതി · Reg. No. PTM/TC/229/2021</div>
          </div>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            <span className="fy-badge">FY 2026–27</span>
            {role === 'admin' && (
              <button
                onClick={() => nav('/admin')}
                style={{ background:'var(--gld)', border:'none', borderRadius:6, padding:'4px 8px', color:'#fff', fontSize:11, fontWeight:600, cursor:'pointer' }}
              >⚙️ Admin</button>
            )}
          </div>
        </div>
      </div>

      {/* Page content */}
      <div style={{ paddingBottom: 0 }}>
        <Outlet />
      </div>

      {/* Bottom nav */}
      <nav className="bottom-nav">
        {NAV.map(item => (
          <button
            key={item.path}
            className={`nav-item${pathname === item.path ? ' active' : ''}`}
            onClick={() => nav(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
