import { describe, expect, it } from 'vitest'
import { STORAGE_KEY, emptyData, loadData, parseData, sanitizeData, saveData } from './storage'
import { buildSampleData } from './sample'

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const store = new Map(Object.entries(initial))
  return {
    get length() {
      return store.size
    },
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    key: (i) => [...store.keys()][i] ?? null,
    removeItem: (key) => void store.delete(key),
    setItem: (key, value) => void store.set(key, String(value)),
  }
}

describe('storage', () => {
  it('round-trips data through localStorage', () => {
    const storage = memoryStorage()
    const data = buildSampleData('EUR', new Date(2026, 9, 20))
    expect(saveData(data, storage)).toBe(true)
    expect(loadData(storage)).toEqual(data)
  })

  it('returns empty data when nothing is stored or the JSON is corrupt', () => {
    expect(loadData(memoryStorage())).toEqual(emptyData())
    expect(loadData(memoryStorage({ [STORAGE_KEY]: '{not json' }))).toEqual(emptyData())
    expect(parseData('[]')).toBeNull()
  })

  it('reports failure when the browser refuses to save', () => {
    const storage = memoryStorage()
    storage.setItem = () => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    }
    expect(saveData(emptyData(), storage)).toBe(false)
  })

  it('drops malformed entries and keeps valid ones', () => {
    const result = sanitizeData({
      transactions: [
        {
          id: 'a',
          type: 'expense',
          amountCents: 500,
          date: '2026-10-01',
          category: 'Dining',
          note: 'ok',
          createdAt: 1,
        },
        { id: 'b', type: 'expense', amountCents: -5, date: '2026-10-01', category: 'Dining' },
        { id: 'c', type: 'refund', amountCents: 500, date: '2026-10-01', category: 'Dining' },
        { id: 'd', type: 'income', amountCents: 500, date: '2026-02-30', category: 'Salary' },
        { id: 'a', type: 'income', amountCents: 12.5, date: '2026-10-01', category: 'Salary' },
        { id: 'a', type: 'income', amountCents: 900, date: '2026-10-02', category: 'Salary' },
        'garbage',
      ],
      budgets: { Dining: 10000, Travel: -1, Shopping: 'lots' },
      settings: { currency: 'usd' },
    })
    expect(result?.transactions.map((t) => t.amountCents)).toEqual([500, 900])
    // Duplicate ids are reassigned so edits and deletes target one row.
    expect(new Set(result?.transactions.map((t) => t.id)).size).toBe(2)
    expect(result?.budgets).toEqual({ Dining: 10000 })
    expect(result?.settings.currency).toBe('USD')
  })
})
