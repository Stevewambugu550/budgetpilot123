export const INCOME_CATEGORIES = [
  { id: 'Salary',     icon: '💼', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'Business',   icon: '🏪', color: 'bg-teal-100 text-teal-700' },
  { id: 'Freelance',  icon: '💻', color: 'bg-cyan-100 text-cyan-700' },
  { id: 'Investment', icon: '📈', color: 'bg-indigo-100 text-indigo-700' },
  { id: 'Rental',     icon: '🏠', color: 'bg-amber-100 text-amber-700' },
  { id: 'Gift',       icon: '🎁', color: 'bg-pink-100 text-pink-700' },
  { id: 'Bonus',      icon: '🎉', color: 'bg-fuchsia-100 text-fuchsia-700' },
  { id: 'Refund',     icon: '↩️', color: 'bg-lime-100 text-lime-700' },
  { id: 'Transfer',   icon: '🔄', color: 'bg-slate-100 text-slate-600' },
  { id: 'Other',      icon: '✨', color: 'bg-slate-100 text-slate-700' },
]

export const EXPENSE_CATEGORIES = [
  { id: 'Food',           icon: '🍲', color: 'bg-orange-100 text-orange-700',   bucket: 'need' },
  { id: 'Transport',      icon: '🚗', color: 'bg-sky-100 text-sky-700',         bucket: 'need' },
  { id: 'Rent',           icon: '🏠', color: 'bg-amber-100 text-amber-700',     bucket: 'need' },
  { id: 'Utilities',      icon: '💡', color: 'bg-yellow-100 text-yellow-700',   bucket: 'need' },
  { id: 'Internet',       icon: '🌐', color: 'bg-blue-100 text-blue-700',       bucket: 'need' },
  { id: 'Health',         icon: '🩺', color: 'bg-rose-100 text-rose-700',       bucket: 'need' },
  { id: 'Education',      icon: '🎓', color: 'bg-violet-100 text-violet-700',   bucket: 'need' },
  { id: 'Entertainment',  icon: '🎬', color: 'bg-pink-100 text-pink-700',       bucket: 'want' },
  { id: 'Shopping',       icon: '🛍️', color: 'bg-fuchsia-100 text-fuchsia-700', bucket: 'want' },
  { id: 'Family',         icon: '👨‍👩‍👧', color: 'bg-emerald-100 text-emerald-700', bucket: 'want' },
  { id: 'Payroll',        icon: '👷', color: 'bg-slate-200 text-slate-800',     bucket: 'need' },
  { id: 'Savings',        icon: '🐷', color: 'bg-brand-100 text-brand-700',     bucket: 'savings' },
  { id: 'Subscriptions',  icon: '🔁', color: 'bg-cyan-100 text-cyan-700',       bucket: 'want' },
  { id: 'Travel',         icon: '✈️', color: 'bg-indigo-100 text-indigo-700',   bucket: 'want' },
  { id: 'Taxes',          icon: '🧾', color: 'bg-red-100 text-red-700',         bucket: 'need' },
  { id: 'Insurance',      icon: '🛡️', color: 'bg-blue-100 text-blue-700',       bucket: 'need' },
  { id: 'Transfer',       icon: '🔄', color: 'bg-slate-100 text-slate-600',     bucket: 'savings' },
  { id: 'Other',          icon: '📦', color: 'bg-slate-100 text-slate-700',     bucket: 'want' },
]

export const ACCOUNT_TYPES = [
  { id: 'cash',       label: 'Cash',        icon: '💵' },
  { id: 'bank',       label: 'Bank',        icon: '🏦' },
  { id: 'mpesa',      label: 'M-Pesa',      icon: '📱' },
  { id: 'savings',    label: 'Savings',     icon: '🐷' },
  { id: 'credit',     label: 'Credit Card', icon: '💳' },
  { id: 'investment', label: 'Investment',  icon: '📈' },
  { id: 'other',      label: 'Other',       icon: '💼' },
]

export const catMeta = (id, type) => {
  const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  return list.find(c => c.id === id) || { id, icon: '📦', color: 'bg-slate-100 text-slate-700' }
}
