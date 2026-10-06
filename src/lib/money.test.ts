import { describe, expect, it } from 'vitest'
import { MAX_AMOUNT_CENTS, centsToInput, formatMoney, parseAmount } from './money'

describe('parseAmount', () => {
  it.each([
    ['12', 1200],
    ['12.5', 1250],
    ['12.05', 1205],
    ['.99', 99],
    ['1,234.56', 123456],
    [' $ 9.99 ', 999],
  ])('parses %j as %i cents', (input, cents) => {
    expect(parseAmount(input)).toBe(cents)
  })

  it.each(['', '.', '0', '0.00', '-5', '1.234', 'abc', '1e3', '12..5'])('rejects %j', (input) => {
    expect(parseAmount(input)).toBeNull()
  })

  it('rejects amounts above the maximum', () => {
    expect(parseAmount(String(MAX_AMOUNT_CENTS / 100 + 1))).toBeNull()
    expect(parseAmount(String(MAX_AMOUNT_CENTS / 100))).toBe(MAX_AMOUNT_CENTS)
  })
})

describe('formatting', () => {
  it('round-trips cents through the input format', () => {
    expect(centsToInput(1205)).toBe('12.05')
    expect(parseAmount(centsToInput(1205))).toBe(1205)
  })

  it('formats signed and negative amounts', () => {
    expect(formatMoney(1250, 'USD')).toMatch(/12\.50/)
    expect(formatMoney(1250, 'USD', { signed: true }).startsWith('+')).toBe(true)
    expect(formatMoney(-1250, 'USD').startsWith('−')).toBe(true)
    expect(formatMoney(0, 'USD', { signed: true }).startsWith('+')).toBe(false)
  })

  it('falls back gracefully for an invalid currency code', () => {
    expect(() => formatMoney(100, 'NOT-A-CODE')).not.toThrow()
  })
})
