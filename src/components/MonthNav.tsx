import type { MonthKey } from '../types'
import { currentMonthKey, formatMonth, shiftMonth } from '../lib/dates'
import { Icon } from './Icon'

interface MonthNavProps {
  month: MonthKey
  onChange: (month: MonthKey) => void
}

export function MonthNav({ month, onChange }: MonthNavProps) {
  const thisMonth = currentMonthKey()
  return (
    <nav className="month-nav" aria-label="Choose month">
      <button
        type="button"
        className="icon-button"
        onClick={() => onChange(shiftMonth(month, -1))}
        aria-label={`Previous month, ${formatMonth(shiftMonth(month, -1))}`}
      >
        <Icon name="chevronLeft" />
      </button>
      <p className="month-label" aria-live="polite">
        {formatMonth(month)}
      </p>
      <button
        type="button"
        className="icon-button"
        onClick={() => onChange(shiftMonth(month, 1))}
        aria-label={`Next month, ${formatMonth(shiftMonth(month, 1))}`}
      >
        <Icon name="chevronRight" />
      </button>
      {month !== thisMonth && (
        <button
          type="button"
          className="button button-ghost button-small"
          onClick={() => onChange(thisMonth)}
        >
          Today
        </button>
      )}
    </nav>
  )
}
