import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login, loading, error } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const loggedInUser = await login(email, password)
    if (loggedInUser) {
      navigate(loggedInUser.role === 'admin' ? '/' : '/portal')
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-side">
        <div className="auth-side-brand">Orbit EMS</div>
        <div className="auth-side-quote">
          One roster.<br />Every department,<br />always in sync.
        </div>
        <div className="auth-side-foot">FastAPI · MongoDB · React</div>
      </div>
      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h1>Welcome back</h1>
          <p className="sub">Sign in to manage your team.</p>

          {error && <div className="error-banner">{error}</div>}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="auth-switch">
            No account yet? <Link to="/register">Create one</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
