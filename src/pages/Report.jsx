import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { C, inr, fmtDate, filterByPeriod, todayStr } from '../utils/helpers'

const PERIOD_OPTS = [
  ['all',   'Full FY 2026\u201327'],
  ['month', 'This month'],
  ['week',  'This week'],
  ['day',   'Today'],
]

// ── PDF colour arrays ──
const HDR   = [8,80,65]
const GLD   = [186,117,23]
const NRI_C = [12,68,124];   const NRI_L = [230,241,251]
const KER_C = [8,80,65];     const KER_L = [225,245,238]
const PUR_C = [60,52,137];   const PUR_L = [238,237,254]
const AMB_C = [99,56,6];     const AMB_L = [250,238,218]
const RED_C = [163,45,45];   const RED_L = [252,235,235]
const MID   = [136,135,128]
const DK    = [44,44,42]
const BG    = [241,239,232]
const BD    = [211,209,199]
const W     = [255,255,255]
const RS    = 'Rs.'   // jsPDF safe rupee label

export default function Report() {
  const { entries, showToast } = useApp()
  const [grp,    setGrp]    = useState('NRI')
  const [period, setPeriod] = useState('all')
  const [busy,   setBusy]   = useState(false)

  const base   = filterByPeriod(entries.filter(e => e.group === grp), period)
  const subs   = base.filter(e => e.type === 'Subscription')
  const dons   = base.filter(e => e.type === 'Donation')
  const subTot = subs.reduce((a, e) => a + (e.amount || 0), 0)
  const donTot = dons.reduce((a, e) => a + (e.amount || 0), 0)
  const grand  = subTot + donTot
  const thC    = grp === 'NRI' ? C.nri : C.ker
  const thL    = grp === 'NRI' ? C.nriLt : C.kerLt
  const pLabel = PERIOD_OPTS.find(([k]) => k === period)?.[1] || 'Full FY'

  const genPDF = async () => {
    setBusy(true)
    await new Promise(r => setTimeout(r, 60))
    try {
      const { default: jsPDF } = await import('jspdf')
      await import('jspdf-autotable')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      buildPDF(doc, grp, base, subs, dons, subTot, donTot, grand, pLabel)
      addFooters(doc)
      doc.save(`NCVS_${grp}_Report_FY2026-27.pdf`)
      showToast(`\u2705 ${grp} PDF downloaded!`)
    } catch (e) { console.error(e); showToast('\u274c PDF failed: ' + e.message) }
    setBusy(false)
  }

  const copyText = () => {
    const txt = buildText(grp, subs, dons, subTot, donTot, grand, pLabel)
    navigator.clipboard?.writeText(txt)
      .then(() => showToast(`\u2705 ${grp} report copied!`))
      .catch(() => showToast('\u274c Copy failed'))
  }

  return (
    <div style={{ padding: '14px 14px', maxWidth: 430, margin: '0 auto' }}>

      {/* Group toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[['NRI', C.nri, C.nriLt], ['Kerala', C.ker, C.kerLt]].map(([g, col, bg]) => (
          <button key={g} onClick={() => setGrp(g)} style={{
            flex: 1, padding: '11px 4px',
            border: `2px solid ${grp === g ? col : C.bd}`,
            borderRadius: 10,
            background: grp === g ? bg : '#fff',
            color: grp === g ? col : C.mid,
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            transition: 'all .15s',
          }}>
            {g} Group
          </button>
        ))}
      </div>

      {/* Period selector */}
      <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${C.bd}`, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>
          Period
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {PERIOD_OPTS.map(([k, v]) => (
            <button key={k} onClick={() => setPeriod(k)} style={{
              flex: 1, padding: '8px 4px',
              border: `1px solid ${period === k ? C.hdr : C.bd}`,
              borderRadius: 8,
              background: period === k ? C.hdr : '#fff',
              color: period === k ? '#fff' : C.mid,
              fontSize: 10, fontWeight: 600, cursor: 'pointer',
              lineHeight: 1.3,
            }}>
              {k === 'all' ? 'Full FY' : v.split(' ').slice(1).join(' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Summary banner */}
      <div style={{
        background: `linear-gradient(135deg, ${thC} 0%, ${thC}dd 100%)`,
        borderRadius: 12, padding: '18px 16px', marginBottom: 14,
      }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.75)', marginBottom: 4, letterSpacing: '.04em' }}>
          {grp} GROUP \u00b7 {pLabel}
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: '-.5px' }}>
          {inr(grand)}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.65)' }}>Subscription</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{inr(subTot)}</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,.25)' }} />
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.65)' }}>Donations</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{inr(donTot)}</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,.25)' }} />
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.65)' }}>Members</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{subs.length}</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,.25)' }} />
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.65)' }}>Donors</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{dons.length}</div>
          </div>
        </div>
      </div>

      {/* Section 1 — Subscription */}
      <ReportSection
        title="Section 1 \u2014 Monthly Subscription"
        count={`${subs.length} member${subs.length !== 1 ? 's' : ''}`}
        total={inr(subTot)}
        totalColor={thC}
        headerBg={thC}
        rows={subs}
        amtColor={C.amb}
        dateColor={thC}
        rcptColor={thC}
        showPeriod
      />

      {/* Section 2 — Donations */}
      <ReportSection
        title="Section 2 \u2014 Donations"
        count={`${dons.length} donor${dons.length !== 1 ? 's' : ''}`}
        total={inr(donTot)}
        totalColor={C.pur}
        headerBg={C.pur}
        rows={dons}
        amtColor={C.pur}
        dateColor={thC}
        rcptColor={C.pur}
      />

      {/* Grand total card */}
      <div style={{
        background: C.purLt, borderRadius: 12,
        border: `2px solid ${C.pur}`,
        padding: '16px', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.pur, textTransform: 'uppercase', letterSpacing: '.05em' }}>
              {grp} Group \u2014 Grand Total
            </div>
            <div style={{ fontSize: 11, color: C.mid, marginTop: 3 }}>
              {pLabel} \u00b7 FY 2026\u201327
            </div>
            <div style={{ fontSize: 11, color: C.mid, marginTop: 2 }}>
              {inr(subTot)} sub + {inr(donTot)} donation
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: C.pur, letterSpacing: '-.5px' }}>
            {inr(grand)}
          </div>
        </div>
      </div>

      {/* PDF spinner */}
      {busy && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 14px', background: C.hdrLt,
          borderRadius: 10, border: `1px solid ${C.hdrAcc}`, marginBottom: 12,
        }}>
          <div style={{ width: 18, height: 18, border: `2px solid ${C.hdrAcc}`, borderTopColor: C.hdr, borderRadius: '50%', animation: 'spin .7s linear infinite', flexShrink: 0 }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <span style={{ fontSize: 13, color: C.hdr, fontWeight: 600 }}>Generating PDF\u2026</span>
        </div>
      )}

      {/* Action buttons */}
      <button onClick={genPDF} disabled={busy} style={{
        width: '100%', padding: 14,
        background: busy ? C.mid : thC,
        color: '#fff', border: 'none', borderRadius: 10,
        fontSize: 14, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer',
        marginBottom: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <i className="ti ti-file-download" style={{ fontSize: 20 }} />
        Download {grp} Report PDF
      </button>

      <button onClick={copyText} style={{
        width: '100%', padding: 14,
        background: '#fff', color: C.dk,
        border: `1px solid ${C.bd}`, borderRadius: 10,
        fontSize: 14, fontWeight: 600, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <i className="ti ti-copy" style={{ fontSize: 20, color: C.mid }} />
        Copy {grp} Report Text
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// Report section component
// ─────────────────────────────────────────────
function ReportSection({ title, count, total, totalColor, headerBg, rows, amtColor, dateColor, rcptColor, showPeriod }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12,
      border: `1px solid ${C.bd}`,
      overflow: 'hidden', marginBottom: 14,
    }}>
      {/* Section header */}
      <div style={{
        background: headerBg, padding: '10px 14px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{title}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.75)', marginTop: 2 }}>{count}</div>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{total}</div>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div style={{ padding: '20px 14px', fontSize: 13, color: C.mid, textAlign: 'center' }}>
          No entries for this period
        </div>
      ) : (
        <>
          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '28px 1fr 80px 64px 54px',
            background: C.bg, padding: '6px 14px',
            borderBottom: `1px solid ${C.bd}`,
          }}>
            {['Sl', 'Name', 'Date', 'Receipt', 'Amount'].map(h => (
              <div key={h} style={{
                fontSize: 9, fontWeight: 700, color: C.mid,
                textAlign: h === 'Amount' ? 'right' : h === 'Sl' ? 'center' : 'left',
                textTransform: 'uppercase', letterSpacing: '.04em',
              }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {rows.map((e, i) => (
            <div key={e.id} style={{
              display: 'grid',
              gridTemplateColumns: '28px 1fr 80px 64px 54px',
              padding: '7px 14px',
              background: i % 2 === 0 ? '#fff' : '#FAFAF8',
              borderBottom: i < rows.length - 1 ? `1px solid ${C.bd}` : 'none',
              alignItems: 'start',
            }}>
              {/* Sl */}
              <div style={{ fontSize: 10, color: C.mid, textAlign: 'center', paddingTop: 1 }}>{i + 1}</div>

              {/* Name */}
              <div style={{ paddingRight: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.dk, lineHeight: 1.3 }}>
                  {e.name}
                  {e.nonSH && <span style={{ color: C.red, fontSize: 8, marginLeft: 3 }}>[NS]</span>}
                </div>
                {showPeriod && e.period && (
                  <div style={{ fontSize: 9, color: C.mid, marginTop: 1 }}>{e.period}</div>
                )}
                {e.pay && (
                  <div style={{ fontSize: 9, color: C.mid, marginTop: 1 }}>{e.pay}</div>
                )}
                {e.txn && (
                  <div style={{ fontSize: 9, color: C.mid, marginTop: 1 }}>Txn: {e.txn.slice(0, 16)}</div>
                )}
              </div>

              {/* Date */}
              <div style={{ fontSize: 10, fontWeight: 600, color: dateColor, lineHeight: 1.3 }}>
                {fmtDate(e.date)}
              </div>

              {/* Receipt */}
              <div style={{ fontSize: 10, fontWeight: 700, color: rcptColor }}>
                {e.receipt || '\u2014'}
              </div>

              {/* Amount */}
              <div style={{ fontSize: 12, fontWeight: 700, color: amtColor, textAlign: 'right' }}>
                {inr(e.amount)}
              </div>
            </div>
          ))}

          {/* Subtotal */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '9px 14px',
            background: totalColor + '15',
            borderTop: `2px solid ${totalColor}40`,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.mid }}>
              {count}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: totalColor }}>
              {total}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// PDF builder
// ─────────────────────────────────────────────
function buildPDF(doc, grp, base, subs, dons, sT, dT, grand, pLabel) {
  const PW = 210, M = 13, AW = 184
  const thC = grp === 'NRI' ? NRI_C : KER_C
  const thL = grp === 'NRI' ? NRI_L : KER_L

  // ── Header ──
  doc.setFillColor(...HDR); doc.rect(0, 0, PW, 32, 'F')
  doc.setFillColor(...GLD); doc.rect(0, 0, 4, 32, 'F')
  doc.setFillColor(29, 158, 117); doc.rect(0, 32, PW, 1.5, 'F')

  doc.setFont('helvetica', 'bold'); doc.setFontSize(13.5); doc.setTextColor(...W)
  doc.text('NIRANAM CHUNDAN VALLASAMITHI', M + 2, 11)

  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(159, 225, 203)
  doc.text('Reg. No. PTM/TC/229/2021  |  niranamchundan@gmail.com', M + 2, 17.5)
  doc.text('Niranam P.O., Thiruvalla, Pathanamthitta, Kerala \u2013 689621', M + 2, 23)

  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(225, 245, 238)
  doc.text(`${grp} GROUP REPORT`, PW - M, 11, { align: 'right' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(159, 225, 203)
  doc.text('Financial Year: 01 Apr 2026 \u2013 31 Mar 2027', PW - M, 17.5, { align: 'right' })
  doc.text(`Period: ${pLabel}  |  Date: ${fmtDate(todayStr())}`, PW - M, 23, { align: 'right' })
  doc.text('Prepared by: Secretary, NCVS', PW - M, 28.5, { align: 'right' })

  let y = 38

  // ── Summary cards ──
  const cw = AW / 4
  const cards = [
    { l: 'Members', v: String(subs.length), c: thC, bg: thL },
    { l: 'Subscription', v: `${RS} ${sT.toLocaleString('en-IN')}`, c: AMB_C, bg: AMB_L },
    { l: 'Donations', v: `${RS} ${dT.toLocaleString('en-IN')}`, c: PUR_C, bg: PUR_L },
    { l: 'Grand Total', v: `${RS} ${grand.toLocaleString('en-IN')}`, c: thC, bg: thL },
  ]
  cards.forEach((card, i) => {
    const x = M + i * cw
    doc.setFillColor(...card.bg); doc.roundedRect(x, y, cw - 2, 20, 2, 2, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...card.c)
    doc.text(card.v, x + (cw - 2) / 2, y + 9, { align: 'center' })
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...MID)
    doc.text(card.l, x + (cw - 2) / 2, y + 15, { align: 'center' })
  })
  y += 25

  // ── FY info bar ──
  doc.setFillColor(...thL); doc.roundedRect(M, y, AW, 9, 2, 2, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...thC)
  doc.text('Financial Year: 01 Apr 2026 \u2013 31 Mar 2027', M + 5, y + 6)
  doc.text(`Report Date: ${fmtDate(todayStr())}`, PW - M - 5, y + 6, { align: 'right' })
  y += 14

  // ── Section 1: Subscription ──
  y = drawSection(doc, `Section 1 \u2014 ${grp} Monthly Subscription`,
    `${subs.length} members  |  ${RS} ${sT.toLocaleString('en-IN')}`,
    subs, thC, thL, AMB_C, true, y, M, AW, PW)

  if (y > 240) { doc.addPage(); y = 20 }

  // ── Section 2: Donations ──
  y = drawSection(doc, `Section 2 \u2014 ${grp} Donations`,
    `${dons.length} donors  |  ${RS} ${dT.toLocaleString('en-IN')}`,
    dons, PUR_C, PUR_L, PUR_C, false, y, M, AW, PW)

  if (y > 258) { doc.addPage(); y = 20 }

  // ── Grand total ──
  doc.setFillColor(...PUR_L); doc.roundedRect(M, y, AW, 22, 3, 3, 'F')
  doc.setDrawColor(...PUR_C); doc.setLineWidth(0.8); doc.line(M, y, M + AW, y)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...PUR_C)
  doc.text(`${grp} GROUP \u2014 GRAND TOTAL`, M + 8, y + 9)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MID)
  doc.text(`Subscription ${RS} ${sT.toLocaleString('en-IN')}  +  Donation ${RS} ${dT.toLocaleString('en-IN')}`, M + 8, y + 16)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(...PUR_C)
  doc.text(`${RS} ${grand.toLocaleString('en-IN')}`, PW - M - 8, y + 14, { align: 'right' })
  y += 27

  // ── Non-SH note ──
  const ns = base.filter(e => e.nonSH)
  if (ns.length) {
    if (y > 272) { doc.addPage(); y = 20 }
    doc.setFillColor(...RED_L); doc.roundedRect(M, y, AW, 10, 2, 2, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...RED_C)
    doc.text('Non-shareholder donors:', M + 5, y + 6.5)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...DK)
    doc.text(ns.map(e => e.name).join(', ').slice(0, 120), M + 50, y + 6.5)
  }

  // ── Payment legend ──
  y += 16
  if (y > 272) { doc.addPage(); y = 20 }
  const legend = [
    { label: 'NCVS Acc Transfer', bg: AMB_L, c: AMB_C },
    { label: 'GPay Mathai K M', bg: [234,243,222], c: [39,80,10] },
    { label: 'By Hand / Cash', bg: BG, c: DK },
    { label: 'Other / Custom', bg: [230,241,251], c: NRI_C },
  ]
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...MID)
  doc.text('PAYMENT METHOD LEGEND', M, y)
  y += 5
  const lw = AW / 4
  legend.forEach((item, i) => {
    const x = M + i * lw
    doc.setFillColor(...item.bg); doc.roundedRect(x, y, lw - 3, 8, 1.5, 1.5, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...item.c)
    doc.text(item.label, x + (lw - 3) / 2, y + 5, { align: 'center' })
  })
}

function drawSection(doc, title, subtitle, rows, hdrC, hdrL, amtC, showPeriod, startY, M, AW, PW) {
  let y = startY

  // Section heading bar
  doc.setFillColor(...hdrC); doc.roundedRect(M, y, AW, 12, 2, 2, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(255, 255, 255)
  doc.text(title, M + 6, y + 7.5)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(220, 240, 255)
  doc.text(subtitle, PW - M - 6, y + 7.5, { align: 'right' })
  y += 14

  if (!rows.length) {
    doc.setFontSize(9); doc.setTextColor(...MID)
    doc.text('No entries for this period.', M, y + 6)
    return y + 12
  }

  doc.autoTable({
    startY: y,
    margin: { left: M, right: M },
    head: [[
      { content: 'Sl', styles: { halign: 'center' } },
      'Name',
      ...(showPeriod ? ['Period'] : []),
      { content: 'Date Received', styles: { halign: 'center' } },
      { content: 'Receipt No', styles: { halign: 'center' } },
      'Payment Method',
      'Transaction ID',
      { content: 'Amount', styles: { halign: 'right' } },
    ]],
    body: rows.map((e, i) => [
      { content: i + 1, styles: { halign: 'center' } },
      e.name + (e.nonSH ? ' [NS]' : ''),
      ...(showPeriod ? [e.period || '\u2014'] : []),
      { content: fmtDate(e.date), styles: { halign: 'center', textColor: hdrC, fontStyle: 'bold' } },
      { content: e.receipt || '\u2014', styles: { halign: 'center', fontStyle: 'bold', textColor: hdrC } },
      e.pay || '\u2014',
      e.txn ? e.txn.slice(0, 16) : '\u2014',
      { content: `${RS} ${(e.amount || 0).toLocaleString('en-IN')}`, styles: { halign: 'right', fontStyle: 'bold', textColor: amtC } },
    ]),
    styles: { fontSize: 7.5, cellPadding: 2.8, textColor: DK, lineColor: BD, lineWidth: 0.2 },
    headStyles: { fillColor: hdrC, textColor: W, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: BG },
    columnStyles: showPeriod
      ? { 0:{cellWidth:8}, 1:{cellWidth:40}, 2:{cellWidth:12,halign:'center'}, 3:{cellWidth:22}, 4:{cellWidth:20}, 5:{cellWidth:28}, 6:{cellWidth:22,textColor:MID}, 7:{cellWidth:AW-152,halign:'right'} }
      : { 0:{cellWidth:8}, 1:{cellWidth:48}, 2:{cellWidth:22}, 3:{cellWidth:22}, 4:{cellWidth:30}, 5:{cellWidth:22,textColor:MID}, 6:{cellWidth:AW-152,halign:'right'} },
    foot: [[
      { content: `Total (${rows.length} ${showPeriod ? 'members' : 'donors'})`, colSpan: showPeriod ? 7 : 6, styles: { halign: 'right', fontStyle: 'bold', fillColor: hdrL, textColor: hdrC, fontSize: 9 } },
      { content: `${RS} ${rows.reduce((a,e)=>a+(e.amount||0),0).toLocaleString('en-IN')}`, styles: { halign: 'right', fontStyle: 'bold', fillColor: hdrL, textColor: hdrC, fontSize: 10 } },
    ]],
    showFoot: 'lastPage',
  })

  return doc.lastAutoTable.finalY + 10
}

function addFooters(doc) {
  const n = doc.getNumberOfPages()
  for (let p = 1; p <= n; p++) {
    doc.setPage(p)
    doc.setFillColor(...BG); doc.rect(0, 286, 210, 11, 'F')
    doc.setDrawColor(...BD); doc.setLineWidth(0.4); doc.line(0, 286, 210, 286)
    doc.setFillColor(...GLD); doc.rect(0, 286, 4, 11, 'F')
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...MID)
    doc.text('Niranam Chundan Vallasamithi  |  FY 01 Apr 2026 \u2013 31 Mar 2027  |  Confidential \u2013 Internal Use Only', 13, 293)
    doc.text(`Page ${p} of ${n}`, 197, 293, { align: 'right' })
  }
}

function buildText(grp, subs, dons, sT, dT, grand, pLabel) {
  const RS = 'Rs.'
  let t = `*NIRANAM CHUNDAN VALLASAMITHI*\n`
  t += `*${grp} GROUP REPORT*\n`
  t += `Reg. No. PTM/TC/229/2021\n`
  t += `Period: ${pLabel} \u00b7 FY: 01 Apr 2026 \u2013 31 Mar 2027\n`
  t += `\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\n`

  if (subs.length) {
    t += `*Section 1 \u2014 Monthly Subscription (${subs.length} members)*\n`
    subs.forEach((e, i) => {
      t += `${i + 1}. ${e.name}${e.period ? ' (' + e.period + ')' : ''}${e.nonSH ? ' [Non-SH]' : ''}\n`
      t += `   Date: ${fmtDate(e.date)}  |  Receipt: ${e.receipt || '\u2014'}  |  ${RS} ${(e.amount||0).toLocaleString('en-IN')}\n`
      t += `   Pay: ${e.pay || '\u2014'}${e.txn ? '  |  Txn: ' + e.txn : ''}\n`
    })
    t += `*Subscription Total: ${RS} ${sT.toLocaleString('en-IN')}*\n\n`
  }

  if (dons.length) {
    t += `*Section 2 \u2014 Donations (${dons.length} donors)*\n`
    dons.forEach((e, i) => {
      t += `${i + 1}. ${e.name}${e.nonSH ? ' [Non-SH]' : ''}\n`
      t += `   Date: ${fmtDate(e.date)}  |  Receipt: ${e.receipt || '\u2014'}  |  ${RS} ${(e.amount||0).toLocaleString('en-IN')}\n`
      t += `   Pay: ${e.pay || '\u2014'}${e.txn ? '  |  Txn: ' + e.txn : ''}\n`
    })
    t += `*Donation Total: ${RS} ${dT.toLocaleString('en-IN')}*\n\n`
  }

  if (!subs.length && !dons.length) t += `_No entries for this period_\n\n`

  t += `\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n`
  t += `*${grp} GROUP TOTAL: ${RS} ${grand.toLocaleString('en-IN')}*\n`
  t += `\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n`
  t += `_Niranam, Thiruvalla \u00b7 niranamchundan@gmail.com_`
  return t
}
