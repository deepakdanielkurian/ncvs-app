import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { db, auth } from '../firebase'
import { doc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { showToast } from '../components/Toast'
import { useNavigate } from 'react-router-dom'

export default function Admin() {
  const { user, role, logout } = useAuth()
  const nav = useNavigate()
  const [tab, setTab] = useState('users')

  if (role !== 'admin') {
    return (
      <div className="screen fade-up">
        <div className="empty">
          <div className="empty-icon">🔒</div>
          <div className="empty-txt">Admin access only.<br />Contact the administrator.</div>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    await logout()
    nav('/login')
  }

  return (
    <div className="screen fade-up">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div>
          <div style={{ fontSize:15, fontWeight:600, color:'var(--dk)' }}>Admin Panel</div>
          <div style={{ fontSize:11, color:'var(--mid)', marginTop:2 }}>{user?.email}</div>
        </div>
        <button onClick={handleLogout}
          style={{ padding:'7px 12px', border:'1px solid var(--bd)', borderRadius:8, background:'var(--red-lt)', color:'var(--red)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
          Sign out
        </button>
      </div>

      <div className="rtype-row">
        <div className={`rtype-chip${tab==='users'?' active':''}`} onClick={()=>setTab('users')}>Users</div>
        <div className={`rtype-chip${tab==='settings'?' active':''}`} onClick={()=>setTab('settings')}>Settings</div>
        <div className={`rtype-chip${tab==='data'?' active':''}`} onClick={()=>setTab('data')}>Data</div>
      </div>

      {tab === 'users' && <UsersTab />}
      {tab === 'settings' && <SettingsTab />}
      {tab === 'data' && <DataTab />}
    </div>
  )
}

function UsersTab() {
  const [email, setEmail]   = useState('')
  const [pw, setPw]         = useState('')
  const [role, setRole]     = useState('treasurer')
  const [name, setName]     = useState('')
  const [creating, setCreating] = useState(false)

  const create = async () => {
    if (!email.trim() || !pw || pw.length < 6) {
      showToast('❌ Valid email and password (min 6 chars) required')
      return
    }
    setCreating(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pw)
      await setDoc(doc(db, 'users', cred.user.uid), {
        email: email.trim(), role, name: name.trim(),
        createdAt: new Date().toISOString()
      })
      showToast(`✅ User "${email}" created as ${role}`)
      setEmail(''); setPw(''); setName('')
    } catch (e) {
      showToast('❌ ' + (e.message || 'Failed to create user'))
    }
    setCreating(false)
  }

  return (
    <div>
      <div className="card card-pad" style={{ marginBottom:14 }}>
        <div className="card-title">Create new user</div>
        <div className="field"><label>Full name</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Mathai K M" />
        </div>
        <div className="field"><label>Email address <span className="req">*</span></label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="user@email.com" />
        </div>
        <div className="field"><label>Password <span className="req">*</span></label>
          <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Min 6 characters" />
        </div>
        <div className="field"><label>Role</label>
          <div className="tog-row">
            {['admin','treasurer'].map(r => (
              <button key={r} className={`tog-btn act-on`}
                style={{ opacity: role===r?1:.4, textTransform:'capitalize' }}
                onClick={() => setRole(r)}>{r}</button>
            ))}
          </div>
        </div>
        <button className="btn-primary" onClick={create} disabled={creating}>
          {creating ? 'Creating…' : '➕ Create user'}
        </button>
      </div>

      <div className="card card-pad">
        <div className="card-title">Current users</div>
        <div style={{ fontSize:12, color:'var(--mid)', lineHeight:1.8 }}>
          Users are managed in Firebase Authentication.<br />
          Go to <b>console.firebase.google.com</b> → Authentication → Users to view, disable, or delete users.<br /><br />
          Role data is stored in Firestore → <b>users</b> collection.
        </div>
      </div>
    </div>
  )
}

function SettingsTab() {
  return (
    <div className="card card-pad">
      <div className="card-title">Organisation settings</div>
      <div style={{ fontSize:12, color:'var(--mid)', lineHeight:1.9 }}>
        <b>Organisation:</b> Niranam Chundan Vallasamithi<br />
        <b>Reg. No.:</b> PTM/TC/229/2021<br />
        <b>Financial Year:</b> 01 Apr 2026 – 31 Mar 2027<br />
        <b>Email:</b> niranamchundan@gmail.com<br />
        <b>Address:</b> Niranam P.O., Thiruvalla, Pathanamthitta<br /><br />
        <div style={{ background:'var(--amb-lt)', borderRadius:8, padding:'10px 12px', color:'var(--amb)' }}>
          To update these details, edit the constants in<br />
          <b>src/utils/helpers.js</b> and redeploy.
        </div>
      </div>
    </div>
  )
}

function DataTab() {
  const [counts, setCounts] = useState(null)
  const [loading, setLoading] = useState(false)

  const getCounts = async () => {
    setLoading(true)
    try {
      const [e, m, a] = await Promise.all([
        getDocs(collection(db, 'entries')),
        getDocs(collection(db, 'members')),
        getDocs(collection(db, 'attendance')),
      ])
      setCounts({ entries: e.size, members: m.size, attendance: a.size })
    } catch { showToast('❌ Failed to load') }
    setLoading(false)
  }

  return (
    <div>
      <div className="card card-pad" style={{ marginBottom:10 }}>
        <div className="card-title">Database summary</div>
        <button className="btn-primary" onClick={getCounts} disabled={loading}>
          {loading ? 'Loading…' : '📊 Load counts'}
        </button>
        {counts && (
          <div style={{ marginTop:12, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            {[['Entries',counts.entries,'var(--pur)'],['Members',counts.members,'var(--nri)'],['Att. sessions',counts.attendance,'var(--grn)']].map(([l,v,c])=>(
              <div key={l} style={{ background:'var(--bg)', borderRadius:8, padding:'10px 8px', textAlign:'center' }}>
                <div style={{ fontSize:22, fontWeight:700, color:c }}>{v}</div>
                <div style={{ fontSize:10, color:'var(--mid)', marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="card card-pad">
        <div className="card-title">Firebase console</div>
        <div style={{ fontSize:12, color:'var(--mid)', lineHeight:1.8 }}>
          Manage all data directly at:<br />
          <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer"
             style={{ color:'var(--nri)', fontWeight:600 }}>
            console.firebase.google.com
          </a><br /><br />
          Collections used:<br />
          • <b>entries</b> — All donations and subscriptions<br />
          • <b>members</b> — Member contact list<br />
          • <b>attendance</b> — Session attendance records<br />
          • <b>users</b> — App user roles (admin/treasurer)
        </div>
      </div>
    </div>
  )
}
