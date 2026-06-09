import { C } from '../utils/helpers'

const NAV = [
  { id: 'home',       icon: 'ti-home',        label: 'Home'       },
  { id: 'members',    icon: 'ti-users',        label: 'Members'    },
  { id: 'entries',    icon: 'ti-notes',        label: 'Entries'    },
  { id: 'attendance', icon: 'ti-checkbox',     label: 'Attendance' },
  { id: 'report',     icon: 'ti-chart-bar',    label: 'Report'     },
]

export default function BottomNav({ page, setPage }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%',
      transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430,
      background: '#fff',
      borderTop: `1px solid ${C.bd}`,
      display: 'flex',
      paddingBottom: `max(8px, env(safe-area-inset-bottom))`,
      zIndex: 100,
    }}>
      {NAV.map(item => {
        const active = page === item.id
        return (
          <button key={item.id} onClick={() => setPage(item.id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 2,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '8px 4px 4px',
            color: active ? C.hdrAcc : C.mid,
            transition: 'color .15s',
          }}>
            <i className={`ti ${item.icon}`} style={{ fontSize: 22 }} />
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.02em' }}>{item.label}</span>
            {active && (
              <div style={{ width: 18, height: 2, background: C.hdrAcc, borderRadius: 2, marginTop: 1 }} />
            )}
          </button>
        )
      })}
    </div>
  )
}
