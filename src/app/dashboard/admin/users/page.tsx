'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import UserTable from '@/components/admin/UserTable';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    isApproved: boolean;
    isActive: boolean;
    isBanned: boolean;
    bannedUntil: Date | null;
    phone: string | null;
    studentId: string | null;
    employeeId: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface PaginationData {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
}

interface Stats {
    pendingCount: number;
}

export default function UserManagementPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [users, setUsers] = useState<User[]>([]);
    const [pagination, setPagination] = useState<PaginationData>({
        page: 1,
        limit: 20,
        totalCount: 0,
        totalPages: 0,
        hasMore: false
    });
    const [stats, setStats] = useState<Stats>({ pendingCount: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'incharges' | 'admins'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Redirect if not admin
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
        router.push('/dashboard');
        return null;
    }

    // Fetch users
    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            setError('');

            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });

            if (searchQuery) params.append('search', searchQuery);
            if (roleFilter) params.append('role', roleFilter);
            if (statusFilter) params.append('isActive', statusFilter);

            // Apply tab filters
            if (activeTab === 'pending') {
                params.append('isApproved', 'false');
            } else if (activeTab === 'incharges') {
                params.append('role', 'INCHARGE');
                params.append('isApproved', 'true');
            } else if (activeTab === 'admins') {
                params.append('role', 'ADMIN');
                params.append('isApproved', 'true');
            }

            const response = await fetch(`/api/admin/users?${params.toString()}`);

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const data = await response.json();
            setUsers(data.users);
            setPagination(data.pagination);
            setStats(data.stats);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch users on mount and when filters/pagination change
    useEffect(() => {
        if (status === 'authenticated') {
            fetchUsers();
        }
    }, [status, pagination.page, searchQuery, roleFilter, statusFilter, activeTab]);

    // Handle approve user
    const handleApprove = async (userId: string) => {
        if (!confirm('Are you sure you want to approve this user?')) return;

        try {
            const response = await fetch(`/api/admin/users/${userId}/approve`, {
                method: 'POST'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to approve user');
            }

            // Refresh users
            fetchUsers();
            alert('User approved successfully');
        } catch (err: any) {
            alert(err.message);
        }
    };

    // Handle reject user
    const handleReject = async (userId: string) => {
        const reason = prompt('Enter rejection reason (optional):');
        if (reason === null) return; // User cancelled

        try {
            const response = await fetch(`/api/admin/users/${userId}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to reject user');
            }

            // Refresh users
            fetchUsers();
            alert('User rejected successfully');
        } catch (err: any) {
            alert(err.message);
        }
    };

    // Handle role change
    const handleRoleChange = async (userId: string, newRole: string) => {
        if (!confirm(`Change user role to ${newRole}?`)) return;

        try {
            const response = await fetch(`/api/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update user role');
            }

            // Refresh users
            fetchUsers();
            alert('User role updated successfully');
        } catch (err: any) {
            alert(err.message);
        }
    };

    // Handle status toggle
    const handleStatusToggle = async (userId: string, isActive: boolean) => {
        if (!confirm(`${isActive ? 'Activate' : 'Deactivate'} this user?`)) return;

        try {
            const response = await fetch(`/api/admin/users/${userId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update user status');
            }

            // Refresh users
            fetchUsers();
            alert(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
        } catch (err: any) {
            alert(err.message);
        }
    };

    // Handle delete user
    const handleDelete = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete user');
            }

            // Refresh users
            fetchUsers();
            alert('User deleted successfully');
        } catch (err: any) {
            alert(err.message);
        }
    };

    // Handle revoke ban
    const handleRevokeBan = async (userId: string) => {
        if (!confirm('Are you sure you want to revoke this user\'s ban? They will be able to request items immediately.')) return;

        try {
            const response = await fetch(`/api/admin/users/${userId}/revoke-ban`, {
                method: 'PUT'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to revoke ban');
            }

            // Refresh users
            fetchUsers();
            alert('Ban revoked successfully');
        } catch (err: any) {
            alert(err.message);
        }
    };

    // Handle bulk approve
    const handleBulkApprove = async (userIds: string[]) => {
        if (!confirm(`Approve ${userIds.length} user(s)?`)) return;

        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userIds, action: 'approve' })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to approve users');
            }

            const data = await response.json();
            // Refresh users
            fetchUsers();
            alert(data.message || `Successfully approved ${data.count} user(s)`);
        } catch (err: any) {
            alert(err.message);
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-gradient-light flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                    <p className="mt-4 text-secondary-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-light">
            {/* Header */}
            <header className="bg-white border-b border-secondary-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-secondary-800">User Management</h1>
                            <p className="text-sm text-secondary-600 mt-1">Manage users, approvals, and roles</p>
                        </div>
                        <button
                            onClick={() => router.push('/dashboard/admin')}
                            className="px-4 py-2 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            ← Back to Dashboard
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-4 border border-secondary-200">
                        <p className="text-sm text-secondary-600">Total Users</p>
                        <p className="text-2xl font-bold text-secondary-800">{pagination.totalCount}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4 border border-secondary-200">
                        <p className="text-sm text-secondary-600">Pending Approval</p>
                        <p className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-md mb-6 border border-secondary-200">
                    <div className="border-b border-secondary-200">
                        <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                            {[
                                { key: 'all', label: 'All Users', count: pagination.totalCount },
                                { key: 'pending', label: 'Pending Approval', count: stats.pendingCount },
                                { key: 'incharges', label: 'Incharges', count: 0 },
                                { key: 'admins', label: 'Admins', count: 0 }
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => {
                                        setActiveTab(tab.key as any);
                                        setPagination({ ...pagination, page: 1 });
                                    }}
                                    className={`${activeTab === tab.key
                                        ? 'border-primary-500 text-primary-600'
                                        : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                                >
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-secondary-100">
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Filters */}
                    <div className="p-4 bg-secondary-50">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Search by name, email, or ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* User Table */}
                <UserTable
                    users={users}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onRoleChange={handleRoleChange}
                    onStatusToggle={handleStatusToggle}
                    onDelete={handleDelete}
                    onRevokeBan={handleRevokeBan}
                    onBulkApprove={handleBulkApprove}
                    isLoading={isLoading}
                />

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between bg-white rounded-lg shadow-md p-4 border border-secondary-200">
                        <div className="text-sm text-secondary-600">
                            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                            {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
                            {pagination.totalCount} users
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                                disabled={pagination.page === 1}
                                className="px-4 py-2 border border-secondary-300 rounded-lg text-sm font-medium text-secondary-700 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                                disabled={!pagination.hasMore}
                                className="px-4 py-2 border border-secondary-300 rounded-lg text-sm font-medium text-secondary-700 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
