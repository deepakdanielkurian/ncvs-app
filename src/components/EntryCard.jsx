import { C, inr, fmtDate, initials, groupStyle } from '../utils/helpers'

export default function EntryCard({ entry: e, onEdit, onDelete }) {
  const gs = groupStyle(e.group)
  return (
    <div style={{
      background: '#fff', borderRadius: 10,
      border: `1px solid ${C.bd}`,
      padding: '11px 13px', marginBottom: 8,
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Avatar */}
        <div style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: gs.bg, color: gs.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700,
        }}>
          {initials(e.name)}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.dk, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {e.name}
            {e.nonSH && <span style={{ color: C.red, fontSize: 9, marginLeft: 5 }}>[Non-SH]</span>}
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 3 }}>
            <Badge bg={gs.bg} color={gs.color}>{e.group}</Badge>
            <Badge bg={e.type === 'Subscription' ? C.ambLt : C.purLt}
                   color={e.type === 'Subscription' ? C.amb : C.pur}>
              {e.type}{e.period ? ' · ' + e.period : ''}
            </Badge>
            {e.pay && <Badge bg={C.bg} color={C.mid} border>{e.pay}</Badge>}
          </div>
          <div style={{ fontSize: 10.5, color: C.mid, marginTop: 3, lineHeight: 1.5 }}>
            <i className="ti ti-calendar" style={{ fontSize: 11, marginRight: 3 }} />
            <b>{fmtDate(e.date)}</b>
            &nbsp;·&nbsp;
            <i className="ti ti-receipt" style={{ fontSize: 11, marginRight: 3 }} />
            <b>Rcpt: {e.receipt || '—'}</b>
            {e.txn && <>&nbsp;·&nbsp;Txn: {e.txn.slice(0, 14)}{e.txn.length > 14 ? '…' : ''}</>}
            {e.note && <><br />{e.note}</>}
          </div>
        </div>

        {/* Amount */}
        <div style={{
          fontSize: 15, fontWeight: 700, flexShrink: 0,
          color: e.type === 'Subscription' ? C.amb : C.pur,
        }}>
          {inr(e.amount)}
        </div>
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex', gap: 6,
        marginTop: 9, paddingTop: 9,
        borderTop: `1px solid ${C.bd}`,
      }}>
        <ActionBtn icon="ti-pencil" label="Edit" onClick={onEdit}
          bg={C.gldLt} color={C.gld} />
        <ActionBtn icon="ti-trash" label="Delete" onClick={onDelete}
          bg={C.redLt} color={C.red} />
      </div>
    </div>
  )
}

function Badge({ children, bg, color, border }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 9, fontWeight: 600,
      padding: '2px 5px', borderRadius: 4,
      background: bg, color,
      border: border ? `1px solid ${color}30` : 'none',
    }}>
      {children}
    </span>
  )
}

function ActionBtn({ icon, label, onClick, bg, color }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 5, padding: '7px 4px',
      border: `1px solid ${color}40`, borderRadius: 8,
      background: bg, color,
      fontSize: 12, fontWeight: 600, cursor: 'pointer',
    }}>
      <i className={`ti ${icon}`} style={{ fontSize: 14 }} />
      {label}
    </button>
  )
}
