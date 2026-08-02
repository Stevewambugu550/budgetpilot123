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
    if (action === 'signup') return ok(await signup(sql, payload))
    if (action === 'signin') return ok(await signin(sql, payload))

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

async function signin(sql, { email, password }) {
  if (!email || !password) throw err('Email and password required', 400)
  const key = email.toLowerCase().trim()

  const rows = await sql`SELECT * FROM app_users WHERE email = ${key}`
  const user = rows[0]
  if (!user || hashPwd(password, user.salt) !== user.password_hash)
    throw err('Invalid email or password', 401)

  // Delete expired sessions for this user (housekeeping)
  await sql`DELETE FROM app_sessions WHERE user_id = ${user.id} AND expires_at <= now()`

  const token    = newToken()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  await sql`
    INSERT INTO app_sessions (token, user_id, email, full_name, role, expires_at)
    VALUES (${token}, ${user.id}, ${user.email}, ${user.full_name}, ${user.role}, ${expiresAt})
  `
  return { token, user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role } }
}

// Error helper
const err = (msg, status = 400) => Object.assign(new Error(msg), { status })

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

    case 'transfer':  return transfer(sql, userId, payload)
    case 'payPerson': return payPersonAction(sql, userId, payload)
    case 'importAll': return importAll(sql, userId, payload)
    case 'clearAll':  return clearAll(sql, userId)

    case 'adminLoadAll':       return adminLoadAll(sql, session)
    case 'adminLoadUser':      return adminLoadUser(sql, session, payload)
    case 'adminChangeRole':    return adminChangeRole(sql, session, payload)
    case 'adminDeleteTx':      return adminDeleteTx(sql, session, payload)
    case 'adminDeleteAccount': return adminDeleteAccount(sql, session, payload)

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

// ─── loadAll ──────────────────────────────────────────────────────────
async function loadAll(sql, userId) {
  const [profRows, accounts, transactions, goals, people, payments, budgets] = await Promise.all([
    sql`SELECT * FROM profiles WHERE id = ${userId}`,
    sql`SELECT * FROM accounts WHERE user_id = ${userId} ORDER BY created_at`,
    sql`SELECT * FROM transactions WHERE user_id = ${userId} ORDER BY date DESC, created_at DESC`,
    sql`SELECT * FROM goals WHERE user_id = ${userId} ORDER BY created_at`,
    sql`SELECT * FROM people WHERE user_id = ${userId} ORDER BY created_at`,
    sql`SELECT * FROM payments WHERE user_id = ${userId} ORDER BY date DESC`,
    sql`SELECT * FROM budgets WHERE user_id = ${userId} ORDER BY created_at`,
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
async function importAll(sql, userId, { accounts=[], transactions=[], goals=[], people=[], payments=[], budgets=[] }) {
  await clearAll(sql, userId)
  const today = new Date().toISOString().slice(0,10)
  for (const a of accounts)     await sql`INSERT INTO accounts (user_id,name,type,balance,color) VALUES (${userId},${a.name},${a.type||'bank'},${Number(a.balance)||0},${a.color||'#3b82f6'})`
  for (const t of transactions) await sql`INSERT INTO transactions (user_id,type,amount,category,date,note) VALUES (${userId},${t.type},${Number(t.amount)||0},${t.category||''},${t.date||today},${t.note||''})`
  for (const g of goals)        await sql`INSERT INTO goals (user_id,name,target,saved,deadline,category,note) VALUES (${userId},${g.name},${Number(g.target)||0},${Number(g.saved)||0},${g.deadline||null},${g.category||''},${g.note||''})`
  for (const p of people)       await sql`INSERT INTO people (user_id,name,role,monthly_pay,hire_date,phone,note,active) VALUES (${userId},${p.name},${p.role||''},${Number(p.monthlyPay)||0},${p.hireDate||null},${p.phone||''},${p.note||''},${p.active!==false})`
  for (const b of budgets)      await sql`INSERT INTO budgets (user_id,category,monthly_limit) VALUES (${userId},${b.category},${Number(b.monthlyLimit)||0}) ON CONFLICT (user_id,category) DO UPDATE SET monthly_limit=EXCLUDED.monthly_limit`
  return null
}
async function clearAll(sql, userId) {
  await Promise.all([sql`DELETE FROM payments WHERE user_id=${userId}`, sql`DELETE FROM budgets WHERE user_id=${userId}`])
  await sql`DELETE FROM transactions WHERE user_id=${userId}`
  await sql`DELETE FROM goals WHERE user_id=${userId}`
  await sql`DELETE FROM people WHERE user_id=${userId}`
  await sql`DELETE FROM accounts WHERE user_id=${userId}`
  return null
}

// ─── Admin ────────────────────────────────────────────────────────────
function requireAdmin(session) {
  if (!['admin','superadmin','it'].includes(session.role))
    throw err('Forbidden', 403)
}

async function adminLoadAll(sql, session) {
  requireAdmin(session)
  const [profiles, transactions] = await Promise.all([
    sql`SELECT id, email, full_name AS "fullName", role, created_at AS "createdAt" FROM app_users ORDER BY created_at DESC`,
    sql`SELECT * FROM transactions ORDER BY created_at DESC LIMIT 500`,
  ])
  return { profiles, transactions: transactions.map(mapTx) }
}

async function adminLoadUser(sql, session, { targetUserId }) {
  requireAdmin(session)
  const [accounts, transactions, goals, people, payments] = await Promise.all([
    sql`SELECT * FROM accounts     WHERE user_id=${targetUserId} ORDER BY created_at`,
    sql`SELECT * FROM transactions WHERE user_id=${targetUserId} ORDER BY date DESC`,
    sql`SELECT * FROM goals        WHERE user_id=${targetUserId}`,
    sql`SELECT * FROM people       WHERE user_id=${targetUserId}`,
    sql`SELECT * FROM payments     WHERE user_id=${targetUserId} ORDER BY date DESC`,
  ])
  return { accounts: accounts.map(mapAcc), transactions: transactions.map(mapTx), goals: goals.map(mapGoal), people: people.map(mapPer), payments: payments.map(mapPay) }
}

async function adminChangeRole(sql, session, { targetUserId, role }) {
  requireAdmin(session)
  await Promise.all([
    sql`UPDATE app_users SET role = ${role} WHERE id = ${targetUserId}`,
    sql`UPDATE profiles  SET role = ${role} WHERE id = ${targetUserId}`,
  ])
  return null
}

async function adminDeleteTx(sql, session, { txId, accountId, type, amount }) {
  requireAdmin(session)
  return deleteTransaction(sql, { id: txId, accountId, type, amount })
}

async function adminDeleteAccount(sql, session, { accountId }) {
  requireAdmin(session)
  await sql`DELETE FROM accounts WHERE id = ${accountId}::uuid`
  return null
}
