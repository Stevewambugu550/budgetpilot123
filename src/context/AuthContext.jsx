import { createContext, useContext, useEffect, useState } from 'react'
import { callApi, saveSession, clearSession, getLocalUser, getToken } from '../lib/identity'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = getToken()
    const saved = getLocalUser()
    if (token && saved) setUser(saved)
    setLoading(false)
  }, [])

  const signIn = async (email, password) => {
    try {
      const { token, user: u } = await callApi('signin', { email, password })
      saveSession(token, u)
      setUser(u)
      return { error: null }
    } catch (e) {
      return { error: e }
    }
  }

  const signUp = async (email, password, fullName) => {
    try {
      const { token, user: u } = await callApi('signup', { email, password, fullName })
      saveSession(token, u)
      setUser(u)
      return { data: { session: u }, error: null }
    } catch (e) {
      return { data: null, error: e }
    }
  }

  const signOut = () => {
    clearSession()
    setUser(null)
  }

  // Stub — profile is the user object itself (role etc. already in it)
  const refreshProfile = async () => {}

  const role         = (user?.role || 'user').toLowerCase()
  const isSuperAdmin = role === 'superadmin'
  const isAdmin      = role === 'admin' || isSuperAdmin
  const isIT         = role === 'it'
  const canViewAdmin = isAdmin || isSuperAdmin || isIT

  const value = {
    session: user ? { user } : null,
    user,
    profile: user ? { ...user, currency: 'USD', name: user.fullName || 'My Finances' } : null,
    role,
    isAdmin,
    isSuperAdmin,
    isIT,
    canViewAdmin,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  }

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
