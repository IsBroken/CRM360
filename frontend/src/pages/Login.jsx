import { useState } from 'react'
import { loginApi } from '../services/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const data = await loginApi(email, password)
      const token = data?.access_token

      if (!token) {
        throw new Error('Login failed. No access token was returned.')
      }

      localStorage.setItem('token', token)
      window.location.href = '/attendance'
    } catch (loginError) {
      setError(loginError.message || 'Login failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f3f6fb 0%, #e9eefc 100%)',
        padding: '24px',
        fontFamily: 'Segoe UI, sans-serif',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#ffffff',
          borderRadius: '18px',
          boxShadow: '0 20px 45px rgba(15, 23, 42, 0.12)',
          padding: '32px 28px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: '#1d4ed8',
              color: '#ffffff',
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '12px',
            }}
          >
            C
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: '2rem',
              color: '#0f172a',
              letterSpacing: '-0.04em',
            }}
          >
            CRM360
          </h1>
          <p
            style={{
              margin: '8px 0 0',
              color: '#64748b',
              fontSize: '0.96rem',
            }}
          >
            Employee access portal
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: '18px' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#334155',
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="name@company.com"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: '1rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                boxSizing: 'border-box',
                background: '#f8fafc',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#334155',
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Enter your password"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: '1rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                boxSizing: 'border-box',
                background: '#f8fafc',
              }}
            />
          </div>

          {error ? (
            <div
              role="alert"
              style={{
                marginBottom: '18px',
                padding: '10px 12px',
                borderRadius: '10px',
                background: '#fef2f2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
                fontSize: '0.95rem',
              }}
            >
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              border: 'none',
              borderRadius: '10px',
              background: isSubmitting ? '#94a3b8' : '#1d4ed8',
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: '700',
              padding: '13px 16px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s ease',
            }}
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </section>
    </main>
  )
}
