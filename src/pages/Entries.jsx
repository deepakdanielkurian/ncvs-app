import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { C, inr } from '../utils/helpers'
import EntryCard  from '../components/EntryCard'
import EntryModal from '../components/EntryModal'
import { Empty, SearchBar } from './Home'

export default function Entries() {
  const { entries, dataLoading, addEntry, updateEntry, deleteEntry, showToast } = useApp()
  const [q, setQ]       = useState('')
  const [grp, setGrp]   = useState('all')
  const [type, setType] = useState('all')
  const [modal, setModal] = useState(null)

  const filtered = entries.filter(e => {
    const mg = grp  === 'all' || e.group === grp
    const mt = type === 'all' || e.type  === type
    const mq = !q ||
      (e.name||'').toLowerCase().includes(q.toLowerCase()) ||
      (e.receipt||'').toLowerCase().includes(q.toLowerCase()) ||
      (e.txn||'').toLowerCase().includes(q.toLowerCase()) ||
      (e.pay||'').toLowerCase().includes(q.toLowerCase())
    return mg && mt && mq
  })

  const total = filtered.reduce((a, e) => a + e.amount, 0)

  const handleSave = async (data) => {
    try {
      if (modal?.id) { await updateEntry(modal.id, data); showToast('✅ Updated!') }
      else           { await addEntry(data);               showToast('✅ Saved!') }
    } catch { showToast('❌ Failed') }
  }

  const handleDel = async (id) => {
    if (!window.confirm('Delete this entry?')) return
    try { await deleteEntry(id); showToast('🗑️ Deleted') }
    catch { showToast('❌ Failed') }
  }

  return (
    <div style={{ padding: '12px 13px' }}>
      <SearchBar value={q} onChange={setQ} placeholder="Search name, receipt, txn, pay method…" />

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, overflowX: 'auto' }}>
        {['all','NRI','Kerala'].map(g => (
          <Chip key={g} active={grp===g} color={C.nri} onClick={()=>setGrp(g)}>
            {g==='all'?'All groups':g}
          </Chip>
        ))}
        <div style={{ width: 1, background: C.bd, flexShrink: 0, margin: '0 2px' }} />
        {['all','Subscription','Donation'].map(t => (
          <Chip key={t} active={type===t} color={t==='Subscription'?C.amb:C.pur} onClick={()=>setType(t)}>
            {t==='all'?'All types':t}
          </Chip>
        ))}
      </div>

      <button onClick={() => setModal('add')} style={{
        width:'100%', padding:13, background:C.hdr, color:'#fff',
        border:'none', borderRadius:10, fontSize:14, fontWeight:700,
        cursor:'pointer', marginBottom:14,
        display:'flex', alignItems:'center', justifyContent:'center', gap:6,
      }}>
        <i className="ti ti-plus" style={{fontSize:18}} /> Add new entry
      </button>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <div style={{ fontSize:13, fontWeight:600, color:C.dk }}>Entries</div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ fontSize:11, color:C.mid, background:C.bg, padding:'2px 8px', borderRadius:20, border:`1px solid ${C.bd}` }}>{filtered.length}</div>
          <div style={{ fontSize:12, fontWeight:700, color:C.pur }}>{inr(total)}</div>
        </div>
      </div>

      {dataLoading ? (
        <div style={{ textAlign:'center', padding:40, color:C.mid }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <Empty icon="ti-notes" text="No entries found." />
      ) : (
        filtered.map(e => (
          <EntryCard key={e.id} entry={e}
            onEdit={() => setModal(e)}
            onDelete={() => handleDel(e.id)} />
        ))
      )}

      {modal && (
        <EntryModal
          initial={modal === 'add' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

function Chip({ active, color, onClick, children }) {
  return (
    <div onClick={onClick} style={{
      padding:'5px 12px', border:`1px solid ${active?color:C.bd}`,
      borderRadius:20, background:active?color+'22':'#fff',
      color:active?color:C.mid, fontSize:11, fontWeight:active?600:500,
      cursor:'pointer', whiteSpace:'nowrap', flexShrink:0,
    }}>{children}</div>
  )
}
