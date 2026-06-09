import { useState, useEffect } from 'react'
import { useApp } from '../contexts/AppContext'
import { C, todayStr, fmtDate, initials, groupStyle } from '../utils/helpers'
import { Empty } from './Home'

export default function Attendance() {
  const { members, saveAttendance, getAttendance, getAttendanceHistory, showToast } = useApp()
  const [tab,     setTab]     = useState('mark')
  const [date,    setDate]    = useState(todayStr())
  const [grp,     setGrp]     = useState('all')
  const [records, setRecords] = useState({})
  const [history, setHistory] = useState([])
  const [saving,  setSaving]  = useState(false)
  const [histLoading, setHistLoading] = useState(false)

  // Load attendance for selected date
  useEffect(() => {
    getAttendance(date).then(d => setRecords(d?.records || {}))
  }, [date])

  // Load history when tab changes
  useEffect(() => {
    if (tab !== 'history') return
    setHistLoading(true)
    getAttendanceHistory().then(h => { setHistory(h); setHistLoading(false) })
  }, [tab])

  const toggle = id => {
    setRecords(p => {
      const cur = p[id]
      if (cur === 'present') return { ...p, [id]: 'absent' }
      if (cur === 'absent')  return { ...p, [id]: undefined }
      return { ...p, [id]: 'present' }
    })
  }

  const markAll = status => {
    const upd = {}
    filtered.forEach(m => { upd[m.id] = status })
    setRecords(p => ({ ...p, ...upd }))
  }

  const doSave = async () => {
    setSaving(true)
    try {
      await saveAttendance(date, records)
      showToast(`✅ Attendance saved for ${fmtDate(date)}`)
    } catch { showToast('❌ Failed to save') }
    setSaving(false)
  }

  const filtered = members.filter(m => grp === 'all' || m.group === grp)
  const present  = filtered.filter(m => records[m.id] === 'present').length
  const absent   = filtered.filter(m => records[m.id] === 'absent').length
  const unmarked = filtered.length - present - absent

  return (
    <div style={{ padding: '12px 13px' }}>
      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:14 }}>
        {['mark','history'].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{
            flex:1, padding:'9px 4px', border:`1px solid ${tab===t?C.hdr:C.bd}`,
            borderRadius:8, background:tab===t?C.hdr:'#fff',
            color:tab===t?'#fff':C.mid, fontSize:12, fontWeight:600, cursor:'pointer',
          }}>
            {t === 'mark' ? '✅ Mark attendance' : '📋 History'}
          </button>
        ))}
      </div>

      {tab === 'mark' && (
        <>
          {/* Date */}
          <div style={{ background:'#fff', borderRadius:10, border:`1px solid ${C.bd}`, padding:'13px', marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:600, color:C.mid, marginBottom:5 }}>Session date</div>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)}
              style={{ width:'100%', border:`1px solid ${C.bd}`, borderRadius:8, padding:'10px 12px', fontSize:14, color:C.dk, background:C.bg, outline:'none', fontFamily:'inherit', WebkitAppearance:'none' }} />
          </div>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
            {[['Present',present,C.grn,C.grnLt],['Absent',absent,C.red,C.redLt],['Unmarked',unmarked,C.mid,C.bg]].map(([l,v,col,bg])=>(
              <div key={l} style={{ background:bg, borderRadius:10, border:`1px solid ${C.bd}`, padding:'10px 8px', textAlign:'center' }}>
                <div style={{ fontSize:22, fontWeight:700, color:col }}>{v}</div>
                <div style={{ fontSize:10, color:C.mid, marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Filter + bulk */}
          <div style={{ display:'flex', gap:6, marginBottom:10, alignItems:'center' }}>
            <div style={{ display:'flex', gap:5, flex:1, overflowX:'auto' }}>
              {['all','NRI','Kerala'].map(g=>(
                <div key={g} onClick={()=>setGrp(g)} style={{ padding:'5px 10px', border:`1px solid ${grp===g?C.hdrAcc:C.bd}`, borderRadius:20, background:grp===g?C.hdrLt:'#fff', color:grp===g?C.hdr:C.mid, fontSize:11, fontWeight:500, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
                  {g==='all'?'All':g}
                </div>
              ))}
            </div>
            <button onClick={()=>markAll('present')} style={{ padding:'6px 10px', border:`1px solid ${C.grn}`, borderRadius:7, background:C.grnLt, color:C.grn, fontSize:11, fontWeight:700, cursor:'pointer', flexShrink:0 }}>
              All present
            </button>
          </div>

          {/* Member list */}
          <div style={{ background:'#fff', borderRadius:10, border:`1px solid ${C.bd}`, padding:'4px 13px', marginBottom:12 }}>
            {filtered.length === 0 ? (
              <div style={{ padding:'20px 0', textAlign:'center', fontSize:13, color:C.mid }}>
                No members. Add members first.
              </div>
            ) : filtered.map((m, i) => {
              const gs     = groupStyle(m.group)
              const status = records[m.id]
              return (
                <div key={m.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom: i < filtered.length-1 ? `1px solid ${C.bd}` : 'none' }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:gs.bg, color:gs.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>
                    {initials(m.name)}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:C.dk, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.name}</div>
                    <div style={{ fontSize:10, color:C.mid }}>{m.group}{m.location?' · '+m.location:''}</div>
                  </div>
                  <button onClick={() => toggle(m.id)} style={{
                    padding:'5px 12px', borderRadius:7, fontSize:12, fontWeight:700,
                    cursor:'pointer', border:'1px solid',
                    background: status==='present'?C.grnLt : status==='absent'?C.redLt : C.bg,
                    color:       status==='present'?C.grn  : status==='absent'?C.red  : C.mid,
                    borderColor: status==='present'?C.grn  : status==='absent'?C.red  : C.bd,
                  }}>
                    {status==='present'?'✓ Present':status==='absent'?'✗ Absent':'— Mark'}
                  </button>
                </div>
              )
            })}
          </div>

          <button onClick={doSave} disabled={saving} style={{
            width:'100%', padding:13, background:saving?C.mid:C.hdr,
            color:'#fff', border:'none', borderRadius:10,
            fontSize:14, fontWeight:700, cursor:saving?'not-allowed':'pointer',
          }}>
            {saving ? 'Saving…' : `💾 Save attendance for ${fmtDate(date)}`}
          </button>
        </>
      )}

      {tab === 'history' && (
        <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <div style={{ fontSize:13, fontWeight:600, color:C.dk }}>Attendance history</div>
            <div style={{ fontSize:11, color:C.mid, background:C.bg, padding:'2px 8px', borderRadius:20, border:`1px solid ${C.bd}` }}>Last 60 sessions</div>
          </div>
          {histLoading ? (
            <div style={{ textAlign:'center', padding:40, color:C.mid }}>Loading…</div>
          ) : history.length === 0 ? (
            <Empty icon="ti-clipboard" text="No attendance records yet." />
          ) : history.map(h => (
            <div key={h.id} style={{ background:'#fff', borderRadius:10, border:`1px solid ${C.bd}`, padding:'13px', marginBottom:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:C.dk }}>{fmtDate(h.date)}</div>
                  <div style={{ fontSize:11, marginTop:4 }}>
                    <span style={{ color:C.grn, fontWeight:700 }}>✓ {h.presentCount||0} present</span>
                    <span style={{ color:C.mid, margin:'0 6px' }}>·</span>
                    <span style={{ color:C.red, fontWeight:700 }}>✗ {h.absentCount||0} absent</span>
                  </div>
                </div>
                <div style={{ fontSize:20, fontWeight:700, color:C.hdr }}>
                  {h.presentCount && h.absentCount !== undefined
                    ? `${Math.round(h.presentCount/(h.presentCount+h.absentCount)*100)}%`
                    : '—'}
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
