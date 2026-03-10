import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { useNavigate} from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
    MdCamera, MdPalette, MdVideocam,
    MdHome, MdRestaurant, MdMusicNote, MdCheckCircle, MdError,
    MdFactCheck, MdWifi, MdMemory, MdBarChart, MdHistory,
    MdEdit, MdLogout, MdPerson, MdLock
} from 'react-icons/md'
import './EventForm.css'

interface PredictFormState {
    event_type: string
    num_guests: number | string
    location: string
    max_budget: number | string
    has_photography: number
    has_videography: number
    has_decoration: number
    has_venue: number
    has_catering: number
    has_dj: number
}

const serviceOptions: {
    key: keyof PredictFormState
    label: string
    Icon: React.ComponentType<{ size?: number; color?: string }>
}[] = [
    { key: 'has_venue',       label: 'Venue',       Icon: MdHome },
    { key: 'has_photography', label: 'Photography',  Icon: MdCamera },
    { key: 'has_videography', label: 'Videography',  Icon: MdVideocam },
    { key: 'has_decoration',  label: 'Decoration',   Icon: MdPalette },
    { key: 'has_catering',    label: 'Catering',     Icon: MdRestaurant },
    { key: 'has_dj',          label: 'DJ & Music',   Icon: MdMusicNote },
]

const eventTypeOptions = ['Wedding', 'Birthday', 'Corporate', 'Gala', 'Concert', 'Conference']

type StepStatus = 'idle' | 'active' | 'done' | 'error'

interface Step {
    label: string
    subActive: string
    subDone: string
    subError: string
    StepIcon: React.ComponentType<{ size?: number; color?: string }>
}

const STEPS: Step[] = [
    { label: 'Validating event details', subActive: 'Checking inputs…',   subDone: 'Confirmed', subError: 'Failed', StepIcon: MdFactCheck },
    { label: 'Connecting to AI',         subActive: 'Reaching server…',   subDone: 'Connected', subError: 'Offline', StepIcon: MdWifi },
    { label: 'Processing Model',         subActive: 'Calculating…',       subDone: 'Complete',  subError: 'Failed',  StepIcon: MdMemory },
    { label: 'Finalizing',               subActive: 'Preparing results…', subDone: 'Ready!',    subError: 'Error',   StepIcon: MdBarChart },
]

const delay = (ms: number) => new Promise<void>((res) => setTimeout(res, ms))

const GOLD  = '#c9a84c'
const GOLD2 = '#e2be6e'
const DARK  = '#1a1408'

// ── Edit Profile Modal ────────────────────────────────────────────────────────
interface EditProfileModalProps {
    user: { name: string; email: string }
    onClose: () => void
    onSaved: (name: string) => void
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onSaved }) => {
    const [name,            setName]            = useState(user.name)
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword,     setNewPassword]     = useState('')
    const [saving,          setSaving]          = useState(false)

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '11px 14px', borderRadius: '10px',
        border: '1.5px solid rgba(0,0,0,0.09)', fontSize: '14px',
        outline: 'none', boxSizing: 'border-box', color: '#1a1a1a',
        background: '#f9f8f6', fontFamily: 'inherit',
        transition: 'border-color 0.2s, box-shadow 0.2s',
    }

    const handleSave = async () => {
        if (!name.trim()) { toast.error('Name cannot be empty'); return }
        setSaving(true)
        try {
            const token = localStorage.getItem('token')
            await axios.put('http://localhost:3001/api/auth/profile', {
                name,
                currentPassword: currentPassword || undefined,
                newPassword:     newPassword     || undefined,
            }, { headers: { Authorization: `Bearer ${token}` } })

            const stored = localStorage.getItem('user')
            if (stored) {
                const parsed = JSON.parse(stored)
                localStorage.setItem('user', JSON.stringify({ ...parsed, name }))
            }
            toast.success('Profile updated!')
            onSaved(name)
            onClose()
        } catch (err) {
            const e = err as { response?: { data?: { error?: string } } }
            toast.error(e?.response?.data?.error || 'Update failed')
        } finally {
            setSaving(false)
        }
    }

    const labelStyle: React.CSSProperties = {
        fontSize: '11px', fontWeight: 800, color: '#666',
        display: 'block', marginBottom: '6px',
        textTransform: 'uppercase', letterSpacing: '0.15em',
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000, backdropFilter: 'blur(4px)',
        }}>
            <div style={{
                background: '#fff', borderRadius: '20px', padding: '36px 32px',
                width: '100%', maxWidth: '420px',
                boxShadow: `0 24px 64px rgba(0,0,0,0.22), 0 0 0 1px rgba(201,168,76,0.12)`,
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
                    <div style={{
                        width: '46px', height: '46px', borderRadius: '50%',
                        background: `linear-gradient(135deg, ${DARK}, ${GOLD})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                        <MdPerson size={24} color="#fff8e1" />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '17px', color: '#1a1a1a', fontWeight: 800 }}>Edit Profile</h2>
                        <p  style={{ margin: 0, fontSize: '12px', color: '#888', marginTop: '2px' }}>{user.email}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                        <label style={labelStyle}>Full Name</label>
                        <input value={name} onChange={e => setName(e.target.value)}
                            placeholder="Your name" style={inputStyle}
                            onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = `0 0 0 3px rgba(201,168,76,0.13)` }}
                            onBlur={e  => { e.target.style.borderColor = 'rgba(0,0,0,0.09)'; e.target.style.boxShadow = 'none' }}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Email</label>
                        <input value={user.email} disabled
                            style={{ ...inputStyle, background: '#f4f3f0', color: '#aaa', cursor: 'not-allowed' }} />
                    </div>

                    <div style={{ borderTop: '1.5px solid rgba(0,0,0,0.06)', paddingTop: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                            <MdLock size={13} color={GOLD} />
                            <span style={{ ...labelStyle, margin: 0 }}>Change Password</span>
                        </div>
                        <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#aaa' }}>
                            Leave blank to keep current password
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <input type="password" value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                placeholder="Current password" style={inputStyle}
                                onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = `0 0 0 3px rgba(201,168,76,0.13)` }}
                                onBlur={e  => { e.target.style.borderColor = 'rgba(0,0,0,0.09)'; e.target.style.boxShadow = 'none' }}
                            />
                            <input type="password" value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="New password" style={inputStyle}
                                onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = `0 0 0 3px rgba(201,168,76,0.13)` }}
                                onBlur={e  => { e.target.style.borderColor = 'rgba(0,0,0,0.09)'; e.target.style.boxShadow = 'none' }}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                    <button onClick={onClose} style={{
                        flex: 1, padding: '12px', borderRadius: '10px',
                        border: '1.5px solid rgba(0,0,0,0.09)', background: '#f9f8f6',
                        fontSize: '14px', fontWeight: 700, color: '#666', cursor: 'pointer',
                    }}>Cancel</button>
                    <button onClick={handleSave} disabled={saving} style={{
                        flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
                        background: `linear-gradient(135deg, ${DARK} 0%, ${GOLD} 60%, ${GOLD2} 100%)`,
                        fontSize: '14px', fontWeight: 800, color: '#fff8e1', letterSpacing: '0.05em',
                        cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                        boxShadow: `0 4px 16px rgba(201,168,76,0.35)`,
                    }}>
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Main Component ────────────────────────────────────────────────────────────
const EventForm: React.FC = () => {
    const navigate        = useNavigate()
    const isAuthenticated = !!localStorage.getItem('token')

    const storedUser = (() => {
        try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} }
    })()

    const [userName,      setUserName]      = useState<string>(storedUser.name || '')
    const [dropdownOpen,  setDropdownOpen]  = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const [form, setForm] = useState<PredictFormState>({
        event_type: 'Wedding', num_guests: '', location: '', max_budget: '',
        has_photography: 0, has_videography: 0, has_decoration: 0,
        has_venue: 0, has_catering: 0, has_dj: 0,
    })

    const [loading,      setLoading]      = useState<boolean>(false)
    const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(['idle', 'idle', 'idle', 'idle'])

    const isFormValid = useMemo(() => {
        const base = form.location.trim().length > 0 && Number(form.max_budget) > 0
        return form.has_venue === 1 ? base && Number(form.num_guests) > 0 : base
    }, [form])

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }, [])

    const handleNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value === '' ? '' : Math.max(0, parseInt(value)) }))
    }, [])

    const handleServiceToggle = useCallback((key: keyof PredictFormState) => {
        setForm(prev => {
            const next = { ...prev, [key]: prev[key] === 1 ? 0 : 1 }
            if (key === 'has_venue' && prev[key] === 1) next.num_guests = ''
            return next
        })
    }, [])

    const setStep = useCallback((i: number, s: StepStatus) => {
        setStepStatuses(prev => { const n = [...prev]; n[i] = s; return n })
    }, [])

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('result')
        toast.success('Signed out successfully.')
        navigate('/')
    }

    const handleSubmit = useCallback(async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!isFormValid) return
        setLoading(true)
        setStepStatuses(['idle', 'idle', 'idle', 'idle'])

        const payload = {
            event_type: form.event_type, num_guests: Number(form.num_guests || 0),
            location: form.location, max_budget: Number(form.max_budget),
            handover_budget: Number(form.max_budget),
            has_photography: form.has_photography, has_videography: form.has_videography,
            has_decoration: form.has_decoration, has_venue: form.has_venue,
            has_catering: form.has_catering, has_dj: form.has_dj,
        }

        try {
            setStep(0, 'active'); await delay(650); setStep(0, 'done')
            setStep(1, 'active'); await delay(500)
            const res = await axios.post('http://localhost:5001/predict', payload)
            setStep(1, 'done'); setStep(2, 'active'); await delay(500); setStep(2, 'done')
            setStep(3, 'active'); await delay(600); setStep(3, 'done')

            const resultToSave = {
                ...res.data,
                userInputBudget: Number(form.max_budget),
                event_type: form.event_type, location: form.location,
                num_guests: Number(form.num_guests || 0), max_budget: Number(form.max_budget),
            }
            localStorage.setItem('result', JSON.stringify(resultToSave))

            const token = localStorage.getItem('token')
            if (token) {
                try {
                    await axios.post('http://localhost:3001/api/history',
                        { event: { event_type: form.event_type }, result: resultToSave },
                        { headers: { Authorization: `Bearer ${token}` } }
                    )
                } catch (histErr) { console.warn('History save failed:', histErr) }
            }
            toast.success('Prediction Complete!')
            navigate('/dashboard')
        } catch (err) {
            console.error(err)
            setStepStatuses(['error', 'idle', 'idle', 'idle'])
            setLoading(false)
            toast.error('Prediction failed.')
        }
    }, [form, isFormValid, navigate, setStep])

    const renderStepIcon = (status: StepStatus, step: Step) => {
        if (status === 'done')   return <MdCheckCircle size={18} color="#22c55e" />
        if (status === 'error')  return <MdError       size={18} color="#ef4444" />
        if (status === 'active') return <span className="es-step-pulse" />
        return <step.StepIcon size={17} color="#888" />
    }

    const initials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

    return (
        <>
            <form onSubmit={handleSubmit} noValidate>
                <div className="event-sense-event-form">

                    {/* ── Topbar ── */}
                    <div className="es-form-topbar">
                        <span className="es-form-brand-name">
                            Event <span className="es-form-brand-accent">Sense</span>
                        </span>

                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>

                            {/* View History — logged in only */}
                            {isAuthenticated && (
                                <button type="button" className="es-form-history-btn"
                                    onClick={() => navigate('/history')}>
                                    <MdHistory size={15} /> View History
                                </button>
                            )}

                           
                            {/* User avatar dropdown — logged in only */}
                            {isAuthenticated && (
                                <div ref={dropdownRef} style={{ position: 'relative' }}>
                                    <button
                                        type="button"
                                        onClick={() => setDropdownOpen(o => !o)}
                                        title={userName}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            background: `linear-gradient(135deg, ${DARK}, #2d2000)`,
                                            border: `1.5px solid rgba(201,168,76,0.35)`,
                                            borderRadius: '999px', padding: '4px 12px 4px 4px',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 10px rgba(201,168,76,0.18)',
                                        }}
                                    >
                                        <div style={{
                                            width: '28px', height: '28px', borderRadius: '50%',
                                            background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '11px', fontWeight: 800, color: DARK, flexShrink: 0,
                                        }}>
                                            {initials || <MdPerson size={16} color={DARK} />}
                                        </div>
                                        <span style={{
                                            fontSize: '13px', fontWeight: 700,
                                            color: 'rgba(255,248,225,0.9)',
                                            maxWidth: '90px', overflow: 'hidden',
                                            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        }}>
                                            {userName || 'Account'}
                                        </span>
                                        <span style={{ fontSize: '9px', color: GOLD }}>▾</span>
                                    </button>

                                    {dropdownOpen && (
                                        <div style={{
                                            position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                                            background: '#fff', borderRadius: '14px', minWidth: '210px',
                                            boxShadow: '0 12px 40px rgba(0,0,0,0.14)',
                                            border: `1px solid rgba(201,168,76,0.15)`,
                                            zIndex: 999, overflow: 'hidden',
                                        }}>
                                            {/* User info */}
                                            <div style={{
                                                padding: '14px 16px',
                                                borderBottom: '1.5px solid rgba(0,0,0,0.06)',
                                                background: '#f9f8f6',
                                            }}>
                                                <div style={{ fontWeight: 800, fontSize: '14px', color: '#1a1a1a' }}>
                                                    {userName}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>
                                                    {storedUser.email || ''}
                                                </div>
                                            </div>

                                            {/* Edit Profile */}
                                            <button type="button"
                                                onClick={() => { setDropdownOpen(false); setShowEditModal(true) }}
                                                style={{
                                                    width: '100%', padding: '12px 16px', border: 'none',
                                                    background: 'transparent', textAlign: 'left', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '10px',
                                                    fontSize: '13px', color: '#333', fontWeight: 600,
                                                }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,168,76,0.07)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                            >
                                                <MdEdit size={15} color={GOLD} /> Edit Profile
                                            </button>

                                            {/* Sign Out */}
                                            <button type="button" onClick={handleLogout}
                                                style={{
                                                    width: '100%', padding: '12px 16px', border: 'none',
                                                    borderTop: '1.5px solid rgba(0,0,0,0.05)',
                                                    background: 'transparent', textAlign: 'left', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '10px',
                                                    fontSize: '13px', color: '#ef4444', fontWeight: 600,
                                                }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.06)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                            >
                                                <MdLogout size={15} color="#ef4444" /> Sign Out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Main Row ── */}
                    <div className="es-form-main-row">
                        <div className="es-form-left-panel">
                            <div className="es-form-panel-logo">
                                <h2 className="es-form-panel-tagline">AI <span>Budget</span> Planner</h2>
                                <p className="es-form-panel-desc">Select venue to enable guest count estimation.</p>
                            </div>
                            <div className="es-form-left-bottom">
                                <button type="submit" className="es-form-predict-btn"
                                    disabled={!isFormValid || loading}>
                                    {loading ? 'Processing…' : 'Predict Budget'}
                                </button>
                            </div>
                        </div>

                        <div className="es-form-right-panel">
                            <div className="es-form-content">
                                {loading ? (
                                    <div className="es-form-progress-overlay">
                                        <div className="es-form-progress-title">AI Prediction in Progress</div>
                                        <div className="es-form-progress-steps">
                                            {STEPS.map((step, i) => (
                                                <div key={i} className={`es-form-progress-step step-${stepStatuses[i]}`}>
                                                    <div className="es-form-step-icon">{renderStepIcon(stepStatuses[i], step)}</div>
                                                    <div className="es-form-step-text">
                                                        <span className="es-form-step-label">{step.label}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="es-form-section">
                                            <div className="es-form-section-title">General Info</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                <select name="event_type" value={form.event_type}
                                                    onChange={handleChange} className="es-form-input">
                                                    {eventTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                                <div className="es-form-grid-2">
                                                    <div className={`es-form-input-container ${form.has_venue === 0 ? 'disabled-field' : ''}`}>
                                                        <input name="num_guests" type="number"
                                                            placeholder={form.has_venue === 1 ? 'Guests' : 'Select Venue First'}
                                                            value={form.num_guests} onChange={handleNumberChange}
                                                            className="es-form-input" disabled={form.has_venue === 0} />
                                                    </div>
                                                    <input name="max_budget" type="number" placeholder="Budget (LKR)"
                                                        value={form.max_budget} onChange={handleNumberChange} className="es-form-input" />
                                                </div>
                                                <input name="location" type="text" placeholder="Location"
                                                    value={form.location} onChange={handleChange} className="es-form-input" />
                                            </div>
                                        </div>

                                        <div className="es-form-section">
                                            <div className="es-form-section-title">Services &amp; Optimization</div>
                                            <div className="es-form-services-grid">
                                                {serviceOptions.map(({ key, label, Icon }) => (
                                                    <div key={key}
                                                        className={`es-form-service-toggle ${form[key] === 1 ? 'active' : ''}`}
                                                        onClick={() => handleServiceToggle(key)}>
                                                        <Icon size={20} /><span>{label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            {showEditModal && (
                <EditProfileModal
                    user={{ name: userName, email: storedUser.email || '' }}
                    onClose={() => setShowEditModal(false)}
                    onSaved={newName => setUserName(newName)}
                />
            )}
        </>
    )
}

export default EventForm
