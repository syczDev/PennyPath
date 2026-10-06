export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  type: TransactionType
  /** Always a positive integer number of minor units (cents). */
  amountCents: number
  /** Local calendar date in `YYYY-MM-DD` form. */
  date: string
  category: string
  note: string
  /** Epoch milliseconds; used to order transactions that share a date. */
  createdAt: number
}

/** Monthly spending limit per expense category, in cents. */
export type Budgets = Record<string, number>

export interface Settings {
  currency: string
}

export interface AppData {
  version: 1
  transactions: Transaction[]
  budgets: Budgets
  settings: Settings
}

/** A `YYYY-MM` month identifier. */
export type MonthKey = string

export type BudgetLevel = 'ok' | 'near' | 'over'
