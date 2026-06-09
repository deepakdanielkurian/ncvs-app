import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { C, initials, groupStyle } from '../utils/helpers'
import { Empty, SearchBar } from './Home'

const EMPTY_M = { name: '', group: 'NRI', phone: '', whatsapp: '', location: '', email: '', notes: '' }

export default function Members() {
  const { members, dataLoading, addMember, updateMember, deleteMember, showToast } = useApp()
  const [q, setQ]       = useState('')
  const [grp, setGrp]   = useState('all')
  const [modal, setModal] = useState(null)
  const [f, setF]         = useState({ ...EMPTY_M })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const filtered = members.filter(m => {
    const mg = grp === 'all' || m.group === grp
    const mq = !q ||
      (m.name || '').toLowerCase().includes(q.toLowerCase()) ||
      (m.phone || '').includes(q) ||
      (m.location || '').toLowerCase().includes(q.toLowerCase())
    return mg && mq
  })

  const openAdd  = ()  => { setF({ ...EMPTY_M }); setModal('add') }
  const openEdit = (m) => { setF({ ...m });        setModal(m)    }

  const save = async () => {
    if (!f.name.trim()) { showToast('❌ Enter member name'); return }
    setSaving(true)
    try {
      if (modal?.id) { await updateMember(modal.id, f); showToast('✅ Member updated!') }
      else           { await addMember(f);               showToast('✅ Member added!')   }
      setModal(null)
    } catch { showToast('❌ Failed to save') }
    setSaving(false)
  }

  const del = async (id) => {
    if (!window.confirm('Remove this member?')) return
    try { await deleteMember(id); showToast('🗑️ Removed') }
    catch { showToast('❌ Failed') }
  }

  return (
    <div style={{ padding: '12px 13px' }}>
      <SearchBar value={q} onChange={setQ} placeholder="Search name, phone, location…" />

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, overflowX: 'auto' }}>
        {['all', 'NRI', 'Kerala'].map(g => (
          <Chip key={g} active={grp === g} onClick={() => setGrp(g)}>
            {g === 'all' ? 'All members' : g}
          </Chip>
        ))}
      </div>

      <button onClick={openAdd} style={{
        width: '100%', padding: 13, background: C.hdr, color: '#fff',
        border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
        cursor: 'pointer', marginBottom: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        <i className="ti ti-user-plus" style={{ fontSize: 18 }} /> Add member
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.dk }}>Members</div>
        <div style={{ fontSize: 11, color: C.mid, background: C.bg, padding: '2px 8px', borderRadius: 20, border: `1px solid ${C.bd}` }}>
          {filtered.length} total
        </div>
      </div>

      {dataLoading ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.mid }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <Empty icon="ti-users" text={q ? 'No members found.' : 'No members yet.\nTap Add member to begin.'} />
      ) : filtered.map(m => {
        const gs = groupStyle(m.group)
        return (
          <div key={m.id} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${C.bd}`, padding: '12px 13px', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: gs.bg, color: gs.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                {initials(m.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.dk }}>{m.name}</div>
                <div style={{ display: 'flex', gap: 5, marginTop: 3, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 5px', borderRadius: 4, background: gs.bg, color: gs.color }}>{m.group}</span>
                  {m.location && <span style={{ fontSize: 11, color: C.mid }}>📍 {m.location}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {m.phone && (
                  <a href={`tel:${m.phone}`} style={{ width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${C.bd}`, background: C.bg, textDecoration: 'none', fontSize: 16 }}>📞</a>
                )}
                {m.whatsapp && (
                  <a href={`https://wa.me/${m.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                    style={{ width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${C.bd}`, background: C.bg, textDecoration: 'none', fontSize: 16 }}>💬</a>
                )}
              </div>
            </div>

            {(m.phone || m.email || m.notes) && (
              <div style={{ fontSize: 11, color: C.mid, lineHeight: 1.7, marginBottom: 8, paddingLeft: 52 }}>
                {m.phone && <div><i className="ti ti-phone" style={{ fontSize: 12, marginRight: 4 }} />{m.phone}</div>}
                {m.email && <div><i className="ti ti-mail"  style={{ fontSize: 12, marginRight: 4 }} />{m.email}</div>}
                {m.notes && <div><i className="ti ti-notes" style={{ fontSize: 12, marginRight: 4 }} />{m.notes}</div>}
              </div>
            )}

            <div style={{ display: 'flex', gap: 6, borderTop: `1px solid ${C.bd}`, paddingTop: 9 }}>
              <ActionBtn icon="ti-pencil" label="Edit"   color={C.gld} bg={C.gldLt} onClick={() => openEdit(m)} />
              <ActionBtn icon="ti-trash"  label="Remove" color={C.red} bg={C.redLt} onClick={() => del(m.id)} />
            </div>
          </div>
        )
      })}

      {/* Add/Edit modal */}
      {modal && (
        <div onClick={e => e.target === e.currentTarget && setModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '16px 16px 0 0', padding: '20px 16px 36px', width: '100%', maxWidth: 430, maxHeight: '90dvh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.dk }}>{modal === 'add' ? 'Add member' : 'Edit member'}</div>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', fontSize: 22, color: C.mid, cursor: 'pointer' }}>×</button>
            </div>

            {[['name','Full name *','text','Full name'],['phone','Phone number','tel','+91 XXXXX XXXXX'],['whatsapp','WhatsApp (with country code)','tel','+971 XX XXX XXXX'],['location','Location / Place','text','Dubai, Niranam, Kuwait…'],['email','Email','email','Optional']].map(([k,label,type,ph]) => (
              <MField key={k} label={label}>
                <input type={type} value={f[k]||''} onChange={e=>set(k,e.target.value)} placeholder={ph} style={minp} />
              </MField>
            ))}
            <MField label="Group">
              <div style={{ display: 'flex', gap: 6 }}>
                {['NRI','Kerala'].map(g=>{
                  const gs=groupStyle(g)
                  return <button key={g} onClick={()=>set('group',g)} style={{ flex:1, padding:'9px 4px', border:`1px solid ${f.group===g?gs.color:C.bd}`, borderRadius:8, background:f.group===g?gs.bg:C.bg, color:f.group===g?gs.color:C.mid, fontWeight:f.group===g?700:500, fontSize:12, cursor:'pointer' }}>{g}</button>
                })}
              </div>
            </MField>
            <MField label="Notes">
              <textarea value={f.notes||''} onChange={e=>set('notes',e.target.value)} placeholder="Any notes…" style={{...minp,height:60,resize:'none'}} />
            </MField>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={() => setModal(null)} style={{ flex:1, padding:13, border:`1px solid ${C.bd}`, borderRadius:8, background:C.bg, color:C.mid, fontSize:13, fontWeight:500, cursor:'pointer' }}>Cancel</button>
              <button onClick={save} disabled={saving} style={{ flex:2, padding:13, border:'none', borderRadius:8, background:saving?C.mid:C.gld, color:'#fff', fontSize:13, fontWeight:700, cursor:saving?'not-allowed':'pointer' }}>
                {saving?'Saving…':'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const minp = { width:'100%', border:`1px solid ${C.bd}`, borderRadius:8, padding:'10px 12px', fontSize:14, color:C.dk, background:C.bg, fontFamily:'inherit', outline:'none', WebkitAppearance:'none', boxSizing:'border-box' }
function MField({ label, children }) { return <div style={{ marginBottom:12 }}><div style={{ fontSize:11, fontWeight:600, color:C.mid, marginBottom:5 }}>{label}</div>{children}</div> }
function Chip({ active, onClick, children }) {
  return <div onClick={onClick} style={{ padding:'5px 12px', border:`1px solid ${active?C.hdrAcc:C.bd}`, borderRadius:20, background:active?C.hdrLt:'#fff', color:active?C.hdr:C.mid, fontSize:11, fontWeight:500, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>{children}</div>
}
function ActionBtn({ icon, label, color, bg, onClick }) {
  return <button onClick={onClick} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'7px 4px', border:`1px solid ${color}40`, borderRadius:8, background:bg, color, fontSize:12, fontWeight:600, cursor:'pointer' }}><i className={`ti ${icon}`} style={{fontSize:14}}/>{label}</button>
}
