import React, { useCallback, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  MdEmail, MdLock, MdVisibility, MdVisibilityOff,
  MdArrowBack, MdCheckCircle, MdSecurity,
} from 'react-icons/md'
import './Login.css'

type Step = 1 | 2 | 3 | 4

const Login: React.FC = () => {
  const navigate = useNavigate()

  // Login fields
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [otp,          setOtp]          = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)

  
  const [step, setStep] = useState<Step>(1)

  // Forgot password fields
  const [fpEmail,   setFpEmail]   = useState('')
  const [fpNewPass, setFpNewPass] = useState('')
  const [fpConfirm, setFpConfirm] = useState('')
  const [showNew,   setShowNew]   = useState(false)
  const [showConf,  setShowConf]  = useState(false)

  // ── Step 1: Send OTP ────────────────────────────────────────────────────
  const handleLoginRequest = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Please fill in all fields.')
    setLoading(true)
    try {
      await axios.post('http://localhost:3001/api/login-request', { email, password })
      toast.success('OTP sent to your email!')
      setStep(2)
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) toast.error(err.response?.data?.error || 'Login failed')
      else toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [email, password])

  // ── Step 2: Verify OTP → login ──────────────────────────────────────────
  const handleVerifyOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp) return toast.error('Please enter the OTP')
    setLoading(true)
    try {
      const res = await axios.post('http://localhost:3001/api/verify-otp', { email, otp })
      localStorage.setItem('token', res.data.token)
      if (res.data?.user) localStorage.setItem('user', JSON.stringify(res.data.user))
      toast.success('Welcome back!')
      navigate('/event-form')
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) toast.error(err.response?.data?.error || 'Invalid OTP')
      else toast.error('Verification failed')
    } finally {
      setLoading(false)
    }
  }, [email, otp, navigate])

  // ── Step 3: Forgot Password ─────────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fpEmail)                return toast.error('Please enter your email')
    if (!fpNewPass)              return toast.error('Please enter a new password')
    if (fpNewPass.length < 6)    return toast.error('Password must be at least 6 characters')
    if (fpNewPass !== fpConfirm) return toast.error('Passwords do not match')
    setLoading(true)
    try {
      await axios.post('http://localhost:3001/api/reset-password-direct', {
        email: fpEmail, newPassword: fpNewPass,
      })
      toast.success('Password updated!')
      setStep(4)
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) toast.error(err.response?.data?.error || 'Reset failed')
      else toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="event-sense-login">

      {/* ── Left Panel ── */}
      <div className="es-login-left">
        <div className="es-login-left__glow" />
        <div className="es-login-left__grid" />
        <div className="es-login-left__body">
          <div className="es-login-left__text">
            <p className="es-login-left__eyebrow">AI-Powered Budgeting</p>
            <h1 className="es-login-left__brand">Event<br /><span>Sense</span></h1>
            <p className="es-login-left__tagline">Craft moments that matter.</p>
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="es-login-right">
        <div className="es-login-right__inner">

          {/* Back button */}
          <button type="button"
            onClick={() => {
              if (step === 2) { setStep(1); setOtp('') }
              else if (step === 3 || step === 4) setStep(1)
              else navigate('/')
            }}
            className="es-login-back-link"
            style={{ border: 'none', background: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MdArrowBack size={16} />
            {step === 1 ? 'Back to Home' : 'Back to Login'}
          </button>

          {/* ── Step 1: Login form ── */}
          {step === 1 && (
            <>
              <div className="es-login-right__header">
                <h2 className="es-login-heading">Welcome Back</h2>
                <p className="es-login-sub-text">Sign in to your Event Sense account.</p>
              </div>

              <form onSubmit={handleLoginRequest} className="es-login-form">
                <div className="es-login-field">
                  <label className="es-login-label">Email Address</label>
                  <div className="es-login-input-wrap">
                    <span className="es-login-input-icon"><MdEmail size={18} /></span>
                    <input type="email" value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="es-login-input" placeholder="you@example.com" />
                  </div>
                </div>

                <div className="es-login-field">
                  <label className="es-login-label">Password</label>
                  <div className="es-login-input-wrap">
                    <span className="es-login-input-icon"><MdLock size={18} /></span>
                    <input type={showPassword ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="es-login-input" placeholder="••••••••" />
                    <button type="button" className="es-login-input-action"
                      onClick={() => setShowPassword(s => !s)}>
                      {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password link */}
                <div style={{ textAlign: 'right', marginTop: '-4px' }}>
                  <button type="button"
                    onClick={() => { setFpEmail(email); setStep(3) }}
                    style={{ border: 'none', background: 'none', cursor: 'pointer',
                      fontSize: '13px', color: 'var(--es-gold-primary)', fontWeight: 600, padding: 0 }}>
                    Forgot Password?
                  </button>
                </div>

                <button type="submit" className="es-login-submit-btn" disabled={loading}>
                  {loading ? 'Sending OTP…' : 'Login'}
                </button>
              </form>

              <p className="es-login-register-text">
                Don't have an account?{' '}
                <Link to="/register" className="es-login-register-link">Create one</Link>
              </p>
            </>
          )}

          {/* ── Step 2: OTP Entry ── */}
          {step === 2 && (
            <>
              <div className="es-login-right__header">
                <h2 className="es-login-heading">Check Your Email</h2>
                <p className="es-login-sub-text">
                  We sent a 6-digit code to <strong>{email}</strong>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="es-login-form">
                <div className="es-login-field">
                  <label className="es-login-label">OTP Code</label>
                  <div className="es-login-input-wrap">
                    <span className="es-login-input-icon"><MdSecurity size={18} /></span>
                    <input type="text" value={otp}
                      onChange={e => setOtp(e.target.value)}
                      className="es-login-input" placeholder="Enter 6-digit code"
                      maxLength={6} autoFocus
                      style={{ letterSpacing: '0.2em', fontSize: '18px', fontWeight: 700 }} />
                  </div>
                </div>

                <button type="submit" className="es-login-submit-btn" disabled={loading}>
                  {loading ? 'Verifying…' : 'Verify & Login'}
                </button>

                {/* Resend */}
                <p style={{ textAlign: 'center', fontSize: '13px', color: '#aaa', margin: '4px 0 0' }}>
                  Didn't receive it?{' '}
                  <button type="button"
                    onClick={() => { setStep(1); setOtp('') }}
                    style={{ border: 'none', background: 'none', cursor: 'pointer',
                      color: 'var(--es-gold-primary)', fontWeight: 600, fontSize: '13px', padding: 0 }}>
                    Resend OTP
                  </button>
                </p>
              </form>
            </>
          )}

          {/* ── Step 3: Forgot Password ── */}
          {step === 3 && (
            <>
              <div className="es-login-right__header">
                <h2 className="es-login-heading">Reset Password</h2>
                <p className="es-login-sub-text">Enter your email and set a new password.</p>
              </div>

              <form onSubmit={handleForgotPassword} className="es-login-form">
                <div className="es-login-field">
                  <label className="es-login-label">Email Address</label>
                  <div className="es-login-input-wrap">
                    <span className="es-login-input-icon"><MdEmail size={18} /></span>
                    <input type="email" value={fpEmail}
                      onChange={e => setFpEmail(e.target.value)}
                      className="es-login-input" placeholder="you@example.com" />
                  </div>
                </div>

                <div className="es-login-field">
                  <label className="es-login-label">New Password</label>
                  <div className="es-login-input-wrap">
                    <span className="es-login-input-icon"><MdLock size={18} /></span>
                    <input type={showNew ? 'text' : 'password'} value={fpNewPass}
                      onChange={e => setFpNewPass(e.target.value)}
                      className="es-login-input" placeholder="Min. 6 characters" />
                    <button type="button" className="es-login-input-action"
                      onClick={() => setShowNew(s => !s)}>
                      {showNew ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                    </button>
                  </div>
                </div>

                <div className="es-login-field">
                  <label className="es-login-label">Confirm Password</label>
                  <div className="es-login-input-wrap">
                    <span className="es-login-input-icon"><MdLock size={18} /></span>
                    <input type={showConf ? 'text' : 'password'} value={fpConfirm}
                      onChange={e => setFpConfirm(e.target.value)}
                      className="es-login-input" placeholder="Re-enter new password" />
                    <button type="button" className="es-login-input-action"
                      onClick={() => setShowConf(s => !s)}>
                      {showConf ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                    </button>
                  </div>
                  {fpConfirm && fpConfirm !== fpNewPass && (
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#ef4444' }}>
                      Passwords do not match
                    </p>
                  )}
                </div>

                <button type="submit" className="es-login-submit-btn" disabled={loading}>
                  {loading ? 'Saving…' : 'Save New Password'}
                </button>
              </form>
            </>
          )}

          {/* ── Step 4: Success ── */}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <MdCheckCircle size={56} color="var(--es-gold-primary)" />
              <h2 style={{ margin: '16px 0 8px', fontSize: '20px', fontWeight: 800, color: '#1a1a1a' }}>
                Password Updated!
              </h2>
              <p style={{ color: '#888', fontSize: '14px', lineHeight: 1.6, marginBottom: '28px' }}>
                Your password has been changed. You can now log in.
              </p>
              <button className="es-login-submit-btn"
                onClick={() => { setStep(1); setFpEmail(''); setFpNewPass(''); setFpConfirm('') }}>
                Back to Login
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default Login
