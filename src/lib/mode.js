// Single source of truth: hostname.
// Any URL containing "admin" -> admin mode. Everything else -> user mode.
// Optional ?mode=admin override for local testing only.

const host = typeof window !== 'undefined' && window.location ? window.location.hostname : ''
const search = typeof window !== 'undefined' && window.location ? window.location.search : ''
const override = new URLSearchParams(search).get('mode')

export const APP_MODE = (override === 'admin' || /admin/i.test(host)) ? 'admin' : 'user'
export const IS_ADMIN_BUILD = APP_MODE === 'admin'
