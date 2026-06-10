import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { C, inr, fmtDate, filterByPeriod, todayStr } from '../utils/helpers'

const RS = 'Rs.'

const PERIOD_OPTS = [
  ['all',   'Full FY 2026\u201327'],
  ['month', 'This month'],
  ['week',  'This week'],
  ['day',   'Today'],
]

// ── PDF colour constants ────────────────────────
const HDR   = [8,80,65];    const GLD   = [186,117,23]
const NRI_C = [12,68,124];  const NRI_L = [230,241,251]
const KER_C = [8,80,65];    const KER_L = [225,245,238]
const PUR_C = [60,52,137];  const PUR_L = [238,237,254]
const AMB_C = [99,56,6];    const AMB_L = [250,238,218]
const RED_C = [163,45,45];  const RED_L = [252,235,235]
const MID   = [136,135,128]; const DK = [44,44,42]
const BG    = [241,239,232]; const BD = [211,209,199]
const W255  = [255,255,255]

export default function Report() {
  const { entries, showToast } = useApp()
  const [period, setPeriod] = useState('all')
  const [busy,   setBusy]   = useState(null) // track which button is busy

  const pLabel = PERIOD_OPTS.find(([k]) => k === period)?.[1] || 'Full FY'

  // ── Compute all group/type slices ──
  const base = p => filterByPeriod(entries, p)

  const slice = (grp, type, p) => {
    let list = base(p)
    if (grp   !== 'Both') list = list.filter(e => e.group === grp)
    if (type  !== 'Both') list = list.filter(e => e.type  === type)
    return list
  }

  const nriSubs = slice('NRI',    'Subscription', period)
  const nriDons = slice('NRI',    'Donation',      period)
  const kerSubs = slice('Kerala', 'Subscription', period)
  const kerDons = slice('Kerala', 'Donation',      period)
  const nriAll  = [...nriSubs, ...nriDons]
  const kerAll  = [...kerSubs, ...kerDons]

  const tot = arr => arr.reduce((a,e) => a + (e.amount||0), 0)

  // ── Download handlers ──
  const download = async (key, grp, type, label, rows, subRows, donRows) => {
    setBusy(key)
    await new Promise(r => setTimeout(r, 60))
    try {
      const { default: jsPDF } = await import('jspdf')
      await import('jspdf-autotable')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      buildPDF(doc, grp, type, label, rows, subRows, donRows, pLabel)
      addFooters(doc)
      doc.save(`NCVS_${grp}_${type}_Report_FY2026-27.pdf`)
      showToast(`\u2705 ${label} PDF downloaded!`)
    } catch (e) { console.error(e); showToast('\u274c PDF failed: ' + e.message) }
    setBusy(null)
  }

  const copyTxt = (grp, type, label, rows, subRows, donRows) => {
    const txt = buildText(grp, type, label, rows, subRows, donRows, pLabel)
    navigator.clipboard?.writeText(txt)
      .then(() => showToast(`\u2705 ${label} report copied!`))
      .catch(() => showToast('\u274c Copy failed'))
  }

  // ── Report cards config ──
  const reportCards = [
    // NRI
    {
      key: 'nri-sub', grp: 'NRI', type: 'Subscription',
      label: 'NRI \u2014 Subscription', icon: 'ti-file-text',
      thC: C.nri, thL: C.nriLt,
      stats: [
        { label: 'Members',      value: nriSubs.length },
        { label: 'Total',        value: inr(tot(nriSubs)), big: true },
      ],
      rows: nriSubs, subRows: null, donRows: null,
    },
    {
      key: 'nri-don', grp: 'NRI', type: 'Donation',
      label: 'NRI \u2014 Donations', icon: 'ti-heart',
      thC: C.pur, thL: C.purLt,
      stats: [
        { label: 'Donors',  value: nriDons.length },
        { label: 'Total',   value: inr(tot(nriDons)), big: true },
      ],
      rows: nriDons, subRows: null, donRows: null,
    },
    {
      key: 'nri-both', grp: 'NRI', type: 'Combined',
      label: 'NRI \u2014 Combined', icon: 'ti-files',
      thC: C.nri, thL: C.nriLt,
      stats: [
        { label: 'Sub',     value: inr(tot(nriSubs)) },
        { label: 'Donation',value: inr(tot(nriDons)) },
        { label: 'Total',   value: inr(tot(nriAll)), big: true },
      ],
      rows: nriAll, subRows: nriSubs, donRows: nriDons,
    },
    // Kerala
    {
      key: 'ker-sub', grp: 'Kerala', type: 'Subscription',
      label: 'Kerala \u2014 Subscription', icon: 'ti-file-text',
      thC: C.ker, thL: C.kerLt,
      stats: [
        { label: 'Members', value: kerSubs.length },
        { label: 'Total',   value: inr(tot(kerSubs)), big: true },
      ],
      rows: kerSubs, subRows: null, donRows: null,
    },
    {
      key: 'ker-don', grp: 'Kerala', type: 'Donation',
      label: 'Kerala \u2014 Donations', icon: 'ti-heart',
      thC: C.grn, thL: C.grnLt,
      stats: [
        { label: 'Donors', value: kerDons.length },
        { label: 'Total',  value: inr(tot(kerDons)), big: true },
      ],
      rows: kerDons, subRows: null, donRows: null,
    },
    {
      key: 'ker-both', grp: 'Kerala', type: 'Combined',
      label: 'Kerala \u2014 Combined', icon: 'ti-files',
      thC: C.ker, thL: C.kerLt,
      stats: [
        { label: 'Sub',      value: inr(tot(kerSubs)) },
        { label: 'Donation', value: inr(tot(kerDons)) },
        { label: 'Total',    value: inr(tot(kerAll)), big: true },
      ],
      rows: kerAll, subRows: kerSubs, donRows: kerDons,
    },
  ]

  return (
    <div style={{ padding: '14px 14px', maxWidth: 430, margin: '0 auto' }}>

      {/* Period */}
      <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${C.bd}`, padding: '13px 14px', marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 9 }}>
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
              fontSize: 10, fontWeight: 600, cursor: 'pointer', lineHeight: 1.3,
            }}>
              {k === 'all' ? 'Full FY' : v.replace('This ', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Report cards */}
      <div style={{ fontSize: 12, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>
        Select report to download or copy
      </div>

      {reportCards.map(card => (
        <ReportCard
          key={card.key}
          card={card}
          period={pLabel}
          isBusy={busy === card.key}
          onDownload={() => download(card.key, card.grp, card.type, card.label, card.rows, card.subRows, card.donRows)}
          onCopy={() => copyTxt(card.grp, card.type, card.label, card.rows, card.subRows, card.donRows)}
        />
      ))}

    </div>
  )
}

// ── Report Card ─────────────────────────────────
function ReportCard({ card, period, isBusy, onDownload, onCopy }) {
  const [expanded, setExpanded] = useState(false)
  const tot = card.rows.reduce((a,e) => a+(e.amount||0), 0)

  return (
    <div style={{
      background: '#fff', borderRadius: 12,
      border: `1.5px solid ${card.thC}20`,
      marginBottom: 10, overflow: 'hidden',
    }}>
      {/* Card header */}
      <div style={{
        background: `linear-gradient(135deg, ${card.thC} 0%, ${card.thC}cc 100%)`,
        padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <i className={`ti ${card.icon}`} style={{ fontSize: 22, color: 'rgba(255,255,255,.85)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{card.label}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>{period}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{inr(tot)}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.7)', marginTop: 1 }}>{card.rows.length} entries</div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.bd}` }}>
        {card.stats.map((s, i) => (
          <div key={i} style={{
            flex: 1, padding: '8px 10px', textAlign: 'center',
            borderRight: i < card.stats.length - 1 ? `1px solid ${C.bd}` : 'none',
            background: s.big ? card.thL : '#fff',
          }}>
            <div style={{ fontSize: s.big ? 14 : 13, fontWeight: 700, color: s.big ? card.thC : C.dk }}>
              {s.value}
            </div>
            <div style={{ fontSize: 9, color: C.mid, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Preview toggle */}
      <button onClick={() => setExpanded(p => !p)} style={{
        width: '100%', padding: '8px 14px',
        background: C.bg, border: 'none',
        borderBottom: expanded ? `1px solid ${C.bd}` : 'none',
        color: C.mid, fontSize: 11, fontWeight: 600, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
      }}>
        <i className={`ti ti-chevron-${expanded ? 'up' : 'down'}`} style={{ fontSize: 14 }} />
        {expanded ? 'Hide preview' : 'Show preview'}
      </button>

      {/* Inline preview */}
      {expanded && (
        <PreviewTable card={card} />
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 14px', background: '#fff' }}>
        <button onClick={onDownload} disabled={isBusy} style={{
          flex: 2, padding: '10px 8px',
          background: isBusy ? C.mid : card.thC,
          color: '#fff', border: 'none', borderRadius: 8,
          fontSize: 12, fontWeight: 700, cursor: isBusy ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        }}>
          {isBusy
            ? <><span style={{ width:14,height:14,border:'2px solid rgba(255,255,255,.4)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style> Generating…</>
            : <><i className="ti ti-file-download" style={{ fontSize: 16 }} /> Download PDF</>
          }
        </button>
        <button onClick={onCopy} style={{
          flex: 1, padding: '10px 8px',
          background: '#fff', color: C.dk,
          border: `1px solid ${C.bd}`, borderRadius: 8,
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        }}>
          <i className="ti ti-copy" style={{ fontSize: 16, color: C.mid }} /> Copy
        </button>
      </div>
    </div>
  )
}

// ── Inline preview table ─────────────────────────
function PreviewTable({ card }) {
  const isCombined = card.type === 'Combined'

  if (isCombined) {
    return (
      <div>
        <PreviewSection
          label={`Subscription (${card.subRows.length})`}
          rows={card.subRows}
          color={card.thC}
          amtColor={C.amb}
          showPeriod
        />
        <div style={{ height: 1, background: C.bd }} />
        <PreviewSection
          label={`Donations (${card.donRows.length})`}
          rows={card.donRows}
          color={C.pur}
          amtColor={C.pur}
        />
      </div>
    )
  }

  return (
    <PreviewSection
      label={`${card.rows.length} entries`}
      rows={card.rows}
      color={card.thC}
      amtColor={card.type === 'Subscription' ? C.amb : C.pur}
      showPeriod={card.type === 'Subscription'}
    />
  )
}

function PreviewSection({ label, rows, color, amtColor, showPeriod }) {
  if (!rows.length) return (
    <div style={{ padding: '12px 14px', fontSize: 12, color: C.mid, textAlign: 'center' }}>
      No entries
    </div>
  )
  return (
    <div>
      <div style={{ padding: '6px 14px', background: color + '18', fontSize: 10, fontWeight: 700, color, borderBottom: `1px solid ${C.bd}` }}>
        {label}
      </div>
      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 72px 56px 52px', padding: '5px 14px', background: C.bg, borderBottom: `1px solid ${C.bd}` }}>
        {['#', 'Name', 'Date', 'Receipt', 'Amount'].map(h => (
          <div key={h} style={{ fontSize: 8, fontWeight: 700, color: C.mid, textAlign: h === 'Amount' ? 'right' : h === '#' ? 'center' : 'left', textTransform: 'uppercase' }}>{h}</div>
        ))}
      </div>
      {rows.map((e, i) => (
        <div key={e.id} style={{
          display: 'grid', gridTemplateColumns: '24px 1fr 72px 56px 52px',
          padding: '6px 14px',
          background: i % 2 === 0 ? '#fff' : '#FAFAF8',
          borderBottom: i < rows.length - 1 ? `1px solid ${C.bd}` : 'none',
          alignItems: 'start',
        }}>
          <div style={{ fontSize: 9, color: C.mid, textAlign: 'center', paddingTop: 1 }}>{i + 1}</div>
          <div style={{ paddingRight: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.dk, lineHeight: 1.3 }}>
              {e.name}{e.nonSH && <span style={{ color: C.red, fontSize: 8 }}> [NS]</span>}
            </div>
            {showPeriod && e.period && <div style={{ fontSize: 9, color: C.mid }}>{e.period}</div>}
            {e.pay && <div style={{ fontSize: 9, color: C.mid }}>{e.pay}</div>}
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color }}>
            {fmtDate(e.date)}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color }}>
            {e.receipt || '\u2014'}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: amtColor, textAlign: 'right' }}>
            {inr(e.amount)}
          </div>
        </div>
      ))}
      {/* Section total */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 14px', background: color + '12', borderTop: `1.5px solid ${color}30` }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.mid }}>{rows.length} entries</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{inr(rows.reduce((a,e)=>a+(e.amount||0),0))}</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// PDF builder
// ─────────────────────────────────────────────
function buildPDF(doc, grp, type, label, rows, subRows, donRows, pLabel) {
  const PW = 210, M = 13, AW = 184
  const thC = grp === 'NRI' ? NRI_C : (type === 'Donation' ? PUR_C : KER_C)
  const thL = grp === 'NRI' ? NRI_L : (type === 'Donation' ? PUR_L : KER_L)
  const isCombined = type === 'Combined'
  const total = rows.reduce((a,e)=>a+(e.amount||0),0)

  // ── Header ──
  doc.setFillColor(...HDR); doc.rect(0, 0, PW, 32, 'F')
  doc.setFillColor(...GLD); doc.rect(0, 0, 4, 32, 'F')
  doc.setFillColor(29,158,117); doc.rect(0, 32, PW, 1.5, 'F')

  doc.setFont('helvetica','bold'); doc.setFontSize(13.5); doc.setTextColor(...W255)
  doc.text('NIRANAM CHUNDAN VALLASAMITHI', M+2, 11)
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(159,225,203)
  doc.text('Reg. No. PTM/TC/229/2021  |  niranamchundan@gmail.com', M+2, 17.5)
  doc.text('Niranam P.O., Thiruvalla, Pathanamthitta, Kerala \u2013 689621', M+2, 23)

  doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(225,245,238)
  doc.text(label.toUpperCase(), PW-M, 11, { align:'right' })
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(159,225,203)
  doc.text('Financial Year: 01 Apr 2026 \u2013 31 Mar 2027', PW-M, 17.5, { align:'right' })
  doc.text(`Period: ${pLabel}  |  Date: ${fmtDate(todayStr())}`, PW-M, 23, { align:'right' })
  doc.text('Prepared by: Secretary, NCVS', PW-M, 28.5, { align:'right' })

  let y = 38

  // ── Summary cards ──
  if (isCombined) {
    const subTot = subRows.reduce((a,e)=>a+(e.amount||0),0)
    const donTot = donRows.reduce((a,e)=>a+(e.amount||0),0)
    const cw = AW / 4
    const cards = [
      { l:'Members',     v: String(subRows.length), c:thC, bg:thL },
      { l:'Subscription',v: `${RS} ${subTot.toLocaleString('en-IN')}`, c:AMB_C, bg:AMB_L },
      { l:'Donations',   v: `${RS} ${donTot.toLocaleString('en-IN')}`, c:PUR_C, bg:PUR_L },
      { l:'Grand Total', v: `${RS} ${total.toLocaleString('en-IN')}`,  c:thC,   bg:thL  },
    ]
    cards.forEach((card, i) => {
      const x = M + i*cw
      doc.setFillColor(...card.bg); doc.roundedRect(x, y, cw-2, 20, 2, 2, 'F')
      doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...card.c)
      doc.text(card.v, x+(cw-2)/2, y+9, { align:'center' })
      doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...MID)
      doc.text(card.l, x+(cw-2)/2, y+15, { align:'center' })
    })
  } else {
    const cw = AW / 3
    const cards = [
      { l: type==='Subscription'?'Members':'Donors', v: String(rows.length), c:thC, bg:thL },
      { l: 'Total', v: `${RS} ${total.toLocaleString('en-IN')}`, c:thC, bg:thL },
      { l: 'Report', v: type, c:thC, bg:thL },
    ]
    cards.forEach((card, i) => {
      const x = M + i*cw
      doc.setFillColor(...card.bg); doc.roundedRect(x, y, cw-2, 20, 2, 2, 'F')
      doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...card.c)
      doc.text(card.v, x+(cw-2)/2, y+9, { align:'center' })
      doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...MID)
      doc.text(card.l, x+(cw-2)/2, y+15, { align:'center' })
    })
  }
  y += 25

  // ── FY bar ──
  doc.setFillColor(...thL); doc.roundedRect(M, y, AW, 9, 2, 2, 'F')
  doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...thC)
  doc.text('Financial Year: 01 Apr 2026 \u2013 31 Mar 2027', M+5, y+6)
  doc.text(`Report Date: ${fmtDate(todayStr())}`, PW-M-5, y+6, { align:'right' })
  y += 14

  if (isCombined) {
    // Draw subscription section then donation section
    y = drawSection(doc, `${grp} \u2014 Monthly Subscription`,
      `${subRows.length} members  |  ${RS} ${subRows.reduce((a,e)=>a+(e.amount||0),0).toLocaleString('en-IN')}`,
      subRows, thC, thL, AMB_C, true, y, M, AW, PW)

    if (y > 240) { doc.addPage(); y = 20 }

    y = drawSection(doc, `${grp} \u2014 Donations`,
      `${donRows.length} donors  |  ${RS} ${donRows.reduce((a,e)=>a+(e.amount||0),0).toLocaleString('en-IN')}`,
      donRows, PUR_C, PUR_L, PUR_C, false, y, M, AW, PW)

    if (y > 255) { doc.addPage(); y = 20 }

    // Grand total
    const subTot = subRows.reduce((a,e)=>a+(e.amount||0),0)
    const donTot = donRows.reduce((a,e)=>a+(e.amount||0),0)
    doc.setFillColor(...PUR_L); doc.roundedRect(M, y, AW, 22, 3, 3, 'F')
    doc.setDrawColor(...PUR_C); doc.setLineWidth(0.8); doc.line(M, y, M+AW, y)
    doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(...PUR_C)
    doc.text(`${grp} \u2014 GRAND TOTAL`, M+8, y+9)
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...MID)
    doc.text(`Subscription ${RS} ${subTot.toLocaleString('en-IN')}  +  Donation ${RS} ${donTot.toLocaleString('en-IN')}`, M+8, y+16)
    doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(...PUR_C)
    doc.text(`${RS} ${total.toLocaleString('en-IN')}`, PW-M-8, y+14, { align:'right' })

  } else {
    // Single section
    const isSub = type === 'Subscription'
    y = drawSection(doc,
      `${grp} \u2014 ${type}`,
      `${rows.length} ${isSub?'members':'donors'}  |  ${RS} ${total.toLocaleString('en-IN')}`,
      rows, thC, thL, isSub ? AMB_C : PUR_C, isSub, y, M, AW, PW)

    if (y > 255) { doc.addPage(); y = 20 }

    // Total box
    doc.setFillColor(...thL); doc.roundedRect(M, y, AW, 18, 3, 3, 'F')
    doc.setDrawColor(...thC); doc.setLineWidth(0.8); doc.line(M, y, M+AW, y)
    doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(...thC)
    doc.text(`${grp} ${type} \u2014 Total`, M+8, y+8)
    doc.setFontSize(14)
    doc.text(`${RS} ${total.toLocaleString('en-IN')}`, PW-M-8, y+12, { align:'right' })
  }

  // Non-SH note
  const ns = rows.filter(e => e.nonSH)
  if (ns.length) {
    y += 24
    if (y > 272) { doc.addPage(); y = 20 }
    doc.setFillColor(...RED_L); doc.roundedRect(M, y, AW, 10, 2, 2, 'F')
    doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...RED_C)
    doc.text('Non-shareholder:', M+5, y+6.5)
    doc.setFont('helvetica','normal'); doc.setTextColor(...DK)
    doc.text(ns.map(e=>e.name).join(', ').slice(0,120), M+42, y+6.5)
  }
}

function drawSection(doc, title, subtitle, rows, hdrC, hdrL, amtC, showPeriod, startY, M, AW, PW) {
  let y = startY

  doc.setFillColor(...hdrC); doc.roundedRect(M, y, AW, 12, 2, 2, 'F')
  doc.setFont('helvetica','bold'); doc.setFontSize(10.5); doc.setTextColor(255,255,255)
  doc.text(title, M+6, y+7.5)
  doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(220,240,255)
  doc.text(subtitle, PW-M-6, y+7.5, { align:'right' })
  y += 14

  if (!rows.length) {
    doc.setFontSize(9); doc.setTextColor(...MID)
    doc.text('No entries for this period.', M, y+6)
    return y + 12
  }

  const cols = showPeriod
    ? ['Sl','Name','Period','Date Received','Receipt No','Payment Method','Txn ID','Amount']
    : ['Sl','Donor Name','Date Received','Receipt No','Payment Method','Txn ID','Amount']

  doc.autoTable({
    startY: y,
    margin: { left: M, right: M },
    head: [cols.map((c,i) => ({
      content: c,
      styles: {
        halign: c === 'Amount' ? 'right' : (c === 'Sl' || c === 'Date Received' || c === 'Receipt No') ? 'center' : 'left'
      }
    }))],
    body: rows.map((e, i) => [
      { content: i+1, styles:{ halign:'center' } },
      e.name + (e.nonSH ? ' [NS]' : ''),
      ...(showPeriod ? [e.period||'\u2014'] : []),
      { content: fmtDate(e.date), styles:{ halign:'center', textColor:hdrC, fontStyle:'bold' } },
      { content: e.receipt||'\u2014', styles:{ halign:'center', fontStyle:'bold', textColor:hdrC } },
      e.pay||'\u2014',
      e.txn ? e.txn.slice(0,16) : '\u2014',
      { content:`${RS} ${(e.amount||0).toLocaleString('en-IN')}`, styles:{ halign:'right', fontStyle:'bold', textColor:amtC } },
    ]),
    styles:{ fontSize:7.5, cellPadding:2.8, textColor:DK, lineColor:BD, lineWidth:0.2 },
    headStyles:{ fillColor:hdrC, textColor:W255, fontStyle:'bold', fontSize:8 },
    alternateRowStyles:{ fillColor:BG },
    columnStyles: showPeriod
      ? { 0:{cellWidth:8}, 1:{cellWidth:38}, 2:{cellWidth:12}, 3:{cellWidth:22}, 4:{cellWidth:20}, 5:{cellWidth:28}, 6:{cellWidth:20,textColor:MID}, 7:{cellWidth:AW-148,halign:'right'} }
      : { 0:{cellWidth:8}, 1:{cellWidth:46}, 2:{cellWidth:22}, 3:{cellWidth:20}, 4:{cellWidth:30}, 5:{cellWidth:20,textColor:MID}, 6:{cellWidth:AW-146,halign:'right'} },
    foot:[[
      { content:`Total (${rows.length} ${showPeriod?'members':'donors'})`, colSpan: cols.length-1, styles:{ halign:'right', fontStyle:'bold', fillColor:hdrL, textColor:hdrC, fontSize:9 } },
      { content:`${RS} ${rows.reduce((a,e)=>a+(e.amount||0),0).toLocaleString('en-IN')}`, styles:{ halign:'right', fontStyle:'bold', fillColor:hdrL, textColor:hdrC, fontSize:10 } },
    ]],
    showFoot:'lastPage',
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
    doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(...MID)
    doc.text('Niranam Chundan Vallasamithi  |  FY 01 Apr 2026 \u2013 31 Mar 2027  |  Confidential', 13, 293)
    doc.text(`Page ${p} of ${n}`, 197, 293, { align:'right' })
  }
}

function buildText(grp, type, label, rows, subRows, donRows, pLabel) {
  const isCombined = type === 'Combined'
  const total = rows.reduce((a,e)=>a+(e.amount||0),0)
  let t = `*NIRANAM CHUNDAN VALLASAMITHI*\n`
  t += `*${label.toUpperCase()} REPORT*\n`
  t += `Reg. No. PTM/TC/229/2021\n`
  t += `Period: ${pLabel} \u00b7 FY: 01 Apr 2026 \u2013 31 Mar 2027\n`
  t += `${'━'.repeat(25)}\n\n`

  if (isCombined) {
    t += `*Subscription (${subRows.length} members)*\n`
    subRows.forEach((e,i) => {
      t += `${i+1}. ${e.name}${e.period?' ('+e.period+')':''}${e.nonSH?' [Non-SH]':''}\n`
      t += `   Date: ${fmtDate(e.date)}  |  Receipt: ${e.receipt||'\u2014'}  |  Rs. ${(e.amount||0).toLocaleString('en-IN')}\n`
      if(e.pay) t += `   Pay: ${e.pay}${e.txn?'  |  Txn: '+e.txn:''}\n`
    })
    t += `*Sub Total: Rs. ${subRows.reduce((a,e)=>a+(e.amount||0),0).toLocaleString('en-IN')}*\n\n`

    t += `*Donations (${donRows.length} donors)*\n`
    donRows.forEach((e,i) => {
      t += `${i+1}. ${e.name}${e.nonSH?' [Non-SH]':''}\n`
      t += `   Date: ${fmtDate(e.date)}  |  Receipt: ${e.receipt||'\u2014'}  |  Rs. ${(e.amount||0).toLocaleString('en-IN')}\n`
      if(e.pay) t += `   Pay: ${e.pay}${e.txn?'  |  Txn: '+e.txn:''}\n`
    })
    t += `*Donation Total: Rs. ${donRows.reduce((a,e)=>a+(e.amount||0),0).toLocaleString('en-IN')}*\n\n`
  } else {
    const isSub = type === 'Subscription'
    rows.forEach((e,i) => {
      t += `${i+1}. ${e.name}${isSub&&e.period?' ('+e.period+')':''}${e.nonSH?' [Non-SH]':''}\n`
      t += `   Date: ${fmtDate(e.date)}  |  Receipt: ${e.receipt||'\u2014'}  |  Rs. ${(e.amount||0).toLocaleString('en-IN')}\n`
      if(e.pay) t += `   Pay: ${e.pay}${e.txn?'  |  Txn: '+e.txn:''}\n`
    })
    t += '\n'
  }

  t += `${'━'.repeat(25)}\n`
  t += `*${label} Total: Rs. ${total.toLocaleString('en-IN')}*\n`
  t += `${'━'.repeat(25)}\n`
  t += `_Niranam, Thiruvalla \u00b7 niranamchundan@gmail.com_`
  return t
}
