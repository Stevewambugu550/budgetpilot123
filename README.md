# BudgetPilot — *Your money, charted.*

A personal & small-business finance tracker built for anyone, anywhere. Track income, expenses, savings goals, payroll for workers, and multiple accounts — all in one beautiful dashboard. Export to Excel or CSV. Optional cloud sync & admin panel via Supabase.

## Features
- 📊 **Dashboard** with net worth, monthly trends, category breakdown
- 💸 **Transactions** — income & expense with rich categories and accounts
- 🎯 **Goals & Targets** with progress bars and deadlines
- 👷 **People & Payroll** — workers, monthly pay, payment history
- 🏦 **Accounts** — Cash, Bank, M-Pesa, Savings, Credit, Investments
- 🌍 **Multi-currency** (KES, USD, EUR, GBP)
- 💾 **Backup & restore** via JSON export
- 📱 **Mobile-friendly**, works offline

All data is stored locally in your browser. Use the Export button in Settings to back it up.

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:5174

## Build for production
```bash
npm run build
```
Output is in `dist/`.

## Stack
React 18 · Vite · Tailwind CSS · Recharts · Lucide icons
