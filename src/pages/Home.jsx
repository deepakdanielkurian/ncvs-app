import { useState } from 'react'
import { useEntries } from '../hooks/useEntries'
import { useAuth }    from '../contexts/AuthContext'
import { inr, fmtDate, initials, GROUP_COLORS } from '../utils/helpers'
import EntryModal from '../components/EntryModal'
import { showToast } from '../components/Toast'

export default function Home() {
  const { entries, loading, add, update, remove } = useEntries()
  const { role } = useAuth()
  const [q, setQ]         = useState('')
  const [modal, setModal] = useState(null) // null | 'add' | entry-object

  const filtered = entries.filter(e =>
    !q ||
    e.name?.toLowerCase().includes(q.toLowerCase()) ||
    (e.receipt || '').toLowerCase().includes(q.toLowerCase()) ||
    (e.txn || '').toLowerCase().includes(q.toLowerCase())
  )

  const nri    = entries.filter(e => e.group === 'NRI')
  const ker    = entries.filter(e => e.group === 'Kerala')
  const tot    = entries.reduce((a, e) => a + (e.amount || 0), 0)
  const subTot = entries.filter(e => e.type === 'Subscription').reduce((a, e) => a + (e.amount || 0), 0)
  const donTot = entries.filter(e => e.type === 'Donation').reduce((a, e) => a + (e.amount || 0), 0)

  const handleSave = async (data) => {
    try {
      if (modal?.id) { await update(modal.id, data); showToast('✅ Entry updated!') }
      else            { await add(data);              showToast('✅ Entry saved!') }
      setModal(null)
    } catch { showToast('❌ Failed to save') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry?')) return
    try { await remove(id); showToast('🗑️ Deleted') }
    catch { showToast('❌ Failed to delete') }
  }

  return (
    <div className="screen fade-up">
      {/* Stats */}
      <div className="stat-grid" style={{ marginTop: 4 }}>
        <div className="stat-card wide" style={{ background:'var(--hdr)', borderColor:'var(--hdr)' }}>
          <div className="stat-val" style={{ color:'#fff' }}>{inr(tot)}</div>
          <div className="stat-lbl" style={{ color:'#9FE1CB' }}>Grand Total · All Groups · FY 2026–27</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ color:'var(--nri)' }}>{inr(nri.reduce((a,e)=>a+e.amount,0))}</div>
          <div className="stat-lbl">NRI group</div>
          <div className="stat-sub">{nri.filter(e=>e.type==='Subscription').length} members · {nri.filter(e=>e.type==='Donation').length} donors</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ color:'var(--ker)' }}>{inr(ker.reduce((a,e)=>a+e.amount,0))}</div>
          <div className="stat-lbl">Kerala group</div>
          <div className="stat-sub">{ker.filter(e=>e.type==='Subscription').length} members · {ker.filter(e=>e.type==='Donation').length} donors</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ color:'var(--amb)' }}>{inr(subTot)}</div>
          <div className="stat-lbl">Subscriptions</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ color:'var(--pur)' }}>{inr(donTot)}</div>
          <div className="stat-lbl">Donations</div>
        </div>
      </div>

      {/* Search */}
      <div className="search-wrap">
        <span className="search-icon">🔍</span>
        <input value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search name, receipt no, transaction…" />
      </div>

      {/* Add button */}
      <button className="btn-primary" style={{ marginBottom:12 }} onClick={() => setModal('add')}>
        ➕ Add new entry
      </button>

      {/* List */}
      <div className="sec-head">
        <div className="sec-title">Recent entries</div>
        <div className="sec-count">{filtered.length} total</div>
      </div>

      {loading ? (
        <div className="empty"><div className="spinner" style={{ margin:'0 auto' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🚣</div>
          <div className="empty-txt">{q ? 'No entries found.' : 'No entries yet.\nTap Add to record a payment.'}</div>
        </div>
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

function EntryCard({ entry: e, onEdit, onDelete }) {
  const gc = GROUP_COLORS[e.group] || GROUP_COLORS.NRI
  return (
    <div className="entry-card">
      <div className="entry-top">
        <div className="avatar" style={{ background: gc.bg, color: gc.text }}>
          {initials(e.name || '')}
        </div>
        <div className="entry-info">
          <div className="entry-name">{e.name}{e.nonSH && <span style={{ color:'var(--red)', fontSize:9, marginLeft:4 }}>[Non-SH]</span>}</div>
          <div className="entry-meta">
            <span className={`badge ${e.group==='NRI'?'b-nri':'b-ker'}`}>{e.group}</span>
            <span className={`badge ${e.type==='Subscription'?'b-sub':'b-don'}`}>{e.type}{e.period?' · '+e.period:''}</span>
            <span className="badge b-pay">{e.pay||'—'}</span>
          </div>
          <div className="entry-detail">
            📅 <b>{fmtDate(e.date)}</b> &nbsp;·&nbsp; 🧾 <b>Rcpt: {e.receipt||'—'}</b>
            {e.txn && ` · Txn: ${e.txn.slice(0,14)}`}
            {e.note && ` · ${e.note}`}
          </div>
        </div>
        <div className={`entry-amt`} style={{ color: e.type==='Subscription'?'var(--amb)':'var(--pur)' }}>
          {inr(e.amount)}
        </div>
      </div>
      <div className="entry-actions">
        <button className="btn-edit" onClick={onEdit}>✏️ Edit</button>
        <button className="btn-del"  onClick={onDelete}>🗑️ Delete</button>
      </div>
    </div>
  )
}
