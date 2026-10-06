import type { AppData, Budgets, Settings, Transaction } from '../types'
import { isValidISODate } from './dates'
import { MAX_AMOUNT_CENTS } from './money'

export const STORAGE_KEY = 'pennypath:data:v1'

export const DEFAULT_SETTINGS: Settings = { currency: 'USD' }

export function emptyData(): AppData {
  return { version: 1, transactions: [], budgets: {}, settings: { ...DEFAULT_SETTINGS } }
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // randomUUID is unavailable on insecure origins (e.g. a LAN IP over http).
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const isAmount = (v: unknown): v is number =>
  typeof v === 'number' && Number.isSafeInteger(v) && v > 0 && v <= MAX_AMOUNT_CENTS

function sanitizeTransaction(raw: unknown): Transaction | null {
  if (!isRecord(raw)) return null
  const { id, type, amountCents, date, category, note, createdAt } = raw
  if (type !== 'income' && type !== 'expense') return null
  if (!isAmount(amountCents)) return null
  if (typeof date !== 'string' || !isValidISODate(date)) return null
  if (typeof category !== 'string' || category.trim() === '') return null
  return {
    id: typeof id === 'string' && id ? id : createId(),
    type,
    amountCents,
    date,
    category: category.trim(),
    note: typeof note === 'string' ? note.slice(0, 200) : '',
    createdAt: typeof createdAt === 'number' && Number.isFinite(createdAt) ? createdAt : 0,
  }
}

function sanitizeBudgets(raw: unknown): Budgets {
  const budgets: Budgets = {}
  if (!isRecord(raw)) return budgets
  for (const [category, limit] of Object.entries(raw)) {
    if (category.trim() && isAmount(limit)) budgets[category] = limit
  }
  return budgets
}

function sanitizeSettings(raw: unknown): Settings {
  if (!isRecord(raw)) return { ...DEFAULT_SETTINGS }
  const currency =
    typeof raw.currency === 'string' && /^[A-Z]{3}$/.test(raw.currency)
      ? raw.currency
      : DEFAULT_SETTINGS.currency
  return { currency }
}

/**
 * Turns untrusted JSON (from localStorage or an imported backup) into valid
 * app data, dropping anything malformed instead of failing outright.
 * Returns `null` only when the input isn't PennyPath data at all.
 */
export function sanitizeData(raw: unknown): AppData | null {
  if (!isRecord(raw) || !Array.isArray(raw.transactions)) return null
  const seen = new Set<string>()
  const transactions: Transaction[] = []
  for (const item of raw.transactions) {
    const t = sanitizeTransaction(item)
    if (!t) continue
    if (seen.has(t.id)) t.id = createId()
    seen.add(t.id)
    transactions.push(t)
  }
  return {
    version: 1,
    transactions,
    budgets: sanitizeBudgets(raw.budgets),
    settings: sanitizeSettings(raw.settings),
  }
}

export function parseData(json: string | null): AppData | null {
  if (json == null) return null
  try {
    return sanitizeData(JSON.parse(json))
  } catch {
    return null
  }
}

export function loadData(storage: Storage | undefined = globalThis.localStorage): AppData {
  try {
    return parseData(storage?.getItem(STORAGE_KEY) ?? null) ?? emptyData()
  } catch {
    // Access to localStorage can throw (e.g. blocked site data).
    return emptyData()
  }
}

/** Returns false when the browser refused the write (quota exceeded, storage disabled). */
export function saveData(
  data: AppData,
  storage: Storage | undefined = globalThis.localStorage,
): boolean {
  try {
    if (!storage) return false
    storage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}
