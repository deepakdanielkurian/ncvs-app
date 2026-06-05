export const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')

export const inr = n => {
  if (!n) return '₹0'
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
  name.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?'

export const GROUP_COLORS = {
  NRI:    { bg: '#E6F1FB', text: '#0C447C' },
  Kerala: { bg: '#E1F5EE', text: '#085041' }
}

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
