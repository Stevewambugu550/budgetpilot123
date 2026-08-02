export const CURRENCIES = {
  USD: { symbol: '$',   locale: 'en-US' },
  EUR: { symbol: '€',   locale: 'de-DE' },
  GBP: { symbol: '£',   locale: 'en-GB' },
  KES: { symbol: 'KSh', locale: 'en-KE' },
  CAD: { symbol: 'C$',  locale: 'en-CA' },
  AUD: { symbol: 'A$',  locale: 'en-AU' },
}

export const fmtMoney = (amount, currency = 'USD') => {
  const n = Number(amount) || 0
  const c = CURRENCIES[currency] || CURRENCIES.USD
  try {
    return new Intl.NumberFormat(c.locale, {
      style: 'currency', currency, maximumFractionDigits: 0,
    }).format(n)
  } catch {
    return `${c.symbol} ${n.toLocaleString()}`
  }
}

export const fmtDate = (iso) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: '2-digit',
    })
  } catch { return iso }
}

export const ymKey = (iso) => (iso || '').slice(0, 7)         // YYYY-MM
export const monthLabel = (ym) => {
  if (!ym) return ''
  const [y, m] = ym.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
}

export const daysUntil = (iso) => {
  if (!iso) return null
  const diff = (new Date(iso) - new Date()) / (1000 * 60 * 60 * 24)
  return Math.ceil(diff)
}
