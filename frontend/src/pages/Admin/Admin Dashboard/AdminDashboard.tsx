import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    MdPeople, 
    MdHistory, 
    MdAnalytics, 
    MdLogout, 
    MdDashboard,
    MdMenu
} from 'react-icons/md';
import UserHistory from '../User History/UserHistory';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<string>('user-management');
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="admin-container">
            {/* Sidebar Section */}
            <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-brand">
                    <MdDashboard className="brand-icon" />
                    <span>Admin Panel</span>
                </div>

                <nav className="sidebar-menu">
                    {/* <button 
                        className={activeTab === 'users-history' ? 'menu-item active' : 'menu-item'} 
                        onClick={() => setActiveTab('/admin-user-management')}
                    >
                        <MdPeople className="menu-icon" /> <span>User Management</span>
                    </button> */}
                    <button 
                        className={activeTab === 'User Management' ? 'menu-item active' : 'menu-item'} 
                        onClick={() => {
                            setActiveTab('admin-user-management');
                            navigate('/admin-user-management'); // මෙතනින් /event-form එකට යොමු කරයි
                        }}
                    >
                                                <MdPeople className="menu-icon" /> <span>User Management</span>

</button>
                    <button 
                        className={activeTab === 'user-management' ? 'menu-item active' : 'menu-item'} 
                        onClick={() => setActiveTab('user-management')}
                    >
                        <MdHistory className="menu-icon" /> <span>Users History</span>
                    </button>

                                <button 
                        className={activeTab === 'budget-predictions' ? 'menu-item active' : 'menu-item'} 
                        onClick={() => {
                            setActiveTab('budget-predictions');
                            navigate('/event-form'); // මෙතනින් /event-form එකට යොමු කරයි
                        }}
                    >
                        <MdAnalytics className="menu-icon" /> <span>Budget Predictions</span>
        </button>
                </nav>

                <div className="sidebar-footer">
                    <button className="signout-btn" onClick={handleLogout}>
                        <MdLogout className="menu-icon" /> <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="admin-content">
                <header className="content-header">
                    <div className="header-left">
                        <button className="toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                            <MdMenu />
                        </button>
                        <div className="breadcrumb">
                            <span className="current-page">{activeTab.replace('-', ' ').toUpperCase()}</span>
                            <span className="user-role">Administrator</span>
                        </div>
                    </div>
                </header>

                <main className="content-body">
                    {activeTab === 'user-management' && <UserHistory />}
                    {activeTab === 'users-history' && <div className="p-8 text-gray-500">Users History Content Coming Soon...</div>}
                    {activeTab === 'budget-predictions' && <div className="p-8 text-gray-500">Analytics Content Coming Soon...</div>}
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;