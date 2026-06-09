export const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')

export const inr = n => {
  if (!n && n !== 0) return '₹0'
  n = Math.round(Number(n))
  let s = n.toString(), r = s.slice(-3), rest = s.slice(0, -3), p = []
  while (rest.length > 2) { p.push(rest.slice(-2)); rest = rest.slice(0, -2) }
  if (rest) p.push(rest); p.reverse()
  return '₹' + (p.length ? p.join(',') + ',' + r : r)
}

export const fmtDate = d => {
  if (!d) return '—'
  const [y, m, dd] = d.split('-')
  return `${+dd} ${MONTHS[+m - 1]} ${y}`
}

export const todayStr = () => new Date().toISOString().split('T')[0]

export const initials = name =>
  (name || '').split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?'

export const PAY_METHODS = [
  'NCVS Acc Transfer',
  'GPay – Mathai K M (Treasurer)',
  'By Hand (Cash)',
  'Other'
]

export const filterByPeriod = (list, period) => {
  const now = new Date(), td = todayStr()
  const wk  = new Date(now - 7 * 864e5).toISOString().split('T')[0]
  const mo  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  if (period === 'day')   return list.filter(e => e.date === td)
  if (period === 'week')  return list.filter(e => e.date >= wk)
  if (period === 'month') return list.filter(e => e.date >= mo)
  return list
}

// Colors
export const C = {
  hdr:    '#085041', hdrAcc: '#1D9E75', hdrLt: '#E1F5EE',
  nri:    '#0C447C', nriLt:  '#E6F1FB',
  ker:    '#085041', kerLt:  '#E1F5EE',
  pur:    '#3C3489', purLt:  '#EEEDFE',
  amb:    '#633806', ambLt:  '#FAEEDA',
  grn:    '#27500A', grnLt:  '#EAF3DE',
  gld:    '#BA7517', gldLt:  '#FFF8E1',
  red:    '#A32D2D', redLt:  '#FCEBEB',
  bg:     '#F1EFE8', bd:     '#D3D1C7',
  mid:    '#888780', dk:     '#2C2C2A',
  white:  '#ffffff',
}

export const groupStyle = g => g === 'NRI'
  ? { bg: C.nriLt, color: C.nri }
  : { bg: C.kerLt, color: C.ker }
