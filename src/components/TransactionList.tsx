import { useDeferredValue, useId, useMemo, useState, type Ref } from 'react'
import type { MonthKey, Transaction, TransactionType } from '../types'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, categoryIcon } from '../lib/categories'
import { formatDate, formatMonth } from '../lib/dates'
import { formatMoney } from '../lib/money'
import { filterTransactions, type TransactionFilter } from '../lib/stats'
import { Icon } from './Icon'

interface TransactionListProps {
  transactions: Transaction[]
  month: MonthKey
  currency: string
  onEdit: (transaction: Transaction) => void
  onDelete: (transaction: Transaction) => void
  /** Receives the list heading so callers can move focus there (e.g. after a delete). */
  headingRef?: Ref<HTMLHeadingElement>
}

const PAGE_SIZE = 50

export function TransactionList({
  transactions,
  month,
  currency,
  onEdit,
  onDelete,
  headingRef,
}: TransactionListProps) {
  const id = useId()
  const [query, setQuery] = useState('')
  const [type, setType] = useState<TransactionType | 'all'>('all')
  const [category, setCategory] = useState('all')
  const [scope, setScope] = useState<'month' | 'all'>('month')
  const [limit, setLimit] = useState(PAGE_SIZE)
  const deferredQuery = useDeferredValue(query)

  const results = useMemo(() => {
    const filter: TransactionFilter = {
      query: deferredQuery,
      type,
      category,
      month: scope === 'month' ? month : 'all',
    }
    return filterTransactions(transactions, filter)
  }, [transactions, deferredQuery, type, category, scope, month])
  const net = results.reduce(
    (sum, t) => sum + (t.type === 'income' ? t.amountCents : -t.amountCents),
    0,
  )
  const visible = results.slice(0, limit)
  const groups = groupByDate(visible)
  const isFiltered = query !== '' || type !== 'all' || category !== 'all'

  // Categories that exist in the data but aren't built in (e.g. from an import).
  const extraCategories = [...new Set(transactions.map((t) => t.category))].filter(
    (c) =>
      !EXPENSE_CATEGORIES.some((e) => e.name === c) && !INCOME_CATEGORIES.some((i) => i.name === c),
  )

  function clearFilters() {
    setQuery('')
    setType('all')
    setCategory('all')
  }

  return (
    <section className="card panel transactions" aria-labelledby={`${id}-heading`}>
      <div className="panel-header">
        <div>
          <h2 id={`${id}-heading`} ref={headingRef} tabIndex={-1}>
            Transactions
          </h2>
          <p className="panel-subtitle">{scope === 'month' ? formatMonth(month) : 'All time'}</p>
        </div>
      </div>

      <div className="filters" role="search" aria-label="Filter transactions">
        <div className="field field-search">
          <label htmlFor={`${id}-search`} className="visually-hidden">
            Search transactions
          </label>
          <Icon name="search" size={16} className="search-icon" />
          <input
            id={`${id}-search`}
            type="search"
            placeholder="Search notes, categories, amounts…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setLimit(PAGE_SIZE)
            }}
          />
        </div>
        <div className="field">
          <label htmlFor={`${id}-scope`} className="visually-hidden">
            Period
          </label>
          <select
            id={`${id}-scope`}
            value={scope}
            onChange={(e) => setScope(e.target.value as 'month' | 'all')}
          >
            <option value="month">{formatMonth(month)}</option>
            <option value="all">All time</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${id}-type`} className="visually-hidden">
            Type
          </label>
          <select
            id={`${id}-type`}
            value={type}
            onChange={(e) => setType(e.target.value as TransactionType | 'all')}
          >
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expenses</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${id}-category`} className="visually-hidden">
            Category
          </label>
          <select
            id={`${id}-category`}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All categories</option>
            <optgroup label="Expenses">
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Income">
              {INCOME_CATEGORIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </optgroup>
            {extraCategories.length > 0 && (
              <optgroup label="Other">
                {extraCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </div>

      <div className="results-bar">
        <p role="status" className="results-count">
          {results.length === 1 ? '1 transaction' : `${results.length} transactions`}
          {results.length > 0 && <> · net {formatMoney(net, currency, { signed: true })}</>}
        </p>
        {isFiltered && (
          <button type="button" className="button button-ghost button-small" onClick={clearFilters}>
            <Icon name="x" size={14} /> Clear filters
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <div className="empty-note">
          {isFiltered ? (
            <p>No transactions match these filters.</p>
          ) : scope === 'month' ? (
            <p>
              Nothing recorded for {formatMonth(month)} yet.{' '}
              <button type="button" className="link-button" onClick={() => setScope('all')}>
                Show all time
              </button>
            </p>
          ) : (
            <p>No transactions yet.</p>
          )}
        </div>
      ) : (
        <ul className="day-list">
          {groups.map(([date, items]) => (
            <li key={date} className="day">
              <h3 className="day-heading">{formatDate(date)}</h3>
              <ul className="tx-list">
                {items.map((t) => (
                  <TransactionRow
                    key={t.id}
                    transaction={t}
                    currency={currency}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      {results.length > visible.length && (
        <div className="load-more">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setLimit((l) => l + PAGE_SIZE)}
          >
            Show more ({results.length - visible.length} remaining)
          </button>
        </div>
      )}
    </section>
  )
}

function groupByDate(transactions: Transaction[]): [string, Transaction[]][] {
  const groups = new Map<string, Transaction[]>()
  for (const t of transactions) {
    const list = groups.get(t.date)
    if (list) list.push(t)
    else groups.set(t.date, [t])
  }
  return [...groups]
}

interface TransactionRowProps {
  transaction: Transaction
  currency: string
  onEdit: (transaction: Transaction) => void
  onDelete: (transaction: Transaction) => void
}

function TransactionRow({ transaction: t, currency, onEdit, onDelete }: TransactionRowProps) {
  const title = t.note || t.category
  const amount = formatMoney(t.type === 'income' ? t.amountCents : -t.amountCents, currency, {
    signed: true,
  })
  const label = `${title}, ${amount}`

  return (
    <li className={`tx tx-${t.type}`}>
      <span className="tx-icon" aria-hidden="true">
        {categoryIcon(t.category)}
      </span>
      <div className="tx-main">
        <p className="tx-title">{title}</p>
        <p className="tx-meta">
          {t.category}
          <span className={`tag tag-${t.type}`}>{t.type === 'income' ? 'Income' : 'Expense'}</span>
        </p>
      </div>
      <p className="tx-amount">{amount}</p>
      <div className="row-actions">
        <button
          type="button"
          className="icon-button"
          onClick={() => onEdit(t)}
          aria-label={`Edit ${label}`}
        >
          <Icon name="pencil" size={16} />
        </button>
        <button
          type="button"
          className="icon-button icon-button-danger"
          onClick={() => onDelete(t)}
          aria-label={`Delete ${label}`}
        >
          <Icon name="trash" size={16} />
        </button>
      </div>
    </li>
  )
}
