import { getToken } from './identity'
import { fmtMoney, ymKey } from './format'

/** Builds a compact text summary of the user's finances to ground the AI's answers. */
export const buildFinancialContext = (data) => {
  const { settings, accounts = [], transactions = [], goals = [], people = [], budgets = [] } = data
  const cur = settings.currency
  const thisYM = ymKey(new Date().toISOString())

  const netWorth = accounts.reduce((s, a) => s + (a.balance || 0), 0)
  const monthTx  = transactions.filter(t => ymKey(t.date) === thisYM)
  const income   = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense  = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const byCategory = new Map()
  for (const t of monthTx) {
    if (t.type !== 'expense') continue
    byCategory.set(t.category, (byCategory.get(t.category) || 0) + t.amount)
  }
  const topCategories = [...byCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)

  const lines = [
    `Currency: ${cur}`,
    `Net worth (sum of all account balances): ${fmtMoney(netWorth, cur)}`,
    `Accounts (${accounts.length}): ${accounts.map(a => `${a.name} [${a.type}] = ${fmtMoney(a.balance, cur)}`).join('; ') || 'none'}`,
    `This month's income: ${fmtMoney(income, cur)}`,
    `This month's expenses: ${fmtMoney(expense, cur)}`,
    topCategories.length ? `Top expense categories this month: ${topCategories.map(([c, v]) => `${c}=${fmtMoney(v, cur)}`).join(', ')}` : 'No expenses recorded yet this month.',
    settings.monthlyIncomeTarget ? `Monthly income target: ${fmtMoney(settings.monthlyIncomeTarget, cur)}` : '',
    settings.monthlyExpenseLimit ? `Monthly expense limit: ${fmtMoney(settings.monthlyExpenseLimit, cur)}` : '',
    budgets.length ? `Budgets: ${budgets.map(b => `${b.category} limit=${fmtMoney(b.monthlyLimit, cur)}`).join('; ')}` : 'No budgets set yet.',
    goals.length ? `Goals: ${goals.map(g => `${g.name} ${fmtMoney(g.saved, cur)}/${fmtMoney(g.target, cur)}`).join('; ')}` : 'No savings goals yet.',
    people.length ? `People tracked for payroll: ${people.filter(p => p.active).length} active` : '',
  ].filter(Boolean)

  return lines.join('\n')
}

/** Sends the conversation + context to the chat function and returns the assistant's reply. */
export const sendChatMessage = async (messages, context) => {
  const token = getToken?.() // identity.js exports getToken via localStorage token in this app
  const res = await fetch('/.netlify/functions/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages, context }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || `Chat error ${res.status}`)
  return json.data.reply
}
