import { useState, useEffect } from 'react'
import { todayStr, PAY_METHODS } from '../utils/helpers'

const EMPTY = {
  group:'NRI', type:'Subscription', period:'1 YR',
  name:'', amount:'', date:todayStr(),
  receipt:'', pay:'', txn:'', note:'', nonSH:false
}

export default function EntryModal({ initial, onSave, onClose }) {
  const [f, setF] = useState(initial ? { ...initial, amount: String(initial.amount||'') } : { ...EMPTY })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const tog = (k, v, btn) => {
    set(k, v)
    btn.parentElement.querySelectorAll('button').forEach(b => b.dataset.active = '')
    btn.dataset.active = '1'
  }

  const save = async () => {
    if (!f.name.trim()) { alert('Enter name'); return }
    if (!f.amount || +f.amount <= 0) { alert('Enter valid amount'); return }
    if (!f.date)    { alert('Select date received'); return }
    if (!f.receipt.trim()) { alert('Receipt No is mandatory'); return }
    if (!f.pay)     { alert('Select payment method'); return }
    setSaving(true)
    await onSave({ ...f, amount: parseFloat(f.amount) })
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-title">
          {initial ? 'Edit entry' : 'Add new entry'}
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Group */}
        <div className="field"><label>Group</label>
          <div className="tog-row">
            {['NRI','Kerala'].map(g => (
              <button key={g} className={`tog-btn ${g==='NRI'?'nri':'ker'}-on`}
                style={{ opacity: f.group===g?1:.45 }}
                onClick={() => set('group', g)}>{g}</button>
            ))}
          </div>
        </div>

        {/* Type */}
        <div className="field"><label>Type</label>
          <div className="tog-row">
            {['Subscription','Donation'].map(t => (
              <button key={t} className={`tog-btn ${t==='Subscription'?'sub':'don'}-on`}
                style={{ opacity: f.type===t?1:.45 }}
                onClick={() => { set('type', t); if(t==='Donation') set('period','') }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Period */}
        {f.type === 'Subscription' && (
          <div className="field"><label>Period</label>
            <div className="tog-row">
              {['1 YR','6 MONTHS'].map(p => (
                <button key={p} className={`tog-btn ${p==='1 YR'?'y1':'m6'}-on`}
                  style={{ opacity: f.period===p?1:.45 }}
                  onClick={() => set('period', p)}>
                  {p === '1 YR' ? '1 Year' : '6 Months'}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="field"><label>Full name <span className="req">*</span></label>
          <input value={f.name} onChange={e => set('name', e.target.value)} placeholder="Enter full name" />
        </div>
        <div className="field"><label>Amount (₹) <span className="req">*</span></label>
          <input type="number" value={f.amount} onChange={e => set('amount', e.target.value)}
            placeholder="e.g. 3000" inputMode="numeric" />
        </div>
        <div className="field"><label>Date received <span className="req">*</span></label>
          <input type="date" value={f.date} onChange={e => set('date', e.target.value)} />
        </div>
        <div className="field"><label>Receipt No <span className="req">*</span></label>
          <input value={f.receipt} onChange={e => set('receipt', e.target.value)}
            placeholder="Mandatory — enter receipt number" />
        </div>
        <div className="field"><label>Payment method <span className="req">*</span></label>
          <select value={f.pay} onChange={e => set('pay', e.target.value)}>
            <option value="">— Select —</option>
            {PAY_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="field"><label>Transaction ID / Reference</label>
          <input value={f.txn} onChange={e => set('txn', e.target.value)} placeholder="Optional" />
        </div>
        <div className="field"><label>Note (optional)</label>
          <textarea value={f.note} onChange={e => set('note', e.target.value)} placeholder="Any note…" />
        </div>
        <div className="field">
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
            <input type="checkbox" checked={f.nonSH} onChange={e => set('nonSH', e.target.checked)}
              style={{ width:'auto', padding:0 }} />
            Non-shareholder donor
          </label>
        </div>

        <div className="modal-row">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-gold"   onClick={save} disabled={saving}>
            {saving ? 'Saving…' : initial ? 'Save changes' : 'Save entry'}
          </button>
        </div>
      </div>
    </div>
  )
}
