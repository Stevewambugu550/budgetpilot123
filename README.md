# BudgetPilot — *Your money, charted.*

BudgetPilot is a modern, high-performance financial management suite built with React 19, TypeScript, Tailwind CSS, and Express. It includes zero-based envelope budgeting, multi-user authentication with role-based access control (RBAC), an AI savings advisor, interactive spending visualizations, and a realistic mobile phone app simulator with an optical receipt scanner.

All data is stored securely and privately in your browser (`localStorage`), and can be exported to JSON/CSV for backups at any time.

## Features

### 📊 Financial Intelligence & Envelope Budgeting
- **Zero-Based Budgeting**: Allocate every dollar across customizable categories with real-time health badges.
- **50/30/20 Rule Analysis**: Automated breakdown of Needs, Wants, and Savings with targeted rebalancing recommendations.
- **Interactive Spending Wave**: Canvas/SVG curves showing day-by-day cash flow velocity and peak spending days.
- **Category Donut & Segmented Progress**: Visual proportion wheels and merchant leaderboards.

### 🔐 Multi-User Authentication & Security Enclave
- **Authentication**: Google OAuth-style 1-click login, email/password registration, and demo persona switching.
- **Role-Based Access Control (RBAC)**: 5 permission tiers — Super Admin, Manager, Editor, Viewer, Auditor.
- **2FA / TOTP Security**: Built-in two-factor authentication generator and verification.
- **Privacy Cloak**: 1-click toggle to mask all financial balances when working in public.
- **PIN Vault & Auto-Lock Screen**: 4-digit PIN pad with biometric simulation.

### 📱 Mobile App Experience & AI Receipt Scanner
- **Mobile Phone Simulator**: Switch between iPhone and Android skins with responsive touch navigation.
- **AI Optical Receipt Scanner**: Scan or upload receipts to automatically extract merchant, date, tax, and itemized amounts.
- **PWA Ready**: Offline storage and Add to Home Screen instructions for iOS and Android.

### 💡 Savings Goals & Compound Wealth Engine
- **Target Milestones**: Multi-contributor emergency funds, vacation vaults, and down payment trackers.
- **Compound Growth Simulator**: Forecast household wealth 5, 10, 20, and 30 years into the future with variable return rates.
- **Recurring Bill Tracker**: Calendar schedule with overdue alerts and split-cost calculations per household member.

### 🤖 AI Savings Advisor
- Powered by Google Gemini when a `GEMINI_API_KEY` is configured (via the `/api/ai-advisor` Netlify Function).
- Falls back automatically to instant, rules-based financial insights computed from your own budget data if no key is set or the AI is unavailable.

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000

## Test the Netlify Functions locally
```bash
npm install -g netlify-cli   # if not already installed
netlify dev
```

## Build for production
```bash
npm run build
```
Output is in `dist/`, ready to deploy to Netlify (see `netlify.toml`).

## Deploy
```powershell
powershell -ExecutionPolicy Bypass -File .\redeploy.ps1
```
This builds the app and deploys the same bundle to the linked Netlify site(s).

## Environment variables
Set these in the Netlify dashboard (Site settings → Environment variables) or in a local `.env` file for `npm run dev`:
- `GEMINI_API_KEY` — optional; enables real AI-generated advice from the AI Savings Advisor. Without it, the advisor still works using local rules-based insights.

## Stack
React 19 · TypeScript · Vite · Tailwind CSS v4 · Express (local dev) · Netlify Functions (production API) · Lucide icons · Framer Motion
