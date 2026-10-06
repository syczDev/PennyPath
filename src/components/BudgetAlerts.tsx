import type { BudgetProgress } from '../lib/stats'
import { formatMoney } from '../lib/money'
import { Icon } from './Icon'

interface BudgetAlertsProps {
  progress: BudgetProgress[]
  currency: string
}

/** A short, scannable heads-up for every budget that is close to or past its limit. */
export function BudgetAlerts({ progress, currency }: BudgetAlertsProps) {
  const over = progress.filter((b) => b.level === 'over')
  const near = progress.filter((b) => b.level === 'near')
  if (over.length === 0 && near.length === 0) return null

  return (
    <section
      className={`alert ${over.length > 0 ? 'alert-critical' : 'alert-warning'}`}
      aria-labelledby="alerts-heading"
    >
      <Icon
        name={over.length > 0 ? 'alertCircle' : 'alertTriangle'}
        size={20}
        className="alert-icon"
      />
      <div>
        <h2 id="alerts-heading" className="alert-title">
          {over.length > 0
            ? `${over.length} ${over.length === 1 ? 'budget is' : 'budgets are'} over the limit`
            : `${near.length} ${near.length === 1 ? 'budget is' : 'budgets are'} close to the limit`}
        </h2>
        <ul className="alert-list">
          {over.map((b) => (
            <li key={b.category}>
              <strong>{b.category}</strong>: over by {formatMoney(-b.remaining, currency)} (
              {Math.round(b.ratio * 100)}% used)
            </li>
          ))}
          {near.map((b) => (
            <li key={b.category}>
              <strong>{b.category}</strong>: {formatMoney(b.remaining, currency)} left (
              {Math.round(b.ratio * 100)}% used)
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
