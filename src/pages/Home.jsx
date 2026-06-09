import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { C, inr, fmtDate, initials, groupStyle } from '../utils/helpers'
import EntryCard  from '../components/EntryCard'
import EntryModal from '../components/EntryModal'

export default function Home() {
  const { entries, dataLoading, addEntry, updateEntry, deleteEntry, showToast } = useApp()
  const [q, setQ]         = useState('')
  const [modal, setModal] = useState(null) // null | 'add' | entry

  const nri    = entries.filter(e => e.group === 'NRI')
  const ker    = entries.filter(e => e.group === 'Kerala')
  const subTot = entries.filter(e => e.type === 'Subscription').reduce((a, e) => a + e.amount, 0)
  const donTot = entries.filter(e => e.type === 'Donation').reduce((a, e) => a + e.amount, 0)

  const filtered = entries.filter(e =>
    !q ||
    (e.name || '').toLowerCase().includes(q.toLowerCase()) ||
    (e.receipt || '').toLowerCase().includes(q.toLowerCase()) ||
    (e.txn || '').toLowerCase().includes(q.toLowerCase()) ||
    (e.note || '').toLowerCase().includes(q.toLowerCase())
  )

  const handleSave = async (data) => {
    try {
      if (modal?.id) { await updateEntry(modal.id, data); showToast('✅ Entry updated!') }
      else           { await addEntry(data);               showToast('✅ Entry saved!') }
    } catch { showToast('❌ Failed to save') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry?')) return
    try { await deleteEntry(id); showToast('🗑️ Entry deleted') }
    catch { showToast('❌ Failed to delete') }
  }

  return (
    <div style={{ padding: '12px 13px' }}>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14, marginTop: 4 }}>
        <StatCard label="Grand Total · FY 2026–27" value={inr(subTot + donTot)}
          valueColor="#fff" bg={C.hdr} span={2} />
        <StatCard label="NRI group"
          sub={`${nri.filter(e=>e.type==='Subscription').length} members · ${nri.filter(e=>e.type==='Donation').length} donors`}
          value={inr(nri.reduce((a,e)=>a+e.amount,0))} valueColor={C.nri} />
        <StatCard label="Kerala group"
          sub={`${ker.filter(e=>e.type==='Subscription').length} members · ${ker.filter(e=>e.type==='Donation').length} donors`}
          value={inr(ker.reduce((a,e)=>a+e.amount,0))} valueColor={C.ker} />
        <StatCard label="Subscriptions" value={inr(subTot)} valueColor={C.amb} />
        <StatCard label="Donations"     value={inr(donTot)} valueColor={C.pur} />
      </div>

      {/* Search */}
      <SearchBar value={q} onChange={setQ} placeholder="Search name, receipt no, transaction…" />

      {/* Add button */}
      <button onClick={() => setModal('add')} style={{
        width: '100%', padding: 13, background: C.hdr, color: '#fff',
        border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
        cursor: 'pointer', marginBottom: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        <i className="ti ti-plus" style={{ fontSize: 18 }} /> Add new entry
      </button>

      {/* Section head */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.dk }}>Recent entries</div>
        <div style={{ fontSize: 11, color: C.mid, background: C.bg, padding: '2px 8px', borderRadius: 20, border: `1px solid ${C.bd}` }}>
          {filtered.length} total
        </div>
      </div>

      {dataLoading ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.mid }}>
          <div style={{ fontSize: 13 }}>Loading…</div>
        </div>
      ) : filtered.length === 0 ? (
        <Empty icon="ti-sailboat" text={q ? 'No entries found.' : 'No entries yet.\nTap Add to record a payment.'} />
      ) : (
        filtered.map(e => (
          <EntryCard key={e.id} entry={e}
            onEdit={() => setModal(e)}
            onDelete={() => handleDelete(e.id)} />
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

// ── Shared sub-components ──
export function StatCard({ label, sub, value, valueColor, bg, span }) {
  return (
    <div style={{
      background: bg || '#fff', borderRadius: 10,
      border: `1px solid ${C.bd}`, padding: '10px 12px',
      gridColumn: span ? `span ${span}` : undefined,
    }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: valueColor || C.dk, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 10, color: bg ? '#9FE1CB' : C.mid, marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: bg ? '#9FE1CB' : C.mid, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ position: 'relative', marginBottom: 10 }}>
      <i className="ti ti-search" style={{
        position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
        color: C.mid, fontSize: 16, pointerEvents: 'none',
      }} />
      <input value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '10px 12px 10px 36px',
          border: `1px solid ${C.bd}`, borderRadius: 10,
          fontSize: 13, color: C.dk, background: '#fff',
          outline: 'none', fontFamily: 'inherit',
        }} />
    </div>
  )
}

export function Empty({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: C.mid }}>
      <i className={`ti ${icon}`} style={{ fontSize: 48, display: 'block', marginBottom: 12 }} />
      <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{text}</div>
    </div>
  )
}
