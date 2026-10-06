/** Largest amount accepted for a single transaction or budget: 1 billion. */
export const MAX_AMOUNT_CENTS = 100_000_000_000

export const CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
  'NZD',
  'JPY',
  'INR',
  'CHF',
  'SEK',
  'MXN',
  'BRL',
  'ZAR',
  'SGD',
] as const

/**
 * Parses user-entered text such as "12", "1,234.5" or "$ 9.99" into a whole
 * number of cents. Returns `null` for anything that isn't a positive amount
 * with at most two decimal places.
 */
export function parseAmount(input: string): number | null {
  const cleaned = input.trim().replace(/[\s,$€£¥₹]/g, '')
  if (!/^\d*(\.\d{0,2})?$/.test(cleaned) || cleaned === '' || cleaned === '.') {
    return null
  }
  const [whole = '0', fraction = ''] = cleaned.split('.')
  const cents = Number(whole || '0') * 100 + Number(fraction.padEnd(2, '0'))
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > MAX_AMOUNT_CENTS) {
    return null
  }
  return cents
}

/** Formats cents for an `<input>` value, e.g. 1250 -> "12.50". */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2)
}

const formatters = new Map<string, Intl.NumberFormat>()

function formatterFor(currency: string, compact: boolean): Intl.NumberFormat {
  const key = `${currency}:${compact}`
  let fmt = formatters.get(key)
  if (!fmt) {
    try {
      fmt = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        ...(compact ? { notation: 'compact', maximumFractionDigits: 1 } : {}),
      })
    } catch {
      fmt = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' })
    }
    formatters.set(key, fmt)
  }
  return fmt
}

export function formatMoney(
  cents: number,
  currency: string,
  options: { signed?: boolean; compact?: boolean } = {},
): string {
  const text = formatterFor(currency, options.compact ?? false).format(Math.abs(cents) / 100)
  if (cents < 0) return `−${text}`
  if (options.signed && cents > 0) return `+${text}`
  return text
}

/** The symbol a currency is written with in the user's locale, e.g. "$" or "€". */
export function currencySymbol(currency: string): string {
  const part = formatterFor(currency, false)
    .formatToParts(0)
    .find((p) => p.type === 'currency')
  return part?.value ?? currency
}
