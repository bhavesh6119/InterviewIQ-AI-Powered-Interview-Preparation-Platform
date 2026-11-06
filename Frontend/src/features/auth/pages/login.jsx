import React, { useState } from 'react'
import '../auth.form.scss'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const Login = () => {
  const { loading, error, handleLogin } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const success = await handleLogin({ email, password })

    if (success) {
      navigate('/')
    }
  }

  if (loading) {
    return (
      <main className="auth-page">
        <div className="auth-shell auth-shell--loading">
          <h1>Loading...</h1>
        </div>
      </main>
    )
  }

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <aside className="auth-visual">
          <div className="brand-pill">InterviewIQ</div>
          <h1>Get interview-ready with real clarity.</h1>
          <p>
            Turn your resume, job description, and self-story into a focused,
            confidence-building prep plan.
          </p>

          <ul className="feature-list">
            <li>Resume-to-role matching</li>
            <li>Gap analysis and action plan</li>
            <li>Technical + behavioural prep</li>
          </ul>
        </aside>

        <section className="auth-panel">
          <div className="auth-header">
            <span className="eyebrow">Welcome back</span>
            <h2>Login</h2>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}

            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                id="password"
                name="password"
                placeholder="Enter your password"
              />
            </div>

            <div className="helper-row">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Keep me signed in</span>
              </label>
              <a href="#">Forgot password?</a>
            </div>

            <button type="submit" className="button primary-button">
              Login
            </button>
          </form>

          <div className="auth-footer">
            <span>Don&apos;t have an account?</span>
            <Link to="/register">Create account</Link>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Login