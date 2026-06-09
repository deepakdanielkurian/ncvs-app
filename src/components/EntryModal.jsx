import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { C, PAY_METHODS, todayStr } from '../utils/helpers'

const EMPTY = {
  group: 'NRI', type: 'Subscription', period: '1 YR',
  name: '', amount: '', date: todayStr(),
  receipt: '', pay: '', txn: '', note: '', nonSH: false
}

export default function EntryModal({ initial, onSave, onClose }) {
  const { customPay, addCustomPay, removeCustomPay, showToast } = useApp()
  const [f, setF]         = useState(initial ? { ...initial, amount: String(initial.amount || '') } : { ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [newPay, setNewPay] = useState('')
  const [showAddPay, setShowAddPay] = useState(false)

  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const allMethods = [...PAY_METHODS, ...customPay]

  const handleAddPay = () => {
    if (!newPay.trim()) return
    if (addCustomPay(newPay)) {
      set('pay', newPay.trim())
      setNewPay('')
      setShowAddPay(false)
      showToast(`✅ "${newPay.trim()}" added`)
    } else {
      showToast('Already exists')
    }
  }

  const save = async () => {
    if (!f.name.trim())    { showToast('❌ Enter name'); return }
    if (!f.amount || +f.amount <= 0) { showToast('❌ Enter valid amount'); return }
    if (!f.date)           { showToast('❌ Select date received'); return }
    if (!f.receipt.trim()) { showToast('❌ Receipt No is mandatory'); return }
    if (!f.pay)            { showToast('❌ Select payment method'); return }
    setSaving(true)
    try {
      await onSave({ ...f, amount: parseFloat(f.amount) })
      onClose()
    } catch { showToast('❌ Failed to save') }
    setSaving(false)
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,.5)', zIndex: 200,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px 16px 0 0',
        padding: '20px 16px 36px',
        width: '100%', maxWidth: 430,
        maxHeight: '92dvh', overflowY: 'auto',
        animation: 'slideUp .28s cubic-bezier(.32,1.2,.5,1)',
      }}>
        <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.dk }}>
            {initial ? 'Edit entry' : 'Add new entry'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: C.mid, cursor: 'pointer', padding: 2, lineHeight: 1 }}>×</button>
        </div>

        {/* Group */}
        <FieldLabel>Group</FieldLabel>
        <TogRow>
          {[['NRI', C.nriLt, C.nri], ['Kerala', C.kerLt, C.ker]].map(([g, bg, col]) => (
            <TogBtn key={g} active={f.group === g} bg={bg} color={col} onClick={() => set('group', g)}>{g}</TogBtn>
          ))}
        </TogRow>

        {/* Type */}
        <FieldLabel>Type</FieldLabel>
        <TogRow>
          {[['Subscription', C.ambLt, C.amb], ['Donation', C.purLt, C.pur]].map(([t, bg, col]) => (
            <TogBtn key={t} active={f.type === t} bg={bg} color={col}
              onClick={() => { set('type', t); if (t === 'Donation') set('period', '') }}>
              {t}
            </TogBtn>
          ))}
        </TogRow>

        {/* Period */}
        {f.type === 'Subscription' && (
          <>
            <FieldLabel>Period</FieldLabel>
            <TogRow>
              {[['1 YR', '1 Year', C.nriLt, C.nri], ['6 MONTHS', '6 Months', C.ambLt, C.amb]].map(([v, label, bg, col]) => (
                <TogBtn key={v} active={f.period === v} bg={bg} color={col} onClick={() => set('period', v)}>{label}</TogBtn>
              ))}
            </TogRow>
          </>
        )}

        <div style={{ height: 8 }} />

        <Field label="Full name *">
          <input value={f.name} onChange={e => set('name', e.target.value)} placeholder="Enter full name" style={inputSt} />
        </Field>
        <Field label="Amount (₹) *">
          <input type="number" value={f.amount} onChange={e => set('amount', e.target.value)}
            placeholder="e.g. 3000" inputMode="numeric" style={inputSt} />
        </Field>
        <Field label="Date received *">
          <input type="date" value={f.date} onChange={e => set('date', e.target.value)} style={inputSt} />
        </Field>
        <Field label="Receipt No *">
          <input value={f.receipt} onChange={e => set('receipt', e.target.value)}
            placeholder="Mandatory — enter receipt number" style={inputSt} />
        </Field>

        {/* Payment method */}
        <Field label="Payment method *">
          <select value={f.pay} onChange={e => set('pay', e.target.value)} style={inputSt}>
            <option value="">— Select —</option>
            {allMethods.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>

        {/* Add custom method */}
        {!showAddPay ? (
          <button onClick={() => setShowAddPay(true)} style={{
            background: 'none', border: `1px dashed ${C.bd}`, borderRadius: 8,
            padding: '7px 12px', fontSize: 12, color: C.mid, cursor: 'pointer',
            width: '100%', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center',
          }}>
            <i className="ti ti-plus" style={{ fontSize: 14 }} /> Add new payment method
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <input value={newPay} onChange={e => setNewPay(e.target.value)}
              placeholder="e.g. PhonePe – Raju" style={{ ...inputSt, flex: 1, marginBottom: 0 }}
              onKeyDown={e => e.key === 'Enter' && handleAddPay()} />
            <button onClick={handleAddPay} style={{ padding: '9px 14px', background: C.hdr, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Add</button>
            <button onClick={() => setShowAddPay(false)} style={{ padding: '9px 10px', background: C.bg, color: C.mid, border: `1px solid ${C.bd}`, borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>✕</button>
          </div>
        )}

        {/* Saved custom methods */}
        {customPay.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
            {customPay.map(m => (
              <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 3, background: C.bg, borderRadius: 20, padding: '3px 8px 3px 10px', border: `1px solid ${C.bd}` }}>
                <span style={{ fontSize: 11, color: C.dk }}>{m}</span>
                <button onClick={() => removeCustomPay(m)} style={{ background: 'none', border: 'none', color: C.mid, cursor: 'pointer', fontSize: 13, lineHeight: 1, padding: 1 }}>×</button>
              </div>
            ))}
          </div>
        )}

        <Field label="Transaction ID / Reference">
          <input value={f.txn} onChange={e => set('txn', e.target.value)} placeholder="Optional" style={inputSt} />
        </Field>
        <Field label="Note (optional)">
          <textarea value={f.note} onChange={e => set('note', e.target.value)}
            placeholder="Any additional note…"
            style={{ ...inputSt, height: 64, resize: 'none' }} />
        </Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 16, fontSize: 13, color: C.dk }}>
          <input type="checkbox" checked={f.nonSH} onChange={e => set('nonSH', e.target.checked)} style={{ width: 'auto' }} />
          Non-shareholder donor
        </label>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 13, border: `1px solid ${C.bd}`, borderRadius: 8, background: C.bg, color: C.mid, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={save} disabled={saving} style={{ flex: 2, padding: 13, border: 'none', borderRadius: 8, background: saving ? C.mid : C.gld, color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving…' : initial ? 'Save changes' : 'Save entry'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ──
const inputSt = {
  width: '100%', border: `1px solid #D3D1C7`, borderRadius: 8,
  padding: '10px 12px', fontSize: 14, color: '#2C2C2A',
  background: '#F1EFE8', fontFamily: 'inherit', outline: 'none',
  WebkitAppearance: 'none', marginBottom: 0,
  boxSizing: 'border-box',
}
function FieldLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 600, color: '#888780', marginBottom: 5 }}>{children}</div>
}
function TogRow({ children }) {
  return <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>{children}</div>
}
function TogBtn({ active, bg, color, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '9px 4px', border: `1px solid ${active ? color : '#D3D1C7'}`,
      borderRadius: 8, background: active ? bg : '#F1EFE8',
      color: active ? color : '#888780', fontSize: 12, fontWeight: active ? 700 : 500,
      cursor: 'pointer', transition: 'all .15s',
    }}>{children}</button>
  )
}
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#888780', marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  )
}
