import { describe, expect, it } from 'vitest'
import { currentMonthKey, isValidISODate, monthKeyOf, shiftMonth, todayISO } from './dates'

describe('dates', () => {
  it('uses the local calendar date', () => {
    const lateEvening = new Date(2026, 0, 31, 23, 30)
    expect(todayISO(lateEvening)).toBe('2026-01-31')
    expect(currentMonthKey(lateEvening)).toBe('2026-01')
  })

  it('shifts months across year boundaries', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2025-12', 1)).toBe('2026-01')
    expect(shiftMonth('2026-03', -14)).toBe('2025-01')
  })

  it('validates real calendar dates only', () => {
    expect(isValidISODate('2024-02-29')).toBe(true)
    expect(isValidISODate('2025-02-29')).toBe(false)
    expect(isValidISODate('2026-13-01')).toBe(false)
    expect(isValidISODate('2026-1-1')).toBe(false)
    expect(isValidISODate('')).toBe(false)
  })

  it('extracts the month key', () => {
    expect(monthKeyOf('2026-10-06')).toBe('2026-10')
  })
})
