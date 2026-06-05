import { useState } from 'react'
import { useEntries } from '../hooks/useEntries'
import { inr, fmtDate, filterByPeriod, todayStr } from '../utils/helpers'
import { showToast } from '../components/Toast'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const PERIOD_LABELS = { all:'Full FY 2026–27', month:'This month', week:'This week', day:'Today' }

export default function Report() {
  const { entries, loading } = useEntries()
  const [grpTab, setGrpTab] = useState('NRI')
  const [period, setPeriod] = useState('all')
  const [pdfBusy, setPdfBusy] = useState(false)

  const buildData = (grp) => {
    const base = filterByPeriod(entries.filter(e => e.group === grp), period)
    const subs = base.filter(e => e.type === 'Subscription')
    const dons = base.filter(e => e.type === 'Donation')
    return { subs, dons, subTot: subs.reduce((a,e)=>a+e.amount,0), donTot: dons.reduce((a,e)=>a+e.amount,0) }
  }

  const { subs, dons, subTot, donTot } = buildData(grpTab)
  const grand = subTot + donTot
  const themeColor = grpTab === 'NRI' ? 'var(--nri)' : 'var(--ker)'

  // PDF generation
  const genPDF = async (grp) => {
    const { jsPDF: J } = await import('jspdf')
    await import('jspdf-autotable')
    setPdfBusy(true)
    await new Promise(r => setTimeout(r, 50))
    try {
      const doc = new J({ orientation:'portrait', unit:'mm', format:'a4' })
      buildPDF(doc, grp, entries, period)
      addFooters(doc)
      doc.save(`NCVS_${grp}_Report_FY2026-27.pdf`)
      showToast(`✅ ${grp} PDF downloaded!`)
    } catch(e) { console.error(e); showToast('❌ PDF failed') }
    setPdfBusy(false)
  }

  const copyText = (grp) => {
    const txt = buildText(grp, entries, period)
    navigator.clipboard?.writeText(txt).then(() => showToast(`✅ ${grp} report copied!`))
  }

  return (
    <div className="screen fade-up">
      {/* Group tab */}
      <div className="rtype-row">
        {['NRI','Kerala'].map(g => (
          <div key={g} className={`rtype-chip${grpTab===g?' active':''}`} onClick={()=>setGrpTab(g)}>{g} Group</div>
        ))}
      </div>

      {/* Period */}
      <div className="card card-pad" style={{ marginBottom:12 }}>
        <div style={{ fontSize:11, fontWeight:600, color:'var(--mid)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>Period</div>
        <div className="per-row">
          {Object.entries(PERIOD_LABELS).map(([k,v]) => (
            <div key={k} className={`per-chip${period===k?' active':''}`} onClick={()=>setPeriod(k)}>
              {k==='all'?'Full FY':v.split(' ')[1]}
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="empty"><div className="spinner" style={{ margin:'0 auto' }} /></div>
      ) : (
        <>
          {/* Subscription block */}
          <div className="rb">
            <div className="rb-head" style={{ background: themeColor }}>
              <div className="rb-title">{grpTab} — Monthly Subscription</div>
              <div className="rb-total">{inr(subTot)}</div>
            </div>
            {subs.length ? (
              <div style={{ overflowX:'auto' }}>
                <table className="rb-tbl">
                  <thead><tr>
                    <th>Sl</th><th>Name</th><th>Date Received</th>
                    <th>Receipt No</th><th>Pay Method</th><th>Txn ID</th><th>Amount</th>
                  </tr></thead>
                  <tbody>
                    {subs.map((e,i) => (
                      <tr key={e.id}>
                        <td style={{ color:'var(--mid)' }}>{i+1}</td>
                        <td><b>{e.name}</b>{e.period&&<span style={{ fontSize:9, color:'var(--mid)', marginLeft:4 }}>· {e.period}</span>}{e.nonSH&&<span style={{ color:'var(--red)', fontSize:9 }}> [NS]</span>}</td>
                        <td style={{ color: themeColor, fontSize:10, whiteSpace:'nowrap', fontWeight:600 }}>{fmtDate(e.date)}</td>
                        <td style={{ color: themeColor, fontWeight:600 }}>{e.receipt||'—'}</td>
                        <td style={{ fontSize:10 }}>{e.pay||'—'}</td>
                        <td style={{ fontSize:10, color:'var(--mid)' }}>{e.txn?e.txn.slice(0,12):'—'}</td>
                        <td style={{ color:'var(--amb)', fontWeight:700 }}>{inr(e.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div style={{ padding:'12px 13px', fontSize:12, color:'var(--mid)' }}>No entries for this period</div>}
            <div className="rb-sub">
              <span>{subs.length} member{subs.length!==1?'s':''}</span>
              <span style={{ color: themeColor }}>{inr(subTot)}</span>
            </div>
          </div>

          {/* Donation block */}
          <div className="rb">
            <div className="rb-head" style={{ background:'var(--pur)' }}>
              <div className="rb-title">{grpTab} — Donations</div>
              <div className="rb-total">{inr(donTot)}</div>
            </div>
            {dons.length ? (
              <div style={{ overflowX:'auto' }}>
                <table className="rb-tbl">
                  <thead><tr>
                    <th>Sl</th><th>Name</th><th>Date Received</th>
                    <th>Receipt No</th><th>Pay Method</th><th>Txn ID</th><th>Amount</th>
                  </tr></thead>
                  <tbody>
                    {dons.map((e,i) => (
                      <tr key={e.id}>
                        <td style={{ color:'var(--mid)' }}>{i+1}</td>
                        <td><b>{e.name}</b>{e.nonSH&&<span style={{ color:'var(--red)', fontSize:9 }}> [NS]</span>}</td>
                        <td style={{ color: themeColor, fontSize:10, whiteSpace:'nowrap', fontWeight:600 }}>{fmtDate(e.date)}</td>
                        <td style={{ color:'var(--pur)', fontWeight:600 }}>{e.receipt||'—'}</td>
                        <td style={{ fontSize:10 }}>{e.pay||'—'}</td>
                        <td style={{ fontSize:10, color:'var(--mid)' }}>{e.txn?e.txn.slice(0,12):'—'}</td>
                        <td style={{ color:'var(--pur)', fontWeight:700 }}>{inr(e.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div style={{ padding:'12px 13px', fontSize:12, color:'var(--mid)' }}>No entries for this period</div>}
            <div className="rb-sub">
              <span>{dons.length} donor{dons.length!==1?'s':''}</span>
              <span style={{ color:'var(--pur)' }}>{inr(donTot)}</span>
            </div>
          </div>

          {/* Grand total */}
          <div className="grand-box">
            <div className="gl">{grpTab} Group Grand Total · {PERIOD_LABELS[period]}</div>
            <div className="ga">{inr(grand)}</div>
            <div className="gs">Subscription {inr(subTot)} + Donation {inr(donTot)}</div>
          </div>

          {/* PDF + Copy */}
          <div className="divider" />
          {pdfBusy && (
            <div className="prog-bar">
              <div className="spinner" />
              <span style={{ fontSize:13, color:'var(--hdr)', fontWeight:500 }}>Generating PDF…</span>
            </div>
          )}
          <button className="btn-primary" style={{ marginBottom:8 }} onClick={() => genPDF(grpTab)}>
            📥 Download {grpTab} Report PDF
          </button>
          <button className="copy-btn" onClick={() => copyText(grpTab)}>
            <div className="copy-icon" style={{ background: grpTab==='NRI'?'var(--nri-lt)':'var(--ker-lt)' }}>📋</div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--dk)' }}>Copy {grpTab} report text</div>
              <div style={{ fontSize:11, color:'var(--mid)' }}>Paste into messages or email</div>
            </div>
          </button>
        </>
      )}
    </div>
  )
}

// ── PDF builder ──────────────────────────────
function buildPDF(doc, grp, allEntries, period) {
  const W=210, M=13, AW=197
  const base = filterByPeriod(allEntries.filter(e => e.group === grp), period)
  const subs  = base.filter(e => e.type === 'Subscription')
  const dons  = base.filter(e => e.type === 'Donation')
  const sT    = subs.reduce((a,e)=>a+e.amount,0)
  const dT    = dons.reduce((a,e)=>a+e.amount,0)
  const grand = sT + dT
  const thC   = grp==='NRI' ? [12,68,124] : [8,80,65]
  const thL   = grp==='NRI' ? [230,241,251] : [225,245,238]
  const PUR=[60,52,137], PUR_L=[238,237,254]
  const AMB=[99,56,6],   AMB_L=[250,238,218]
  const GLD=[186,117,23], HDR=[8,80,65]
  const MID=[136,135,128], DK=[44,44,42], BG=[241,239,232], BD=[211,209,199]
  const RED=[163,45,45],  RED_L=[252,235,235]
  const WHITE=[255,255,255]
  const pLabel = PERIOD_LABELS[period] || 'Full FY 2026–27'

  doc.setFillColor(...HDR); doc.rect(0,0,W,30,'F')
  doc.setFillColor(...GLD); doc.rect(0,0,4,30,'F')
  doc.setFillColor(29,158,117); doc.rect(0,30,W,1.5,'F')
  doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(...WHITE)
  doc.text('NIRANAM CHUNDAN VALLASAMITHI',M+2,10)
  doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(159,225,203)
  doc.text('Reg. No. PTM/TC/229/2021  |  niranamchundan@gmail.com',M+2,16)
  doc.text('Niranam P.O., Thiruvalla, Pathanamthitta, Kerala – 689621',M+2,21)
  doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(225,245,238)
  doc.text(`${grp} GROUP REPORT`,W-M,10,{align:'right'})
  doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(159,225,203)
  doc.text('Financial Year: 01 Apr 2026 – 31 Mar 2027',W-M,16,{align:'right'})
  doc.text(`Period: ${pLabel}  |  Date: ${fmtDate(todayStr())}`,W-M,21,{align:'right'})
  doc.text('Secretary, NCVS',W-M,26,{align:'right'})

  let y = 36
  const cards = [
    {l:'Members (Sub)',v:String(subs.length),c:thC,bg:thL},
    {l:'Subscription',v:inr(sT),c:AMB,bg:AMB_L},
    {l:'Donations',v:inr(dT),c:PUR,bg:PUR_L},
    {l:'Grand Total',v:inr(grand),c:thC,bg:thL},
  ]
  const cw = AW/4
  cards.forEach((card,i)=>{
    const x=M+i*cw
    doc.setFillColor(...card.bg); doc.roundedRect(x,y,cw-2,18,2,2,'F')
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...card.c)
    doc.text(card.v,x+cw/2-1,y+8,{align:'center'})
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...MID)
    doc.text(card.l,x+cw/2-1,y+14,{align:'center'})
  })
  y += 22

  doc.setFillColor(...thL); doc.roundedRect(M,y,AW,8,2,2,'F')
  doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(...thC)
  doc.text('Financial Year: 01 Apr 2026 – 31 Mar 2027',M+4,y+5)
  doc.text(`Report Date: ${fmtDate(todayStr())}`,W-M-4,y+5,{align:'right'})
  y += 12

  // Section 1
  doc.setFillColor(...thC); doc.roundedRect(M,y,AW,10,2,2,'F')
  doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...WHITE)
  doc.text(`Section 1 — ${grp} Monthly Subscription`,M+5,y+6.5)
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(225,245,238)
  doc.text(`${subs.length} members  |  Total: ${inr(sT)}`,W-M-5,y+6.5,{align:'right'})
  y += 12

  if(subs.length){
    doc.autoTable({
      startY:y, margin:{left:M,right:M},
      head:[['Sl','Name','Period','Date Received','Receipt No','Pay Method','Txn ID','Amount']],
      body:subs.map((e,i)=>[i+1,e.name+(e.nonSH?' [Non-SH]':''),e.period||'—',fmtDate(e.date),e.receipt||'—',e.pay||'—',e.txn?e.txn.slice(0,14):'—',inr(e.amount)]),
      styles:{fontSize:7.5,cellPadding:2.5,textColor:DK,lineColor:BD,lineWidth:0.2},
      headStyles:{fillColor:thC,textColor:WHITE,fontStyle:'bold',fontSize:7.5},
      alternateRowStyles:{fillColor:BG},
      columnStyles:{0:{cellWidth:8,halign:'center'},1:{cellWidth:42},2:{cellWidth:14,halign:'center'},3:{cellWidth:22,halign:'center',textColor:thC,fontStyle:'bold'},4:{cellWidth:22,textColor:thC,fontStyle:'bold'},5:{cellWidth:26},6:{cellWidth:20,textColor:MID},7:{cellWidth:23,halign:'right',fontStyle:'bold'}},
      foot:[[{content:'Subscription Total',colSpan:7,styles:{halign:'right',fontStyle:'bold',fillColor:thL,textColor:thC}},{content:inr(sT),styles:{halign:'right',fontStyle:'bold',fillColor:thL,textColor:thC,fontSize:9}}]],
    })
    y = doc.lastAutoTable.finalY + 8
  } else { doc.setFontSize(9); doc.setTextColor(...MID); doc.text('No subscription entries.',M,y+6); y+=12 }

  if(y>240){ doc.addPage(); y=20 }
  doc.setFillColor(...PUR); doc.roundedRect(M,y,AW,10,2,2,'F')
  doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...WHITE)
  doc.text(`Section 2 — ${grp} Donations`,M+5,y+6.5)
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(238,237,254)
  doc.text(`${dons.length} donors  |  Total: ${inr(dT)}`,W-M-5,y+6.5,{align:'right'})
  y += 12

  if(dons.length){
    doc.autoTable({
      startY:y, margin:{left:M,right:M},
      head:[['Sl','Donor Name','Date Received','Receipt No','Pay Method','Txn ID','Amount']],
      body:dons.map((e,i)=>[i+1,e.name+(e.nonSH?' [Non-SH]':''),fmtDate(e.date),e.receipt||'—',e.pay||'—',e.txn?e.txn.slice(0,14):'—',inr(e.amount)]),
      styles:{fontSize:7.5,cellPadding:2.5,textColor:DK,lineColor:BD,lineWidth:0.2},
      headStyles:{fillColor:PUR,textColor:WHITE,fontStyle:'bold',fontSize:7.5},
      alternateRowStyles:{fillColor:BG},
      columnStyles:{0:{cellWidth:8,halign:'center'},1:{cellWidth:50},2:{cellWidth:24,halign:'center',textColor:thC,fontStyle:'bold'},3:{cellWidth:24,textColor:PUR,fontStyle:'bold'},4:{cellWidth:28},5:{cellWidth:22,textColor:MID},6:{cellWidth:21,halign:'right',fontStyle:'bold'}},
      foot:[[{content:'Donation Total',colSpan:6,styles:{halign:'right',fontStyle:'bold',fillColor:PUR_L,textColor:PUR}},{content:inr(dT),styles:{halign:'right',fontStyle:'bold',fillColor:PUR_L,textColor:PUR,fontSize:9}}]],
    })
    y = doc.lastAutoTable.finalY + 8
  } else { doc.setFontSize(9); doc.setTextColor(...MID); doc.text('No donation entries.',M,y+6); y+=12 }

  if(y>255){ doc.addPage(); y=20 }
  doc.setFillColor(...PUR_L); doc.roundedRect(M,y,AW,20,3,3,'F')
  doc.setDrawColor(...PUR); doc.setLineWidth(0.8); doc.line(M,y,M+AW,y)
  doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(...PUR)
  doc.text(`${grp} GROUP — GRAND TOTAL`,M+6,y+8)
  doc.setFontSize(8); doc.setTextColor(107,100,215)
  doc.text(`Subscription ${inr(sT)}  +  Donation ${inr(dT)}`,M+6,y+15)
  doc.setFontSize(14); doc.setTextColor(...PUR)
  doc.text(inr(grand),W-M-6,y+13,{align:'right'})

  const ns = base.filter(e=>e.nonSH)
  if(ns.length){
    y += 26
    doc.setFillColor(...RED_L); doc.roundedRect(M,y,AW,10,2,2,'F')
    doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(...RED)
    doc.text('Non-shareholder:',M+4,y+6.5)
    doc.setFont('helvetica','normal'); doc.setTextColor(...DK)
    doc.text(ns.map(e=>e.name).join(', ').slice(0,110),M+35,y+6.5)
  }
}

function addFooters(doc){
  const n=doc.getNumberOfPages()
  for(let p=1;p<=n;p++){
    doc.setPage(p)
    doc.setFillColor(241,239,232); doc.rect(0,285,210,12,'F')
    doc.setDrawColor(211,209,199); doc.setLineWidth(0.4); doc.line(0,285,210,285)
    doc.setFillColor(186,117,23); doc.rect(0,285,4,12,'F')
    doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(136,135,128)
    doc.text('Niranam Chundan Vallasamithi  |  FY 01 Apr 2026 – 31 Mar 2027  |  Confidential',13,291.5)
    doc.text(`Page ${p} of ${n}`,197,291.5,{align:'right'})
  }
}

function buildText(grp, allEntries, period) {
  const base = filterByPeriod(allEntries.filter(e => e.group === grp), period)
  const subs = base.filter(e => e.type === 'Subscription')
  const dons = base.filter(e => e.type === 'Donation')
  const sT   = subs.reduce((a,e)=>a+e.amount,0)
  const dT   = dons.reduce((a,e)=>a+e.amount,0)
  const pL   = PERIOD_LABELS[period]
  let t = `*NIRANAM CHUNDAN VALLASAMITHI*\n*${grp} GROUP REPORT*\nReg. No. PTM/TC/229/2021\nPeriod: ${pL} · FY: 01 Apr 2026 – 31 Mar 2027\n━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
  if(subs.length){ t+=`*Section 1 — Monthly Subscription (${subs.length} members)*\n`; subs.forEach((e,i)=>{ t+=`${i+1}. ${e.name}${e.period?' ('+e.period+')':''}${e.nonSH?' [Non-SH]':''}\n   Date: ${fmtDate(e.date)}  |  Receipt: ${e.receipt||'—'}  |  ${inr(e.amount)}\n   Pay: ${e.pay||'—'}${e.txn?'  |  Txn: '+e.txn:''}\n` }); t+=`*Subscription Total: ${inr(sT)}*\n\n` }
  if(dons.length){ t+=`*Section 2 — Donations (${dons.length} donors)*\n`; dons.forEach((e,i)=>{ t+=`${i+1}. ${e.name}${e.nonSH?' [Non-SH]':''}\n   Date: ${fmtDate(e.date)}  |  Receipt: ${e.receipt||'—'}  |  ${inr(e.amount)}\n   Pay: ${e.pay||'—'}${e.txn?'  |  Txn: '+e.txn:''}\n` }); t+=`*Donation Total: ${inr(dT)}*\n\n` }
  if(!subs.length&&!dons.length) t+=`_No entries for this period_\n\n`
  t+=`━━━━━━━━━━━━━━━━━━━━━━━━━\n*${grp} GROUP TOTAL: ${inr(sT+dT)}*\n━━━━━━━━━━━━━━━━━━━━━━━━━\n_Niranam, Thiruvalla · niranamchundan@gmail.com_`
  return t
}
