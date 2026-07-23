import { createContext, useContext, useState, useCallback } from 'react'
import client from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('ems_user')
    return raw ? JSON.parse(raw) : null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const login = useCallback(async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      const form = new URLSearchParams()
      form.append('username', email)
      form.append('password', password)
      const { data } = await client.post('/auth/login', form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      localStorage.setItem('ems_token', data.access_token)
      localStorage.setItem('ems_user', JSON.stringify(data.user))
      setUser(data.user)
      return data.user
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (name, email, password) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await client.post('/auth/register', { name, email, password })
      localStorage.setItem('ems_token', data.access_token)
      localStorage.setItem('ems_user', JSON.stringify(data.user))
      setUser(data.user)
      return data.user
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('ems_token')
    localStorage.removeItem('ems_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
