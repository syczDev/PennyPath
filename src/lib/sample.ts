import type { AppData, Transaction, TransactionType } from '../types'
import { currentMonthKey, shiftMonth, todayISO } from './dates'
import { createId } from './storage'

type Row = [
  dayOfMonth: number,
  type: TransactionType,
  dollars: number,
  category: string,
  note: string,
]

const MONTH_TEMPLATE: Row[] = [
  [1, 'income', 4200, 'Salary', 'Monthly paycheck'],
  [1, 'expense', 1450, 'Housing', 'Rent'],
  [2, 'expense', 64.3, 'Groceries', 'Weekly shop'],
  [3, 'expense', 15.99, 'Subscriptions', 'Streaming service'],
  [5, 'expense', 42.5, 'Transport', 'Transit pass top-up'],
  [7, 'expense', 38.2, 'Dining', 'Dinner with friends'],
  [9, 'expense', 71.85, 'Groceries', 'Farmers market + store'],
  [11, 'expense', 96.4, 'Utilities', 'Electricity & internet'],
  [12, 'income', 650, 'Freelance', 'Logo design project'],
  [14, 'expense', 24, 'Entertainment', 'Movie tickets'],
  [16, 'expense', 58.75, 'Groceries', 'Weekly shop'],
  [18, 'expense', 120, 'Shopping', 'Running shoes'],
  [20, 'expense', 30, 'Health', 'Pharmacy'],
  [22, 'expense', 47.1, 'Dining', 'Lunches this week'],
  [24, 'expense', 66.2, 'Groceries', 'Weekly shop'],
  [27, 'expense', 18.5, 'Transport', 'Ride share'],
]

/**
 * Three months of realistic demo data ending today, plus a few budgets that
 * show every budget state (on track, close, over).
 */
export function buildSampleData(currency: string, now: Date = new Date()): AppData {
  const today = todayISO(now)
  const thisMonth = currentMonthKey(now)
  const transactions: Transaction[] = []
  let createdAt = now.getTime() - 1_000_000

  for (let offset = -2; offset <= 0; offset++) {
    const month = shiftMonth(thisMonth, offset)
    MONTH_TEMPLATE.forEach(([day, type, dollars, category, note], i) => {
      const date = `${month}-${String(day).padStart(2, '0')}`
      if (date > today) return
      // Vary amounts a little from month to month so the trend isn't flat.
      const wobble = type === 'expense' && i % 3 === offset + 2 ? 1.25 : 1
      transactions.push({
        id: createId(),
        type,
        amountCents: Math.round(dollars * wobble * 100),
        date,
        category,
        note,
        createdAt: createdAt++,
      })
    })
  }

  return {
    version: 1,
    transactions,
    budgets: {
      Groceries: 25000,
      Dining: 8000,
      Entertainment: 10000,
      Shopping: 10000,
      Transport: 5000,
    },
    settings: { currency },
  }
}
