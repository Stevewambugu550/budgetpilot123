-- ============================================================
-- BudgetPilot — Neon (Postgres) schema
-- Run this once in your Neon SQL editor to set up the database.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── AUTH: USERS ─────────────────────────────────────────────
-- Stores email/password accounts (no external auth service needed).
CREATE TABLE IF NOT EXISTS app_users (
  id            text PRIMARY KEY,          -- random hex UUID
  email         text UNIQUE NOT NULL,
  full_name     text DEFAULT '',
  salt          text NOT NULL,
  password_hash text NOT NULL,
  role          text NOT NULL DEFAULT 'user'
                  CHECK (role IN ('user','it','admin','superadmin')),
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

-- ─── AUDIT LOG ───────────────────────────────────────────────
-- Records every admin action for accountability.
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     text NOT NULL,
  actor_email  text NOT NULL,
  action       text NOT NULL,
  target_id    text,
  target_email text,
  details      text DEFAULT '',
  created_at   timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_created_idx ON admin_audit_log(created_at DESC);

-- ─── AUTH: SESSIONS ──────────────────────────────────────────
-- Token-based sessions (30-day expiry). Cleaned up on signin.
CREATE TABLE IF NOT EXISTS app_sessions (
  token      text PRIMARY KEY,
  user_id    text NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  email      text NOT NULL,
  full_name  text DEFAULT '',
  role       text DEFAULT 'user',
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_idx  ON app_sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON app_sessions(expires_at);

-- ─── PROFILES ────────────────────────────────────────────────
-- Per-user settings (currency, workspace name, targets).
CREATE TABLE IF NOT EXISTS profiles (
  id                    text PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
  email                 text NOT NULL DEFAULT '',
  full_name             text DEFAULT '',
  phone                 text DEFAULT '',
  role                  text NOT NULL DEFAULT 'user'
                          CHECK (role IN ('user','it','admin','superadmin')),
  currency              text DEFAULT 'USD',
  workspace_name        text DEFAULT 'My Finances',
  monthly_income_target numeric DEFAULT 0,
  monthly_expense_limit numeric DEFAULT 0,
  created_at            timestamptz DEFAULT now()
);

-- ─── ACCOUNTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    text NOT NULL,
  name       text NOT NULL,
  type       text DEFAULT 'bank',
  balance    numeric DEFAULT 0,
  color      text DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS accounts_user_idx ON accounts(user_id);

-- ─── TRANSACTIONS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text NOT NULL,
  type        text NOT NULL CHECK (type IN ('income','expense')),
  amount      numeric NOT NULL DEFAULT 0,
  category    text DEFAULT '',
  account_id  uuid REFERENCES accounts(id) ON DELETE SET NULL,
  person_id   uuid,
  transfer_id uuid,
  date        text NOT NULL DEFAULT '',
  note        text DEFAULT '',
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tx_user_idx  ON transactions(user_id);
CREATE INDEX IF NOT EXISTS tx_date_idx  ON transactions(date DESC);

-- ─── GOALS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goals (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    text NOT NULL,
  name       text NOT NULL,
  target     numeric DEFAULT 0,
  saved      numeric DEFAULT 0,
  deadline   text DEFAULT '',
  category   text DEFAULT '',
  note       text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS goals_user_idx ON goals(user_id);

-- ─── PEOPLE ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS people (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text NOT NULL,
  name        text NOT NULL,
  role        text DEFAULT '',
  monthly_pay numeric DEFAULT 0,
  hire_date   text DEFAULT '',
  phone       text DEFAULT '',
  note        text DEFAULT '',
  active      boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS people_user_idx ON people(user_id);

-- ─── PAYMENTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    text NOT NULL,
  person_id  uuid REFERENCES people(id) ON DELETE SET NULL,
  account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  amount     numeric NOT NULL DEFAULT 0,
  date       text NOT NULL DEFAULT '',
  note       text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payments_user_idx ON payments(user_id);

-- ─── BUDGETS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budgets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       text NOT NULL,
  category      text NOT NULL,
  monthly_limit numeric NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (user_id, category)
);
CREATE INDEX IF NOT EXISTS budgets_user_idx ON budgets(user_id);
