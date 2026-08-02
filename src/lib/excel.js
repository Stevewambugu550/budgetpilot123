import * as XLSX from 'xlsx'

const todayStamp = () => new Date().toISOString().slice(0, 10)

const accName = (accounts, id) => accounts.find(a => a.id === id)?.name || ''

// Export the user's full ledger to a multi-sheet .xlsx file
export const exportToExcel = (data, filename) => {
  const { transactions = [], accounts = [], goals = [], people = [], payments = [], settings = {} } = data

  const txRows = transactions.map(t => ({
    Date:        t.date,
    Type:        t.type,
    Amount:      Number(t.amount) || 0,
    Category:    t.category,
    Account:     accName(accounts, t.accountId),
    Note:        t.note || '',
  }))

  const accRows = accounts.map(a => ({
    Name:    a.name,
    Type:    a.type,
    Balance: Number(a.balance) || 0,
    Created: (a.createdAt || '').slice(0, 10),
  }))

  const goalRows = goals.map(g => ({
    Name:        g.name,
    Target:      Number(g.target) || 0,
    Saved:       Number(g.saved) || 0,
    Remaining:   Math.max(0, (Number(g.target) || 0) - (Number(g.saved) || 0)),
    'Progress %': g.target > 0 ? Math.round((g.saved / g.target) * 100) : 0,
    Deadline:    g.deadline || '',
    Note:        g.note || '',
  }))

  const peopleRows = people.map(p => ({
    Name:        p.name,
    Role:        p.role || '',
    'Monthly Pay': Number(p.monthlyPay) || 0,
    'Hire Date': p.hireDate || '',
    Phone:       p.phone || '',
    Active:      p.active ? 'Yes' : 'No',
    Note:        p.note || '',
  }))

  const payRows = payments.map(p => ({
    Date:    p.date,
    Person:  people.find(x => x.id === p.personId)?.name || '',
    Amount:  Number(p.amount) || 0,
    Account: accName(accounts, p.accountId),
    Note:    p.note || '',
  }))

  // Summary
  const income  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0)
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0)
  const netWorth = accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0)
  const summaryRows = [
    { Metric: 'Currency',           Value: settings.currency || 'USD' },
    { Metric: 'Workspace',          Value: settings.name || 'My Finances' },
    { Metric: 'Generated on',       Value: new Date().toLocaleString() },
    { Metric: 'Total Income (all)', Value: income },
    { Metric: 'Total Expense (all)',Value: expense },
    { Metric: 'Net Worth',          Value: netWorth },
    { Metric: 'Accounts',           Value: accounts.length },
    { Metric: 'Transactions',       Value: transactions.length },
    { Metric: 'Goals',              Value: goals.length },
    { Metric: 'People',             Value: people.length },
  ]

  const wb = XLSX.utils.book_new()
  const sheets = [
    ['Summary',      summaryRows],
    ['Transactions', txRows],
    ['Accounts',     accRows],
    ['Goals',        goalRows],
    ['People',       peopleRows],
    ['Payments',     payRows],
  ]
  for (const [name, rows] of sheets) {
    const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Empty: '—' }])
    // Auto-size columns roughly
    const cols = Object.keys(rows[0] || { Empty: '' }).map(k => ({ wch: Math.max(12, k.length + 2) }))
    ws['!cols'] = cols
    XLSX.utils.book_append_sheet(wb, ws, name)
  }

  XLSX.writeFile(wb, filename || `budgetpilot-${todayStamp()}.xlsx`)
}

// CSV export for just transactions
export const exportTransactionsCSV = (transactions, accounts, filename) => {
  const rows = transactions.map(t => ({
    Date:     t.date,
    Type:     t.type,
    Amount:   Number(t.amount) || 0,
    Category: t.category,
    Account:  accName(accounts, t.accountId),
    Note:     (t.note || '').replace(/[\r\n]+/g, ' '),
  }))
  const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Empty: '—' }])
  const csv = XLSX.utils.sheet_to_csv(ws)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `transactions-${todayStamp()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
