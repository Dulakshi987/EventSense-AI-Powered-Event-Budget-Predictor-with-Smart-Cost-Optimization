import React, { useCallback, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  MdEmail,
  MdLock,
  MdVisibility,
  MdVisibilityOff,
  MdArrowBack,
} from 'react-icons/md'
import './Login.css'

interface LoginFormState {
  email: string
  password: string
}

const Login: React.FC = () => {
  const navigate = useNavigate()

  const [form, setForm] = useState<LoginFormState>({
    email: '',
    password: '',
  })

  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  // --- HARDCODED ADMIN CREDENTIALS ---
  const ADMIN_EMAIL = "admin@eventsense.com";
  const ADMIN_PASSWORD = "admin123";

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }))
    },
    []
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      // Validation
      if (!form.email.trim() || !form.password.trim()) {
        toast.error('Please fill in all fields.')
        return
      }

      setLoading(true)

      // --- ADMIN CHECK LOGIC ---
      setTimeout(() => {
        if (form.email === ADMIN_EMAIL && form.password === ADMIN_PASSWORD) {
          toast.success('Welcome back, Admin!');
          
          localStorage.setItem('userRole', 'admin');
          localStorage.setItem('token', 'admin-dummy-token'); 
          
          navigate('/admin-dashboard'); // Admin Dashboard 
        } else {
          toast.error('Invalid Admin credentials!');
        }
        setLoading(false)
      }, 1000); 
      
    },
    [form, navigate]
  )

  return (
    <div className="event-sense-login">
      <div className="es-login-left">
        <div className="es-login-left__glow" />
        <div className="es-login-left__grid" />
        <div className="es-login-left__body">
          <div className="es-login-left__text">
            <p className="es-login-left__eyebrow">Management Portal</p>
            <h1 className="es-login-left__brand">
              Admin<br /><span>Panel</span>
            </h1>
            <p className="es-login-left__tagline">
              Manage and monitor event budgets.
            </p>
          </div>
        </div>
      </div>

      <div className="es-login-right">
        <div className="es-login-right__inner">
          <Link to="/" className="es-login-back-link">
            <MdArrowBack size={16} />
            Back to Home
          </Link>

          <div className="es-login-right__header">
            <h2 className="es-login-heading">Admin Login</h2>
            <p className="es-login-sub-text">
              Enter your fixed credentials to access the panel.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="es-login-form">
            <div className="es-login-field">
              <label className="es-login-label">Admin Email</label>
              <div className="es-login-input-wrap">
                <span className="es-login-input-icon"><MdEmail size={18} /></span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="es-login-input"
                  placeholder="admin@eventsense.com"
                />
              </div>
            </div>

            <div className="es-login-field">
              <label className="es-login-label">Password</label>
              <div className="es-login-input-wrap">
                <span className="es-login-input-icon"><MdLock size={18} /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="es-login-input"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="es-login-input-action"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="es-login-submit-btn" disabled={loading}>
              {loading ? 'Authenticating…' : 'Login as Admin'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login