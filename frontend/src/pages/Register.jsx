import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Register() {
  const { register, loading, error } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const registeredUser = await register(name, email, password)
    if (registeredUser) {
      navigate(registeredUser.role === 'admin' ? '/' : '/portal')
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-side">
        <div className="auth-side-brand">Orbit EMS</div>
        <div className="auth-side-quote">
          The first account<br />you create becomes<br />the administrator.
        </div>
        <div className="auth-side-foot">FastAPI · MongoDB · React</div>
      </div>
      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h1>Create your account</h1>
          <p className="sub">Set up access to the employee roster.</p>

          {error && <div className="error-banner">{error}</div>}

          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Lee" />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" className="input" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>

          <div className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
