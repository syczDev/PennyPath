import { useId, useRef, useState, type FormEvent } from 'react'
import type { BudgetLevel, Budgets, MonthKey } from '../types'
import type { BudgetProgress } from '../lib/stats'
import { EXPENSE_CATEGORIES } from '../lib/categories'
import { formatMonth } from '../lib/dates'
import { centsToInput, formatMoney, parseAmount } from '../lib/money'
import { Icon, type IconName } from './Icon'

interface BudgetPanelProps {
  month: MonthKey
  budgets: Budgets
  progress: BudgetProgress[]
  currency: string
  currencySymbol: string
  onSave: (category: string, cents: number) => void
  onRemove: (category: string) => void
}

const LEVEL: Record<BudgetLevel, { label: string; icon: IconName }> = {
  ok: { label: 'On track', icon: 'checkCircle' },
  near: { label: 'Close to limit', icon: 'alertTriangle' },
  over: { label: 'Over budget', icon: 'alertCircle' },
}

export function BudgetPanel(props: BudgetPanelProps) {
  const { month, budgets, progress, currency, onRemove } = props
  const [editing, setEditing] = useState<string | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const unbudgeted = EXPENSE_CATEGORIES.filter((c) => !(c.name in budgets))

  return (
    <section className="card panel" aria-labelledby="budget-heading">
      <div className="panel-header">
        <div>
          <h2 id="budget-heading" ref={headingRef} tabIndex={-1}>
            Monthly budgets
          </h2>
          <p className="panel-subtitle">{formatMonth(month)}</p>
        </div>
      </div>

      {progress.length === 0 ? (
        <p className="empty-note">
          No budgets yet. Set a monthly limit for a category and PennyPath will flag it when you get
          close (80%) or go over.
        </p>
      ) : (
        <ul className="budget-list">
          {progress.map((b) => (
            <li key={b.category} className={`budget budget-${b.level}`}>
              {editing === b.category ? (
                <BudgetForm
                  {...props}
                  category={b.category}
                  initialCents={b.limit}
                  onDone={() => {
                    setEditing(null)
                    // The inline form unmounts; return focus to the row's edit button.
                    requestAnimationFrame(() =>
                      document
                        .querySelector<HTMLButtonElement>(
                          `[data-budget-edit="${CSS.escape(b.category)}"]`,
                        )
                        ?.focus(),
                    )
                  }}
                />
              ) : (
                <>
                  <div className="budget-top">
                    <span className="budget-name">
                      <span aria-hidden="true">{b.icon}</span> {b.category}
                    </span>
                    <span className="budget-amounts">
                      <strong>{formatMoney(b.spent, currency)}</strong> of{' '}
                      {formatMoney(b.limit, currency)}
                    </span>
                  </div>
                  <div className="meter" aria-hidden="true">
                    <div
                      className="meter-fill"
                      style={{ width: `${Math.min(b.ratio, 1) * 100}%` }}
                    />
                  </div>
                  <div className="budget-bottom">
                    <span className={`status status-${b.level}`}>
                      <Icon name={LEVEL[b.level].icon} size={15} />
                      {LEVEL[b.level].label}
                      <span className="status-detail">
                        {' · '}
                        {b.remaining >= 0
                          ? `${formatMoney(b.remaining, currency)} left`
                          : `${formatMoney(-b.remaining, currency)} over`}{' '}
                        ({Math.round(b.ratio * 100)}%)
                      </span>
                    </span>
                    <span className="row-actions">
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => setEditing(b.category)}
                        data-budget-edit={b.category}
                        aria-label={`Edit ${b.category} budget`}
                      >
                        <Icon name="pencil" size={16} />
                      </button>
                      <button
                        type="button"
                        className="icon-button icon-button-danger"
                        onClick={() => {
                          onRemove(b.category)
                          headingRef.current?.focus()
                        }}
                        aria-label={`Remove ${b.category} budget`}
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </span>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {unbudgeted.length > 0 && (
        <BudgetForm {...props} categories={unbudgeted.map((c) => c.name)} />
      )}
    </section>
  )
}

type BudgetFormProps = BudgetPanelProps & {
  /** Editing an existing budget… */
  category?: string
  initialCents?: number
  onDone?: () => void
  /** …or adding a new one, choosing from these categories. */
  categories?: string[]
}

function BudgetForm({
  category,
  initialCents,
  categories,
  currencySymbol,
  onSave,
  onDone,
}: BudgetFormProps) {
  const id = useId()
  const isEdit = category !== undefined
  const [chosen, setChosen] = useState(category ?? categories?.[0] ?? '')
  // After a budget is added its category leaves the list; fall back to the next one.
  const selected = categories && !categories.includes(chosen) ? (categories[0] ?? '') : chosen
  const [amount, setAmount] = useState(initialCents ? centsToInput(initialCents) : '')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cents = parseAmount(amount)
    if (cents === null) {
      setError('Enter a positive amount, like 250.')
      event.currentTarget.querySelector<HTMLInputElement>('input')?.focus()
      return
    }
    onSave(selected, cents)
    setAmount('')
    setError(null)
    onDone?.()
  }

  return (
    <form
      className={isEdit ? 'budget-form budget-form-inline' : 'budget-form'}
      onSubmit={handleSubmit}
      onKeyDown={(e) => {
        if (isEdit && e.key === 'Escape') onDone?.()
      }}
      noValidate
      aria-label={isEdit ? `Edit ${category} budget` : 'Add a budget'}
    >
      {!isEdit && <h3 className="form-title">Add a budget</h3>}
      <div className="budget-form-fields">
        {isEdit ? (
          <span className="budget-name">{category}</span>
        ) : (
          <div className="field">
            <label htmlFor={`${id}-category`}>Category</label>
            <select
              id={`${id}-category`}
              value={selected}
              onChange={(e) => setChosen(e.target.value)}
            >
              {categories?.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="field">
          <label htmlFor={`${id}-amount`} className={isEdit ? 'visually-hidden' : undefined}>
            Monthly limit{isEdit ? ` for ${category}` : ''}
          </label>
          <div className="input-affix">
            <span className="affix" aria-hidden="true">
              {currencySymbol}
            </span>
            <input
              id={`${id}-amount`}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-error` : undefined}
              autoFocus={isEdit}
            />
          </div>
        </div>
        <div className="budget-form-actions">
          {isEdit && (
            <button type="button" className="button button-secondary button-small" onClick={onDone}>
              Cancel
            </button>
          )}
          <button type="submit" className="button button-primary button-small">
            {isEdit ? 'Save' : 'Add budget'}
          </button>
        </div>
      </div>
      {error && (
        <p id={`${id}-error`} className="field-error">
          <Icon name="alertCircle" size={14} /> {error}
        </p>
      )}
    </form>
  )
}
