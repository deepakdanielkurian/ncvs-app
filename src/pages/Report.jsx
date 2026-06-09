import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { C, inr, fmtDate, filterByPeriod, todayStr } from '../utils/helpers'

const PERIOD_OPTS = [
  ['all',   'Full FY'],
  ['month', 'This month'],
  ['week',  'This week'],
  ['day',   'Today'],
]

export default function Report() {
  const { entries, showToast } = useApp()
  const [grp,     setGrp]     = useState('NRI')
  const [period,  setPeriod]  = useState('all')
  const [pdfBusy, setPdfBusy] = useState(false)

  const base   = filterByPeriod(entries.filter(e => e.group === grp), period)
  const subs   = base.filter(e => e.type === 'Subscription')
  const dons   = base.filter(e => e.type === 'Donation')
  const subTot = subs.reduce((a, e) => a + e.amount, 0)
  const donTot = dons.reduce((a, e) => a + e.amount, 0)
  const grand  = subTot + donTot
  const thC    = grp === 'NRI' ? C.nri : C.ker
  const pLabel = PERIOD_OPTS.find(([k]) => k === period)?.[1] || 'Full FY'

  const genPDF = async () => {
    setPdfBusy(true)
    await new Promise(r => setTimeout(r, 50))
    try {
      const { default: jsPDF } = await import('jspdf')
      await import('jspdf-autotable')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      buildPDF(doc, grp, base, subs, dons, subTot, donTot, grand, pLabel)
      addFooters(doc)
      doc.save(`NCVS_${grp}_Report_FY2026-27.pdf`)
      showToast(`✅ ${grp} PDF downloaded!`)
    } catch (e) { console.error(e); showToast('❌ PDF failed') }
    setPdfBusy(false)
  }

  const copyText = () => {
    const txt = buildText(grp, subs, dons, subTot, donTot, grand, pLabel)
    navigator.clipboard?.writeText(txt)
      .then(() => showToast(`✅ ${grp} report copied!`))
      .catch(() => showToast('❌ Copy failed'))
  }

  return (
    <div style={{ padding: '12px 13px' }}>
      {/* Group toggle */}
      <div style={{ display:'flex', gap:6, marginBottom:12 }}>
        {[['NRI', C.nri, C.nriLt], ['Kerala', C.ker, C.kerLt]].map(([g,col,bg]) => (
          <button key={g} onClick={() => setGrp(g)} style={{
            flex:1, padding:'9px 4px', border:`1px solid ${grp===g?col:C.bd}`,
            borderRadius:8, background:grp===g?bg:'#fff',
            color:grp===g?col:C.mid, fontSize:12, fontWeight:grp===g?700:500, cursor:'pointer',
          }}>{g} Group</button>
        ))}
      </div>

      {/* Period */}
      <div style={{ background:'#fff', borderRadius:10, border:`1px solid ${C.bd}`, padding:'13px', marginBottom:12 }}>
        <div style={{ fontSize:11, fontWeight:600, color:C.mid, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>Period</div>
        <div style={{ display:'flex', gap:6 }}>
          {PERIOD_OPTS.map(([k,v]) => (
            <button key={k} onClick={()=>setPeriod(k)} style={{
              flex:1, padding:'7px 4px', border:`1px solid ${period===k?C.hdr:C.bd}`,
              borderRadius:8, background:period===k?C.hdr:'#fff',
              color:period===k?'#fff':C.mid, fontSize:11, fontWeight:period===k?600:500, cursor:'pointer',
            }}>{v}</button>
          ))}
        </div>
      </div>

      {/* Subscription block */}
      <ReportBlock
        title={`${grp} — Monthly Subscription`}
        total={inr(subTot)} color={thC}
        rows={subs} amtColor={C.amb}
        countLabel={`${subs.length} member${subs.length!==1?'s':''}`}
      />

      {/* Donation block */}
      <ReportBlock
        title={`${grp} — Donations`}
        total={inr(donTot)} color={C.pur}
        rows={dons} amtColor={C.pur}
        countLabel={`${dons.length} donor${dons.length!==1?'s':''}`}
      />

      {/* Grand total */}
      <div style={{ background:C.pur, borderRadius:10, padding:16, marginBottom:14, textAlign:'center' }}>
        <div style={{ fontSize:11, color:'#ADA9E8', marginBottom:5 }}>{grp} Group Grand Total · {pLabel}</div>
        <div style={{ fontSize:28, fontWeight:700, color:'#fff', fontFamily:'Georgia, serif' }}>{inr(grand)}</div>
        <div style={{ fontSize:11, color:'#ADA9E8', marginTop:4 }}>Subscription {inr(subTot)} + Donation {inr(donTot)}</div>
      </div>

      {/* PDF busy */}
      {pdfBusy && (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', background:C.hdrLt, borderRadius:10, border:`1px solid ${C.hdrAcc}`, marginBottom:10 }}>
          <div style={{ width:18, height:18, border:`2px solid ${C.hdrAcc}`, borderTopColor:C.hdr, borderRadius:'50%', animation:'spin .7s linear infinite', flexShrink:0 }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <span style={{ fontSize:13, color:C.hdr, fontWeight:500 }}>Generating PDF…</span>
        </div>
      )}

      <button onClick={genPDF} disabled={pdfBusy} style={{
        width:'100%', padding:13, background:pdfBusy?C.mid:thC,
        color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700,
        cursor:pdfBusy?'not-allowed':'pointer', marginBottom:8,
        display:'flex', alignItems:'center', justifyContent:'center', gap:6,
      }}>
        <i className="ti ti-file-download" style={{fontSize:18}} /> Download {grp} Report PDF
      </button>

      <button onClick={copyText} style={{
        width:'100%', padding:13, background:'#fff', color:C.dk,
        border:`1px solid ${C.bd}`, borderRadius:10, fontSize:14, fontWeight:600,
        cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
      }}>
        <i className="ti ti-copy" style={{fontSize:18, color:C.mid}} /> Copy {grp} report text
      </button>
    </div>
  )
}

function ReportBlock({ title, total, color, rows, amtColor, countLabel }) {
  return (
    <div style={{ background:'#fff', borderRadius:10, border:`1px solid ${C.bd}`, overflow:'hidden', marginBottom:10 }}>
      <div style={{ background:color, padding:'10px 13px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontSize:12, fontWeight:600, color:'#fff' }}>{title}</div>
        <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{total}</div>
      </div>
      {rows.length ? (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
            <thead>
              <tr style={{ background:C.bg }}>
                {['Sl','Name','Date Received','Receipt No','Pay Method','Txn ID','Amount'].map(h => (
                  <th key={h} style={{ fontSize:9, fontWeight:600, color:C.mid, textAlign:h==='Amount'?'right':'left', padding:'5px 7px', borderBottom:`1px solid ${C.bd}`, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((e, i) => (
                <tr key={e.id} style={{ background: i%2===0?'#fff':'#FAFAF8' }}>
                  <td style={{ padding:'6px 7px', color:C.mid, fontSize:10 }}>{i+1}</td>
                  <td style={{ padding:'6px 7px', color:C.dk, fontWeight:600, maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {e.name}{e.nonSH&&<span style={{color:C.red,fontSize:8}}> [NS]</span>}
                    {e.period&&<div style={{fontSize:9,color:C.mid,fontWeight:400}}>{e.period}</div>}
                  </td>
                  <td style={{ padding:'6px 7px', color, fontWeight:600, fontSize:10, whiteSpace:'nowrap' }}>{fmtDate(e.date)}</td>
                  <td style={{ padding:'6px 7px', color, fontWeight:600 }}>{e.receipt||'—'}</td>
                  <td style={{ padding:'6px 7px', color:C.dk, fontSize:10, maxWidth:80, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.pay||'—'}</td>
                  <td style={{ padding:'6px 7px', color:C.mid, fontSize:10 }}>{e.txn?e.txn.slice(0,12)+'…':'—'}</td>
                  <td style={{ padding:'6px 7px', color:amtColor, fontWeight:700, textAlign:'right' }}>{inr(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding:'12px 13px', fontSize:12, color:C.mid }}>No entries for this period</div>
      )}
      <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 13px', borderTop:`2px solid ${C.bd}` }}>
        <span style={{ fontSize:11, fontWeight:600, color:C.mid }}>{countLabel}</span>
        <span style={{ fontSize:13, fontWeight:700, color }}>{total}</span>
      </div>
    </div>
  )
}

// ── PDF builder ──────────────────────────────
function buildPDF(doc, grp, base, subs, dons, sT, dT, grand, pLabel) {
  const W=210, M=13, AW=197
  const thC  = grp==='NRI'?[12,68,124]:[8,80,65]
  const thL  = grp==='NRI'?[230,241,251]:[225,245,238]
  const PUR=[60,52,137], PUR_L=[238,237,254]
  const AMB=[99,56,6],   AMB_L=[250,238,218]
  const GLD=[186,117,23], HDR=[8,80,65]
  const MID=[136,135,128], DK=[44,44,42], BG=[241,239,232], BD=[211,209,199]
  const RED=[163,45,45],  RED_L=[252,235,235], W255=[255,255,255]

  doc.setFillColor(...HDR); doc.rect(0,0,W,30,'F')
  doc.setFillColor(...GLD); doc.rect(0,0,4,30,'F')
  doc.setFillColor(29,158,117); doc.rect(0,30,W,1.5,'F')
  doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(...W255)
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

  let y=36
  const cw=AW/4
  const cards=[{l:'Members',v:String(subs.length),c:thC,bg:thL},{l:'Subscription',v:inr(sT),c:AMB,bg:AMB_L},{l:'Donations',v:inr(dT),c:PUR,bg:PUR_L},{l:'Grand Total',v:inr(grand),c:thC,bg:thL}]
  cards.forEach((card,i)=>{const x=M+i*cw; doc.setFillColor(...card.bg); doc.roundedRect(x,y,cw-2,18,2,2,'F'); doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...card.c); doc.text(card.v,x+cw/2-1,y+8,{align:'center'}); doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...MID); doc.text(card.l,x+cw/2-1,y+14,{align:'center'})})
  y+=22

  doc.setFillColor(...thL); doc.roundedRect(M,y,AW,8,2,2,'F'); doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(...thC); doc.text('Financial Year: 01 Apr 2026 – 31 Mar 2027',M+4,y+5); doc.text(`Report Date: ${fmtDate(todayStr())}`,W-M-4,y+5,{align:'right'}); y+=12

  doc.setFillColor(...thC); doc.roundedRect(M,y,AW,10,2,2,'F'); doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...W255); doc.text(`Section 1 — ${grp} Monthly Subscription`,M+5,y+6.5); doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(225,245,238); doc.text(`${subs.length} members  |  Total: ${inr(sT)}`,W-M-5,y+6.5,{align:'right'}); y+=12

  if(subs.length){
    doc.autoTable({startY:y,margin:{left:M,right:M},head:[['Sl','Name','Period','Date Received','Receipt No','Pay Method','Txn ID','Amount']],body:subs.map((e,i)=>[i+1,e.name+(e.nonSH?' [Non-SH]':''),e.period||'—',fmtDate(e.date),e.receipt||'—',e.pay||'—',e.txn?e.txn.slice(0,14):'—',inr(e.amount)]),styles:{fontSize:7.5,cellPadding:2.5,textColor:DK,lineColor:BD,lineWidth:0.2},headStyles:{fillColor:thC,textColor:W255,fontStyle:'bold',fontSize:7.5},alternateRowStyles:{fillColor:BG},columnStyles:{0:{cellWidth:8,halign:'center'},1:{cellWidth:40},2:{cellWidth:14,halign:'center'},3:{cellWidth:22,halign:'center',textColor:thC,fontStyle:'bold'},4:{cellWidth:22,textColor:thC,fontStyle:'bold'},5:{cellWidth:28},6:{cellWidth:20,textColor:MID},7:{cellWidth:23,halign:'right',fontStyle:'bold'}},foot:[[{content:'Subscription Total',colSpan:7,styles:{halign:'right',fontStyle:'bold',fillColor:thL,textColor:thC}},{content:inr(sT),styles:{halign:'right',fontStyle:'bold',fillColor:thL,textColor:thC,fontSize:9}}]]})
    y=doc.lastAutoTable.finalY+8
  } else {doc.setFontSize(9);doc.setTextColor(...MID);doc.text('No subscription entries.',M,y+6);y+=12}

  if(y>240){doc.addPage();y=20}
  doc.setFillColor(...PUR); doc.roundedRect(M,y,AW,10,2,2,'F'); doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...W255); doc.text(`Section 2 — ${grp} Donations`,M+5,y+6.5); doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(238,237,254); doc.text(`${dons.length} donors  |  Total: ${inr(dT)}`,W-M-5,y+6.5,{align:'right'}); y+=12

  if(dons.length){
    doc.autoTable({startY:y,margin:{left:M,right:M},head:[['Sl','Donor Name','Date Received','Receipt No','Pay Method','Txn ID','Amount']],body:dons.map((e,i)=>[i+1,e.name+(e.nonSH?' [Non-SH]':''),fmtDate(e.date),e.receipt||'—',e.pay||'—',e.txn?e.txn.slice(0,14):'—',inr(e.amount)]),styles:{fontSize:7.5,cellPadding:2.5,textColor:DK,lineColor:BD,lineWidth:0.2},headStyles:{fillColor:PUR,textColor:W255,fontStyle:'bold',fontSize:7.5},alternateRowStyles:{fillColor:BG},columnStyles:{0:{cellWidth:8,halign:'center'},1:{cellWidth:48},2:{cellWidth:24,halign:'center',textColor:thC,fontStyle:'bold'},3:{cellWidth:24,textColor:PUR,fontStyle:'bold'},4:{cellWidth:30},5:{cellWidth:22,textColor:MID},6:{cellWidth:21,halign:'right',fontStyle:'bold'}},foot:[[{content:'Donation Total',colSpan:6,styles:{halign:'right',fontStyle:'bold',fillColor:PUR_L,textColor:PUR}},{content:inr(dT),styles:{halign:'right',fontStyle:'bold',fillColor:PUR_L,textColor:PUR,fontSize:9}}]]})
    y=doc.lastAutoTable.finalY+8
  } else {doc.setFontSize(9);doc.setTextColor(...MID);doc.text('No donation entries.',M,y+6);y+=12}

  if(y>255){doc.addPage();y=20}
  doc.setFillColor(...PUR_L); doc.roundedRect(M,y,AW,20,3,3,'F'); doc.setDrawColor(...PUR); doc.setLineWidth(0.8); doc.line(M,y,M+AW,y); doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(...PUR); doc.text(`${grp} GROUP — GRAND TOTAL`,M+6,y+8); doc.setFontSize(8); doc.setTextColor(107,100,215); doc.text(`Subscription ${inr(sT)}  +  Donation ${inr(dT)}`,M+6,y+15); doc.setFontSize(14); doc.setTextColor(...PUR); doc.text(inr(grand),W-M-6,y+13,{align:'right'})

  const ns=base.filter(e=>e.nonSH)
  if(ns.length){y+=26; doc.setFillColor(...RED_L); doc.roundedRect(M,y,AW,10,2,2,'F'); doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(...RED); doc.text('Non-shareholder:',M+4,y+6.5); doc.setFont('helvetica','normal'); doc.setTextColor(...DK); doc.text(ns.map(e=>e.name).join(', ').slice(0,110),M+35,y+6.5)}
}

function addFooters(doc){
  const n=doc.getNumberOfPages()
  for(let p=1;p<=n;p++){
    doc.setPage(p); doc.setFillColor(241,239,232); doc.rect(0,285,210,12,'F'); doc.setDrawColor(211,209,199); doc.setLineWidth(0.4); doc.line(0,285,210,285); doc.setFillColor(186,117,23); doc.rect(0,285,4,12,'F'); doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(136,135,128); doc.text('Niranam Chundan Vallasamithi  |  FY 01 Apr 2026 – 31 Mar 2027  |  Confidential',13,291.5); doc.text(`Page ${p} of ${n}`,197,291.5,{align:'right'})
  }
}

function buildText(grp, subs, dons, sT, dT, grand, pLabel) {
  let t=`*NIRANAM CHUNDAN VALLASAMITHI*\n*${grp} GROUP REPORT*\nReg. No. PTM/TC/229/2021\nPeriod: ${pLabel} · FY: 01 Apr 2026 – 31 Mar 2027\n━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
  if(subs.length){t+=`*Section 1 — Monthly Subscription (${subs.length} members)*\n`;subs.forEach((e,i)=>{t+=`${i+1}. ${e.name}${e.period?' ('+e.period+')':''}${e.nonSH?' [Non-SH]':''}\n   Date: ${fmtDate(e.date)}  |  Receipt: ${e.receipt||'—'}  |  ${inr(e.amount)}\n   Pay: ${e.pay||'—'}${e.txn?'  |  Txn: '+e.txn:''}\n`});t+=`*Subscription Total: ${inr(sT)}*\n\n`}
  if(dons.length){t+=`*Section 2 — Donations (${dons.length} donors)*\n`;dons.forEach((e,i)=>{t+=`${i+1}. ${e.name}${e.nonSH?' [Non-SH]':''}\n   Date: ${fmtDate(e.date)}  |  Receipt: ${e.receipt||'—'}  |  ${inr(e.amount)}\n   Pay: ${e.pay||'—'}${e.txn?'  |  Txn: '+e.txn:''}\n`});t+=`*Donation Total: ${inr(dT)}*\n\n`}
  if(!subs.length&&!dons.length)t+=`_No entries for this period_\n\n`
  t+=`━━━━━━━━━━━━━━━━━━━━━━━━━\n*${grp} GROUP TOTAL: ${inr(grand)}*\n━━━━━━━━━━━━━━━━━━━━━━━━━\n_Niranam, Thiruvalla · niranamchundan@gmail.com_`
  return t
}
