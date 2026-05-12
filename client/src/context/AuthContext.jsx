import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../api/api'
import { AuthContext } from './context'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return
    }
    localStorage.setItem('token', token)
    if (user) localStorage.setItem('user', JSON.stringify(user))
  }, [token, user])

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      if (!data.success) throw new Error(data.message || 'Login failed')
      setToken(data.data.token)
      setUser(data.data.user)
      return data.data.user
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }, [])

  const value = useMemo(
    () => ({ token, user, loading, login, logout, isAuthenticated: Boolean(token) }),
    [token, user, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
