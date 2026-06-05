import { useState } from 'react'
import { useEntries } from '../hooks/useEntries'
import { inr, fmtDate, initials, GROUP_COLORS } from '../utils/helpers'
import EntryModal from '../components/EntryModal'
import { showToast } from '../components/Toast'

export default function Entries() {
  const { entries, loading, add, update, remove } = useEntries()
  const [q, setQ]         = useState('')
  const [grpF, setGrpF]   = useState('all')
  const [typeF, setTypeF] = useState('all')
  const [modal, setModal] = useState(null)

  const filtered = entries.filter(e => {
    const mg = grpF  === 'all' || e.group === grpF
    const mt = typeF === 'all' || e.type  === typeF
    const mq = !q   || e.name?.toLowerCase().includes(q.toLowerCase()) ||
               (e.receipt||'').toLowerCase().includes(q.toLowerCase()) ||
               (e.txn||'').toLowerCase().includes(q.toLowerCase()) ||
               (e.pay||'').toLowerCase().includes(q.toLowerCase())
    return mg && mt && mq
  })

  const total = filtered.reduce((a,e)=>a+e.amount,0)

  const handleSave = async (data) => {
    try {
      if (modal?.id) { await update(modal.id, data); showToast('✅ Updated!') }
      else           { await add(data);              showToast('✅ Saved!') }
      setModal(null)
    } catch { showToast('❌ Failed') }
  }

  const handleDel = async (id) => {
    if (!window.confirm('Delete this entry?')) return
    try { await remove(id); showToast('🗑️ Deleted') }
    catch { showToast('❌ Failed') }
  }

  return (
    <div className="screen fade-up">
      <div className="search-wrap">
        <span className="search-icon">🔍</span>
        <input value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search name, receipt no, txn, pay method…" />
      </div>

      <div className="chips">
        {['all','NRI','Kerala'].map(g=>(
          <div key={g} className={`chip${grpF===g?' active':''}`} onClick={()=>setGrpF(g)}>
            {g==='all'?'All groups':g}
          </div>
        ))}
        <div style={{ width:1, background:'var(--bd)', margin:'0 2px', flexShrink:0 }} />
        {['all','Subscription','Donation'].map(t=>(
          <div key={t} className={`chip${typeF===t?' active':''}`} onClick={()=>setTypeF(t)}>
            {t==='all'?'All types':t}
          </div>
        ))}
      </div>

      <button className="btn-primary" style={{ marginBottom:12 }} onClick={() => setModal('add')}>
        ➕ Add new entry
      </button>

      <div className="sec-head">
        <div className="sec-title">Entries</div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div className="sec-count">{filtered.length}</div>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--pur)' }}>{inr(total)}</div>
        </div>
      </div>

      {loading ? (
        <div className="empty"><div className="spinner" style={{ margin:'0 auto' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📝</div>
          <div className="empty-txt">No entries found.</div>
        </div>
      ) : filtered.map(e => {
        const gc = GROUP_COLORS[e.group] || GROUP_COLORS.NRI
        return (
          <div key={e.id} className="entry-card">
            <div className="entry-top">
              <div className="avatar" style={{ background:gc.bg, color:gc.text }}>{initials(e.name||'')}</div>
              <div className="entry-info">
                <div className="entry-name">{e.name}{e.nonSH&&<span style={{color:'var(--red)',fontSize:9,marginLeft:4}}>[Non-SH]</span>}</div>
                <div className="entry-meta">
                  <span className={`badge ${e.group==='NRI'?'b-nri':'b-ker'}`}>{e.group}</span>
                  <span className={`badge ${e.type==='Subscription'?'b-sub':'b-don'}`}>{e.type}{e.period?' · '+e.period:''}</span>
                  <span className="badge b-pay">{e.pay||'—'}</span>
                </div>
                <div className="entry-detail">
                  📅 <b>{fmtDate(e.date)}</b> &nbsp;·&nbsp; 🧾 <b>Rcpt: {e.receipt||'—'}</b>
                  {e.txn&&` · Txn: ${e.txn.slice(0,14)}`}
                  {e.note&&` · ${e.note}`}
                </div>
              </div>
              <div className="entry-amt" style={{ color:e.type==='Subscription'?'var(--amb)':'var(--pur)' }}>
                {inr(e.amount)}
              </div>
            </div>
            <div className="entry-actions">
              <button className="btn-edit" onClick={()=>setModal(e)}>✏️ Edit</button>
              <button className="btn-del"  onClick={()=>handleDel(e.id)}>🗑️ Delete</button>
            </div>
          </div>
        )
      })}

      {modal && (
        <EntryModal
          initial={modal==='add'?null:modal}
          onSave={handleSave}
          onClose={()=>setModal(null)}
        />
      )}
    </div>
  )
}
