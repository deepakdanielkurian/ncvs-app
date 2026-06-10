import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { C, inr } from '../utils/helpers'
import EntryCard  from '../components/EntryCard'
import EntryModal from '../components/EntryModal'
import { Empty, SearchBar } from './Home'

const GRP_OPTS  = ['All','NRI','Kerala']
const TYPE_OPTS = ['All','Subscription','Donation']

export default function Entries() {
  const { entries, dataLoading, addEntry, updateEntry, deleteEntry, showToast } = useApp()
  const [q,     setQ]     = useState('')
  const [grp,   setGrp]   = useState('All')
  const [type,  setType]  = useState('All')
  const [modal, setModal] = useState(null)

  const filtered = entries.filter(e => {
    const mg = grp  === 'All' || e.group === grp
    const mt = type === 'All' || e.type  === type
    const mq = !q  ||
      (e.name||'').toLowerCase().includes(q.toLowerCase()) ||
      (e.receipt||'').toLowerCase().includes(q.toLowerCase()) ||
      (e.txn||'').toLowerCase().includes(q.toLowerCase()) ||
      (e.pay||'').toLowerCase().includes(q.toLowerCase())
    return mg && mt && mq
  })

  const total = filtered.reduce((a, e) => a + (e.amount || 0), 0)

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
    <div style={{ padding: '14px 14px' }}>
      <SearchBar value={q} onChange={setQ} placeholder="Search name, receipt, txn, pay method…" />

      {/* Group filter */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Group</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {GRP_OPTS.map(g => (
            <button key={g} onClick={() => setGrp(g)} style={{
              flex: 1, padding: '8px 4px',
              border: `1.5px solid ${grp===g ? (g==='NRI'?C.nri : g==='Kerala'?C.ker : C.hdr) : C.bd}`,
              borderRadius: 8,
              background: grp===g ? (g==='NRI'?C.nriLt : g==='Kerala'?C.kerLt : C.hdrLt) : '#fff',
              color: grp===g ? (g==='NRI'?C.nri : g==='Kerala'?C.ker : C.hdr) : C.mid,
              fontSize: 12, fontWeight: grp===g ? 700 : 500, cursor: 'pointer',
            }}>{g}</button>
          ))}
        </div>
      </div>

      {/* Type filter */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Type</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {TYPE_OPTS.map(t => (
            <button key={t} onClick={() => setType(t)} style={{
              flex: 1, padding: '8px 4px',
              border: `1.5px solid ${type===t ? (t==='Subscription'?C.amb : t==='Donation'?C.pur : C.hdr) : C.bd}`,
              borderRadius: 8,
              background: type===t ? (t==='Subscription'?C.ambLt : t==='Donation'?C.purLt : C.hdrLt) : '#fff',
              color: type===t ? (t==='Subscription'?C.amb : t==='Donation'?C.pur : C.hdr) : C.mid,
              fontSize: 12, fontWeight: type===t ? 700 : 500, cursor: 'pointer',
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Add button */}
      <button onClick={() => setModal('add')} style={{
        width: '100%', padding: 13, background: C.hdr, color: '#fff',
        border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
        cursor: 'pointer', marginBottom: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        <i className="ti ti-plus" style={{ fontSize: 18 }} /> Add new entry
      </button>

      {/* Count + total */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.dk }}>
          {grp !== 'All' ? grp : ''} {type !== 'All' ? type : 'All entries'}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: C.mid, background: C.bg, padding: '2px 8px', borderRadius: 20, border: `1px solid ${C.bd}` }}>
            {filtered.length} entries
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.pur }}>{inr(total)}</div>
        </div>
      </div>

      {/* List */}
      {dataLoading ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.mid }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <Empty icon="ti-notes" text={q ? 'No entries match your search.' : `No ${type !== 'All' ? type.toLowerCase() : ''} entries${grp !== 'All' ? ' for ' + grp : ''}.`} />
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
