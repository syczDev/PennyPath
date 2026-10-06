import { Icon } from './Icon'

interface EmptyStateProps {
  onAdd: () => void
  onLoadSample: () => void
}

export function EmptyState({ onAdd, onLoadSample }: EmptyStateProps) {
  return (
    <section className="card welcome" aria-labelledby="welcome-heading">
      <h2 id="welcome-heading">Welcome to PennyPath</h2>
      <p>
        Track what comes in and what goes out, set monthly budgets, and see where your money goes.
        Everything is stored privately in this browser — no accounts, no bank connections.
      </p>
      <div className="welcome-actions">
        <button type="button" className="button button-primary" onClick={onAdd}>
          <Icon name="plus" size={18} /> Add your first transaction
        </button>
        <button type="button" className="button button-secondary" onClick={onLoadSample}>
          <Icon name="sparkles" size={18} /> Explore with sample data
        </button>
      </div>
    </section>
  )
}
