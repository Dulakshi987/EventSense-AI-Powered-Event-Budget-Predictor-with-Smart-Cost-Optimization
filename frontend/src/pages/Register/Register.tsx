import React, { useCallback, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
    MdPerson, MdEmail, MdLock, MdVisibility, MdVisibilityOff,
    MdArrowBack, MdCheckBox, MdCheckBoxOutlineBlank,
} from 'react-icons/md'
import './Register.css'

const registerPageMeta = {
    title: 'Create Account',
    subtitle: 'Join Event Sense and start planning unforgettable events.',
    submitLabel: 'Create Account',
    termsLabel: 'I agree to the Terms of Service and Privacy Policy.',
    loginPrompt: 'Already have an account?',
    loginLabel: 'Sign in',
}

interface RegisterFormState {
    fullName: string
    email: string
    password: string
    confirmPassword: string
    acceptTerms: boolean
}

const Register: React.FC = () => {
    const navigate = useNavigate()
    const [form, setForm] = useState<RegisterFormState>({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        acceptTerms: false,
    })
    const [showPwd, setShowPwd] = useState<boolean>(false)
    const [showConfirmPwd, setShowConfirmPwd] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const { name, value, type, checked } = e.target
            setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
        }, [],
    )

    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault()

            if (!form.fullName.trim() || !form.email.trim() || !form.password || !form.confirmPassword) {
                toast.error('Please fill in all fields.')
                return
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
                toast.error('Please enter a valid email address.')
                return
            }
            if (form.password.length < 8) {
                toast.error('Password must be at least 8 characters.')
                return
            }
            if (form.password !== form.confirmPassword) {
                toast.error('Passwords do not match.')
                return
            }
            if (!form.acceptTerms) {
                toast.error('You must accept the Terms of Service.')
                return
            }

            setLoading(true)

            try {
                await axios.post('http://localhost:3001/api/auth/register', {
                    name: form.fullName,
                    email: form.email,
                    password: form.password,
                })
                
                toast.success('Account created! Welcome to Event Sense.')
                navigate('/login')
            } catch (error: unknown) {
                if (axios.isAxiosError(error)) {
                    const errorMsg = error.response?.data?.message || 'Registration could not be completed. Please try again.'
                    toast.error(errorMsg)
                } else {
                    toast.error('An unexpected error occurred. Please try again.')
                }
            } finally {
                setLoading(false)
            }
        },
        [form, navigate],
    )

    return (
        <div className="event-sense-register">
            <div className="es-register-left">
                <div className="es-register-left__glow" />
                <div className="es-register-left__grid" />

                <div className="es-register-left__body">
                    <div className="es-register-banter-wrap">
                        <div className="banter-loader">
                            {Array.from({ length: 9 }).map((_, i) => (
                                <div key={i} className="banter-loader__box" />
                            ))}
                        </div>
                    </div>

                    <div className="es-register-left__text">
                        <p className="es-register-left__eyebrow">AI-Powered Budgeting</p>
                        <h1 className="es-register-left__brand">Event<br /><span>Sense</span></h1>
                        <p className="es-register-left__tagline">Your journey starts here.</p>
                    </div>

                    <div className="es-register-left__steps">
                        <p className="es-register-left__steps-title">Getting started is easy</p>
                        <div className="es-register-step">
                            <div className="es-register-step__num">1</div>
                            <div className="es-register-step__text">
                                <strong>Create your free account</strong>
                                Takes less than a minute
                            </div>
                        </div>
                        <div className="es-register-step">
                            <div className="es-register-step__num">2</div>
                            <div className="es-register-step__text">
                                <strong>Enter your event details</strong>
                                Type, guests, location & budget
                            </div>
                        </div>
                        <div className="es-register-step">
                            <div className="es-register-step__num">3</div>
                            <div className="es-register-step__text">
                                <strong>Get your AI prediction</strong>
                                Instant breakdown + vendor picks
                            </div>
                        </div>
                    </div>

                    <div className="es-register-left__stats">
                        <div className="es-register-stat">
                            <span className="es-register-stat__num">Free</span>
                            <span className="es-register-stat__label">To Get Started</span>
                        </div>
                        <div className="es-register-stat__divider" />
                        <div className="es-register-stat">
                            <span className="es-register-stat__num">10k+</span>
                            <span className="es-register-stat__label">Events Analysed</span>
                        </div>
                        <div className="es-register-stat__divider" />
                        <div className="es-register-stat">
                            <span className="es-register-stat__num">98%</span>
                            <span className="es-register-stat__label">Accuracy Rate</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="es-register-right">
                <div className="es-register-right__inner">
                    <Link to="/" className="es-register-back-link" id="reg-back-link">
                        <MdArrowBack size={16} />
                        Back to Home
                    </Link>

                    <div className="es-register-right__header">
                        <h2 className="es-register-heading">{registerPageMeta.title}</h2>
                        <p className="es-register-sub-text">{registerPageMeta.subtitle}</p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate autoComplete="off" className="es-register-form">
                        <div className="es-register-field">
                            <label htmlFor="reg-name" className="es-register-label">Full Name</label>
                            <div className="es-register-input-wrap">
                                <span className="es-register-input-icon"><MdPerson size={18} /></span>
                                <input
                                    id="reg-name"
                                    type="text"
                                    name="fullName"
                                    placeholder="e.g. Alex Morgan"
                                    value={form.fullName}
                                    onChange={handleChange}
                                    className="es-register-input"
                                    autoComplete="name"
                                />
                            </div>
                        </div>

                        <div className="es-register-field">
                            <label htmlFor="reg-email" className="es-register-label">Email Address</label>
                            <div className="es-register-input-wrap">
                                <span className="es-register-input-icon"><MdEmail size={18} /></span>
                                <input
                                    id="reg-email"
                                    type="email"
                                    name="email"
                                    placeholder="you@example.com"
                                    value={form.email}
                                    onChange={handleChange}
                                    className="es-register-input"
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="es-register-grid-2">
                            <div className="es-register-field">
                                <label htmlFor="reg-password" className="es-register-label">Password</label>
                                <div className="es-register-input-wrap">
                                    <span className="es-register-input-icon"><MdLock size={18} /></span>
                                    <input
                                        id="reg-password"
                                        type={showPwd ? 'text' : 'password'}
                                        name="password"
                                        placeholder="Min. 8 chars"
                                        value={form.password}
                                        onChange={handleChange}
                                        className="es-register-input"
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        className="es-register-input-action"
                                        onClick={() => setShowPwd((p) => !p)}
                                        aria-label="Toggle password visibility"
                                    >
                                        {showPwd ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="es-register-field">
                                <label htmlFor="reg-confirm-password" className="es-register-label">Confirm Password</label>
                                <div className="es-register-input-wrap">
                                    <span className="es-register-input-icon"><MdLock size={18} /></span>
                                    <input
                                        id="reg-confirm-password"
                                        type={showConfirmPwd ? 'text' : 'password'}
                                        name="confirmPassword"
                                        placeholder="Re-enter password"
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        className="es-register-input"
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        className="es-register-input-action"
                                        onClick={() => setShowConfirmPwd((p) => !p)}
                                        aria-label="Toggle confirm password visibility"
                                    >
                                        {showConfirmPwd ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <label className="es-register-terms-row">
                            <input
                                type="checkbox"
                                name="acceptTerms"
                                checked={form.acceptTerms}
                                onChange={handleChange}
                                className="sr-only"
                                id="reg-terms"
                            />
                            {form.acceptTerms
                                ? <MdCheckBox size={21} color="#c9a84c" style={{ flexShrink: 0 }} />
                                : <MdCheckBoxOutlineBlank size={21} color="#bbb" style={{ flexShrink: 0 }} />
                            }
                            <span className="es-register-terms-text">{registerPageMeta.termsLabel}</span>
                        </label>

                        <button
                            type="submit"
                            className="es-register-submit-btn"
                            disabled={loading}
                            id="reg-submit-btn"
                        >
                            {loading ? (
                                <>
                                    <span className="es-register-spinner" />
                                    Creating Account…
                                </>
                            ) : (
                                registerPageMeta.submitLabel
                            )}
                        </button>
                    </form>

                    <p className="es-register-prompt-text">
                        {registerPageMeta.loginPrompt}{' '}
                        <Link to="/login" className="es-register-prompt-link">{registerPageMeta.loginLabel}</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Register