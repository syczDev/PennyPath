import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { AppData, Transaction } from '../types'
import { STORAGE_KEY, createId, loadData, parseData, saveData } from '../lib/storage'

export type TransactionInput = Omit<Transaction, 'id' | 'createdAt'>

type Action =
  | { type: 'add'; input: TransactionInput }
  | { type: 'update'; id: string; input: TransactionInput }
  | { type: 'delete'; id: string }
  | { type: 'setBudget'; category: string; cents: number }
  | { type: 'removeBudget'; category: string }
  | { type: 'setCurrency'; currency: string }
  | { type: 'replace'; data: AppData }

export function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'add':
      return {
        ...state,
        transactions: [
          ...state.transactions,
          { ...action.input, id: createId(), createdAt: Date.now() },
        ],
      }
    case 'update':
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.id ? { ...t, ...action.input } : t,
        ),
      }
    case 'delete':
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.id) }
    case 'setBudget':
      return { ...state, budgets: { ...state.budgets, [action.category]: action.cents } }
    case 'removeBudget': {
      const { [action.category]: _removed, ...budgets } = state.budgets
      return { ...state, budgets }
    }
    case 'setCurrency':
      return { ...state, settings: { ...state.settings, currency: action.currency } }
    case 'replace':
      return action.data
  }
}

/**
 * App state backed by localStorage. Every change is written straight through,
 * and changes made in other tabs are picked up via the `storage` event.
 */
export function useAppData() {
  const [data, dispatch] = useReducer(reducer, undefined, () => loadData())
  const [saveFailed, setSaveFailed] = useState(false)
  // Skip writing back data that we just read from another tab.
  const skipNextSave = useRef(true)

  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false
      return
    }
    setSaveFailed(!saveData(data))
  }, [data])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return
      const next = parseData(event.newValue)
      if (!next) return
      skipNextSave.current = true
      dispatch({ type: 'replace', data: next })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const actions = useMemo(
    () => ({
      add: (input: TransactionInput) => dispatch({ type: 'add', input }),
      update: (id: string, input: TransactionInput) => dispatch({ type: 'update', id, input }),
      remove: (id: string) => dispatch({ type: 'delete', id }),
      setBudget: (category: string, cents: number) =>
        dispatch({ type: 'setBudget', category, cents }),
      removeBudget: (category: string) => dispatch({ type: 'removeBudget', category }),
      setCurrency: (currency: string) => dispatch({ type: 'setCurrency', currency }),
      replaceAll: (next: AppData) => dispatch({ type: 'replace', data: next }),
    }),
    [],
  )

  return { data, saveFailed, actions }
}
export type AppActions = ReturnType<typeof useAppData>['actions']
