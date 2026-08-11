import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FileCode2, Eye, EyeOff } from 'lucide-react'
import axios from 'axios'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [show, setShow] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const { data } = await axios.post('/api/auth/login', form)
      localStorage.setItem('token', data.access_token)
      // Force reload so App re-reads token
      window.location.href = '/dashboard'
    } catch (err) {
      if (!err?.response) {
        setError('Cannot connect to server. Is the backend running on port 5000?')
      } else if (err?.response?.status === 401) {
        setError('Invalid email or password.')
      } else {
        setError(`Error ${err?.response?.status}: ${err?.response?.data?.detail || 'Login failed'}`)
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
        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-sub">Sign in to your XMLGenie account</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="you@email.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input className="form-input" type={show ? 'text' : 'password'}
                placeholder="••••••••" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} required
                style={{ paddingRight: 40 }} />
              <button type="button" onClick={() => setShow(!show)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && (
            <div style={{ color: 'var(--error)', fontSize: 13, marginBottom: 12, padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8 }}>
              {error}
            </div>
          )}
          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14, marginTop: 4 }}>
            {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Signing in…</> : 'Sign In'}
          </button>
        </form>

        <p className="auth-switch">Don't have an account? <Link to="/signup">Sign up</Link></p>
      </div>
    </div>
  )
}
