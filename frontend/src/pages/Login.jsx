import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, User, Lock, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const ROLE_COLOR = {
  'Admin':        '#F36F21',
  'Dist Manager': '#1e68d4',
  'Field Rep':    '#22c55e',
}

export default function Login() {
  const navigate   = useNavigate()
  const { user, login } = useAuth()

  const [username,    setUsername]    = useState('')
  const [password,    setPassword]    = useState('')
  const [showPw,      setShowPw]      = useState(false)
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [demoOpen,    setDemoOpen]    = useState(false)
  const [demoUsers,   setDemoUsers]   = useState([])

  /* Redirect if already logged in */
  useEffect(() => { if (user) navigate('/', { replace: true }) }, [user, navigate])

  /* Fetch demo credentials for the helper panel */
  useEffect(() => {
    fetch('/api/auth/users').then(r => r.json()).then(setDemoUsers).catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password) { setError('Please enter username and password.'); return }
    setError('')
    setLoading(true)
    try {
      await login(username.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (u) => { setUsername(u.username); setPassword(u.password); setError('') }

  return (
    <div style={{
      minHeight:      '100vh',
      background:     '#07111f',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '24px 16px',
      fontFamily:     '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* ── Brand header ── */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display:        'inline-flex',
            alignItems:     'center',
            justifyContent: 'center',
            width:  56, height: 56,
            borderRadius:   14,
            background:     '#F36F21',
            marginBottom:   14,
            fontSize:       '1.4rem',
            fontWeight:     900,
            color:          '#fff',
            letterSpacing:  '-0.5px',
          }}>
            PC
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#e2e8f0', margin: 0 }}>
            PharmaCore IQ2020
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 6 }}>
            Field Intelligence Platform · Sign in to continue
          </p>
        </div>

        {/* ── Login card ── */}
        <div style={{
          background:   '#0f2040',
          border:       '1px solid rgba(255,255,255,0.09)',
          borderRadius: 16,
          padding:      '28px 28px 24px',
          boxShadow:    '0 20px 60px rgba(0,0,0,0.5)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Username */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  placeholder="Enter your username"
                  style={{
                    width:        '100%',
                    background:   '#07111f',
                    border:       '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 9,
                    padding:      '10px 12px 10px 36px',
                    fontSize:     '0.88rem',
                    color:        '#e2e8f0',
                    outline:      'none',
                    boxSizing:    'border-box',
                    transition:   'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#1e68d4'}
                  onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  style={{
                    width:        '100%',
                    background:   '#07111f',
                    border:       '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 9,
                    padding:      '10px 40px 10px 36px',
                    fontSize:     '0.88rem',
                    color:        '#e2e8f0',
                    outline:      'none',
                    boxSizing:    'border-box',
                    transition:   'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#1e68d4'}
                  onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                >
                  {showPw ? <EyeOff size={15} color="#64748b" /> : <Eye size={15} color="#64748b" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem', color: '#fca5a5' }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            8,
                background:     loading ? '#1a4a8a' : '#1e68d4',
                color:          '#fff',
                border:         'none',
                borderRadius:   9,
                padding:        '11px 20px',
                fontSize:       '0.9rem',
                fontWeight:     700,
                cursor:         loading ? 'not-allowed' : 'pointer',
                marginTop:      4,
                transition:     'background 0.15s',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#2672d9' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#1e68d4' }}
            >
              {loading ? (
                <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              ) : (
                <LogIn size={16} />
              )}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* ── Demo credentials accordion ── */}
        <div style={{ marginTop: 16, background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
          <button
            onClick={() => setDemoOpen(v => !v)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600 }}
          >
            <span>Demo accounts — click to fill</span>
            {demoOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {demoOpen && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              {demoUsers.map(u => (
                <button
                  key={u.username}
                  onClick={() => fillDemo(u)}
                  style={{
                    width:        '100%',
                    display:      'flex',
                    alignItems:   'center',
                    justifyContent: 'space-between',
                    padding:      '9px 16px',
                    background:   'none',
                    border:       'none',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    cursor:       'pointer',
                    textAlign:    'left',
                    gap:          12,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  {/* Initials avatar */}
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    background: `${ROLE_COLOR[u.role] || '#1e68d4'}22`,
                    border:     `1px solid ${ROLE_COLOR[u.role] || '#1e68d4'}55`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', fontWeight: 700,
                    color: ROLE_COLOR[u.role] || '#1e68d4',
                  }}>
                    {u.name.split(' ').map(p => p[0]).join('').slice(0,2)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0' }}>{u.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{u.role} · {u.username} / {u.password}</div>
                  </div>

                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                    background: `${ROLE_COLOR[u.role] || '#1e68d4'}22`,
                    color:       ROLE_COLOR[u.role] || '#1e68d4',
                    whiteSpace:  'nowrap',
                  }}>
                    {u.role}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#334155', marginTop: 20 }}>
          PharmaCore Inc · IQ2020 POC · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
