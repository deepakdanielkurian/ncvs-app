import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail]   = useState('')
  const [pw, setPw]         = useState('')
  const [err, setErr]       = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const nav = useNavigate()

  const handle = async (e) => {
    e.preventDefault()
    setErr(''); setLoading(true)
    try {
      await login(email.trim(), pw)
      nav('/')
    } catch (e) {
      setErr('Invalid email or password. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="login-wrap">
      <div className="login-card fade-up">
        <div className="login-logo">
          <div style={{ fontSize:44, marginBottom:8 }}>⚓</div>
          <div className="login-org">Niranam Chundan Vallasamithi</div>
          <div className="login-sub">നിരണം ചുണ്ടൻ വള്ളസമിതി · Reg. No. PTM/TC/229/2021</div>
        </div>

        <div className="login-title">Sign in</div>

        {err && <div className="login-err">⚠️ {err}</div>}

        <form onSubmit={handle}>
          <div className="field">
            <label>Email address</label>
            <input
              type="email" value={email} required
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password" value={pw} required
              onChange={e => setPw(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop:20, fontSize:11, color:'var(--mid)', textAlign:'center', lineHeight:1.6 }}>
          Contact admin to get your login credentials.<br />
          FY 2026–27 Donation Tracker
        </div>
      </div>
    </div>
  )
}
