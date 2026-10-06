import { useId, useRef, useState, type FormEvent } from 'react'
import type { Transaction, TransactionType } from '../types'
import type { TransactionInput } from '../state/useAppData'
import { categoriesFor, categoryIcon, defaultCategory, isKnownCategory } from '../lib/categories'
import { isValidISODate, todayISO } from '../lib/dates'
import { centsToInput, parseAmount } from '../lib/money'
import { Icon } from './Icon'

interface TransactionFormProps {
  initial?: Transaction
  currencySymbol: string
  onSubmit: (input: TransactionInput) => void
  onCancel: () => void
}

type Errors = Partial<Record<'amount' | 'date', string>>

export function TransactionForm({
  initial,
  currencySymbol,
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const id = useId()
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense')
  const [amount, setAmount] = useState(initial ? centsToInput(initial.amountCents) : '')
  const [date, setDate] = useState(initial?.date ?? todayISO())
  const [category, setCategory] = useState(initial?.category ?? defaultCategory('expense'))
  const [note, setNote] = useState(initial?.note ?? '')
  const [errors, setErrors] = useState<Errors>({})
  const amountRef = useRef<HTMLInputElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)

  const options = categoriesFor(type).map((c) => c.name)
  // Keep an unknown category (e.g. from an imported backup) selectable when editing.
  if (!options.includes(category)) options.push(category)

  function changeType(next: TransactionType) {
    setType(next)
    if (!isKnownCategory(next, category)) setCategory(defaultCategory(next))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const cents = parseAmount(amount)
    const nextErrors: Errors = {}
    if (cents === null) {
      nextErrors.amount = amount.trim()
        ? 'Enter a positive amount with up to two decimals, like 12.50.'
        : 'Enter an amount.'
    }
    if (!isValidISODate(date)) nextErrors.date = 'Choose a valid date.'
    setErrors(nextErrors)
    if (nextErrors.amount) return amountRef.current?.focus()
    if (nextErrors.date) return dateRef.current?.focus()
    onSubmit({ type, amountCents: cents!, date, category, note: note.trim() })
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <fieldset className="segmented">
        <legend>Type</legend>
        {(['expense', 'income'] as const).map((value) => (
          <label key={value} className={`segment segment-${value}`}>
            <input
              type="radio"
              name={`${id}-type`}
              value={value}
              checked={type === value}
              onChange={() => changeType(value)}
            />
            <Icon name={value === 'income' ? 'arrowUp' : 'arrowDown'} size={16} />
            <span>{value === 'income' ? 'Income' : 'Expense'}</span>
          </label>
        ))}
      </fieldset>

      <div className="field">
        <label htmlFor={`${id}-amount`}>Amount</label>
        <div className="input-affix">
          <span className="affix" aria-hidden="true">
            {currencySymbol}
          </span>
          <input
            ref={amountRef}
            id={`${id}-amount`}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-invalid={errors.amount ? true : undefined}
            aria-describedby={errors.amount ? `${id}-amount-error` : undefined}
            autoFocus
            required
          />
        </div>
        {errors.amount && (
          <p id={`${id}-amount-error`} className="field-error">
            <Icon name="alertCircle" size={14} /> {errors.amount}
          </p>
        )}
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor={`${id}-date`}>Date</label>
          <input
            ref={dateRef}
            id={`${id}-date`}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={errors.date ? true : undefined}
            aria-describedby={errors.date ? `${id}-date-error` : undefined}
            required
          />
          {errors.date && (
            <p id={`${id}-date-error`} className="field-error">
              <Icon name="alertCircle" size={14} /> {errors.date}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor={`${id}-category`}>Category</label>
          <select
            id={`${id}-category`}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {options.map((name) => (
              <option key={name} value={name}>
                {categoryIcon(name)} {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor={`${id}-note`}>
          Note <span className="optional">(optional)</span>
        </label>
        <input
          id={`${id}-note`}
          type="text"
          maxLength={200}
          placeholder="What was it for?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="form-actions">
        <button type="button" className="button button-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="button button-primary">
          {initial ? 'Save changes' : `Add ${type}`}
        </button>
      </div>
    </form>
  )
}
