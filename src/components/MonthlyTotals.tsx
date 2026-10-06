import { useState } from 'react'
import type { MonthKey } from '../types'
import type { MonthSummary } from '../lib/stats'
import { formatMonth } from '../lib/dates'
import { formatMoney } from '../lib/money'

interface MonthlyTotalsProps {
  history: MonthSummary[]
  selected: MonthKey
  currency: string
  onSelect: (month: MonthKey) => void
}

/** Rounds up to a clean axis maximum: 1, 2, 2.5 or 5 times a power of ten. */
function niceCeil(value: number): number {
  if (value <= 0) return 1
  const power = 10 ** Math.floor(Math.log10(value))
  const step = [1, 2, 2.5, 5, 10].find((s) => s * power >= value) ?? 10
  return step * power
}

export function MonthlyTotals({ history, selected, currency, onSelect }: MonthlyTotalsProps) {
  const [hovered, setHovered] = useState<MonthKey | null>(null)
  const peak = Math.max(0, ...history.flatMap((m) => [m.income, m.expense]))
  const axisMax = niceCeil(peak)
  const ticks = [axisMax, axisMax / 2, 0]
  const height = (cents: number) => `${(cents / axisMax) * 100}%`
  const active = history.find((m) => m.month === hovered)

  return (
    <section className="card panel" aria-labelledby="monthly-heading">
      <div className="panel-header">
        <div>
          <h2 id="monthly-heading">Monthly totals</h2>
          <p className="panel-subtitle">Last {history.length} months</p>
        </div>
        <ul className="legend" aria-label="Legend">
          <li>
            <span className="swatch swatch-income" aria-hidden="true" /> Income
          </li>
          <li>
            <span className="swatch swatch-expense" aria-hidden="true" /> Expenses
          </li>
        </ul>
      </div>

      {/* The chart is a visual summary; the table below carries the same numbers for everyone. */}
      <div className="column-chart" aria-hidden="true" onMouseLeave={() => setHovered(null)}>
        <div className="column-axis">
          {ticks.map((t) => (
            <span key={t}>{formatMoney(t, currency, { compact: true })}</span>
          ))}
        </div>
        <div className="column-plot">
          <div className="column-grid">
            {ticks.map((t) => (
              <span key={t} />
            ))}
          </div>
          {history.map((m) => (
            <div
              key={m.month}
              className={`column-group${m.month === selected ? ' is-selected' : ''}${m.month === hovered ? ' is-hovered' : ''}`}
              onMouseEnter={() => setHovered(m.month)}
              onClick={() => onSelect(m.month)}
            >
              <div className="column-bars">
                <span className="column column-income" style={{ height: height(m.income) }} />
                <span className="column column-expense" style={{ height: height(m.expense) }} />
              </div>
              <span className="column-label">{formatMonth(m.month, 'short')}</span>
            </div>
          ))}
          {active && (
            <div
              className="chart-tooltip"
              // Centre on the hovered month but keep the tooltip inside the plot.
              style={{
                left: `clamp(0px, calc(${((history.indexOf(active) + 0.5) / history.length) * 100}% - 88px), calc(100% - 176px))`,
              }}
            >
              <strong>{formatMonth(active.month)}</strong>
              <span>
                <span className="swatch swatch-income" /> Income{' '}
                {formatMoney(active.income, currency)}
              </span>
              <span>
                <span className="swatch swatch-expense" /> Expenses{' '}
                {formatMoney(active.expense, currency)}
              </span>
              <span>Net {formatMoney(active.net, currency, { signed: true })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Focusable so keyboard users can scroll it if it ever overflows on a narrow screen. */}
      <div className="table-scroll" tabIndex={0} role="region" aria-label="Monthly totals table">
        <table className="data-table">
          <caption className="visually-hidden">Income, expenses and net by month</caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">Income</th>
              <th scope="col">Expenses</th>
              <th scope="col">Net</th>
            </tr>
          </thead>
          <tbody>
            {[...history].reverse().map((m) => (
              <tr key={m.month} className={m.month === selected ? 'is-selected' : undefined}>
                <th scope="row">
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => onSelect(m.month)}
                    aria-current={m.month === selected ? 'true' : undefined}
                  >
                    {formatMonth(m.month, 'medium')}
                  </button>
                </th>
                <td>{formatMoney(m.income, currency)}</td>
                <td>{formatMoney(m.expense, currency)}</td>
                <td
                  className={m.net < 0 ? 'text-negative' : m.net > 0 ? 'text-positive' : undefined}
                >
                  {formatMoney(m.net, currency, { signed: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
