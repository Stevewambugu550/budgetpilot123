// Token-based auth — no external service.
// The session token is stored in localStorage and sent with every API call.

const TOKEN_KEY = 'bp_token'
const USER_KEY  = 'bp_user'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const getLocalUser = () => {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null') } catch { return null }
}

export const saveSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

/** POST to the Netlify Function, optionally with auth token. */
export const callApi = async (action, payload = {}) => {
  const token = getToken()
  const res = await fetch('/.netlify/functions/api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action, payload }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || `API error ${res.status}`)
  return json.data
}
