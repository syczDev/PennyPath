import { useId, useRef, type ChangeEvent } from 'react'
import type { AppData } from '../types'
import { CURRENCIES } from '../lib/money'
import { sanitizeData } from '../lib/storage'
import { todayISO } from '../lib/dates'
import { Icon } from './Icon'

interface DataSettingsProps {
  data: AppData
  onCurrencyChange: (currency: string) => void
  onImport: (data: AppData) => void
  onLoadSample: () => void
  onErase: () => void
  onError: (message: string) => void
}

export function DataSettings({
  data,
  onCurrencyChange,
  onImport,
  onLoadSample,
  onErase,
  onError,
}: DataSettingsProps) {
  const id = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const currencies: string[] = [...CURRENCIES]
  if (!currencies.includes(data.settings.currency)) currencies.push(data.settings.currency)

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `pennypath-backup-${todayISO()}.json`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  async function importData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const parsed = sanitizeData(JSON.parse(await file.text()))
      if (!parsed) throw new Error('not a backup')
      onImport(parsed)
    } catch {
      onError('That file isn’t a PennyPath backup, so nothing was imported.')
    }
  }

  return (
    <section className="settings" aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>Settings &amp; data</h2>
      <div className="settings-row">
        <div className="field field-inline">
          <label htmlFor={`${id}-currency`}>Currency</label>
          <select
            id={`${id}-currency`}
            value={data.settings.currency}
            onChange={(e) => onCurrencyChange(e.target.value)}
          >
            {currencies.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="settings-actions">
          <button
            type="button"
            className="button button-secondary button-small"
            onClick={exportData}
          >
            <Icon name="download" size={16} /> Export backup
          </button>
          <button
            type="button"
            className="button button-secondary button-small"
            onClick={() => fileRef.current?.click()}
          >
            <Icon name="upload" size={16} /> Import backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="visually-hidden"
            tabIndex={-1}
            aria-hidden="true"
            onChange={importData}
          />
          <button
            type="button"
            className="button button-secondary button-small"
            onClick={onLoadSample}
          >
            <Icon name="sparkles" size={16} /> Load sample data
          </button>
          <button
            type="button"
            className="button button-danger-ghost button-small"
            onClick={onErase}
          >
            <Icon name="trash" size={16} /> Erase all data
          </button>
        </div>
      </div>
      <p className="settings-note">
        Your data is saved in this browser’s local storage and never leaves your device. Export a
        backup to move it to another browser.
      </p>
    </section>
  )
}
