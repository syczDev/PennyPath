import type { MonthKey } from '../types'
import type { CategorySpend } from '../lib/stats'
import { formatMonth } from '../lib/dates'
import { formatMoney } from '../lib/money'

interface CategoryBreakdownProps {
  month: MonthKey
  spending: CategorySpend[]
  currency: string
}

const percent = (share: number) =>
  share > 0 && share < 0.01 ? '<1%' : `${Math.round(share * 100)}%`

/**
 * One series (spending) across categories, so every bar shares one hue and
 * each row is labelled directly; no legend or colour lookup is needed.
 */
export function CategoryBreakdown({ month, spending, currency }: CategoryBreakdownProps) {
  const total = spending.reduce((sum, s) => sum + s.cents, 0)
  const max = spending[0]?.cents ?? 0

  return (
    <section className="card panel" aria-labelledby="category-heading">
      <div className="panel-header">
        <div>
          <h2 id="category-heading">Spending by category</h2>
          <p className="panel-subtitle">{formatMonth(month)}</p>
        </div>
        {total > 0 && (
          <p className="panel-figure">
            <span className="visually-hidden">Total spent: </span>
            {formatMoney(total, currency)}
          </p>
        )}
      </div>

      {spending.length === 0 ? (
        <p className="empty-note">No expenses recorded for {formatMonth(month)}.</p>
      ) : (
        <ol className="bar-list">
          {spending.map((s) => (
            <li key={s.category} className="bar-row">
              <div className="bar-text">
                <span className="bar-name">
                  <span aria-hidden="true">{s.icon}</span> {s.category}
                </span>
                <span className="bar-value">
                  {formatMoney(s.cents, currency)}
                  <span className="bar-share">
                    <span className="visually-hidden">, </span>
                    {percent(s.share)}
                    <span className="visually-hidden"> of spending</span>
                  </span>
                </span>
              </div>
              <div className="bar-track" aria-hidden="true">
                <div
                  className="bar-fill"
                  style={{ width: `${Math.max((s.cents / max) * 100, 1.5)}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
