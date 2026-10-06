import { describe, expect, it } from 'vitest'
import { emptyData } from '../lib/storage'
import { reducer, type TransactionInput } from './useAppData'

const input: TransactionInput = {
  type: 'expense',
  amountCents: 1299,
  date: '2026-10-06',
  category: 'Dining',
  note: 'Lunch',
}

describe('reducer', () => {
  it('adds, updates and deletes transactions', () => {
    let state = reducer(emptyData(), { type: 'add', input })
    expect(state.transactions).toHaveLength(1)
    const id = state.transactions[0]!.id

    state = reducer(state, {
      type: 'update',
      id,
      input: { ...input, amountCents: 1500, note: 'Brunch' },
    })
    expect(state.transactions[0]).toMatchObject({ id, amountCents: 1500, note: 'Brunch' })

    state = reducer(state, { type: 'delete', id })
    expect(state.transactions).toEqual([])
  })

  it('sets and removes budgets without mutating previous state', () => {
    const before = emptyData()
    const withBudget = reducer(before, { type: 'setBudget', category: 'Dining', cents: 8000 })
    expect(withBudget.budgets).toEqual({ Dining: 8000 })
    expect(before.budgets).toEqual({})
    expect(reducer(withBudget, { type: 'removeBudget', category: 'Dining' }).budgets).toEqual({})
  })
})
