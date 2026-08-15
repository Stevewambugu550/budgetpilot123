// BudgetPilot — AI chat assistant.
// Tries multiple free AI providers in order, based on whichever API keys are
// configured as environment variables. Falls back automatically if one fails
// or is rate-limited. Requires a valid session token, same as api.mjs.

import { neon } from '@neondatabase/serverless'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

const ok   = (data)         => ({ statusCode: 200, headers: CORS, body: JSON.stringify({ data }) })
const fail = (msg, s = 400) => ({ statusCode: s,   headers: CORS, body: JSON.stringify({ error: msg }) })

const SYSTEM_PROMPT = `You are the BudgetPilot AI assistant, a helpful, concise personal-finance coach built into a budgeting app.
You can see a summary of the user's current financial data below. Use it to answer their questions,
give practical budgeting advice, and point out patterns. Keep answers short and actionable unless asked
for detail. Never invent numbers that aren't in the provided data. If you don't have enough information,
say so and suggest what the user could add or check in the app.

You can also perform simple actions in the app. If the user asks you to add a transaction, set a budget,
add an account, or add a goal, end your reply with the marker [ACTION] followed by a single-line JSON
object with "action" and "payload" keys. Use the exact account names from the summary. Use "Other" for
unknown categories. Valid actions: addTransaction, setBudget, addAccount, addGoal.

Example: "Done — I added it. [ACTION] {\"action\":\"addTransaction\",\"payload\":{\"type\":\"expense\",\"amount\":2000,\"category\":\"Food\",\"account\":\"KCB Current\",\"note\":\"Lunch\",\"date\":\"2025-01-15\"}}"`

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS }
  if (event.httpMethod !== 'POST') return fail('Method not allowed', 405)

  let body
  try { body = JSON.parse(event.body || '{}') } catch { return fail('Invalid JSON') }
  const { messages = [], context = '' } = body
  if (!Array.isArray(messages) || !messages.length) return fail('Missing messages')

  // Require a valid session so the chat isn't wide open to abuse.
  if (!process.env.DATABASE_URL) return fail('DATABASE_URL not configured', 500)
  const sql = neon(process.env.DATABASE_URL)
  const token = (event.headers['authorization'] || '').replace('Bearer ', '').trim()
  if (!token) return fail('Unauthorized', 401)
  const sessions = await sql`SELECT * FROM app_sessions WHERE token = ${token} AND expires_at > now()`
  if (!sessions.length) return fail('Session expired — please log in again', 401)

  const fullMessages = [
    { role: 'system', content: `${SYSTEM_PROMPT}\n\nUser's financial summary:\n${context || 'No data available yet.'}` },
    ...messages.slice(-12), // keep the last few turns only
  ]

  const providers = [
    () => callGemini(fullMessages),
    () => callGroq(fullMessages),
    () => callOpenRouter(fullMessages),
  ]

  const errors = []
  for (const call of providers) {
    try {
      const reply = await call()
      if (reply) return ok({ reply })
    } catch (e) {
      errors.push(e.message)
    }
  }

  return fail(
    errors.length
      ? `All AI providers failed or are not configured. Details: ${errors.join(' | ')}`
      : 'No AI provider is configured. Set GROQ_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY.',
    502
  )
}

// ─── Groq (fast, free tier, Llama 3.x models) ─────────────────────────
async function callGroq(messages) {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY not set')
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.4,
      max_tokens: 600,
    }),
  })
  if (!res.ok) throw new Error(`Groq: ${res.status} ${await res.text()}`)
  const json = await res.json()
  return json.choices?.[0]?.message?.content?.trim()
}

// ─── Google Gemini (free tier) ─────────────────────────────────────────
async function callGemini(messages) {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY not set')
  const system = messages.find(m => m.role === 'system')?.content || ''
  const turns = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: turns,
        generationConfig: { temperature: 0.4, maxOutputTokens: 600 },
      }),
    }
  )
  if (!res.ok) throw new Error(`Gemini: ${res.status} ${await res.text()}`)
  const json = await res.json()
  return json.candidates?.[0]?.content?.parts?.map(p => p.text).join('').trim()
}

// ─── OpenRouter (free models) ───────────────────────────────────────────
async function callOpenRouter(messages) {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) throw new Error('OPENROUTER_API_KEY not set')
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      'HTTP-Referer': 'https://budgetpilot-2026.netlify.app',
      'X-Title': 'BudgetPilot',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      messages,
      temperature: 0.4,
      max_tokens: 600,
    }),
  })
  if (!res.ok) throw new Error(`OpenRouter: ${res.status} ${await res.text()}`)
  const json = await res.json()
  return json.choices?.[0]?.message?.content?.trim()
}
