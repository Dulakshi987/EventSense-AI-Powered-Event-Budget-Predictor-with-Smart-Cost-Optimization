import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './History.css'
import {
    MdArrowBack,  MdAttachMoney,
    MdStorefront, MdLocationOn, MdStar,
} from 'react-icons/md'

interface Vendor {
    service: string
    name?: string
    contact?: string
    location?: string
    rating?: number
    experience?: number
}

interface Result {
    predicted_total?: number
    userInputBudget?: number
    difference?: number
    breakdown?: Record<string, number>
    optimized_breakdown?: Record<string, number>
    budget_status?: string
    vendors?: Vendor[]
    event_type?: string
    location?: string
    num_guests?: number
}

interface HistoryItem {
    event: { event_type: string }
    result: Result
    createdAt: string
}

const History: React.FC = () => {
    const [history, setHistory] = useState<HistoryItem[]>([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) { navigate('/login'); return }

        axios.get('http://localhost:3001/api/history', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => { setHistory(res.data.history || []); setLoading(false) })
            .catch(err => {
                console.error(err)
                setLoading(false)
                if (err.response?.status === 401) {
                    localStorage.removeItem('token')
                    navigate('/login')
                }
            })
    }, [navigate])

    const formatLKR = (val?: number) =>
        val !== undefined && val !== null ? Math.round(val).toLocaleString('en-LK') : '0'

    const formatServiceName = (name: string) =>
        name.replace('has_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

    if (loading) {
        return (
            <div className="es-loader-container">
                <div className="spinner" />
                <p>Loading your event history...</p>
            </div>
        )
    }

    return (
        <div className="es-history-page">

            {/* ── Topbar ── */}
            <div className="es-history-topbar">
                <span className="es-history-brand">
                    Event <span>Sense</span>
                </span>
                <button className="es-history-back-btn" onClick={() => navigate('/event-form')}>
                    <MdArrowBack size={15} /> Back to Planner
                </button>
            </div>

            {/* ── Body ── */}
            <div className="es-history-body">

                {/* Title */}
                <h2 className="es-history-title">
                    {/* <span className="es-history-title-icon">
                        <MdEvent size={22} color="#fff8e1" />
                    </span> */}
                    Prediction History
                </h2>
                <p className="es-history-subtitle">Your previous AI budget predictions</p>

                {history.length === 0 ? (
                    <div className="es-history-empty">
                        <p>No previous predictions found.</p>
                        <button className="es-history-empty-btn" onClick={() => navigate('/event-form')}>
                            Start Your First Prediction
                        </button>
                    </div>
                ) : (
                    <div className="es-history-list">
                        {history.slice().reverse().map((item, index) => {
                            const result = item.result

                            const displayBreakdown =
                                result.budget_status === 'over' && result.optimized_breakdown
                                    ? result.optimized_breakdown
                                    : (result.breakdown || {})

                            const breakdownSum = Object.values(displayBreakdown).reduce((a, b) => a + Number(b), 0)
                            const userBudget = result.userInputBudget ?? 0
                            const optimizedBudget = userBudget - breakdownSum
                            const isOver = optimizedBudget < 0

                            return (
                                <div key={index} className="es-history-card">

                                    {/* ── Card Header ── */}
                                    <div className="es-history-card-header">
                                        <div className="es-history-card-header-left">
                                            <div className="es-history-card-eyebrow">Event Type</div>
                                            <h3 className="es-history-card-title">
                                                {result.event_type || item.event.event_type}
                                            </h3>
                                            {result.location && (
                                                <div className="es-history-card-location">
                                                    <MdLocationOn size={12} /> {result.location}
                                                </div>
                                            )}
                                        </div>
                                        <div className="es-history-card-header-right">
                                            <div className="es-history-card-date-label">Date</div>
                                            <div className="es-history-card-date">
                                                {new Date(item.createdAt).toLocaleDateString('en-LK', {
                                                    year: 'numeric', month: 'short', day: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── Card Body ── */}
                                    <div className="es-history-card-body">

                                        {/* ── 3 Summary Cards ── */}
                                        <div className="es-history-summary-grid">
                                            <div className="es-summary-card budget">
                                                <div className="es-summary-label">
                                                    <MdAttachMoney size={13} /> Input Max Budget
                                                </div>
                                                <div className="es-summary-value">LKR {formatLKR(userBudget)}</div>
                                            </div>

                                            <div className="es-summary-card predicted">
                                                <div className="es-summary-label">Predicted Total</div>
                                                <div className="es-summary-value">LKR {formatLKR(breakdownSum)}</div>
                                            </div>

                                            <div className={`es-summary-card ${isOver ? 'optimized-over' : 'optimized-ok'}`}>
                                                <div className="es-summary-label">Optimized Budget</div>
                                                <div className="es-summary-value">
                                                    LKR {formatLKR(Math.abs(optimizedBudget))}
                                                </div>
                                                <div className="es-summary-badge">
                                                    {isOver ? ' Over Budget' : 'Within Budget'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── Service Breakdown ── */}
                                        {Object.keys(displayBreakdown).length > 0 && (
                                            <div className="es-breakdown-section">
                                                <div className="es-history-section-title">
                                                    <MdAttachMoney size={14} /> Service Breakdown
                                                    {result.budget_status === 'over' && result.optimized_breakdown && (
                                                        <span className="es-optimized-badge">✦ Optimized</span>
                                                    )}
                                                </div>
                                                <div className="es-breakdown-grid">
                                                    {Object.entries(displayBreakdown).map(([svc, amt]) => (
                                                        <div key={svc} className="es-breakdown-item">
                                                            <div className="es-breakdown-item-name">
                                                                {formatServiceName(svc)}
                                                            </div>
                                                            <div className="es-breakdown-item-value">
                                                                LKR {formatLKR(amt)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="es-breakdown-total">
                                                    <span className="es-breakdown-total-label">Total</span>
                                                    <span className="es-breakdown-total-value">
                                                        LKR {formatLKR(breakdownSum)}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* ── Vendors ── */}
                                        {result.vendors && result.vendors.length > 0 && (
                                            <div className="es-vendors-section">
                                                <div className="es-history-section-title">
                                                    <MdStorefront size={14} /> Suggested Vendors
                                                </div>
                                                <div className="es-vendor-list">
                                                    {result.vendors.map((v, i) => (
                                                        <div key={i} className="es-vendor-chip">
                                                            <span className="es-vendor-service">
                                                                {formatServiceName(v.service)}
                                                            </span>
                                                            <span className="es-vendor-name">{v.name}</span>
                                                            {v.location && (
                                                                <span className="es-vendor-location">
                                                                    <MdLocationOn size={11} />{v.location}
                                                                </span>
                                                            )}
                                                            {v.rating !== undefined && (
                                                                <span className="es-vendor-rating">
                                                                    <MdStar size={11} />{v.rating.toFixed(1)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

export default History
