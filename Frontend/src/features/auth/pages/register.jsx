import React, { useState } from 'react'
import '../auth.form.scss'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const Register = () => {
  const navigate = useNavigate()
  const { loading, error, handleRegister } = useAuth()

  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const success = await handleRegister({ username, email, password })

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
          <h1>Build your interview story before the meeting begins.</h1>
          <p>
            Create your profile and get AI-guided feedback on your skills,
            preparation gaps, and next steps.
          </p>

          <ul className="feature-list">
            <li>Personalized role insights</li>
            <li>Structured preparation roadmap</li>
            <li>Skill gap awareness</li>
          </ul>
        </aside>

        <section className="auth-panel">
          <div className="auth-header">
            <span className="eyebrow">Start your journey</span>
            <h2>Register</h2>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}

            <div className="input-group">
              <label htmlFor="username">Username</label>
              <input
                onChange={(e) => setUsername(e.target.value)}
                type="text"
                id="username"
                name="username"
                placeholder="Choose a username"
              />
            </div>

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
                placeholder="Create a password"
              />
            </div>

            <button type="submit" className="button primary-button">
              Register
            </button>
          </form>

          <div className="auth-footer">
            <span>Already have an account?</span>
            <Link to="/login">Login</Link>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Register