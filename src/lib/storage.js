// Netlify Functions + Blobs-backed data layer for BudgetPilot.
// Data is stored camelCase in Blobs, so no mapping needed.

import { callApi } from './identity'

// ─── In-memory cache ─────────────────────────────────────────────────
const EMPTY = {
  settings:     { currency: 'USD', name: 'My Finances', monthlyIncomeTarget: 0, monthlyExpenseLimit: 0 },
  accounts:     [],
  transactions: [],
  goals:        [],
  people:       [],
  payments:     [],
  budgets:      [],
  bills:        [],
  debts:        [],
  ready:        false,
}

let cache = structuredClone(EMPTY)
let listeners = []
let currentUserId = null

const emit = () => { for (const cb of listeners) cb(cache) }

export const getData = () => cache

export const subscribe = (cb) => {
  listeners.push(cb)
  cb(cache)
  return () => { listeners = listeners.filter(x => x !== cb) }
}

export const loadAll = async (userId) => {
  if (!userId) { cache = { ...EMPTY, ready: true }; emit(); return }
  currentUserId = userId
  try {
    const d = await callApi('loadAll')
    // API returns camelCase (mapped from Postgres snake_case in api.mjs)
    cache = {
      settings:     d.settings     || EMPTY.settings,
      accounts:     d.accounts     || [],
      transactions: d.transactions || [],
      goals:        d.goals        || [],
      people:       d.people       || [],
      payments:     d.payments     || [],
      budgets:      d.budgets      || [],
      bills:        d.bills         || [],
      debts:        d.debts         || [],
      ready:        true,
    }
  } catch (e) {
    console.error('loadAll error:', e)
    cache = { ...EMPTY, ready: true }
  }
  emit()
}

export const resetCache = () => {
  currentUserId = null
  cache = structuredClone(EMPTY)
  emit()
}

// ─── Helper: reload full data from server ────────────────────────────
const reload = async () => {
  const d = await callApi('loadAll')
  cache = {
    settings:     d.settings     || EMPTY.settings,
    accounts:     d.accounts     || [],
    transactions: d.transactions || [],
    goals:        d.goals        || [],
    people:       d.people       || [],
    payments:     d.payments     || [],
    budgets:      d.budgets      || [],
    bills:        d.bills         || [],
    debts:        d.debts         || [],
    ready:        true,
  }
  emit()
}

// ─── Settings ────────────────────────────────────────────────────────
export const updateSettings = async (patch) => {
  if (!currentUserId) return
  cache = { ...cache, settings: { ...cache.settings, ...patch } }
  emit()
  await callApi('updateSettings', patch)
}

// ─── Accounts ────────────────────────────────────────────────────────
export const addAccount = async (a) => {
  if (!currentUserId) return
  await callApi('addAccount', a)
  await reload()
}
export const updateAccount = async (id, patch) => {
  await callApi('updateAccount', { id, ...patch })
  await reload()
}
export const deleteAccount = async (id) => {
  await callApi('deleteAccount', { id })
  await reload()
}

// ─── Transactions ─────────────────────────────────────────────────────
export const addTransaction = async (t) => {
  if (!currentUserId) return
  await callApi('addTransaction', t)
  await reload()
}
export const importTransactions = async (rows) => {
  if (!currentUserId) return
  await callApi('importTransactions', rows)
  await reload()
}
export const updateTransaction = async (id, patch) => {
  const oldTx = cache.transactions.find(t => t.id === id)
  await callApi('updateTransaction', { id, old: oldTx, ...patch })
  await reload()
}
export const deleteTransaction = async (id) => {
  const tx = cache.transactions.find(t => t.id === id)
  await callApi('deleteTransaction', { id, accountId: tx?.accountId, type: tx?.type, amount: tx?.amount })
  await reload()
}

// ─── Goals ───────────────────────────────────────────────────────────
export const addGoal = async (g) => {
  if (!currentUserId) return
  await callApi('addGoal', g)
  await reload()
}
export const updateGoal = async (id, patch) => {
  await callApi('updateGoal', { id, ...patch })
  await reload()
}
export const deleteGoal = async (id) => {
  await callApi('deleteGoal', { id })
  await reload()
}
export const contributeGoal = async (id, amount) => {
  const goal = cache.goals.find(g => g.id === id)
  if (!goal) return
  await updateGoal(id, { saved: (goal.saved || 0) + Number(amount) })
}

// ─── People ──────────────────────────────────────────────────────────
export const addPerson = async (p) => {
  if (!currentUserId) return
  await callApi('addPerson', p)
  await reload()
}
export const updatePerson = async (id, patch) => {
  await callApi('updatePerson', { id, ...patch })
  await reload()
}
export const deletePerson = async (id) => {
  await callApi('deletePerson', { id })
  await reload()
}
export const payPerson = async (personId, amount, accountId, note) => {
  if (!currentUserId) return
  await callApi('payPerson', { personId, amount, accountId, note })
  await reload()
}

// ─── Payments ────────────────────────────────────────────────────────
export const addPayment = async (p) => {
  if (!currentUserId) return
  await callApi('addPayment', p)
  await reload()
}
export const updatePayment = async (id, patch) => {
  await callApi('updatePayment', { id, ...patch })
  await reload()
}
export const deletePayment = async (id) => {
  await callApi('deletePayment', { id })
  await reload()
}

// ─── Budgets ─────────────────────────────────────────────────────────
export const addBudget = async (b) => {
  if (!currentUserId) return
  await callApi('addBudget', b)
  await reload()
}
export const updateBudget = async (id, patch) => {
  await callApi('updateBudget', { id, ...patch })
  await reload()
}
export const deleteBudget = async (id) => {
  await callApi('deleteBudget', { id })
  await reload()
}

// ─── Bills ──────────────────────────────────────────────────────────────
export const addBill = async (b) => {
  if (!currentUserId) return
  await callApi('addBill', b)
  await reload()
}
export const updateBill = async (id, patch) => {
  await callApi('updateBill', { id, ...patch })
  await reload()
}
export const deleteBill = async (id) => {
  await callApi('deleteBill', { id })
  await reload()
}
export const markBillPaid = async (id) => {
  const today = new Date().toISOString().slice(0, 10)
  await updateBill(id, { lastPaidDate: today })
}

// ─── Debts ──────────────────────────────────────────────────────────────
export const addDebt = async (d) => {
  if (!currentUserId) return
  await callApi('addDebt', d)
  await reload()
}
export const updateDebt = async (id, patch) => {
  await callApi('updateDebt', { id, ...patch })
  await reload()
}
export const deleteDebt = async (id) => {
  await callApi('deleteDebt', { id })
  await reload()
}

// ─── Accounts helpers ─────────────────────────────────────────────────────
export const transfer = (fromId, toId, amount, note) => {
  const amt = Number(amount) || 0
  if (!amt || !fromId || !toId || fromId === toId) return false
  callApi('transfer', { fromId, toId, amount: amt, note }).then(reload)
  return true
}

// ─── Settings helpers ─────────────────────────────────────────────────
export const exportJSON = () => {
  const { settings, accounts, transactions, goals, people, payments, budgets, bills, debts } = cache
  return JSON.stringify({ settings, accounts, transactions, goals, people, payments, budgets, bills, debts }, null, 2)
}

export const importJSON = (jsonStr) => {
  try {
    const d = JSON.parse(jsonStr)
    if (!d || typeof d !== 'object') return false
    callApi('importAll', d).then(reload)
    return true
  } catch { return false }
}

export const clearAll = () => {
  if (!currentUserId) return
  callApi('clearAll').then(reload)
}
