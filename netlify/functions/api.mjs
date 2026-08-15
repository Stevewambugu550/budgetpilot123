// BudgetPilot — Netlify Function API
// Auth (users + sessions) stored in Neon Postgres.
// Data (accounts, transactions, etc.) also in Neon Postgres.
// No external auth service. No Netlify Blobs.

import { neon } from '@neondatabase/serverless'
import { createHash, randomBytes } from 'crypto'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

const ok   = (data)         => ({ statusCode: 200, headers: CORS, body: JSON.stringify({ data }) })
const fail = (msg, s = 400) => ({ statusCode: s,   headers: CORS, body: JSON.stringify({ error: msg }) })

const OWNER_EMAIL = 'stevewambugu31@gmail.com'

const hashPwd  = (pw, salt) => createHash('sha256').update(pw + salt).digest('hex')
const newId    = () => randomBytes(16).toString('hex')
const newToken = () => randomBytes(32).toString('hex')

// ─── Handler ──────────────────────────────────────────────────────────
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS }
  if (event.httpMethod !== 'POST') return fail('Method not allowed', 405)

  if (!process.env.DATABASE_URL) return fail('DATABASE_URL not configured', 500)
  const sql = neon(process.env.DATABASE_URL)

  let body
  try { body = JSON.parse(event.body || '{}') } catch { return fail('Invalid JSON') }
  const { action, payload = {} } = body
  if (!action) return fail('Missing action')

  try {
    // Public — no token needed
    if (action === 'signup')       return ok(await signup(sql, payload))
    if (action === 'signin')       return ok(await signin(sql, payload, event))
    if (action === 'googleSignIn') return ok(await googleSignIn(sql, payload))

    // All other actions need a valid session
    const token = (event.headers['authorization'] || '').replace('Bearer ', '').trim()
    if (!token) return fail('Unauthorized', 401)

    // Look up session and purge expired ones in one shot
    const sessions = await sql`
      SELECT * FROM app_sessions
      WHERE token = ${token} AND expires_at > now()
    `
    if (!sessions.length) return fail('Session expired — please log in again', 401)
    const session = sessions[0]

    const result = await dispatch(sql, session, action, payload)
    return ok(result)
  } catch (e) {
    console.error(`[api] ${action}:`, e.message)
    return fail(e.message || 'Internal error', e.status || 500)
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────
async function signup(sql, { email, password, fullName }) {
  if (!email || !password) throw err('Email and password required', 400)
  const key = email.toLowerCase().trim()

  const existing = await sql`SELECT id FROM app_users WHERE email = ${key}`
  if (existing.length) throw err('Email already registered', 409)

  const userId = newId()
  const salt   = newId()
  const role   = key === OWNER_EMAIL ? 'admin' : 'user'
  const name   = (fullName || '').trim()

  await sql`
    INSERT INTO app_users (id, email, full_name, salt, password_hash, role)
    VALUES (${userId}, ${key}, ${name}, ${salt}, ${hashPwd(password, salt)}, ${role})
  `
  // Create matching profile row
  await sql`
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (${userId}, ${key}, ${name}, ${role})
    ON CONFLICT (id) DO NOTHING
  `

  const token    = newToken()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  await sql`
    INSERT INTO app_sessions (token, user_id, email, full_name, role, expires_at)
    VALUES (${token}, ${userId}, ${key}, ${name}, ${role}, ${expiresAt})
  `
  return { token, user: { id: userId, email: key, fullName: name, role } }
}

async function signin(sql, { email, password }, event) {
  if (!email || !password) throw err('Email and password required', 400)
  const key = email.toLowerCase().trim()

  const rows = await sql`SELECT * FROM app_users WHERE email = ${key}`
  const user = rows[0]
  if (!user || hashPwd(password, user.salt) !== user.password_hash)
    throw err('Invalid email or password', 401)
  if (user.active === false)
    throw err('This account has been suspended. Contact an administrator.', 403)

  // Delete expired sessions for this user (housekeeping)
  await sql`DELETE FROM app_sessions WHERE user_id = ${user.id} AND expires_at <= now()`

  const token    = newToken()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  await sql`
    INSERT INTO app_sessions (token, user_id, email, full_name, role, expires_at)
    VALUES (${token}, ${user.id}, ${user.email}, ${user.full_name}, ${user.role}, ${expiresAt})
  `

  // Record login event
  const ip = (event?.headers || {})['x-nf-client-connection-ip'] ||
             (event?.headers || {})['x-forwarded-for'] ||
             (event?.headers || {})['client-ip'] || 'unknown'
  const ua = (event?.headers || {})['user-agent'] || 'unknown'
  const device = parseDevice(ua)
  await Promise.all([
    sql`UPDATE app_users SET last_login_at = now(), login_count = login_count + 1 WHERE id = ${user.id}`,
    sql`INSERT INTO app_login_history (user_id, email, ip, user_agent, device) VALUES (${user.id}, ${user.email}, ${ip}, ${ua}, ${device})`,
  ])

  return { token, user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role } }
}

// ─── Google Sign-In ───────────────────────────────────────────────────
async function googleSignIn(sql, { idToken }) {
  if (!idToken) throw err('Missing Google ID token', 400)

  const res  = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`)
  const info = await res.json()
  if (!res.ok || info.error_description) throw err(info.error_description || 'Invalid Google token', 401)

  const clientId = process.env.GOOGLE_CLIENT_ID
  if (clientId && info.aud !== clientId) throw err('Token audience mismatch', 401)

  const email = (info.email || '').toLowerCase().trim()
  if (!email) throw err('Google account has no email', 400)
  const name  = info.name || email.split('@')[0]

  let rows = await sql`SELECT * FROM app_users WHERE email = ${email}`
  if (!rows.length) {
    const userId = newId()
    const role   = email === OWNER_EMAIL ? 'admin' : 'user'
    await sql`
      INSERT INTO app_users (id, email, full_name, salt, password_hash, role)
      VALUES (${userId}, ${email}, ${name}, '', '', ${role})
    `
    await sql`
      INSERT INTO profiles (id, email, full_name, role)
      VALUES (${userId}, ${email}, ${name}, ${role})
      ON CONFLICT (id) DO NOTHING
    `
    rows = await sql`SELECT * FROM app_users WHERE id = ${userId}`
  }

  const user = rows[0]
  if (user.active === false) throw err('This account has been suspended. Contact an administrator.', 403)

  const token     = newToken()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  await sql`
    INSERT INTO app_sessions (token, user_id, email, full_name, role, expires_at)
    VALUES (${token}, ${user.id}, ${email}, ${user.full_name}, ${user.role}, ${expiresAt})
  `
  return { token, user: { id: user.id, email, fullName: user.full_name, role: user.role } }
}

// Error helper
const err = (msg, status = 400) => Object.assign(new Error(msg), { status })

// Quick device string from user-agent
const parseDevice = (ua) => {
  if (!ua || ua === 'unknown') return 'Unknown device'
  const isMobile = /Mobile|Android|iPhone|iPad|iPod/.test(ua)
  const isTablet = /iPad|Tablet/.test(ua)
  const os = /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : /Android/.test(ua) ? 'Android' : /iPhone|iPad|iPod/.test(ua) ? 'iOS' : 'Other'
  const browser = /Chrome/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : /Firefox/.test(ua) ? 'Firefox' : /Edge/.test(ua) ? 'Edge' : 'Browser'
  const type = isTablet ? 'Tablet' : isMobile ? 'Mobile' : 'Desktop'
  return `${type} · ${os} · ${browser}`
}

// ─── Router ───────────────────────────────────────────────────────────
async function dispatch(sql, session, action, payload) {
  const userId = session.user_id

  switch (action) {
    case 'loadAll':        return loadAll(sql, userId)
    case 'updateSettings': return updateSettings(sql, userId, payload)

    case 'addAccount':    return addAccount(sql, userId, payload)
    case 'updateAccount': return updateAccount(sql, payload)
    case 'deleteAccount': return deleteAccount(sql, payload)

    case 'addTransaction':    return addTransaction(sql, userId, payload)
    case 'updateTransaction': return updateTransaction(sql, userId, payload)
    case 'deleteTransaction': return deleteTransaction(sql, payload)
    case 'importTransactions': return importTransactions(sql, userId, payload)

    case 'addGoal':    return addGoal(sql, userId, payload)
    case 'updateGoal': return updateGoal(sql, payload)
    case 'deleteGoal': return deleteGoal(sql, payload)

    case 'addPerson':    return addPerson(sql, userId, payload)
    case 'updatePerson': return updatePerson(sql, payload)
    case 'deletePerson': return deletePerson(sql, payload)

    case 'addPayment':    return addPayment(sql, userId, payload)
    case 'updatePayment': return updatePayment(sql, payload)
    case 'deletePayment': return deletePayment(sql, payload)

    case 'addBudget':    return addBudget(sql, userId, payload)
    case 'updateBudget': return updateBudget(sql, payload)
    case 'deleteBudget': return deleteBudget(sql, payload)

    case 'addBill':    return addBill(sql, userId, payload)
    case 'updateBill': return updateBill(sql, payload)
    case 'deleteBill': return deleteBill(sql, payload)

    case 'addDebt':    return addDebt(sql, userId, payload)
    case 'updateDebt': return updateDebt(sql, payload)
    case 'deleteDebt': return deleteDebt(sql, payload)

    case 'transfer':  return transfer(sql, userId, payload)
    case 'payPerson': return payPersonAction(sql, userId, payload)
    case 'importAll': return importAll(sql, userId, payload)
    case 'clearAll':  return clearAll(sql, userId)

    case 'adminLoadAll':          return adminLoadAll(sql, session)
    case 'adminLoadUser':         return adminLoadUser(sql, session, payload)
    case 'adminChangeRole':       return adminChangeRole(sql, session, payload)
    case 'adminDeleteTx':         return adminDeleteTx(sql, session, payload)
    case 'adminDeleteAccount':    return adminDeleteAccount(sql, session, payload)
    case 'adminSetUserActive':    return adminSetUserActive(sql, session, payload)
    case 'adminDeleteUser':       return adminDeleteUser(sql, session, payload)
    case 'adminResetPassword':    return adminResetPassword(sql, session, payload)
    case 'adminLoadAuditLog':     return adminLoadAuditLog(sql, session)

    default: throw err(`Unknown action: ${action}`, 400)
  }
}

// ─── Row mappers (snake → camel) ─────────────────────────────────────
const mapAcc  = r => ({ id: r.id, name: r.name, type: r.type, balance: Number(r.balance) || 0, color: r.color, createdAt: r.created_at })
const mapTx   = r => ({ id: r.id, userId: r.user_id, type: r.type, amount: Number(r.amount) || 0, category: r.category, accountId: r.account_id, personId: r.person_id, transferId: r.transfer_id, date: r.date, note: r.note || '' })
const mapGoal = r => ({ id: r.id, name: r.name, target: Number(r.target) || 0, saved: Number(r.saved) || 0, deadline: r.deadline || '', category: r.category || '', note: r.note || '' })
const mapPer  = r => ({ id: r.id, name: r.name, role: r.role || '', monthlyPay: Number(r.monthly_pay) || 0, hireDate: r.hire_date || '', phone: r.phone || '', note: r.note || '', active: !!r.active })
const mapPay  = r => ({ id: r.id, personId: r.person_id, accountId: r.account_id, amount: Number(r.amount) || 0, date: r.date, note: r.note || '' })
const mapBud  = r => ({ id: r.id, category: r.category, monthlyLimit: Number(r.monthly_limit) || 0 })
const mapBill = r => ({ id: r.id, name: r.name, amount: Number(r.amount) || 0, dueDay: r.due_day, frequency: r.frequency, category: r.category, autoPay: !!r.auto_pay, notes: r.notes || '', active: !!r.active, lastPaidDate: r.last_paid_date ? String(r.last_paid_date).slice(0,10) : null })
const mapDebt = r => ({ id: r.id, name: r.name, debtType: r.debt_type, balance: Number(r.balance) || 0, interestRate: Number(r.interest_rate) || 0, minimumPayment: Number(r.minimum_payment) || 0, dueDay: r.due_day ?? null, notes: r.notes || '' })

// ─── loadAll ──────────────────────────────────────────────────────────
async function loadAll(sql, userId) {
  const [profRows, accounts, transactions, goals, people, payments, budgets, bills, debts] = await Promise.all([
    sql`SELECT * FROM profiles WHERE id = ${userId}`,
    sql`SELECT * FROM accounts WHERE user_id = ${userId} ORDER BY created_at`,
    sql`SELECT * FROM transactions WHERE user_id = ${userId} ORDER BY date DESC, created_at DESC`,
    sql`SELECT * FROM goals WHERE user_id = ${userId} ORDER BY created_at`,
    sql`SELECT * FROM people WHERE user_id = ${userId} ORDER BY created_at`,
    sql`SELECT * FROM payments WHERE user_id = ${userId} ORDER BY date DESC`,
    sql`SELECT * FROM budgets WHERE user_id = ${userId} ORDER BY created_at`,
    sql`SELECT * FROM bills WHERE user_id = ${userId} AND active = true ORDER BY due_day`,
    sql`SELECT * FROM debts WHERE user_id = ${userId} ORDER BY created_at`,
  ])
  const p = profRows[0]
  return {
    settings: p ? {
      currency: p.currency || 'USD',
      name: p.workspace_name || 'My Finances',
      monthlyIncomeTarget: Number(p.monthly_income_target) || 0,
      monthlyExpenseLimit: Number(p.monthly_expense_limit) || 0,
    } : null,
    accounts:     accounts.map(mapAcc),
    transactions: transactions.map(mapTx),
    goals:        goals.map(mapGoal),
    people:       people.map(mapPer),
    payments:     payments.map(mapPay),
    budgets:      budgets.map(mapBud),
    bills:        bills.map(mapBill),
    debts:        debts.map(mapDebt),
  }
}

// ─── Settings ─────────────────────────────────────────────────────────
async function updateSettings(sql, userId, p) {
  await sql`UPDATE profiles SET
    currency              = COALESCE(${p.currency ?? null}, currency),
    workspace_name        = COALESCE(${p.name ?? null}, workspace_name),
    monthly_income_target = COALESCE(${p.monthlyIncomeTarget != null ? Number(p.monthlyIncomeTarget) : null}::numeric, monthly_income_target),
    monthly_expense_limit = COALESCE(${p.monthlyExpenseLimit != null ? Number(p.monthlyExpenseLimit) : null}::numeric, monthly_expense_limit)
  WHERE id = ${userId}`
  return null
}

// ─── Accounts ─────────────────────────────────────────────────────────
async function addAccount(sql, userId, a) {
  const rows = await sql`
    INSERT INTO accounts (user_id, name, type, balance, color)
    VALUES (${userId}, ${a.name}, ${a.type || 'bank'}, ${Number(a.balance) || 0}, ${a.color || '#3b82f6'})
    RETURNING *`
  return mapAcc(rows[0])
}
async function updateAccount(sql, { id, ...p }) {
  const rows = await sql`
    UPDATE accounts SET
      name    = COALESCE(${p.name    ?? null}, name),
      type    = COALESCE(${p.type    ?? null}, type),
      balance = COALESCE(${p.balance != null ? Number(p.balance) : null}::numeric, balance),
      color   = COALESCE(${p.color   ?? null}, color)
    WHERE id = ${id}::uuid RETURNING *`
  return mapAcc(rows[0])
}
async function deleteAccount(sql, { id }) {
  await sql`DELETE FROM accounts WHERE id = ${id}::uuid`
  return null
}

// ─── Transactions ─────────────────────────────────────────────────────
async function addTransaction(sql, userId, t) {
  const amt = Number(t.amount) || 0
  const rows = await sql`
    INSERT INTO transactions (user_id, type, amount, category, account_id, person_id, date, note)
    VALUES (${userId}, ${t.type}, ${amt}, ${t.category || ''}, ${t.accountId ?? null}::uuid, ${t.personId ?? null}::uuid, ${t.date}, ${t.note || ''})
    RETURNING *`
  if (t.accountId) {
    const delta = t.type === 'income' ? amt : -amt
    await sql`UPDATE accounts SET balance = balance + ${delta} WHERE id = ${t.accountId}::uuid`
  }
  return mapTx(rows[0])
}
async function importTransactions(sql, userId, rows) {
  const out = []
  for (const t of rows) {
    const amt = Number(t.amount) || 0
    const r = await sql`
      INSERT INTO transactions (user_id, type, amount, category, account_id, person_id, date, note)
      VALUES (${userId}, ${t.type}, ${amt}, ${t.category || ''}, ${t.accountId ?? null}::uuid, ${t.personId ?? null}::uuid, ${t.date}, ${t.note || ''})
      RETURNING *`
    if (t.accountId) {
      const delta = t.type === 'income' ? amt : -amt
      await sql`UPDATE accounts SET balance = balance + ${delta} WHERE id = ${t.accountId}::uuid`
    }
    out.push(mapTx(r[0]))
  }
  return out
}
async function updateTransaction(sql, userId, { id, old: oldTx, ...t }) {
  const amt = Number(t.amount) || 0
  if (oldTx?.accountId) {
    const rev = oldTx.type === 'income' ? -Number(oldTx.amount) : Number(oldTx.amount)
    await sql`UPDATE accounts SET balance = balance + ${rev} WHERE id = ${oldTx.accountId}::uuid`
  }
  if (t.accountId) {
    const delta = t.type === 'income' ? amt : -amt
    await sql`UPDATE accounts SET balance = balance + ${delta} WHERE id = ${t.accountId}::uuid`
  }
  const rows = await sql`
    UPDATE transactions SET
      type = ${t.type}, amount = ${amt}, category = ${t.category || ''},
      account_id = ${t.accountId ?? null}::uuid, date = ${t.date}, note = ${t.note || ''}
    WHERE id = ${id}::uuid RETURNING *`
  return mapTx(rows[0])
}
async function deleteTransaction(sql, { id, accountId, type, amount }) {
  await sql`DELETE FROM transactions WHERE id = ${id}::uuid`
  if (accountId) {
    const delta = type === 'income' ? -Number(amount) : Number(amount)
    await sql`UPDATE accounts SET balance = balance + ${delta} WHERE id = ${accountId}::uuid`
  }
  return null
}

// ─── Goals ────────────────────────────────────────────────────────────
async function addGoal(sql, userId, g) {
  const rows = await sql`
    INSERT INTO goals (user_id, name, target, saved, deadline, category, note)
    VALUES (${userId}, ${g.name}, ${Number(g.target)||0}, ${Number(g.saved)||0}, ${g.deadline||null}, ${g.category||''}, ${g.note||''})
    RETURNING *`
  return mapGoal(rows[0])
}
async function updateGoal(sql, { id, ...g }) {
  const rows = await sql`
    UPDATE goals SET
      name     = COALESCE(${g.name     ?? null}, name),
      target   = COALESCE(${g.target   != null ? Number(g.target)  : null}::numeric, target),
      saved    = COALESCE(${g.saved    != null ? Number(g.saved)   : null}::numeric, saved),
      deadline = COALESCE(${g.deadline ?? null}, deadline),
      category = COALESCE(${g.category ?? null}, category),
      note     = COALESCE(${g.note     ?? null}, note)
    WHERE id = ${id}::uuid RETURNING *`
  return mapGoal(rows[0])
}
async function deleteGoal(sql, { id }) {
  await sql`DELETE FROM goals WHERE id = ${id}::uuid`
  return null
}

// ─── People ───────────────────────────────────────────────────────────
async function addPerson(sql, userId, p) {
  const rows = await sql`
    INSERT INTO people (user_id, name, role, monthly_pay, hire_date, phone, note, active)
    VALUES (${userId}, ${p.name}, ${p.role||''}, ${Number(p.monthlyPay)||0}, ${p.hireDate||null}, ${p.phone||''}, ${p.note||''}, ${p.active!==false})
    RETURNING *`
  return mapPer(rows[0])
}
async function updatePerson(sql, { id, ...p }) {
  const rows = await sql`
    UPDATE people SET
      name        = COALESCE(${p.name       ?? null}, name),
      role        = COALESCE(${p.role       ?? null}, role),
      monthly_pay = COALESCE(${p.monthlyPay != null ? Number(p.monthlyPay) : null}::numeric, monthly_pay),
      hire_date   = COALESCE(${p.hireDate   ?? null}, hire_date),
      phone       = COALESCE(${p.phone      ?? null}, phone),
      note        = COALESCE(${p.note       ?? null}, note),
      active      = COALESCE(${p.active     != null ? Boolean(p.active) : null}::boolean, active)
    WHERE id = ${id}::uuid RETURNING *`
  return mapPer(rows[0])
}
async function deletePerson(sql, { id }) {
  await sql`DELETE FROM people WHERE id = ${id}::uuid`
  return null
}

// ─── Payments ─────────────────────────────────────────────────────────
async function addPayment(sql, userId, p) {
  const rows = await sql`
    INSERT INTO payments (user_id, person_id, account_id, amount, date, note)
    VALUES (${userId}, ${p.personId??null}::uuid, ${p.accountId??null}::uuid, ${Number(p.amount)||0}, ${p.date}, ${p.note||''})
    RETURNING *`
  return mapPay(rows[0])
}
async function updatePayment(sql, { id, ...p }) {
  const rows = await sql`
    UPDATE payments SET
      person_id  = COALESCE(${p.personId  ?? null}::uuid, person_id),
      account_id = COALESCE(${p.accountId ?? null}::uuid, account_id),
      amount     = COALESCE(${p.amount    != null ? Number(p.amount) : null}::numeric, amount),
      date       = COALESCE(${p.date      ?? null}, date),
      note       = COALESCE(${p.note      ?? null}, note)
    WHERE id = ${id}::uuid RETURNING *`
  return mapPay(rows[0])
}
async function deletePayment(sql, { id }) {
  await sql`DELETE FROM payments WHERE id = ${id}::uuid`
  return null
}

// ─── Budgets ──────────────────────────────────────────────────────────
async function addBudget(sql, userId, b) {
  const rows = await sql`
    INSERT INTO budgets (user_id, category, monthly_limit)
    VALUES (${userId}, ${b.category}, ${Number(b.monthlyLimit)||0})
    ON CONFLICT (user_id, category) DO UPDATE SET monthly_limit = EXCLUDED.monthly_limit
    RETURNING *`
  return mapBud(rows[0])
}
async function updateBudget(sql, { id, ...b }) {
  const rows = await sql`
    UPDATE budgets SET
      category      = COALESCE(${b.category     ?? null}, category),
      monthly_limit = COALESCE(${b.monthlyLimit != null ? Number(b.monthlyLimit) : null}::numeric, monthly_limit)
    WHERE id = ${id}::uuid RETURNING *`
  return mapBud(rows[0])
}
async function deleteBudget(sql, { id }) {
  await sql`DELETE FROM budgets WHERE id = ${id}::uuid`
  return null
}

// ─── Bills ────────────────────────────────────────────────────────────
async function addBill(sql, userId, b) {
  const rows = await sql`
    INSERT INTO bills (user_id, name, amount, due_day, frequency, category, auto_pay, notes)
    VALUES (${userId}, ${b.name}, ${Number(b.amount)||0}, ${b.dueDay||1}, ${b.frequency||'monthly'}, ${b.category||'Bills'}, ${!!b.autoPay}, ${b.notes||''})
    RETURNING *`
  return mapBill(rows[0])
}
async function updateBill(sql, { id, ...b }) {
  const rows = await sql`
    UPDATE bills SET
      name           = COALESCE(${b.name           ?? null}, name),
      amount         = COALESCE(${b.amount         != null ? Number(b.amount) : null}::numeric, amount),
      due_day        = COALESCE(${b.dueDay         != null ? Number(b.dueDay) : null}::integer, due_day),
      frequency      = COALESCE(${b.frequency      ?? null}, frequency),
      category       = COALESCE(${b.category       ?? null}, category),
      auto_pay       = COALESCE(${b.autoPay        != null ? Boolean(b.autoPay) : null}::boolean, auto_pay),
      notes          = COALESCE(${b.notes          ?? null}, notes),
      active         = COALESCE(${b.active         != null ? Boolean(b.active) : null}::boolean, active),
      last_paid_date = COALESCE(${b.lastPaidDate   ?? null}::date, last_paid_date)
    WHERE id = ${id}::uuid RETURNING *`
  return mapBill(rows[0])
}
async function deleteBill(sql, { id }) {
  await sql`DELETE FROM bills WHERE id = ${id}::uuid`
  return null
}

// ─── Debts ────────────────────────────────────────────────────────────
async function addDebt(sql, userId, d) {
  const rows = await sql`
    INSERT INTO debts (user_id, name, debt_type, balance, interest_rate, minimum_payment, due_day, notes)
    VALUES (${userId}, ${d.name}, ${d.debtType||'other'}, ${Number(d.balance)||0}, ${Number(d.interestRate)||0}, ${Number(d.minimumPayment)||0}, ${d.dueDay??null}, ${d.notes||''})
    RETURNING *`
  return mapDebt(rows[0])
}
async function updateDebt(sql, { id, ...d }) {
  const rows = await sql`
    UPDATE debts SET
      name            = COALESCE(${d.name           ?? null}, name),
      debt_type       = COALESCE(${d.debtType       ?? null}, debt_type),
      balance         = COALESCE(${d.balance        != null ? Number(d.balance)        : null}::numeric, balance),
      interest_rate   = COALESCE(${d.interestRate   != null ? Number(d.interestRate)   : null}::numeric, interest_rate),
      minimum_payment = COALESCE(${d.minimumPayment != null ? Number(d.minimumPayment) : null}::numeric, minimum_payment),
      due_day         = COALESCE(${d.dueDay         != null ? Number(d.dueDay)         : null}::integer, due_day),
      notes           = COALESCE(${d.notes          ?? null}, notes)
    WHERE id = ${id}::uuid RETURNING *`
  return mapDebt(rows[0])
}
async function deleteDebt(sql, { id }) {
  await sql`DELETE FROM debts WHERE id = ${id}::uuid`
  return null
}

// ─── Transfer ─────────────────────────────────────────────────────────
async function transfer(sql, userId, { fromId, toId, amount, note }) {
  const amt = Number(amount) || 0
  if (!amt || !fromId || !toId || fromId === toId) throw err('Invalid transfer')
  const tid   = newId()
  const today = new Date().toISOString().slice(0, 10)
  await Promise.all([
    sql`INSERT INTO transactions (user_id,type,amount,category,account_id,transfer_id,date,note) VALUES (${userId},'expense',${amt},'Transfer',${fromId}::uuid,${tid}::uuid,${today},${note||''})`,
    sql`INSERT INTO transactions (user_id,type,amount,category,account_id,transfer_id,date,note) VALUES (${userId},'income', ${amt},'Transfer',${toId}::uuid,  ${tid}::uuid,${today},${note||''})`,
    sql`UPDATE accounts SET balance = balance - ${amt} WHERE id = ${fromId}::uuid`,
    sql`UPDATE accounts SET balance = balance + ${amt} WHERE id = ${toId}::uuid`,
  ])
  return null
}

// ─── Pay Person ───────────────────────────────────────────────────────
async function payPersonAction(sql, userId, { personId, amount, accountId, note }) {
  const amt   = Number(amount) || 0
  const today = new Date().toISOString().slice(0, 10)
  await Promise.all([
    sql`INSERT INTO payments (user_id,person_id,account_id,amount,date,note) VALUES (${userId},${personId}::uuid,${accountId??null}::uuid,${amt},${today},${note||''})`,
    accountId ? sql`INSERT INTO transactions (user_id,type,amount,category,account_id,date,note) VALUES (${userId},'expense',${amt},'Payroll',${accountId}::uuid,${today},${note||''})` : sql`SELECT 1`,
    accountId ? sql`UPDATE accounts SET balance = balance - ${amt} WHERE id = ${accountId}::uuid` : sql`SELECT 1`,
  ])
  return null
}

// ─── Import / Clear ───────────────────────────────────────────────────
async function importAll(sql, userId, { accounts=[], transactions=[], goals=[], people=[], payments=[], budgets=[], bills=[], debts=[] }) {
  await clearAll(sql, userId)
  const today = new Date().toISOString().slice(0,10)
  for (const a of accounts)     await sql`INSERT INTO accounts (user_id,name,type,balance,color) VALUES (${userId},${a.name},${a.type||'bank'},${Number(a.balance)||0},${a.color||'#3b82f6'})`
  for (const t of transactions) await sql`INSERT INTO transactions (user_id,type,amount,category,date,note) VALUES (${userId},${t.type},${Number(t.amount)||0},${t.category||''},${t.date||today},${t.note||''})`
  for (const g of goals)        await sql`INSERT INTO goals (user_id,name,target,saved,deadline,category,note) VALUES (${userId},${g.name},${Number(g.target)||0},${Number(g.saved)||0},${g.deadline||null},${g.category||''},${g.note||''})`
  for (const p of people)       await sql`INSERT INTO people (user_id,name,role,monthly_pay,hire_date,phone,note,active) VALUES (${userId},${p.name},${p.role||''},${Number(p.monthlyPay)||0},${p.hireDate||null},${p.phone||''},${p.note||''},${p.active!==false})`
  for (const b of budgets)      await sql`INSERT INTO budgets (user_id,category,monthly_limit) VALUES (${userId},${b.category},${Number(b.monthlyLimit)||0}) ON CONFLICT (user_id,category) DO UPDATE SET monthly_limit=EXCLUDED.monthly_limit`
  for (const b of bills)        await sql`INSERT INTO bills (user_id,name,amount,due_day,frequency,category,auto_pay,notes) VALUES (${userId},${b.name},${Number(b.amount)||0},${b.dueDay||1},${b.frequency||'monthly'},${b.category||'Bills'},${!!b.autoPay},${b.notes||''})`
  for (const d of debts)        await sql`INSERT INTO debts (user_id,name,debt_type,balance,interest_rate,minimum_payment,due_day,notes) VALUES (${userId},${d.name},${d.debtType||'other'},${Number(d.balance)||0},${Number(d.interestRate)||0},${Number(d.minimumPayment)||0},${d.dueDay??null},${d.notes||''})`
  return null
}
async function clearAll(sql, userId) {
  await Promise.all([sql`DELETE FROM payments WHERE user_id=${userId}`, sql`DELETE FROM budgets WHERE user_id=${userId}`, sql`DELETE FROM bills WHERE user_id=${userId}`, sql`DELETE FROM debts WHERE user_id=${userId}`])
  await sql`DELETE FROM transactions WHERE user_id=${userId}`
  await sql`DELETE FROM goals WHERE user_id=${userId}`
  await sql`DELETE FROM people WHERE user_id=${userId}`
  await sql`DELETE FROM accounts WHERE user_id=${userId}`
  return null
}

// ─── Admin ────────────────────────────────────────────────────────────
// Permission model:
//   it         — read only, can view everything, cannot mutate anything
//   admin      — full CRUD on users/data, can change roles (except granting/revoking superadmin),
//                can suspend/reactivate users, cannot permanently delete a user account
//   superadmin — everything admin can do, plus granting/revoking superadmin and permanently deleting users
const CAN_VIEW   = ['it', 'admin', 'superadmin']
const CAN_EDIT   = ['admin', 'superadmin']
const CAN_DELETE_USER = ['superadmin']

function requireAdmin(session) {
  if (!CAN_VIEW.includes(session.role)) throw err('Forbidden', 403)
}
function requireEdit(session) {
  if (!CAN_EDIT.includes(session.role)) throw err('Read-only role: this account cannot make changes', 403)
}
function requireSuperadmin(session) {
  if (!CAN_DELETE_USER.includes(session.role)) throw err('Only a superadmin can perform this action', 403)
}

async function logAudit(sql, session, action, target = {}, details = '') {
  try {
    await sql`
      INSERT INTO admin_audit_log (actor_id, actor_email, action, target_id, target_email, details)
      VALUES (${session.user_id}, ${session.email}, ${action}, ${target.id ?? null}, ${target.email ?? null}, ${details})
    `
  } catch (e) { console.error('[audit log]', e.message) }
}

async function adminLoadAll(sql, session) {
  requireAdmin(session)
  const [profiles, transactions] = await Promise.all([
    sql`SELECT id, email, full_name AS "fullName", role, active, last_login_at AS "lastLoginAt", login_count AS "loginCount", created_at AS "createdAt" FROM app_users ORDER BY created_at DESC`,
    sql`SELECT * FROM transactions ORDER BY created_at DESC LIMIT 500`,
  ])
  return { profiles, transactions: transactions.map(mapTx) }
}

async function adminLoadUser(sql, session, { targetUserId }) {
  requireAdmin(session)
  const [accounts, transactions, goals, people, payments, loginHistory] = await Promise.all([
    sql`SELECT * FROM accounts     WHERE user_id=${targetUserId} ORDER BY created_at`,
    sql`SELECT * FROM transactions WHERE user_id=${targetUserId} ORDER BY date DESC`,
    sql`SELECT * FROM goals        WHERE user_id=${targetUserId}`,
    sql`SELECT * FROM people       WHERE user_id=${targetUserId}`,
    sql`SELECT * FROM payments     WHERE user_id=${targetUserId} ORDER BY date DESC`,
    sql`SELECT id, email, ip, user_agent AS "userAgent", device, created_at AS "createdAt" FROM app_login_history WHERE user_id=${targetUserId} ORDER BY created_at DESC LIMIT 50`,
  ])
  return { accounts: accounts.map(mapAcc), transactions: transactions.map(mapTx), goals: goals.map(mapGoal), people: people.map(mapPer), payments: payments.map(mapPay), loginHistory }
}

async function adminChangeRole(sql, session, { targetUserId, role }) {
  requireEdit(session)
  if (targetUserId === session.user_id) throw err("You can't change your own role", 400)
  if (role === 'superadmin' || (await sql`SELECT role FROM app_users WHERE id = ${targetUserId}`)[0]?.role === 'superadmin') {
    requireSuperadmin(session)
  }
  const [target] = await sql`SELECT email FROM app_users WHERE id = ${targetUserId}`
  await Promise.all([
    sql`UPDATE app_users SET role = ${role} WHERE id = ${targetUserId}`,
    sql`UPDATE profiles  SET role = ${role} WHERE id = ${targetUserId}`,
  ])
  await logAudit(sql, session, 'change_role', { id: targetUserId, email: target?.email }, `New role: ${role}`)
  return null
}

async function adminDeleteTx(sql, session, { txId, accountId, type, amount }) {
  requireEdit(session)
  await logAudit(sql, session, 'delete_transaction', { id: txId }, `${type} ${amount}`)
  return deleteTransaction(sql, { id: txId, accountId, type, amount })
}

async function adminDeleteAccount(sql, session, { accountId }) {
  requireEdit(session)
  await logAudit(sql, session, 'delete_account', { id: accountId })
  await sql`DELETE FROM accounts WHERE id = ${accountId}::uuid`
  return null
}

async function adminSetUserActive(sql, session, { targetUserId, active }) {
  requireEdit(session)
  if (targetUserId === session.user_id) throw err("You can't suspend your own account", 400)
  const [target] = await sql`SELECT email, role FROM app_users WHERE id = ${targetUserId}`
  if (target?.role === 'superadmin') requireSuperadmin(session)
  await sql`UPDATE app_users SET active = ${!!active} WHERE id = ${targetUserId}`
  if (!active) await sql`DELETE FROM app_sessions WHERE user_id = ${targetUserId}`
  await logAudit(sql, session, active ? 'reactivate_user' : 'suspend_user', { id: targetUserId, email: target?.email })
  return null
}

async function adminDeleteUser(sql, session, { targetUserId }) {
  requireSuperadmin(session)
  if (targetUserId === session.user_id) throw err("You can't delete your own account", 400)
  const [target] = await sql`SELECT email FROM app_users WHERE id = ${targetUserId}`
  await Promise.all([
    sql`DELETE FROM payments          WHERE user_id = ${targetUserId}`,
    sql`DELETE FROM budgets           WHERE user_id = ${targetUserId}`,
    sql`DELETE FROM transactions      WHERE user_id = ${targetUserId}`,
    sql`DELETE FROM goals             WHERE user_id = ${targetUserId}`,
    sql`DELETE FROM people            WHERE user_id = ${targetUserId}`,
    sql`DELETE FROM accounts          WHERE user_id = ${targetUserId}`,
    sql`DELETE FROM app_login_history WHERE user_id = ${targetUserId}`,
  ])
  await sql`DELETE FROM profiles     WHERE id = ${targetUserId}`
  await sql`DELETE FROM app_sessions WHERE user_id = ${targetUserId}`
  await sql`DELETE FROM app_users    WHERE id = ${targetUserId}`
  await logAudit(sql, session, 'delete_user', { id: targetUserId, email: target?.email })
  return null
}

async function adminResetPassword(sql, session, { targetUserId }) {
  requireEdit(session)
  const [target] = await sql`SELECT email FROM app_users WHERE id = ${targetUserId}`
  if (!target) throw err('User not found', 404)
  const tempPassword = randomBytes(6).toString('hex')
  const salt = newId()
  await sql`UPDATE app_users SET salt = ${salt}, password_hash = ${hashPwd(tempPassword, salt)} WHERE id = ${targetUserId}`
  await sql`DELETE FROM app_sessions WHERE user_id = ${targetUserId}`
  await logAudit(sql, session, 'reset_password', { id: targetUserId, email: target.email })
  return { tempPassword }
}

async function adminLoadAuditLog(sql, session) {
  requireAdmin(session)
  const rows = await sql`SELECT * FROM admin_audit_log ORDER BY created_at DESC LIMIT 300`
  return rows.map(r => ({
    id: r.id, actorEmail: r.actor_email, action: r.action,
    targetEmail: r.target_email, details: r.details, createdAt: r.created_at,
  }))
}
