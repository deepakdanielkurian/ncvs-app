import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { C } from '../utils/helpers'

export default function Login() {
  const { login, authLoading } = useApp()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr]           = useState('')

  const handle = async (e) => {
    e.preventDefault()
    setErr('')
    if (!username.trim() || !password) { setErr('Enter username and password'); return }
    const res = await login(username, password)
    if (!res.ok) setErr(res.error)
  }

  const inp = {
    width: '100%', border: `1px solid ${C.bd}`, borderRadius: 10,
    padding: '12px 14px', fontSize: 15, color: C.dk,
    background: '#F8F7F4', outline: 'none', fontFamily: 'inherit',
    WebkitAppearance: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 24, background: C.hdr,
    }}>
      <div style={{
        background: '#fff', borderRadius: 18,
        padding: '32px 24px', width: '100%', maxWidth: 380,
        boxShadow: '0 20px 60px rgba(0,0,0,.3)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: C.hdr, margin: '0 auto 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="ti ti-sailboat" style={{ fontSize: 36, color: '#fff' }} />
          </div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 17, fontWeight: 700, color: C.hdr, lineHeight: 1.3 }}>
            Niranam Chundan Vallasamithi
          </div>
          <div style={{ fontSize: 11, color: C.mid, marginTop: 4 }}>
            നിരണം ചുണ്ടൻ വള്ളസമിതി
          </div>
          <div style={{ fontSize: 11, color: C.mid }}>Reg. No. PTM/TC/229/2021</div>
        </div>

        <div style={{ fontSize: 20, fontWeight: 700, color: C.dk, marginBottom: 20 }}>Sign in</div>

        {err && (
          <div style={{
            background: C.redLt, color: C.red,
            padding: '10px 14px', borderRadius: 8,
            fontSize: 13, marginBottom: 14, borderLeft: `3px solid ${C.red}`,
          }}>
            ⚠️ {err}
          </div>
        )}

        <form onSubmit={handle}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.mid, marginBottom: 5 }}>Username</div>
            <input value={username} onChange={e => setUsername(e.target.value)}
              placeholder="Enter username" style={inp} autoComplete="username" autoCapitalize="none" />
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.mid, marginBottom: 5 }}>Password</div>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Enter password" style={inp} autoComplete="current-password" />
          </div>
          <button type="submit" disabled={authLoading} style={{
            width: '100%', padding: 14, background: authLoading ? C.mid : C.hdr,
            color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 15, fontWeight: 700, cursor: authLoading ? 'not-allowed' : 'pointer',
          }}>
            {authLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: 20, fontSize: 11, color: C.mid, textAlign: 'center', lineHeight: 1.7 }}>
          Contact admin to get your login credentials.<br />
          <span style={{ color: C.hdr, fontWeight: 600 }}>FY 2026–27 Donation Tracker</span>
        </div>
      </div>
    </div>
  )
}
