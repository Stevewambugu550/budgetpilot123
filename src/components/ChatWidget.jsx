import { useEffect, useRef, useState } from 'react'
import {
  MessageCircle, X, Send, Bot, Loader2,
  Settings2, ExternalLink, Copy, Check, Sparkles, Key,
  MessageSquare, Wand2
} from 'lucide-react'
import { buildFinancialContext, sendChatMessage } from '../lib/chat'
import { useToast } from '../context/ToastContext'
import { addTransaction, addAccount, addGoal, addBudget, updateBudget } from '../lib/storage'
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, ACCOUNT_TYPES } from '../lib/categories'
import { fmtMoney } from '../lib/format'

const WELCOME = {
  role: 'assistant',
  content: "Hi! I'm BudgetPilot AI. Ask me about your spending, budgets, savings goals, or how to improve your finances. I can chat in-app, or I can link you to a free online AI bot if you prefer.",
}

const STORAGE_KEY = 'bp_chat_open'

const FREE_BOTS = [
  { name: 'ChatGPT', url: 'https://chat.openai.com', icon: '💬' },
  { name: 'Google Gemini', url: 'https://gemini.google.com', icon: '✨' },
  { name: 'Microsoft Copilot', url: 'https://copilot.microsoft.com', icon: '🛡️' },
  { name: 'Claude', url: 'https://claude.ai/new', icon: '🧠' },
  { name: 'Groq Chat', url: 'https://chat.groq.com', icon: '⚡' },
  { name: 'Hugging Chat', url: 'https://huggingface.co/chat', icon: '🤗' },
]

const FREE_TIER_APIS = [
  { name: 'Groq', env: 'GROQ_API_KEY', link: 'https://console.groq.com/keys' },
  { name: 'Gemini', env: 'GEMINI_API_KEY', link: 'https://aistudio.google.com/app/apikey' },
  { name: 'OpenRouter', env: 'OPENROUTER_API_KEY', link: 'https://openrouter.ai/keys' },
]

const makePrompt = (data, question) => {
  const context = buildFinancialContext(data)
  return `Act as my BudgetPilot personal-finance assistant. Use the following summary of my finances to answer my question. Do not invent numbers that are not in the summary.

${context}

My question: ${question || 'How am I doing financially and what should I focus on?'}`
}

export default function ChatWidget({ data }) {
  const toast = useToast()
  const [open, setOpen] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([WELCOME])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('chat') // 'chat' | 'options'
  const [copied, setCopied] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const endRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { localStorage.setItem(STORAGE_KEY, String(open)) }, [open])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, open])
  useEffect(() => { if (open && mode === 'chat') inputRef.current?.focus() }, [open, mode])

  const parseAction = (reply) => {
    const idx = reply.indexOf('[ACTION]')
    if (idx === -1) return { text: reply, action: null }
    const text = reply.slice(0, idx).trim()
    const raw = reply.slice(idx + 8).trim()
    try {
      const parsed = JSON.parse(raw)
      return { text, action: parsed }
    } catch {
      return { text: reply, action: null }
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setError('')
    setPendingAction(null)
    const next = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setLoading(true)

    try {
      const context = buildFinancialContext(data)
      const reply = await sendChatMessage(next, context)
      const { text: displayText, action } = parseAction(reply)
      setMessages([...next, { role: 'assistant', content: displayText }])
      if (action) setPendingAction(action)
    } catch (err) {
      const msg = err.message || 'Something went wrong. Please try again.'
      setError(msg)
      if (msg.toLowerCase().includes('not configured') || msg.toLowerCase().includes('not set')) {
        setMode('options')
      }
    } finally {
      setLoading(false)
    }
  }

  const resolveAccount = (name) => data.accounts.find(a => a.name.toLowerCase() === (name || '').toLowerCase())
  const validType = (t) => ['income', 'expense'].includes(t) ? t : 'expense'
  const validCategory = (type, cat) => {
    const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
    const found = list.find(c => c.id.toLowerCase() === (cat || '').toLowerCase())
    return found ? found.id : 'Other'
  }
  const today = () => new Date().toISOString().slice(0, 10)

  const executeAction = async () => {
    if (!pendingAction) return
    const { action, payload } = pendingAction
    try {
      if (action === 'addTransaction') {
        const type = validType(payload.type)
        const category = validCategory(type, payload.category)
        const account = resolveAccount(payload.account)
        const amount = Math.abs(Number(payload.amount) || 0)
        if (!amount) throw new Error('Missing amount')
        if (!account) throw new Error(`Account "${payload.account}" not found. Tell the user the exact account name.`)
        await addTransaction({
          type,
          amount,
          category,
          accountId: account.id,
          date: payload.date || today(),
          note: payload.note || `${category} via AI`,
        })
        toast.success(`Added ${type}: ${fmtMoney(amount, data.settings.currency)} to ${account.name}`)
      } else if (action === 'addAccount') {
        const type = ACCOUNT_TYPES.find(t => t.id === (payload.type || '').toLowerCase()) ? payload.type.toLowerCase() : 'bank'
        const balance = Number(payload.balance) || 0
        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b']
        const color = colors[Math.floor(Math.random() * colors.length)]
        await addAccount({ name: (payload.name || 'New account').trim(), type, balance, color })
        toast.success(`Account "${payload.name}" added`)
      } else if (action === 'addGoal') {
        const target = Math.abs(Number(payload.target) || 0)
        if (!target) throw new Error('Missing target amount')
        await addGoal({
          name: (payload.name || 'Goal').trim(),
          target,
          saved: Number(payload.saved) || 0,
          deadline: payload.deadline || '',
          category: payload.category || 'Savings',
          note: payload.note || '',
        })
        toast.success(`Goal "${payload.name}" added`)
      } else if (action === 'setBudget') {
        const category = validCategory('expense', payload.category)
        const limit = Math.abs(Number(payload.monthlyLimit) || 0)
        if (!limit) throw new Error('Missing monthly limit')
        const existing = data.budgets?.find(b => b.category.toLowerCase() === category.toLowerCase())
        if (existing) await updateBudget(existing.id, { monthlyLimit: limit })
        else await addBudget({ category, monthlyLimit: limit })
        toast.success(`Budget for ${category} set to ${fmtMoney(limit, data.settings.currency)}`)
      } else {
        throw new Error(`Unknown action: ${action}`)
      }
      setMessages(prev => [...prev, { role: 'assistant', content: `Done — I've applied the ${action} for you.` }])
    } catch (e) {
      toast.error(e.message || 'Action failed')
    } finally {
      setPendingAction(null)
    }
  }

  const prompt = makePrompt(data, input)
  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="w-14 h-14 rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700 transition flex items-center justify-center"
          aria-label="Open AI assistant"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {open && (
        <div className="w-[90vw] max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col" style={{ maxHeight: '70vh' }}>
          <div className="bg-brand-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <span className="font-semibold text-sm">BudgetPilot AI</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMode(m => m === 'options' ? 'chat' : 'options')}
                className="p-1.5 rounded-md hover:bg-white/10"
                aria-label="AI chat options"
                title="AI chat options"
              >
                <Settings2 className="w-5 h-5" />
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-md hover:bg-white/10" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {mode === 'options' ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-slate-50" style={{ minHeight: '18rem' }}>
              <section>
                <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-brand-600" /> Built-in chat
                </h4>
                <p className="text-xs text-slate-600 mb-3">
                  Add a free API key to the Netlify environment for one of these providers. The app will try them in order.
                </p>
                <div className="space-y-2">
                  {FREE_TIER_APIS.map(a => (
                    <a
                      key={a.name}
                      href={a.link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg text-sm hover:border-brand-400 hover:shadow-sm transition"
                    >
                      <span className="flex items-center gap-2"><Key className="w-4 h-4 text-slate-400" /> {a.name}</span>
                      <span className="text-xs text-slate-400 font-mono">{a.env}</span>
                    </a>
                  ))}
                </div>
              </section>

              <section>
                <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-brand-600" /> Free online AI bots
                </h4>
                <p className="text-xs text-slate-600 mb-3">
                  No API key needed. Copy the prompt below, open your favourite free chatbot, and paste it.
                </p>
                <div className="space-y-2 mb-3">
                  {FREE_BOTS.map(b => (
                    <a
                      key={b.name}
                      href={b.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg text-sm hover:border-brand-400 hover:shadow-sm transition"
                    >
                      <span className="flex items-center gap-2"><span>{b.icon}</span> {b.name}</span>
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                    </a>
                  ))}
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-500">Pre-filled prompt</span>
                    <button
                      onClick={copyPrompt}
                      className="text-xs flex items-center gap-1 text-brand-600 hover:text-brand-700"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 max-h-28 overflow-y-auto whitespace-pre-wrap">
                    {prompt}
                  </p>
                </div>
              </section>

              <button
                onClick={() => setMode('chat')}
                className="w-full btn-primary text-sm py-2"
              >
                Back to chat
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50" style={{ minHeight: '18rem' }}>
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                        m.role === 'user'
                          ? 'bg-brand-600 text-white rounded-br-none'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {pendingAction && (
                  <div className="flex justify-start">
                    <div className="bg-brand-50 border border-brand-200 rounded-xl rounded-bl-none px-3 py-2 text-sm w-full">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Wand2 className="w-4 h-4 text-brand-600" />
                        <span className="font-semibold text-brand-800">Suggested action</span>
                      </div>
                      <p className="text-xs text-slate-600 mb-2">
                        {pendingAction.action}: {JSON.stringify(pendingAction.payload)}
                      </p>
                      <button
                        onClick={executeAction}
                        className="btn-primary text-xs py-1.5 px-3"
                      >
                        <Check className="w-3.5 h-3.5" /> Confirm
                      </button>
                    </div>
                  </div>
                )}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 rounded-xl rounded-bl-none px-3 py-2 text-sm text-slate-500 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Thinking…
                    </div>
                  </div>
                )}
                {error && (
                  <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-2">
                    {error}
                  </div>
                )}
                <div ref={endRef} />
              </div>

              <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e) }}
                  placeholder="Ask about your budget…"
                  className="flex-1 min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="btn-primary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  )
}
