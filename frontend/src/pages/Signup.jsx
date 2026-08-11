import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FileCode2, CheckCircle } from 'lucide-react'
import axios from 'axios'

export default function Signup() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await axios.post('/api/auth/signup', form)
      setSuccess(true)
      // Auto-navigate to login after 1.5 seconds
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      const msg = err?.response?.data?.detail
      if (msg === 'Email already registered') {
        setError('Email already registered — please sign in.')
      } else if (!err?.response) {
        setError('Cannot connect to server. Is the backend running on port 5000?')
      } else {
        setError(msg || `Error ${err?.response?.status}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon"><FileCode2 size={18} /></div>
          <span style={{ fontWeight: 700, fontSize: 18 }}>XMLGenie</span>
        </div>
        <h2 className="auth-title">Create account</h2>
        <p className="auth-sub">Start querying XML files with AI</p>

        {success ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ color: 'var(--success)', display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <CheckCircle size={48} />
            </div>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Account created!</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Redirecting to login…</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="Prithviraj Thorat"
                value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="you@email.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Min 8 characters"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
            </div>
            {error && (
              <div style={{ color: 'var(--error)', fontSize: 13, marginBottom: 12, padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8 }}>
                {error}
              </div>
            )}
            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14, marginTop: 4 }}>
              {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Creating…</> : 'Create Account'}
            </button>
          </form>
        )}

        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  )
}
