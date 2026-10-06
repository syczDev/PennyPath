# PennyPath

Log expenses, set budgets, and see where your money goes.

PennyPath is a private personal expense tracker that runs entirely in your browser. It's built with
React, TypeScript and Vite, and saves everything to `localStorage`. There are no accounts, no bank
connections, no paid APIs and no tracking.

## Features

- **Income and expenses.** Add, edit and delete transactions, each with an amount, date, category
  and an optional note.
- **Current balance.** Your all-time income minus all-time expenses.
- **Monthly totals.** Income, expenses, net and savings rate for the selected month, plus a
  six-month chart with a table that holds the same numbers.
- **Spending by category.** A ranked breakdown of the month's expenses, with amounts and shares.
- **Searchable transaction list.** Free-text search across notes, categories, dates and amounts
  (for example `groceries 45.50`). You can also filter by month or all time, by type and by
  category. Results are grouped by day.
- **Monthly category budgets.** Set a monthly limit for any expense category. Each budget is marked
  **On track**, **Close to limit** (80% or more used) or **Over budget**. A banner at the top of the
  dashboard lists every budget that needs attention.
- **Your data stays yours.** Everything is saved to `localStorage` as you go and kept in sync
  across open tabs. You can export and import a JSON backup, load sample data, or erase everything.
- **Responsive and accessible.** The layout works from a 320px phone up to a desktop, in both light
  and dark mode. See [Accessibility](#accessibility) for details.

## Getting started

You need [Node.js](https://nodejs.org/) **22.12 or newer** and npm.

```bash
git clone https://github.com/syczDev/PennyPath.git
cd PennyPath
npm install
npm run dev
```

Then open the URL that Vite prints (usually <http://localhost:5173>). To look around without typing
anything, click **Explore with sample data** on the welcome card.

### Production build

```bash
npm run build     # type-checks, then builds static files into dist/
npm run preview   # serves dist/ locally to check the build
```

`dist/` is plain static HTML, CSS and JS, so you can host it anywhere: GitHub Pages, Netlify,
Cloudflare Pages, S3 or any web server. No backend is needed.

### Scripts

| Command                | What it does                               |
| ---------------------- | ------------------------------------------ |
| `npm run dev`          | Start the dev server with hot reload       |
| `npm run build`        | Type-check and build for production        |
| `npm run preview`      | Serve the production build locally         |
| `npm test`             | Run the unit tests once (Vitest)           |
| `npm run test:watch`   | Run the tests in watch mode                |
| `npm run typecheck`    | Run the TypeScript compiler without output |
| `npm run lint`         | Lint with oxlint                           |
| `npm run format`       | Format the code with Prettier              |
| `npm run format:check` | Check formatting without changing files    |

## How your data is stored

Everything is saved under a single `localStorage` key, `pennypath:data:v1`:

```jsonc
{
  "version": 1,
  "transactions": [
    {
      "id": "…",
      "type": "expense", // or "income"
      "amountCents": 1299, // stored as whole cents to avoid floating-point errors
      "date": "2026-10-06", // local calendar date
      "category": "Dining",
      "note": "Lunch",
      "createdAt": 1791300000000,
    },
  ],
  "budgets": { "Dining": 8000 }, // monthly limit per category, in cents
  "settings": { "currency": "USD" },
}
```

- Data is checked when it's loaded or imported. Malformed entries are dropped, so the app still
  opens if storage gets corrupted.
- If the browser refuses to save (storage full or disabled), PennyPath shows a warning and suggests
  exporting a backup.
- `localStorage` belongs to one browser on one device. To move your data, use **Export backup** and
  then **Import backup** in the other browser. Clearing your browser's site data deletes it.

## Accessibility

- Semantic landmarks and headings, plus a "Skip to main content" link.
- Every control has a label. Icon-only buttons have descriptive names, such as
  "Edit Rent, −$1,450.00".
- Dialogs use the native `<dialog>` element, which traps focus, closes with Escape and returns
  focus when closed. Confirmations put initial focus on **Cancel**.
- Form errors are linked to their fields with `aria-invalid` and `aria-describedby`. Focus moves
  to the first invalid field.
- Confirmations ("Transaction added") are announced through a polite live region.
- Budget status never relies on color alone: each state has its own icon and text label.
- The chart's numbers also appear in a real data table.
- Visible focus rings, color contrast that meets WCAG AA, and support for `prefers-color-scheme`,
  `prefers-reduced-motion` and Windows High Contrast (`forced-colors`).

The production build was checked with axe-core (WCAG 2.2 AA rules) in light and dark mode, with no
violations reported.

## Project structure

```
src/
  App.tsx                 Page layout and top-level state wiring
  types.ts                Shared data types
  state/useAppData.ts     Reducer plus localStorage persistence and cross-tab sync
  lib/
    money.ts              Amount parsing and currency formatting (integer cents)
    dates.ts              Local-date helpers (YYYY-MM-DD, YYYY-MM)
    stats.ts              Balance, monthly totals, category spending, budgets, search
    storage.ts            Load, save and validate data
    categories.ts         Built-in income and expense categories
    sample.ts             Demo data generator
  components/             UI components (dialogs, panels, lists, chart)
  index.css               Design tokens and styles (light and dark)
```

The business logic in `src/lib` and `src/state` is plain TypeScript with unit tests next to it
(`*.test.ts`).
