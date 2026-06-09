import { useState, useEffect } from 'react'
import { useApp } from '../contexts/AppContext'
import { C } from '../utils/helpers'

export default function Admin({ setPage }) {
  const { user, logout, createUser, getUsers, deleteUser, showToast } = useApp()
  const role = user?.role
  const [tab,     setTab]     = useState('users')
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(false)
  const [form,    setForm]    = useState({ username:'', password:'', name:'', role:'treasurer' })
  const [creating, setCreating] = useState(false)

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const loadUsers = async () => {
    setLoading(true)
    try { setUsers(await getUsers()) }
    catch { showToast('❌ Failed to load users') }
    setLoading(false)
  }

  useEffect(() => { if (tab === 'users') loadUsers() }, [tab])

  const handleCreate = async () => {
    if (!form.username.trim() || !form.password || form.password.length < 4) {
      showToast('❌ Username and password (min 4 chars) required'); return
    }
    setCreating(true)
    try {
      await createUser(form)
      showToast(`✅ User "${form.username}" created`)
      setForm({ username:'', password:'', name:'', role:'treasurer' })
      loadUsers()
    } catch (e) { showToast('❌ ' + (e.message || 'Failed')) }
    setCreating(false)
  }

  const handleDelete = async (id, uname) => {
    if (!window.confirm(`Remove user "${uname}"?`)) return
    try { await deleteUser(id); showToast('🗑️ User removed'); loadUsers() }
    catch { showToast('❌ Failed') }
  }

  const handleLogout = () => { logout(); setPage('home') }

  if (role !== 'admin') {
    return (
      <div style={{ padding:'12px 13px', textAlign:'center', paddingTop:60 }}>
        <i className="ti ti-lock" style={{ fontSize:48, color:C.mid, display:'block', marginBottom:12 }} />
        <div style={{ fontSize:14, color:C.mid }}>Admin access only</div>
        <button onClick={() => setPage('home')} style={{ marginTop:20, padding:'10px 20px', background:C.hdr, color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>← Back</button>
      </div>
    )
  }

  return (
    <div style={{ padding:'12px 13px' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:700, color:C.dk }}>Admin Panel</div>
          <div style={{ fontSize:11, color:C.mid, marginTop:2 }}>Logged in as <b>{user?.name || user?.username}</b> · {user?.role}</div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={() => setPage('home')} style={{ padding:'7px 12px', border:`1px solid ${C.bd}`, borderRadius:8, background:C.bg, color:C.dk, fontSize:12, fontWeight:600, cursor:'pointer' }}>← Home</button>
          <button onClick={handleLogout} style={{ padding:'7px 12px', border:`1px solid ${C.red}40`, borderRadius:8, background:C.redLt, color:C.red, fontSize:12, fontWeight:600, cursor:'pointer' }}>Sign out</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:16 }}>
        {['users','info'].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{
            flex:1, padding:'9px 4px', border:`1px solid ${tab===t?C.hdr:C.bd}`,
            borderRadius:8, background:tab===t?C.hdr:'#fff',
            color:tab===t?'#fff':C.mid, fontSize:12, fontWeight:600, cursor:'pointer',
          }}>
            {t === 'users' ? '👤 Manage Users' : 'ℹ️ App Info'}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <>
          {/* Create user form */}
          <div style={{ background:'#fff', borderRadius:10, border:`1px solid ${C.bd}`, padding:'14px', marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.mid, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:12 }}>Create new user</div>

            {[['name','Full name','text','e.g. Mathai K M'],['username','Username *','text','e.g. mathai'],['password','Password *','password','Min 4 characters']].map(([k,label,type,ph])=>(
              <div key={k} style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, fontWeight:600, color:C.mid, marginBottom:4 }}>{label}</div>
                <input type={type} value={form[k]} onChange={e=>setF(k,e.target.value)} placeholder={ph}
                  style={{ width:'100%', border:`1px solid ${C.bd}`, borderRadius:8, padding:'10px 12px', fontSize:14, color:C.dk, background:C.bg, fontFamily:'inherit', outline:'none', WebkitAppearance:'none', boxSizing:'border-box' }} />
              </div>
            ))}

            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:600, color:C.mid, marginBottom:6 }}>Role</div>
              <div style={{ display:'flex', gap:6 }}>
                {[['admin','Admin','Full access'],['treasurer','Treasurer','View & enter data']].map(([r,label,desc])=>(
                  <button key={r} onClick={()=>setF('role',r)} style={{
                    flex:1, padding:'9px 8px', border:`1px solid ${form.role===r?C.hdr:C.bd}`,
                    borderRadius:8, background:form.role===r?C.hdrLt:'#fff',
                    color:form.role===r?C.hdr:C.mid, cursor:'pointer', textAlign:'left',
                  }}>
                    <div style={{ fontSize:12, fontWeight:700 }}>{label}</div>
                    <div style={{ fontSize:10, marginTop:2 }}>{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleCreate} disabled={creating} style={{
              width:'100%', padding:13, background:creating?C.mid:C.hdr,
              color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:creating?'not-allowed':'pointer',
            }}>
              {creating ? 'Creating…' : '➕ Create user'}
            </button>
          </div>

          {/* User list */}
          <div style={{ background:'#fff', borderRadius:10, border:`1px solid ${C.bd}`, padding:'14px' }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.mid, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:10 }}>Current users</div>
            {loading ? (
              <div style={{ textAlign:'center', padding:20, color:C.mid }}>Loading…</div>
            ) : users.length === 0 ? (
              <div style={{ fontSize:13, color:C.mid, textAlign:'center', padding:20 }}>No users found</div>
            ) : users.map(u => (
              <div key={u.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:`1px solid ${C.bd}` }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:u.role==='admin'?C.gldLt:C.nriLt, color:u.role==='admin'?C.gld:C.nri, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                  {u.role === 'admin' ? '👑' : '👤'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:C.dk }}>{u.name || u.username}</div>
                  <div style={{ fontSize:11, color:C.mid }}>@{u.username} · <span style={{ color:u.role==='admin'?C.gld:C.nri, fontWeight:600 }}>{u.role}</span></div>
                </div>
                {u.id !== user?.id && (
                  <button onClick={() => handleDelete(u.id, u.username)} style={{ padding:'5px 10px', border:`1px solid ${C.red}40`, borderRadius:7, background:C.redLt, color:C.red, fontSize:11, fontWeight:600, cursor:'pointer' }}>Remove</button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'info' && (
        <div style={{ background:'#fff', borderRadius:10, border:`1px solid ${C.bd}`, padding:'16px' }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.mid, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:12 }}>App information</div>
          {[
            ['Organisation', 'Niranam Chundan Vallasamithi'],
            ['Malayalam', 'നിരണം ചുണ്ടൻ വള്ളസമിതി'],
            ['Reg. No.', 'PTM/TC/229/2021'],
            ['Email', 'niranamchundan@gmail.com'],
            ['Address', 'Niranam P.O., Thiruvalla, Pathanamthitta, Kerala – 689621'],
            ['Financial Year', '01 Apr 2026 – 31 Mar 2027'],
            ['Firebase Project', 'ncvs-donation-tracker'],
            ['Stack', 'React + Vite + Firebase Firestore + Vercel'],
          ].map(([k,v]) => (
            <div key={k} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:`1px solid ${C.bd}` }}>
              <div style={{ fontSize:11, color:C.mid, fontWeight:600, width:100, flexShrink:0 }}>{k}</div>
              <div style={{ fontSize:12, color:C.dk }}>{v}</div>
            </div>
          ))}

          <div style={{ marginTop:16, background:C.ambLt, borderRadius:8, padding:'12px', fontSize:12, color:C.amb, lineHeight:1.7 }}>
            <b>Firestore collections:</b><br />
            • <b>entries</b> — Donations & subscriptions<br />
            • <b>members</b> — Member contact list<br />
            • <b>attendance</b> — Session attendance<br />
            • <b>users</b> — Login credentials & roles
          </div>
        </div>
      )}
    </div>
  )
}
