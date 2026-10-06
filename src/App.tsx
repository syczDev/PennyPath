import { useEffect, useMemo, useRef, useState } from 'react'
import type { MonthKey, Transaction } from './types'
import { useAppData } from './state/useAppData'
import { currentMonthKey } from './lib/dates'
import { currencySymbol, formatMoney } from './lib/money'
import { buildSampleData } from './lib/sample'
import { emptyData } from './lib/storage'
import {
  balance,
  budgetProgress,
  monthTotals,
  monthlyHistory,
  spendingByCategory,
} from './lib/stats'
import { BudgetAlerts } from './components/BudgetAlerts'
import { BudgetPanel } from './components/BudgetPanel'
import { CategoryBreakdown } from './components/CategoryBreakdown'
import { ConfirmDialog, type ConfirmRequest } from './components/ConfirmDialog'
import { DataSettings } from './components/DataSettings'
import { EmptyState } from './components/EmptyState'
import { Icon } from './components/Icon'
import { Modal } from './components/Modal'
import { MonthNav } from './components/MonthNav'
import { MonthlyTotals } from './components/MonthlyTotals'
import { SummaryCards } from './components/SummaryCards'
import { TransactionForm } from './components/TransactionForm'
import { TransactionList } from './components/TransactionList'

type Editor = { mode: 'add' } | { mode: 'edit'; transaction: Transaction } | null

export default function App() {
  const { data, saveFailed, actions } = useAppData()
  const { transactions, budgets, settings } = data
  const currency = settings.currency

  const [month, setMonth] = useState<MonthKey>(currentMonthKey)
  const [editor, setEditor] = useState<Editor>(null)
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null)
  const [toast, setToast] = useState<{ id: number; text: string; isError: boolean } | null>(null)
  const listHeadingRef = useRef<HTMLHeadingElement>(null)

  const stats = useMemo(
    () => ({
      balance: balance(transactions),
      totals: monthTotals(transactions, month),
      spending: spendingByCategory(transactions, month),
      history: monthlyHistory(transactions, month, 6),
      budgets: budgetProgress(transactions, budgets, month),
    }),
    [transactions, budgets, month],
  )

  // Status messages are read by screen readers via role="status" and fade out visually.
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])
  const announce = (text: string, isError = false) => setToast({ id: Date.now(), text, isError })

  const describe = (t: Pick<Transaction, 'type' | 'amountCents'>) =>
    `${t.type === 'income' ? 'Income' : 'Expense'} of ${formatMoney(t.amountCents, currency)}`

  function requestDelete(t: Transaction) {
    setConfirm({
      title: 'Delete transaction?',
      message: `“${t.note || t.category}” (${formatMoney(t.amountCents, currency)}) will be permanently removed.`,
      confirmLabel: 'Delete',
      onConfirm: () => {
        actions.remove(t.id)
        announce(`${describe(t)} deleted.`)
        // The row's button is gone; park focus on the list heading instead of <body>.
        requestAnimationFrame(() => listHeadingRef.current?.focus())
      },
    })
  }

  function loadSample() {
    const apply = () => {
      actions.replaceAll(buildSampleData(currency))
      setMonth(currentMonthKey())
      announce('Sample data loaded.')
    }
    if (transactions.length === 0 && Object.keys(budgets).length === 0) return apply()
    setConfirm({
      title: 'Replace your data with sample data?',
      message:
        'All of your current transactions and budgets will be replaced. Export a backup first if you want to keep them.',
      confirmLabel: 'Replace data',
      onConfirm: apply,
    })
  }

  const isEmpty = transactions.length === 0
  const symbol = currencySymbol(currency)

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
              <circle cx="16" cy="16" r="15" />
              <path d="M12.5 23V9.5h4.6a4.1 4.1 0 0 1 0 8.2h-4.6" />
            </svg>
            <span>PennyPath</span>
          </div>
          <MonthNav month={month} onChange={setMonth} />
          <button
            type="button"
            className="button button-primary add-button"
            onClick={() => setEditor({ mode: 'add' })}
          >
            <Icon name="plus" size={18} />
            <span className="add-label">Add transaction</span>
          </button>
        </div>
      </header>

      <main id="main" className="layout" tabIndex={-1}>
        <h1 className="visually-hidden">PennyPath expense tracker</h1>

        {saveFailed && (
          <div className="alert alert-critical" role="alert">
            <Icon name="alertCircle" size={20} className="alert-icon" />
            <p>
              Your browser didn’t let PennyPath save the latest change (storage may be full or
              disabled). Export a backup so you don’t lose your data.
            </p>
          </div>
        )}

        {isEmpty && (
          <EmptyState onAdd={() => setEditor({ mode: 'add' })} onLoadSample={loadSample} />
        )}

        <SummaryCards
          balance={stats.balance}
          month={month}
          totals={stats.totals}
          currency={currency}
        />
        <BudgetAlerts progress={stats.budgets} currency={currency} />

        <div className="columns">
          <div className="column-main">
            <CategoryBreakdown month={month} spending={stats.spending} currency={currency} />
            <TransactionList
              transactions={transactions}
              month={month}
              currency={currency}
              onEdit={(transaction) => setEditor({ mode: 'edit', transaction })}
              onDelete={requestDelete}
              headingRef={listHeadingRef}
            />
          </div>
          <div className="column-side">
            <BudgetPanel
              month={month}
              budgets={budgets}
              progress={stats.budgets}
              currency={currency}
              currencySymbol={symbol}
              onSave={(category, cents) => {
                actions.setBudget(category, cents)
                announce(`${category} budget set to ${formatMoney(cents, currency)} a month.`)
              }}
              onRemove={(category) => {
                actions.removeBudget(category)
                announce(`${category} budget removed.`)
              }}
            />
            <MonthlyTotals
              history={stats.history}
              selected={month}
              currency={currency}
              onSelect={setMonth}
            />
          </div>
        </div>
      </main>

      <footer className="footer">
        <DataSettings
          data={data}
          onCurrencyChange={actions.setCurrency}
          onImport={(imported) =>
            setConfirm({
              title: 'Import this backup?',
              message: `It contains ${imported.transactions.length} transactions and ${Object.keys(imported.budgets).length} budgets, and will replace everything currently in PennyPath.`,
              confirmLabel: 'Import',
              onConfirm: () => {
                actions.replaceAll(imported)
                announce('Backup imported.')
              },
            })
          }
          onLoadSample={loadSample}
          onErase={() =>
            setConfirm({
              title: 'Erase all data?',
              message:
                'Every transaction and budget will be permanently deleted from this browser. This can’t be undone.',
              confirmLabel: 'Erase everything',
              onConfirm: () => {
                actions.replaceAll({ ...emptyData(), settings })
                announce('All data erased.')
              },
            })
          }
          onError={(message) => announce(message, true)}
        />
        <p className="footer-note">
          PennyPath · Private by design. No bank connections, no tracking.
        </p>
      </footer>

      <Modal
        open={editor !== null}
        title={editor?.mode === 'edit' ? 'Edit transaction' : 'Add transaction'}
        onClose={() => setEditor(null)}
      >
        <TransactionForm
          key={editor?.mode === 'edit' ? editor.transaction.id : 'new'}
          initial={editor?.mode === 'edit' ? editor.transaction : undefined}
          currencySymbol={symbol}
          onCancel={() => setEditor(null)}
          onSubmit={(input) => {
            if (editor?.mode === 'edit') {
              actions.update(editor.transaction.id, input)
              announce(`${describe(input)} updated.`)
            } else {
              actions.add(input)
              announce(`${describe(input)} added.`)
            }
            setEditor(null)
          }}
        />
      </Modal>

      <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />

      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <p key={toast.id} className={toast.isError ? 'toast toast-error' : 'toast'}>
            <Icon name={toast.isError ? 'alertCircle' : 'checkCircle'} size={18} /> {toast.text}
          </p>
        )}
      </div>
    </>
  )
}
