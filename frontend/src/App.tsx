import React, { lazy, Suspense, useCallback, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Preloader from './components/Preloader/Preloader'


const Home = lazy(() => import('./pages/Home/Home'))
const Login = lazy(() => import('./pages/Login/Login'))
const ResetPassword = lazy(() => import('./pages/Login/ResetPassword'))
const FrogetPassword = lazy(() => import('./pages/Login/FrogetPassword'))
const Register = lazy(() => import('./pages/Register/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'))
const EventForm = lazy(() => import('./pages/EventForm/EventForm'))
const History = lazy(() => import('./pages/History/History'))
const AdminUserManagement = lazy(() => import('./pages/Admin/UserManagement/UserManagement'))
const AdminUserHistory = lazy(() => import('./pages/Admin/User History/UserHistory'))

// --- ADMIN PAGES ---

const AdminLogin = lazy(() => import('./pages/Admin/Login/Login'))
const AdminDashboard = lazy(() => import('./pages/Admin/Admin Dashboard/AdminDashboard'))

const SuspenseFallback: React.FC = () => (
    <div
        style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0f172a', // Dark background to match Admin Login
            color: '#d4af37',
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '0.15em',
            fontSize: '0.85rem',
            fontWeight: 600,
            textTransform: 'uppercase',
        }}
    >
        Loading…
    </div>
)

const App: React.FC = () => {
    const [preloading, setPreloading] = useState<boolean>(true)

  
    const handlePreloaderComplete = useCallback(() => {
        setPreloading(false)
    }, [])

    return (
        <>
           
            {preloading && <Preloader onComplete={handlePreloaderComplete} />}

            {/* Route Tree */}
            <div style={{ display: preloading ? 'none' : 'block' }}>
                <Suspense fallback={<SuspenseFallback />}>
                    <Routes>
                        {/* --- PUBLIC ROUTES --- */}
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/reset-password/:token" element={<ResetPassword />} />
                        <Route path="/forgot-password" element={<FrogetPassword />} />
                        <Route path="/register" element={<Register />} />
                        
                        {/* --- USER ROUTES --- */}
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/event-form" element={<EventForm />} />
                        <Route path="/history" element={<History />} />

                        {/* --- ADMIN ROUTES --- */}
                        
                        <Route path="/admin-login" element={<AdminLogin />} />
                        <Route path="/admin-dashboard" element={<AdminDashboard />} />
                        <Route path="/admin-user-management" element={<AdminUserManagement />} />
                        <Route path="/admin-user-history" element={<AdminUserHistory />} />
                        
                        
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
            </div>
        </>
    )
}

export default App