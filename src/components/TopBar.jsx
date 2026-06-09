import { useApp } from '../contexts/AppContext'
import { C } from '../utils/helpers'

export default function TopBar({ page, setPage }) {
  const { user } = useApp()

  return (
    <div style={{
      background: C.hdr,
      padding: '14px 16px 12px',
      position: 'sticky', top: 0, zIndex: 100,
      borderBottom: `2px solid ${C.hdrAcc}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, color: C.hdrLt, lineHeight: 1.2, fontWeight: 700 }}>
            Niranam Chundan Vallasamithi
          </div>
          <div style={{ fontSize: 10, color: '#9FE1CB', marginTop: 2 }}>
            നിരണം ചുണ്ടൻ വള്ളസമിതി · Reg. No. PTM/TC/229/2021
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{
            background: '#BA7517', color: '#fff',
            fontSize: 9, fontWeight: 700, padding: '3px 8px',
            borderRadius: 20, letterSpacing: '.04em',
          }}>FY 2026–27</span>
          {user?.role === 'admin' && (
            <button onClick={() => setPage('admin')} style={{
              background: page === 'admin' ? '#BA7517' : 'rgba(255,255,255,.15)',
              border: 'none', borderRadius: 6, padding: '5px 8px',
              color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <i className="ti ti-settings" style={{ fontSize: 14 }} /> Admin
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
