import type { TransactionType } from '../types'

export interface Category {
  name: string
  icon: string
}

export const EXPENSE_CATEGORIES: readonly Category[] = [
  { name: 'Housing', icon: '🏠' },
  { name: 'Groceries', icon: '🛒' },
  { name: 'Dining', icon: '🍽️' },
  { name: 'Transport', icon: '🚌' },
  { name: 'Utilities', icon: '💡' },
  { name: 'Health', icon: '🩺' },
  { name: 'Entertainment', icon: '🎬' },
  { name: 'Shopping', icon: '🛍️' },
  { name: 'Subscriptions', icon: '🔁' },
  { name: 'Travel', icon: '✈️' },
  { name: 'Education', icon: '📚' },
  { name: 'Gifts & Giving', icon: '🎁' },
  { name: 'Other', icon: '📦' },
]

export const INCOME_CATEGORIES: readonly Category[] = [
  { name: 'Salary', icon: '💼' },
  { name: 'Freelance', icon: '🧑‍💻' },
  { name: 'Investments', icon: '📈' },
  { name: 'Gifts', icon: '🎉' },
  { name: 'Refunds', icon: '↩️' },
  { name: 'Other income', icon: '💰' },
]

const ALL = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]

export function categoriesFor(type: TransactionType): readonly Category[] {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
}

export function defaultCategory(type: TransactionType): string {
  return categoriesFor(type)[0]!.name
}

export function isKnownCategory(type: TransactionType, name: string): boolean {
  return categoriesFor(type).some((c) => c.name === name)
}

export function categoryIcon(name: string): string {
  return ALL.find((c) => c.name === name)?.icon ?? '•'
}
