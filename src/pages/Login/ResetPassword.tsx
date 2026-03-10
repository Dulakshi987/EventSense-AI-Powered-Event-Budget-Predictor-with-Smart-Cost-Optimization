import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const ResetPassword = () => {
    const { token } = useParams<{ token: string }>(); // Token එක URL එකෙන් ගනී
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return toast.error("Passwords don't match");
        }

        setLoading(true);
        try {
            
            await axios.post('http://localhost:3001/api/reset-password-final', { 
                token: token, 
                newPassword: newPassword 
            });            toast.success('Password updated successfully!');
            navigate('/login');
        } catch (error: unknown) { 
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Link expired or invalid');
            } else {
                toast.error('An unexpected error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="event-sense-login">
            <div className="es-login-right__inner">
                <h2 className="es-login-heading">Create New Password</h2>
                <p className="es-login-sub-text">Please enter your new password below.</p>
                
                <form onSubmit={handleSubmit} className="es-login-form">
                    <div className="es-login-field">
                        <input 
                            type="password" 
                            placeholder="New Password" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)} 
                            className="es-login-input" 
                            required 
                        />
                    </div>
                    <div className="es-login-field">
                        <input 
                            type="password" 
                            placeholder="Confirm New Password" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            className="es-login-input" 
                            required 
                        />
                    </div>
                    <button type="submit" className="es-login-submit-btn" disabled={loading}>
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;