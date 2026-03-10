import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    MdEmail, MdHistory, MdExpandMore, MdExpandLess, MdEvent, 
    MdAttachMoney, MdStorefront, MdLocationOn, MdAccountBalanceWallet, MdSavings
} from 'react-icons/md';

interface Vendor {
    service: string;
    name?: string;
    location?: string;
    rating?: number;
    experience?: number;
}

interface Venue {
    name: string;
    location?: string;
}

interface PredictionResult {
    event_type?: string;
    userInputBudget?: number;
    predicted_total?: number;
    breakdown?: Record<string, number>;
    optimized_breakdown?: Record<string, number>;
    budget_status?: string;
    vendors?: Vendor[];
    venue?: Venue;
}

interface UserHistory {
    _id?: string;
    result: PredictionResult;
    createdAt: string;
}

interface User {
    _id: string;
    name: string;
    email: string;
    history: UserHistory[];
}

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await axios.get('http://localhost:3001/api/admin/users');
                setUsers(res.data);
            } catch (err) {
                console.error("Admin fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const formatLKR = (val?: number) =>
        val !== undefined ? Math.round(val).toLocaleString('en-LK') : '0';

    const formatServiceName = (name: string) =>
        name.replace('has_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    if (loading) return <div className="p-10 text-center font-bold text-gray-500">Loading Administrative Data...</div>;

    return (
        <div className="admin-users-list p-4">
            <h2 className="mb-8 text-3xl font-black text-gray-800 flex items-center gap-3">
                All Users Predictions History
            </h2>

            <div className="space-y-6">
                {users.map(user => (
                    <div key={user._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* User Header */}
                        <div className="p-5 flex flex-wrap justify-between items-center bg-white">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-inner">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                        <MdEmail className="text-gray-400" /> {user.email}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setExpandedUserId(expandedUserId === user._id ? null : user._id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border font-bold transition-all ${
                                    expandedUserId === user._id 
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <MdHistory /> {user.history?.length || 0} Predictions
                                {expandedUserId === user._id ? <MdExpandLess /> : <MdExpandMore />}
                            </button>
                        </div>

                        {/* Expanded History */}
                        {expandedUserId === user._id && (
                            <div className="p-5 bg-gray-50 border-t border-gray-100 space-y-6">
                                {user.history && user.history.length > 0 ? (
                                    user.history.slice().reverse().map((item, idx) => {
                                        const result = item.result;
                                        const displayBreakdown =
                                            result.budget_status === 'over' && result.optimized_breakdown
                                            ? result.optimized_breakdown
                                            : result.breakdown || {};

                                        const breakdownSum = Object.values(displayBreakdown).reduce((a, b) => a + Number(b), 0);
                                        const userBudget = result.userInputBudget ?? 0;
                                        const optimizedBudget = userBudget - breakdownSum;
                                        const isOver = optimizedBudget < 0;

                                        return (
                                            <div key={item._id || idx} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                                {/* Header */}
                                                <div className="bg-gray-800 px-5 py-3 flex justify-between items-center text-white">
                                                    <span className="font-bold flex items-center gap-2">
                                                        <MdEvent className="text-indigo-400" /> 
                                                        {result.event_type || "Event Plan"}
                                                    </span>
                                                    <span className="text-xs font-medium opacity-70">
                                                        {new Date(item.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>

                                                <div className="p-5">
                                                    {/* Summary Cards */}
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                                            <p className="text-[10px] uppercase font-bold text-blue-600 mb-1 flex items-center gap-1">
                                                                <MdAccountBalanceWallet /> Event Budget
                                                            </p>
                                                            <p className="text-xl font-black text-blue-900">
                                                                LKR {formatLKR(userBudget)}
                                                            </p>
                                                        </div>

                                                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                                            <p className="text-[10px] uppercase font-bold text-indigo-600 mb-1 flex items-center gap-1">
                                                                <MdAttachMoney /> Predicted Total
                                                            </p>
                                                            <p className="text-xl font-black text-indigo-900">
                                                                LKR {formatLKR(breakdownSum)}
                                                            </p>
                                                        </div>

                                                        <div className={`${isOver ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'} p-4 rounded-xl border`}>
                                                            <p className={`text-[10px] uppercase font-bold mb-1 flex items-center gap-1 ${isOver ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                                <MdSavings /> {isOver ? 'Budget Deficit' : 'Optimized Balance'}
                                                            </p>
                                                            <p className={`text-xl font-black ${isOver ? 'text-rose-900' : 'text-emerald-900'}`}>
                                                                LKR {formatLKR(Math.abs(optimizedBudget))}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Venue */}
                                                    {result.venue && (
                                                        <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-100 flex items-center gap-3">
                                                            <div className="bg-orange-200 p-2 rounded-lg text-orange-700">
                                                                <MdLocationOn size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-bold text-orange-600 uppercase">Selected Venue</p>
                                                                <p className="font-bold text-orange-900">{result.venue.name}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Breakdown */}
                                                    {Object.keys(displayBreakdown).length > 0 && (
                                                        <div className="mb-6">
                                                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">Cost Breakdown</h4>
                                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                                                {Object.entries(displayBreakdown).map(([svc, amt]) => (
                                                                    <div key={svc} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                                        <span className="block text-[10px] text-gray-500 font-medium">{formatServiceName(svc)}</span>
                                                                        <span className="font-bold text-gray-800 text-sm">LKR {formatLKR(amt)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Vendors */}
                                                    {result.vendors && result.vendors.length > 0 && (
                                                        <div className="pt-4 border-t border-gray-100">
                                                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                                                                <MdStorefront /> Suggested Vendors
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {result.vendors.map((v, i) => (
                                                                    <span key={i} className="text-[11px] bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full font-bold">
                                                                        {v.name} <span className="opacity-60 font-medium">({formatServiceName(v.service)})</span>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-300">
                                        <p className="text-gray-400 italic">No prediction records found for this account.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserManagement;