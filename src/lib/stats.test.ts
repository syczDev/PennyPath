import { describe, expect, it } from 'vitest'
import type { Transaction } from '../types'
import {
  balance,
  budgetLevel,
  budgetProgress,
  filterTransactions,
  monthTotals,
  monthlyHistory,
  spendingByCategory,
} from './stats'

let seq = 0
function tx(partial: Partial<Transaction>): Transaction {
  seq += 1
  return {
    id: `t${seq}`,
    type: 'expense',
    amountCents: 1000,
    date: '2026-10-01',
    category: 'Groceries',
    note: '',
    createdAt: seq,
    ...partial,
  }
}

const data: Transaction[] = [
  tx({
    type: 'income',
    amountCents: 300000,
    category: 'Salary',
    note: 'Paycheck',
    date: '2026-10-01',
  }),
  tx({ amountCents: 120000, category: 'Housing', note: 'Rent', date: '2026-10-01' }),
  tx({ amountCents: 4550, category: 'Groceries', note: 'Weekly shop', date: '2026-10-03' }),
  tx({ amountCents: 2000, category: 'Groceries', note: 'Bakery', date: '2026-10-05' }),
  tx({ amountCents: 9000, category: 'Dining', note: 'Birthday dinner', date: '2026-10-04' }),
  tx({ type: 'income', amountCents: 50000, category: 'Freelance', date: '2026-09-15' }),
  tx({ amountCents: 30000, category: 'Groceries', date: '2026-09-10' }),
]

describe('totals', () => {
  it('computes the all-time balance', () => {
    expect(balance(data)).toBe(350000 - 120000 - 4550 - 2000 - 9000 - 30000)
  })

  it('computes totals for one month', () => {
    expect(monthTotals(data, '2026-10')).toEqual({
      income: 300000,
      expense: 135550,
      net: 164450,
    })
    expect(monthTotals(data, '2026-08')).toEqual({ income: 0, expense: 0, net: 0 })
  })

  it('builds a contiguous monthly history, oldest first', () => {
    const history = monthlyHistory(data, '2026-10', 3)
    expect(history.map((h) => h.month)).toEqual(['2026-08', '2026-09', '2026-10'])
    expect(history[1]).toMatchObject({ income: 50000, expense: 30000, net: 20000 })
  })
})

describe('spendingByCategory', () => {
  it('groups expenses for the month, largest first, with shares', () => {
    const spending = spendingByCategory(data, '2026-10')
    expect(spending.map((s) => [s.category, s.cents])).toEqual([
      ['Housing', 120000],
      ['Dining', 9000],
      ['Groceries', 6550],
    ])
    expect(spending.reduce((sum, s) => sum + s.share, 0)).toBeCloseTo(1)
  })
})

describe('budgets', () => {
  it('classifies budget levels at the 80% and 100% thresholds', () => {
    expect(budgetLevel(0, 10000)).toBe('ok')
    expect(budgetLevel(7999, 10000)).toBe('ok')
    expect(budgetLevel(8000, 10000)).toBe('near')
    expect(budgetLevel(10000, 10000)).toBe('near')
    expect(budgetLevel(10001, 10000)).toBe('over')
  })

  it('reports progress for each budget, most used first', () => {
    const progress = budgetProgress(
      data,
      { Groceries: 8000, Dining: 8000, Travel: 50000 },
      '2026-10',
    )
    expect(progress.map((p) => [p.category, p.level])).toEqual([
      ['Dining', 'over'],
      ['Groceries', 'near'],
      ['Travel', 'ok'],
    ])
    expect(progress[0]).toMatchObject({ spent: 9000, remaining: -1000 })
  })
})

describe('filterTransactions', () => {
  const all = { query: '', type: 'all', category: 'all', month: 'all' } as const

  it('sorts newest first', () => {
    const dates = filterTransactions(data, all).map((t) => t.date)
    expect(dates).toEqual([...dates].sort().reverse())
  })

  it('searches notes, categories and amounts case-insensitively', () => {
    expect(filterTransactions(data, { ...all, query: 'RENT' }).map((t) => t.note)).toEqual(['Rent'])
    expect(filterTransactions(data, { ...all, query: 'dining' })).toHaveLength(1)
    expect(filterTransactions(data, { ...all, query: '45.50' }).map((t) => t.note)).toEqual([
      'Weekly shop',
    ])
    expect(filterTransactions(data, { ...all, query: 'groceries weekly' })).toHaveLength(1)
  })

  it('filters by type, category and month', () => {
    expect(filterTransactions(data, { ...all, type: 'income' })).toHaveLength(2)
    expect(filterTransactions(data, { ...all, category: 'Groceries' })).toHaveLength(3)
    expect(
      filterTransactions(data, { ...all, category: 'Groceries', month: '2026-10' }),
    ).toHaveLength(2)
  })
})
