import React, { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
    MdAdd, MdLogout, MdTrendingUp, MdCheckCircleOutline,
    MdStorefront, MdAttachMoney, MdArrowBack, MdLocationOn,
    MdStar, MdPhone, MdWorkspacePremium,
} from 'react-icons/md'
import './Dashboard.css'

interface Vendor {
    service: string
    name?: string
    contact?: string
    location?: string   
    cost?: number       
    rating?: number     
    experience?: number 
    note?: string
}

interface PredictionResult {
    predicted_total: number
    budget_status: string          
    difference: number
    breakdown?: Record<string, number>
    optimized_breakdown?: Record<string, number>
    optimized_total?: number
    vendors?: Vendor[]
    event_type?: string
    userInputBudget?: number
}

const Dashboard: React.FC = () => {
    const navigate = useNavigate()

    const [result] = useState<PredictionResult | null>(() => {
        const stored = localStorage.getItem('result')
        if (stored) {
            try { return JSON.parse(stored) as PredictionResult }
            catch (err) { console.error('Data load error:', err); return null }
        }
        return null
    })

    const handleNewEvent  = useCallback(() => navigate('/event-form'), [navigate])
    const handleLogout    = useCallback(() => {
        toast.success('Signed out of Event Sense.')
        navigate('/')
    }, [navigate])



    const formatServiceName = (name: string) =>
        name.replace('has_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

    // breakdown display (same as before)
    const displayBreakdown = result
        ? (result.budget_status === 'over' && result.optimized_breakdown
            ? result.optimized_breakdown
            : result.breakdown)
        : {}

    // Predicted Total Cost = sum of breakdown amounts
    const breakdownSum = Object.values(displayBreakdown || {}).reduce((a, b) => a + b, 0)

    // Optimized Budget = Input Max Budget - breakdown sum
    const userBudget      = result?.userInputBudget ?? 0
    const optimizedBudget = userBudget - breakdownSum
    const isOver          = optimizedBudget < 0

    return (
        <div className="event-sense-dashboard">

            {/* ── Top Nav ───────────────────────────────── */}
            <div className="es-dash-topbar">
                <span className="es-dash-brand-name">
                    Event <span className="es-dash-brand-accent">Sense</span>
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button className="es-dash-new-btn" onClick={handleNewEvent} id="dashboard-new-event-btn">
                        <MdAdd size={18} /> New Prediction
                    </button>
                    <button className="es-dash-logout-btn" onClick={handleLogout} id="dashboard-logout-btn">
                        <MdLogout size={16} /> Sign Out
                    </button>
                </div>
            </div>

            <div className="es-dash-content" style={{ padding: '32px 24px', maxWidth: '1100px', margin: '0 auto' }}>

                {!result ? (
                    <div className="es-dash-empty">
                        <div className="es-dash-empty-title">No prediction results found</div>
                        <p className="es-dash-empty-text">Please go back and run a budget prediction for your event.</p>
                        <button className="es-dash-back-btn" onClick={() => navigate('/event-form')}>
                            <MdArrowBack size={17} /> Go to Event Form
                        </button>
                    </div>
                ) : (
                    <>
                        {/* ── Page Heading ─────────────────────── */}
                        <div style={{ marginBottom: '28px' }}>
                            <h1 className="es-dash-heading" style={{ fontWeight: 900, fontSize: '1.5rem', marginBottom: '6px' }}>
                                Your {result.event_type || 'Event'} Budget Prediction
                            </h1>
                        </div>

                        {/* ── Summary Cards ────────────────────── */}
                        <div className="es-result-summary-grid">

                            {/* Card 1: Input Max Budget */}
                            <div className="es-result-card">
                                <div className="es-result-card-label">
                                    <MdAttachMoney size={14} /> Input Max Budget
                                </div>
                                <div className="es-result-card-amount" style={{ color: '#2563eb' }}>
                                    <span className="es-result-card-currency">LKR</span>
                                    {Math.round(userBudget).toLocaleString('en-LK')}
                                </div>
                            </div>

                            {/* Predicted Total Cost = breakdown sum */}
                            <div className="es-result-card">
                                <div className="es-result-card-label">
                                    <MdTrendingUp size={14} /> Predicted Total Cost
                                </div>
                                <div className="es-result-card-amount predicted">
                                    <span className="es-result-card-currency">LKR</span>
                                    {Math.round(breakdownSum).toLocaleString('en-LK')}
                                </div>
                            </div>

                            {/* Optimized Budget = Input Max Budget - Predicted Total Cost */}
                            <div className="es-result-card">
                                <div className="es-result-card-label">
                                    <MdCheckCircleOutline size={14} /> Optimized Budget
                                </div>
                                <div
                                    className="es-result-card-amount optimised"
                                    style={{ color: isOver ? '#ef4444' : '#10b981' }}
                                >
                                    <span className="es-result-card-currency">LKR</span>
                                    {Math.round(Math.abs(optimizedBudget)).toLocaleString('en-LK')}
                                </div>
                                <div style={{
                                    fontSize: '12px', fontWeight: 'bold', marginTop: '4px',
                                    color: isOver ? '#ef4444' : '#10b981'
                                }}>
                                    {isOver ? ' Over Budget' : ' Within Budget'}
                                </div>
                            </div>

                        </div>

                        {/* ── Service Breakdown ────────────────── */}
                        <div className="es-dash-section-heading">
                            <MdAttachMoney size={16} />
                            Service Breakdown
                            {result.budget_status === 'over' && result.optimized_breakdown && (
                                <span style={{
                                    marginLeft: 8, fontSize: '11px', background: '#fef3c7',
                                    color: '#92400e', padding: '2px 8px', borderRadius: 4, fontWeight: 600
                                }}>
                                    Optimized Amounts
                                </span>
                            )}
                        </div>

                        <div className="es-dash-table-wrap">
                            <table className="es-dash-table">
                                <thead>
                                    <tr>
                                        <th>Service</th>
                                        <th style={{ textAlign: 'right' }}>Allocated Budget (LKR)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(displayBreakdown || {}).map(([service, amount]) => (
                                        <tr key={service}>
                                            <td className="service-name">{formatServiceName(service)}</td>
                                            <td className="amount" style={{ textAlign: 'right' }}>
                                                {Math.round(amount).toLocaleString('en-LK')}
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Total row */}
                                    {Object.keys(displayBreakdown || {}).length > 0 && (
                                        <tr style={{ borderTop: '2px solid #e5e7eb', fontWeight: 700, background: '#f8fafc' }}>
                                            <td style={{ padding: '10px 12px' }}>Total</td>
                                            <td style={{ textAlign: 'right', color: '#1d4ed8', padding: '10px 12px' }}>
                                                {Math.round(breakdownSum).toLocaleString('en-LK')}
                                            </td>
                                        </tr>
                                    )}
                                    {Object.keys(displayBreakdown || {}).length === 0 && (
                                        <tr>
                                            <td colSpan={2} className="muted">No breakdown data available.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* ── Recommended Vendors ──────────────── */}
                        <div className="es-dash-section-heading">
                            <MdStorefront size={16} /> Recommended Vendors &amp; Venues
                        </div>

                        <div className="es-dash-table-wrap">
                            {Array.isArray(result.vendors) && result.vendors.length > 0 ? (
                                <table className="es-dash-table">
                                    <thead>
                                        <tr>
                                            <th>Service</th>
                                            <th>Name</th>
                                            <th>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <MdLocationOn size={13} /> Location
                                                </span>
                                            </th>
                                            <th>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <MdPhone size={13} /> Contact
                                                </span>
                                            </th>
                                            
                                            <th style={{ textAlign: 'center' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                                                    <MdStar size={13} /> Rating
                                                </span>
                                            </th>
                                            <th style={{ textAlign: 'center' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                                                    <MdWorkspacePremium size={13} /> Exp (yrs)
                                                </span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.vendors.map((v, idx) => (
                                            <tr key={idx}>
                                                <td className="service-name">{formatServiceName(v.service)}</td>
                                                <td style={{ fontWeight: 600 }}>{v.name || 'N/A'}</td>

                                                {/* Location */}
                                                <td>
                                                    {v.location
                                                        ? <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#4b5563' }}>
                                                            <MdLocationOn size={13} color="#6b7280" />
                                                            {v.location}
                                                          </span>
                                                        : <span className="muted">—</span>
                                                    }
                                                </td>

                                                <td className="muted">{v.contact || 'N/A'}</td>

                                               

                                                {/* Rating */}
                                                <td style={{ textAlign: 'center' }}>
                                                    {v.rating !== undefined
                                                        ? <span style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: 2,
                                                            background: '#fef9c3', color: '#854d0e',
                                                            borderRadius: 4, padding: '2px 6px', fontWeight: 700, fontSize: '12px'
                                                          }}>
                                                            <MdStar size={12} color="#f59e0b" />
                                                            {v.rating.toFixed(1)}
                                                          </span>
                                                        : <span className="muted">—</span>
                                                    }
                                                </td>

                                                {/* Experience */}
                                                <td style={{ textAlign: 'center' }}>
                                                    {v.experience !== undefined
                                                        ? <span style={{
                                                            background: '#ede9fe', color: '#5b21b6',
                                                            borderRadius: 4, padding: '2px 8px',
                                                            fontWeight: 600, fontSize: '12px'
                                                          }}>
                                                            {v.experience} yr{v.experience !== 1 ? 's' : ''}
                                                          </span>
                                                        : <span className="muted">—</span>
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="es-dash-no-vendor" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                    No vendor recommendations available for this budget.
                                </p>
                            )}
                        </div>

                        <div className="es-dash-cta-wrap" style={{ marginTop: '40px', textAlign: 'center' }}>
                            <button className="es-dash-predict-btn" onClick={() => navigate('/event-form')}>
                                <MdAdd size={18} /> Predict Another Event
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default Dashboard
