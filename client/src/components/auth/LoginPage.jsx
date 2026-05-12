import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

export default function LoginPage() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const user = await login(email, password)
      if (user.role === 'driver') navigate('/driver/dashboard')
      else navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid credentials')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-white p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="text-center text-3xl font-bold text-brand-700">FleetTrack 🚛</h1>
        <p className="mt-2 text-center text-sm text-slate-500">Sign in to manage trips and fleet operations</p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <input
            className="w-full rounded-lg border px-3 py-2"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="relative">
            <input
              className="w-full rounded-lg border px-3 py-2 pr-16"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-brand-700"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            disabled={loading}
            className="w-full rounded-lg bg-brand-500 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-70"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
        <div className="mt-4 flex justify-between text-sm">
          <Link to="#" className="text-brand-700">Forgot Password?</Link>
          <button className="text-brand-700">Login with Google</button>
        </div>
      </div>
    </div>
  )
}
