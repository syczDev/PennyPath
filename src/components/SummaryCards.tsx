import type { MonthKey } from '../types'
import type { Totals } from '../lib/stats'
import { formatMonth } from '../lib/dates'
import { formatMoney } from '../lib/money'
import { Icon } from './Icon'

interface SummaryCardsProps {
  balance: number
  month: MonthKey
  totals: Totals
  currency: string
}

export function SummaryCards({ balance, month, totals, currency }: SummaryCardsProps) {
  const monthName = formatMonth(month)
  const savingsRate = totals.income > 0 ? Math.round((totals.net / totals.income) * 100) : null

  return (
    <section className="summary" aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="visually-hidden">
        Summary
      </h2>
      <div className="card stat stat-hero">
        <div className="stat-label">
          <Icon name="wallet" size={16} /> Current balance
        </div>
        <p className={`stat-value hero-value${balance < 0 ? ' is-negative' : ''}`}>
          {formatMoney(balance, currency)}
        </p>
        <p className="stat-meta">All income minus all expenses, across every month.</p>
      </div>

      <div className="card stat-group">
        <h3 className="card-kicker">{monthName}</h3>
        <dl className="stat-grid">
          <div className="stat">
            <dt className="stat-label">
              <span className="dot dot-income" aria-hidden="true" /> Income
            </dt>
            <dd className="stat-value">{formatMoney(totals.income, currency)}</dd>
          </div>
          <div className="stat">
            <dt className="stat-label">
              <span className="dot dot-expense" aria-hidden="true" /> Expenses
            </dt>
            <dd className="stat-value">{formatMoney(totals.expense, currency)}</dd>
          </div>
          <div className="stat">
            <dt className="stat-label">Net</dt>
            <dd
              className={`stat-value ${totals.net < 0 ? 'text-negative' : totals.net > 0 ? 'text-positive' : ''}`}
            >
              {formatMoney(totals.net, currency, { signed: true })}
            </dd>
            {savingsRate !== null && (
              <dd className="stat-meta">
                {savingsRate >= 0
                  ? `${savingsRate}% of income saved`
                  : `Spent ${-savingsRate}% more than earned`}
              </dd>
            )}
          </div>
        </dl>
      </div>
    </section>
  )
}
