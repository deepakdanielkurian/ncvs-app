import { useState } from 'react'
import { useMembers } from '../hooks/useMembers'
import { initials, GROUP_COLORS } from '../utils/helpers'
import { showToast } from '../components/Toast'

const EMPTY = { name:'', group:'NRI', phone:'', whatsapp:'', location:'', email:'', notes:'' }

export default function Members() {
  const { members, loading, add, update, remove } = useMembers()
  const [q, setQ]         = useState('')
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(null)
  const [f, setF]         = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const filtered = members.filter(m => {
    const matchGrp = filter === 'all' || m.group === filter
    const matchQ   = !q || m.name?.toLowerCase().includes(q.toLowerCase()) ||
                     (m.phone||'').includes(q) || (m.location||'').toLowerCase().includes(q.toLowerCase())
    return matchGrp && matchQ
  })

  const openAdd  = () => { setF({ ...EMPTY }); setModal('add') }
  const openEdit = (m) => { setF({ ...m }); setModal(m) }

  const save = async () => {
    if (!f.name.trim()) { showToast('❌ Enter member name'); return }
    setSaving(true)
    try {
      if (modal?.id) { await update(modal.id, f); showToast('✅ Member updated!') }
      else           { await add(f);              showToast('✅ Member added!') }
      setModal(null)
    } catch { showToast('❌ Failed to save') }
    setSaving(false)
  }

  const del = async (id) => {
    if (!window.confirm('Remove this member?')) return
    try { await remove(id); showToast('🗑️ Removed') }
    catch { showToast('❌ Failed') }
  }

  return (
    <div className="screen fade-up">
      <div className="search-wrap">
        <span className="search-icon">🔍</span>
        <input value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search name, phone, location…" />
      </div>

      <div className="chips">
        {['all','NRI','Kerala'].map(g => (
          <div key={g} className={`chip${filter===g?' active':''}`}
            onClick={() => setFilter(g)}>
            {g === 'all' ? 'All members' : g}
          </div>
        ))}
      </div>

      <button className="btn-primary" style={{ marginBottom:12 }} onClick={openAdd}>
        ➕ Add member
      </button>

      <div className="sec-head">
        <div className="sec-title">Members</div>
        <div className="sec-count">{filtered.length} total</div>
      </div>

      {loading ? (
        <div className="empty"><div className="spinner" style={{ margin:'0 auto' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">👥</div>
          <div className="empty-txt">No members found.<br />Tap Add member to begin.</div>
        </div>
      ) : filtered.map(m => {
        const gc = GROUP_COLORS[m.group] || GROUP_COLORS.NRI
        return (
          <div key={m.id} className="member-card">
            <div className="member-top">
              <div className="avatar" style={{ background:gc.bg, color:gc.text, width:42, height:42, fontSize:14 }}>
                {initials(m.name||'')}
              </div>
              <div className="member-info">
                <div className="member-name">{m.name}</div>
                <div className="member-sub">
                  <span className={`badge ${m.group==='NRI'?'b-nri':'b-ker'}`}>{m.group}</span>
                  {m.location && <span style={{ marginLeft:6, fontSize:11, color:'var(--mid)' }}>📍 {m.location}</span>}
                </div>
              </div>
              <div className="member-actions">
                {m.phone && (
                  <a href={`tel:${m.phone}`} className="icon-btn" title="Call">📞</a>
                )}
                {m.whatsapp && (
                  <a href={`https://wa.me/${m.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                     className="icon-btn" title="WhatsApp">💬</a>
                )}
              </div>
            </div>

            {(m.phone || m.email || m.notes) && (
              <div style={{ fontSize:11, color:'var(--mid)', marginBottom:8, lineHeight:1.6, paddingLeft:52 }}>
                {m.phone && <div>📞 {m.phone}</div>}
                {m.email && <div>✉️ {m.email}</div>}
                {m.notes && <div>📝 {m.notes}</div>}
              </div>
            )}

            <div className="entry-actions">
              <button className="btn-edit" onClick={() => openEdit(m)}>✏️ Edit</button>
              <button className="btn-del"  onClick={() => del(m.id)}>🗑️ Remove</button>
            </div>
          </div>
        )
      })}

      {modal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(null)}>
          <div className="modal-box">
            <div className="modal-title">
              {modal === 'add' ? 'Add member' : 'Edit member'}
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>

            <div className="field"><label>Full name <span className="req">*</span></label>
              <input value={f.name} onChange={e => set('name',e.target.value)} placeholder="Full name" />
            </div>
            <div className="field"><label>Group</label>
              <div className="tog-row">
                {['NRI','Kerala'].map(g => (
                  <button key={g} className={`tog-btn ${g==='NRI'?'nri':'ker'}-on`}
                    style={{ opacity: f.group===g?1:.45 }}
                    onClick={() => set('group',g)}>{g}</button>
                ))}
              </div>
            </div>
            <div className="field"><label>Phone number</label>
              <input value={f.phone} onChange={e => set('phone',e.target.value)} placeholder="+91 XXXXX XXXXX" inputMode="tel" />
            </div>
            <div className="field"><label>WhatsApp number</label>
              <input value={f.whatsapp} onChange={e => set('whatsapp',e.target.value)} placeholder="+91 XXXXX XXXXX (with country code)" inputMode="tel" />
            </div>
            <div className="field"><label>Location / Place</label>
              <input value={f.location} onChange={e => set('location',e.target.value)} placeholder="e.g. Dubai, Niranam, Kuwait…" />
            </div>
            <div className="field"><label>Email</label>
              <input type="email" value={f.email} onChange={e => set('email',e.target.value)} placeholder="Optional" />
            </div>
            <div className="field"><label>Notes</label>
              <textarea value={f.notes} onChange={e => set('notes',e.target.value)} placeholder="Any notes about this member…" />
            </div>

            <div className="modal-row">
              <button className="btn-cancel" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-gold"   onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
