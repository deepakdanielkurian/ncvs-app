import { useState, useEffect } from 'react'
import { useMembers } from '../hooks/useMembers'
import { db } from '../firebase'
import {
  collection, doc, setDoc, getDoc, query,
  where, getDocs, orderBy, Timestamp
} from 'firebase/firestore'
import { showToast } from '../components/Toast'
import { todayStr, fmtDate, initials, GROUP_COLORS } from '../utils/helpers'

export default function Attendance() {
  const { members, loading: mLoading } = useMembers()
  const [date, setDate]       = useState(todayStr())
  const [grpF, setGrpF]       = useState('all')
  const [attendance, setAtt]  = useState({}) // memberId -> 'present'|'absent'
  const [saving, setSaving]   = useState(false)
  const [history, setHistory] = useState([])
  const [tab, setTab]         = useState('mark') // 'mark' | 'history'

  // Load attendance for selected date
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'attendance', date))
        setAtt(snap.exists() ? (snap.data().records || {}) : {})
      } catch { setAtt({}) }
    }
    load()
  }, [date])

  // Load history
  useEffect(() => {
    if (tab !== 'history') return
    const load = async () => {
      try {
        const q = query(collection(db, 'attendance'), orderBy('date', 'desc'))
        const snap = await getDocs(q)
        setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, 30))
      } catch { setHistory([]) }
    }
    load()
  }, [tab])

  const toggle = (id) => {
    setAtt(prev => ({
      ...prev,
      [id]: prev[id] === 'present' ? 'absent' : prev[id] === 'absent' ? undefined : 'present'
    }))
  }

  const markAll = (status) => {
    const update = {}
    filtered.forEach(m => { update[m.id] = status })
    setAtt(prev => ({ ...prev, ...update }))
  }

  const saveAtt = async () => {
    setSaving(true)
    try {
      const present = Object.values(attendance).filter(v => v === 'present').length
      const absent  = Object.values(attendance).filter(v => v === 'absent').length
      await setDoc(doc(db, 'attendance', date), {
        date, records: attendance,
        presentCount: present, absentCount: absent,
        savedAt: Timestamp.now()
      })
      showToast('✅ Attendance saved!')
    } catch { showToast('❌ Failed to save') }
    setSaving(false)
  }

  const filtered = members.filter(m => grpF === 'all' || m.group === grpF)
  const present  = filtered.filter(m => attendance[m.id] === 'present').length
  const absent   = filtered.filter(m => attendance[m.id] === 'absent').length
  const unmarked = filtered.length - present - absent

  return (
    <div className="screen fade-up">
      {/* Tabs */}
      <div className="rtype-row">
        <div className={`rtype-chip${tab==='mark'?' active':''}`} onClick={()=>setTab('mark')}>Mark attendance</div>
        <div className={`rtype-chip${tab==='history'?' active':''}`} onClick={()=>setTab('history')}>History</div>
      </div>

      {tab === 'mark' && (
        <>
          {/* Date picker */}
          <div className="card card-pad" style={{ marginBottom:12 }}>
            <div className="field" style={{ marginBottom:0 }}>
              <label>Session date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>

          {/* Stats */}
          <div className="att-stats">
            <div className="att-stat">
              <div className="att-stat-val" style={{ color:'var(--grn)' }}>{present}</div>
              <div className="att-stat-lbl">Present</div>
            </div>
            <div className="att-stat">
              <div className="att-stat-val" style={{ color:'var(--red)' }}>{absent}</div>
              <div className="att-stat-lbl">Absent</div>
            </div>
            <div className="att-stat">
              <div className="att-stat-val" style={{ color:'var(--mid)' }}>{unmarked}</div>
              <div className="att-stat-lbl">Unmarked</div>
            </div>
          </div>

          {/* Filter + bulk */}
          <div style={{ display:'flex', gap:6, marginBottom:10, alignItems:'center' }}>
            <div className="chips" style={{ flex:1, marginBottom:0 }}>
              {['all','NRI','Kerala'].map(g=>(
                <div key={g} className={`chip${grpF===g?' active':''}`} onClick={()=>setGrpF(g)}>
                  {g==='all'?'All':g}
                </div>
              ))}
            </div>
            <button onClick={()=>markAll('present')}
              style={{ padding:'5px 10px', border:'1px solid var(--grn)', borderRadius:7, background:'var(--grn-lt)', color:'var(--grn)', fontSize:11, fontWeight:600, cursor:'pointer', flexShrink:0 }}>
              All present
            </button>
          </div>

          {/* Member list */}
          <div className="card card-pad" style={{ marginBottom:12 }}>
            {mLoading ? (
              <div className="empty"><div className="spinner" style={{ margin:'0 auto' }} /></div>
            ) : filtered.length === 0 ? (
              <div style={{ fontSize:13, color:'var(--mid)', textAlign:'center', padding:'20px 0' }}>
                No members. Add members first.
              </div>
            ) : filtered.map((m, i) => {
              const gc     = GROUP_COLORS[m.group] || GROUP_COLORS.NRI
              const status = attendance[m.id]
              return (
                <div key={m.id} className="att-row" style={{ borderBottom: i<filtered.length-1?undefined:'none' }}>
                  <div className="avatar" style={{ background:gc.bg, color:gc.text, width:32, height:32, fontSize:11 }}>
                    {initials(m.name||'')}
                  </div>
                  <div className="att-name">{m.name}
                    <div style={{ fontSize:10, color:'var(--mid)' }}>{m.group}{m.location?' · '+m.location:''}</div>
                  </div>
                  <button
                    className={`att-btn${status==='present'?' present':status==='absent'?' absent':''}`}
                    onClick={() => toggle(m.id)}
                  >
                    {status === 'present' ? '✓ Present' : status === 'absent' ? '✗ Absent' : '— Mark'}
                  </button>
                </div>
              )
            })}
          </div>

          <button className="btn-primary" onClick={saveAtt} disabled={saving}>
            {saving ? 'Saving…' : `💾 Save attendance for ${fmtDate(date)}`}
          </button>
        </>
      )}

      {tab === 'history' && (
        <>
          <div className="sec-head">
            <div className="sec-title">Attendance history</div>
            <div className="sec-count">Last 30 sessions</div>
          </div>
          {history.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📋</div>
              <div className="empty-txt">No attendance records yet.</div>
            </div>
          ) : history.map(h => (
            <div key={h.id} className="card card-pad" style={{ marginBottom:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:600, color:'var(--dk)' }}>{fmtDate(h.date)}</div>
                  <div style={{ fontSize:11, color:'var(--mid)', marginTop:3 }}>
                    <span style={{ color:'var(--grn)', fontWeight:600 }}>✓ {h.presentCount||0} present</span>
                    &nbsp;·&nbsp;
                    <span style={{ color:'var(--red)', fontWeight:600 }}>✗ {h.absentCount||0} absent</span>
                  </div>
                </div>
                <div style={{ fontSize:13, color:'var(--mid)' }}>
                  {Math.round(((h.presentCount||0)/((h.presentCount||0)+(h.absentCount||0)))*100)||0}%
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
