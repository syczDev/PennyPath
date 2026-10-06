import type { BudgetLevel, Budgets, MonthKey, Transaction, TransactionType } from '../types'
import { categoryIcon } from './categories'
import { monthKeyOf, shiftMonth } from './dates'

/** Share of a budget at which we start warning the user. */
export const NEAR_BUDGET_RATIO = 0.8

export interface Totals {
  income: number
  expense: number
  net: number
}

function sumTotals(transactions: Iterable<Transaction>): Totals {
  let income = 0
  let expense = 0
  for (const t of transactions) {
    if (t.type === 'income') income += t.amountCents
    else expense += t.amountCents
  }
  return { income, expense, net: income - expense }
}

export function balance(transactions: readonly Transaction[]): number {
  return sumTotals(transactions).net
}

export function monthTotals(transactions: readonly Transaction[], month: MonthKey): Totals {
  return sumTotals(transactions.filter((t) => monthKeyOf(t.date) === month))
}

export interface MonthSummary extends Totals {
  month: MonthKey
}

/** Totals for `count` consecutive months ending at (and including) `endMonth`, oldest first. */
export function monthlyHistory(
  transactions: readonly Transaction[],
  endMonth: MonthKey,
  count: number,
): MonthSummary[] {
  const months = Array.from({ length: count }, (_, i) => shiftMonth(endMonth, i - count + 1))
  const buckets = new Map(months.map((m) => [m, [] as Transaction[]]))
  for (const t of transactions) buckets.get(monthKeyOf(t.date))?.push(t)
  return months.map((month) => ({ month, ...sumTotals(buckets.get(month) ?? []) }))
}

export interface CategorySpend {
  category: string
  icon: string
  cents: number
  /** Fraction of the month's total spending, 0..1. */
  share: number
}

export function spendingByCategory(
  transactions: readonly Transaction[],
  month: MonthKey,
): CategorySpend[] {
  const byCategory = new Map<string, number>()
  let total = 0
  for (const t of transactions) {
    if (t.type !== 'expense' || monthKeyOf(t.date) !== month) continue
    byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amountCents)
    total += t.amountCents
  }
  return [...byCategory]
    .map(([category, cents]) => ({
      category,
      icon: categoryIcon(category),
      cents,
      share: total > 0 ? cents / total : 0,
    }))
    .sort((a, b) => b.cents - a.cents || a.category.localeCompare(b.category))
}

export function budgetLevel(spentCents: number, limitCents: number): BudgetLevel {
  if (spentCents > limitCents) return 'over'
  if (spentCents >= limitCents * NEAR_BUDGET_RATIO) return 'near'
  return 'ok'
}

export interface BudgetProgress {
  category: string
  icon: string
  limit: number
  spent: number
  remaining: number
  /** spent / limit; may exceed 1. */
  ratio: number
  level: BudgetLevel
}

export function budgetProgress(
  transactions: readonly Transaction[],
  budgets: Budgets,
  month: MonthKey,
): BudgetProgress[] {
  const spentBy = new Map(spendingByCategory(transactions, month).map((s) => [s.category, s.cents]))
  return Object.entries(budgets)
    .map(([category, limit]) => {
      const spent = spentBy.get(category) ?? 0
      return {
        category,
        icon: categoryIcon(category),
        limit,
        spent,
        remaining: limit - spent,
        ratio: limit > 0 ? spent / limit : 0,
        level: budgetLevel(spent, limit),
      }
    })
    .sort((a, b) => b.ratio - a.ratio || a.category.localeCompare(b.category))
}

export interface TransactionFilter {
  query: string
  type: TransactionType | 'all'
  category: string | 'all'
  /** A month to restrict to, or `'all'` for every month. */
  month: MonthKey | 'all'
}

/** Newest first; ties broken by creation time so fresh entries appear on top. */
export function sortTransactions(transactions: readonly Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
}

/**
 * Case-insensitive search across note, category, date and amount. Every
 * whitespace-separated term must match somewhere.
 */
export function filterTransactions(
  transactions: readonly Transaction[],
  filter: TransactionFilter,
): Transaction[] {
  const terms = filter.query.toLowerCase().split(/\s+/).filter(Boolean)
  return sortTransactions(
    transactions.filter((t) => {
      if (filter.type !== 'all' && t.type !== filter.type) return false
      if (filter.category !== 'all' && t.category !== filter.category) return false
      if (filter.month !== 'all' && monthKeyOf(t.date) !== filter.month) return false
      if (terms.length === 0) return true
      const haystack = [t.note, t.category, t.type, t.date, (t.amountCents / 100).toFixed(2)]
        .join(' ')
        .toLowerCase()
      return terms.every((term) => haystack.includes(term.replace(/[$,]/g, '')))
    }),
  )
}
