import React, { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { MdEmail, MdArrowBack, MdLock, MdVisibility, MdVisibilityOff, MdCheckCircle } from 'react-icons/md'

// ─────────────────────────────────────────────────────────────────────────────
// Shared styles
// ─────────────────────────────────────────────────────────────────────────────
const GOLD  = '#c9a84c'
const DARK  = '#1a1408'

const pageWrap: React.CSSProperties = {
  minHeight: '100vh', display: 'flex',
  background: '#f4f3f0', fontFamily: 'inherit',
}

const leftPanel: React.CSSProperties = {
  width: '38%', flexShrink: 0,
  background: 'linear-gradient(145deg, #1a1408 0%, #2d2000 45%, #1a1a0e 100%)',
  display: 'flex', flexDirection: 'column', justifyContent: 'center',
  padding: '60px 48px', position: 'relative', overflow: 'hidden',
}

const rightPanel: React.CSSProperties = {
  flex: 1, display: 'flex', alignItems: 'center',
  justifyContent: 'center', padding: '40px 32px',
}

const card: React.CSSProperties = {
  background: '#fff', borderRadius: '20px', padding: '44px 40px',
  width: '100%', maxWidth: '440px',
  boxShadow: '0 8px 40px rgba(0,0,0,0.09), 0 0 0 1px rgba(201,168,76,0.08)',
}

const inputWrap: React.CSSProperties = {
  position: 'relative', display: 'flex', alignItems: 'center',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '13px 16px 13px 44px',
  borderRadius: '12px', border: '1.5px solid rgba(0,0,0,0.09)',
  fontSize: '14px', color: '#1a1a1a', background: '#f9f8f6',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  transition: 'border-color 0.2s, box-shadow 0.2s',
}

const iconWrap: React.CSSProperties = {
  position: 'absolute', left: '14px',
  color: '#aaa', display: 'flex', alignItems: 'center',
}

const submitBtn: React.CSSProperties = {
  width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
  background: `linear-gradient(135deg, ${DARK} 0%, ${GOLD} 60%, #e2be6e 100%)`,
  color: '#fff8e1', fontSize: '15px', fontWeight: 800, letterSpacing: '0.06em',
  cursor: 'pointer', boxShadow: '0 4px 20px rgba(201,168,76,0.35)',
  transition: 'opacity 0.2s, transform 0.15s', marginTop: '8px',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 800, color: '#666',
  display: 'block', marginBottom: '7px',
  textTransform: 'uppercase', letterSpacing: '0.15em',
}

const focusIn  = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.borderColor = GOLD
  e.target.style.boxShadow   = '0 0 0 3px rgba(201,168,76,0.13)'
  e.target.style.background  = '#fff'
}
const focusOut = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.borderColor = 'rgba(0,0,0,0.09)'
  e.target.style.boxShadow   = 'none'
  e.target.style.background  = '#f9f8f6'
}

// ─────────────────────────────────────────────────────────────────────────────
// Left Panel 
// ─────────────────────────────────────────────────────────────────────────────
const LeftSide: React.FC = () => (
  <div style={leftPanel}>
    {/* dot grid */}
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      backgroundImage: 'radial-gradient(circle, rgba(201,168,76,0.07) 1px, transparent 1px)',
      backgroundSize: '28px 28px',
    }} />
    {/* glow */}
    <div style={{
      position: 'absolute', width: '380px', height: '380px', borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(201,168,76,0.14) 0%, transparent 70%)',
      bottom: '-80px', right: '-80px', pointerEvents: 'none',
    }} />
    <div style={{ position: 'relative', zIndex: 1 }}>
      <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.3em',
        textTransform: 'uppercase', color: 'rgba(201,168,76,0.7)', marginBottom: '20px' }}>
        AI-Powered Budgeting
      </p>
      <h1 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fff',
        lineHeight: 1.15, margin: '0 0 16px' }}>
        Event<br />
        <span style={{
          background: 'linear-gradient(90deg,#c9a84c,#e2be6e)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>Sense</span>
      </h1>
      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
        Craft moments that matter.
      </p>
    </div>
  </div>
)

// ─────────────────────────────────────────────────────────────────────────────
// 1. Forgot Password — enter email
// ─────────────────────────────────────────────────────────────────────────────
export const ForgotPassword: React.FC = () => {
  const navigate          = useNavigate()
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return toast.error('Please enter your email')
    setLoading(true)
    try {
      await axios.post('http://localhost:3001/api/forgot-password-request', { email })
      setSent(true)
      toast.success('Reset link sent!')
    } catch (err) {
      const e2 = err as { response?: { data?: { error?: string } } }
      toast.error(e2?.response?.data?.error || 'Failed to send reset link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={pageWrap}>
      <LeftSide />
      <div style={rightPanel}>
        <div style={card}>

          <button type="button" onClick={() => navigate('/login')}
            style={{ border: 'none', background: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              color: '#888', fontSize: '13px', fontWeight: 600, marginBottom: '28px', padding: 0 }}>
            <MdArrowBack size={16} /> Back to Login
          </button>

          {sent ? (
            /* Success state */
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'rgba(201,168,76,0.1)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
              }}>
                <MdCheckCircle size={32} color={GOLD} />
              </div>
              <h2 style={{ margin: '0 0 10px', fontSize: '20px', fontWeight: 800, color: '#1a1a1a' }}>
                Check your email
              </h2>
              <p style={{ color: '#888', fontSize: '14px', lineHeight: 1.6, margin: '0 0 24px' }}>
                We've sent a password reset link to<br />
                <strong style={{ color: '#1a1a1a' }}>{email}</strong>
              </p>
              <Link to="/login" style={{
                display: 'inline-block', padding: '12px 28px', borderRadius: '12px',
                background: `linear-gradient(135deg, ${DARK}, ${GOLD})`,
                color: '#fff8e1', fontWeight: 700, fontSize: '14px', textDecoration: 'none',
              }}>
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 900, color: '#1a1a1a' }}>
                Forgot Password?
              </h2>
              <p style={{ margin: '0 0 28px', fontSize: '14px', color: '#888', lineHeight: 1.6 }}>
                Enter your registered email address and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <div style={inputWrap}>
                    <span style={iconWrap}><MdEmail size={18} /></span>
                    <input
                      type="email" value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      style={inputStyle}
                      onFocus={focusIn} onBlur={focusOut}
                    />
                  </div>
                </div>

                <button type="submit" style={submitBtn} disabled={loading}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.88' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}>
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  Reset Password — enter new password
// ─────────────────────────────────────────────────────────────────────────────
export const ResetPassword: React.FC = () => {
  const { token }           = useParams<{ token: string }>()
  const navigate             = useNavigate()
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [showConf,  setShowConf]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || !confirm) return toast.error('Please fill in all fields')
    if (password.length < 6)   return toast.error('Password must be at least 6 characters')
    if (password !== confirm)  return toast.error('Passwords do not match')

    setLoading(true)
    try {
      await axios.post('http://localhost:3001/api/reset-password-final', {
        token, newPassword: password,
      })
      setDone(true)
      toast.success('Password reset successful!')
    } catch (err) {
      const e2 = err as { response?: { data?: { error?: string } } }
      toast.error(e2?.response?.data?.error || 'Reset failed. Link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={pageWrap}>
      <LeftSide />
      <div style={rightPanel}>
        <div style={card}>

          {done ? (
            /* Success state */
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'rgba(201,168,76,0.1)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
              }}>
                <MdCheckCircle size={32} color={GOLD} />
              </div>
              <h2 style={{ margin: '0 0 10px', fontSize: '20px', fontWeight: 800, color: '#1a1a1a' }}>
                Password Updated!
              </h2>
              <p style={{ color: '#888', fontSize: '14px', lineHeight: 1.6, margin: '0 0 24px' }}>
                Your password has been reset successfully.<br />You can now log in with your new password.
              </p>
              <button onClick={() => navigate('/login')} style={{ ...submitBtn, width: 'auto', padding: '12px 32px' }}>
                Go to Login
              </button>
            </div>
          ) : (
            <>
              <button type="button" onClick={() => navigate('/login')}
                style={{ border: 'none', background: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  color: '#888', fontSize: '13px', fontWeight: 600, marginBottom: '28px', padding: 0 }}>
                <MdArrowBack size={16} /> Back to Login
              </button>

              <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 900, color: '#1a1a1a' }}>
                Reset Password
              </h2>
              <p style={{ margin: '0 0 28px', fontSize: '14px', color: '#888', lineHeight: 1.6 }}>
                Enter your new password below.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* New Password */}
                <div>
                  <label style={labelStyle}>New Password</label>
                  <div style={inputWrap}>
                    <span style={iconWrap}><MdLock size={18} /></span>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      style={{ ...inputStyle, paddingRight: '44px' }}
                      onFocus={focusIn} onBlur={focusOut}
                    />
                    <button type="button" onClick={() => setShowPass(s => !s)}
                      style={{ position: 'absolute', right: '12px', border: 'none',
                        background: 'none', cursor: 'pointer', color: '#aaa', display: 'flex' }}>
                      {showPass ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label style={labelStyle}>Confirm Password</label>
                  <div style={inputWrap}>
                    <span style={iconWrap}><MdLock size={18} /></span>
                    <input
                      type={showConf ? 'text' : 'password'}
                      value={confirm} onChange={e => setConfirm(e.target.value)}
                      placeholder="Re-enter password"
                      style={{ ...inputStyle, paddingRight: '44px',
                        borderColor: confirm && confirm !== password ? '#ef4444' : undefined }}
                      onFocus={focusIn} onBlur={focusOut}
                    />
                    <button type="button" onClick={() => setShowConf(s => !s)}
                      style={{ position: 'absolute', right: '12px', border: 'none',
                        background: 'none', cursor: 'pointer', color: '#aaa', display: 'flex' }}>
                      {showConf ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                    </button>
                  </div>
                  {confirm && confirm !== password && (
                    <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#ef4444' }}>
                      Passwords do not match
                    </p>
                  )}
                </div>

                <button type="submit" style={submitBtn} disabled={loading}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.88' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}>
                  {loading ? 'Resetting…' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
