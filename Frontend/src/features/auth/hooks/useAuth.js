import { useContext, useEffect } from 'react'
import { AuthContext } from '../auth.context'
import { login, logout, getMe, register } from '../services/auth.api'

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  const { user, setUser, loading, setLoading, error, setError } = context

  const handleLogin = async ({ email, password }) => {
    setError('')
    setLoading(true)

    try {
      const data = await login({ email, password })

      if (!data || !data.user) {
        setError('Invalid email or password. Please try again.')
        return false
      }

      setUser(data.user)
      return true
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid email or password. Please try again.')
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async ({ username, email, password }) => {
    setError('')
    setLoading(true)

    try {
      const data = await register({ username, email, password })

      if (!data || !data.user) {
        setError('Registration failed. Please check your details and try again.')
        return false
      }

      setUser(data.user)
      return true
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed. Please try again.')
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    setError('')

    try {
      await logout()
      setUser(null)
      return true
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to logout right now. Please try again.')
      return false
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const getAndsetUser = async () => {
      const data = await getMe()

      if (!data || !data.user) {
        setUser(null)
        setLoading(false)
        return
      }

      setUser(data.user)
      setLoading(false)
    }

    getAndsetUser()
  }, [setUser, setLoading])

  return { user, loading, error, setError, handleLogin, handleLogout, handleRegister }
}
