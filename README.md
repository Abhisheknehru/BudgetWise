# BudgetWise

A simple, beautiful personal budget tracker built with React. Track your income and expenses, view spending analytics, and sync everything to Google Sheets.

## Features

- **Track Income & Expenses** — Log transactions with categories, notes, and dates
- **Live Balance** — See your current balance update in real-time
- **Spending Analytics** — Visual breakdowns by category with charts
- **Google Sheets Sync** — Auto-syncs every 60 seconds with daily totals and separators
- **CSV Export** — Download your data as a CSV file
- **Offline-First** — All data saved locally in your browser (works without internet)
- **PWA Ready** — Install as an app on your phone

## Tech Stack

- React 19 + Vite
- Recharts (charts)
- Google Apps Script (Sheets integration)
- localStorage (persistence)

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Google Sheets Integration

See [GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md) for step-by-step instructions to connect your budget data to Google Sheets.

## Deploy

This is a static site — deploy free on Vercel, Netlify, or GitHub Pages:

```bash
npm run build   # outputs to dist/
```

Upload the `dist/` folder to any static hosting provider.
