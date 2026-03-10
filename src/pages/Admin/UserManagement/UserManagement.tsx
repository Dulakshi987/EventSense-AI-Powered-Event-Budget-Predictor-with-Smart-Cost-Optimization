import React, { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { MdDelete, MdPeople } from 'react-icons/md';
import './UserManagement.css';

interface User {
    _id: string;
    name: string;
    email: string;
}

interface DeleteResponse {
    message: string;
    deletedUser: {
        name: string;
        email: string;
    };
}

interface ApiErrorResponse {
    error?: string;
}

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get<User[]>('http://localhost:3001/api/admin/users');
            setUsers(response.data);
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            const errorMessage =
                axiosError.response?.data?.error ||
                axiosError.message ||
                'Failed to fetch users';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId: string, userEmail: string): Promise<void> => {
        if (!window.confirm(`Delete user "${userEmail}"?`)) return;

        try {
            setDeletingId(userId);
            await axios.delete<DeleteResponse>(`http://localhost:3001/api/admin/users/${userId}`);

            setUsers(prev => prev.filter(user => user._id !== userId));
            alert(`User "${userEmail}" deleted successfully`);
        } catch (err) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            const errorMessage =
                axiosError.response?.data?.error ||
                axiosError.message ||
                'Failed to delete user';
            alert(errorMessage);
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return <p>Loading users...</p>;
    }

    if (error) {
        return (
            <div>
                <p>{error}</p>
                <button onClick={fetchUsers}>Retry</button>
            </div>
        );
    }

    return (
        <div className="user-management">
            <h2 className="page-title">
                <MdPeople /> User Management
            </h2>

            <table className="user-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {users.map((user, index) => (
                        <tr key={user._id}>
                            <td>{index + 1}</td>
                            <td>{user.name}</td>
                            <td>{user.email}</td>

                            <td>
                                <button
                                    className="delete-btn"
                                    onClick={() => handleDelete(user._id, user.email)}
                                    disabled={deletingId === user._id}
                                >
                                    {deletingId === user._id ? (
                                        "Deleting..."
                                    ) : (
                                        <>
                                            <MdDelete /> Delete
                                        </>
                                    )}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserManagement;