import type { MonthKey } from '../types'

const pad = (n: number) => String(n).padStart(2, '0')

/** Today's local date as `YYYY-MM-DD` (not UTC, so late-evening entries land on the right day). */
export function todayISO(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function currentMonthKey(now: Date = new Date()): MonthKey {
  return todayISO(now).slice(0, 7)
}

export function monthKeyOf(isoDate: string): MonthKey {
  return isoDate.slice(0, 7)
}

export function isValidISODate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const [, y, m, d] = match.map(Number) as [number, number, number, number]
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

export function shiftMonth(key: MonthKey, delta: number): MonthKey {
  const [y, m] = key.split('-').map(Number) as [number, number]
  const date = new Date(y, m - 1 + delta, 1)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

function monthDate(key: MonthKey): Date {
  const [y, m] = key.split('-').map(Number) as [number, number]
  return new Date(y, m - 1, 1)
}

/** `long`: "October 2026", `medium`: "Oct 2026", `short`: "Oct". */
export function formatMonth(key: MonthKey, style: 'long' | 'medium' | 'short' = 'long'): string {
  return monthDate(key).toLocaleDateString(undefined, {
    month: style === 'long' ? 'long' : 'short',
    year: style === 'short' ? undefined : 'numeric',
  })
}

export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number) as [number, number, number]
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
