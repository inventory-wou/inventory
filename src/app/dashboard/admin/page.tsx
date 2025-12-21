'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import DepartmentChart from '@/components/admin/DepartmentChart';
import CategoryChart from '@/components/admin/CategoryChart';
import IssueTrendsChart from '@/components/admin/IssueTrendsChart';

interface AdminStats {
    users: {
        total: number;
        approved: number;
        pending: number;
        banned: number;
    };
    items: {
        total: number;
        available: number;
        issued: number;
        maintenance: number;
    };
    departments: number;
    categories: number;
    requests: {
        pending: number;
    };
    overdue: number;
    recentActivity: Array<{
        id: string;
        action: string;
        entityType: string;
        userName: string;
        timestamp: string;
    }>;
}

interface AnalyticsData {
    departmentStats: Array<{
        name: string;
        code: string;
        total: number;
        available: number;
        issued: number;
    }>;
    categoryStats: Array<{
        name: string;
        count: number;
    }>;
    monthlyTrends: Array<{
        month: string;
        issued: number;
        returned: number;
    }>;
}

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(true);

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
            fetchStats();
            fetchAnalytics();
        }
    }, [status, session]);

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/admin/stats');
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoadingStats(false);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const response = await fetch('/api/admin/analytics');
            if (response.ok) {
                const data = await response.json();
                setAnalytics(data);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoadingAnalytics(false);
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

    if (session?.user?.role !== 'ADMIN') {
        router.push('/dashboard');
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-light">
            {/* Header */}
            <header className="bg-white border-b border-secondary-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-4">
                                <h1 className="text-xl font-bold text-secondary-800">Inventory System</h1>
                                <p className="text-xs text-secondary-500">Admin Dashboard</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <p className="text-sm font-medium text-secondary-800">{session?.user?.name}</p>
                                <p className="text-xs text-secondary-500">{session?.user?.email}</p>
                            </div>
                            <button
                                onClick={() => signOut({ callbackUrl: '/login' })}
                                className="px-4 py-2 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 rounded-lg text-sm font-medium transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-secondary-200">
                    <h2 className="text-2xl font-bold text-secondary-800 mb-2">
                        Welcome back, {session?.user?.name}! 👋
                    </h2>
                    <p className="text-secondary-600">
                        You're logged in as an Administrator. Manage your inventory system from here.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-md p-6 border border-secondary-200">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-secondary-600">Total Users</p>
                                <p className="text-2xl font-bold text-secondary-800">
                                    {loadingStats ? '...' : stats?.users.total || 0}
                                </p>
                                {!loadingStats && stats && (
                                    <p className="text-xs text-secondary-500 mt-1">
                                        {stats.users.pending} pending
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border border-secondary-200">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-secondary-600">Total Items</p>
                                <p className="text-2xl font-bold text-secondary-800">
                                    {loadingStats ? '...' : stats?.items.total || 0}
                                </p>
                                {!loadingStats && stats && (
                                    <p className="text-xs text-secondary-500 mt-1">
                                        {stats.items.available} available
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border border-secondary-200">
                        <div className="flex items-center">
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-secondary-600">Pending Requests</p>
                                <p className="text-2xl font-bold text-secondary-800">
                                    {loadingStats ? '...' : stats?.requests.pending || 0}
                                </p>
                                {!loadingStats && stats && stats.overdue > 0 && (
                                    <p className="text-xs text-red-600 mt-1">
                                        {stats.overdue} overdue
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border border-secondary-200">
                        <div className="flex items-center">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-secondary-600">Departments</p>
                                <p className="text-2xl font-bold text-secondary-800">
                                    {loadingStats ? '...' : stats?.departments || 0}
                                </p>
                                {!loadingStats && stats && (
                                    <p className="text-xs text-secondary-500 mt-1">
                                        {stats.categories} categories
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-secondary-200">
                    <h3 className="text-lg font-semibold text-secondary-800 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <button
                            onClick={() => router.push('/dashboard/admin/users')}
                            className="flex items-center p-4 border-2 border-secondary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                        >
                            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            <div className="ml-3 text-left">
                                <p className="font-medium text-secondary-800">Manage Users</p>
                                <p className="text-xs text-secondary-500">Approve or manage users</p>
                            </div>
                        </button>

                        <button
                            onClick={() => router.push('/dashboard/admin/departments')}
                            className="flex items-center p-4 border-2 border-secondary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                        >
                            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <div className="ml-3 text-left">
                                <p className="font-medium text-secondary-800">Departments</p>
                                <p className="text-xs text-secondary-500">Manage departments</p>
                            </div>
                        </button>

                        <button
                            onClick={() => router.push('/dashboard/admin/categories')}
                            className="flex items-center p-4 border-2 border-secondary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                        >
                            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <div className="ml-3 text-left">
                                <p className="font-medium text-secondary-800">Categories</p>
                                <p className="text-xs text-secondary-500">Manage categories</p>
                            </div>
                        </button>

                        <button
                            onClick={() => router.push('/dashboard/admin/items')}
                            className="flex items-center p-4 border-2 border-secondary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                        >
                            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <div className="ml-3 text-left">
                                <p className="font-medium text-secondary-800">Inventory</p>
                                <p className="text-xs text-secondary-500">Manage items</p>
                            </div>
                        </button>

                        <button
                            onClick={() => alert('Coming soon!')}
                            className="flex items-center p-4 border-2 border-secondary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                        >
                            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <div className="ml-3 text-left">
                                <p className="font-medium text-secondary-800">Settings</p>
                                <p className="text-xs text-secondary-500">Configure system</p>
                            </div>
                        </button>

                        <button
                            onClick={() => router.push('/dashboard/admin/reports')}
                            className="flex items-center p-4 border-2 border-secondary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                        >
                            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div className="ml-3 text-left">
                                <p className="font-medium text-secondary-800">Reports</p>
                                <p className="text-xs text-secondary-500">View analytics</p>
                            </div>
                        </button>

                        <button
                            onClick={() => alert('Coming soon!')}
                            className="flex items-center p-4 border-2 border-secondary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                        >
                            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="ml-3 text-left">
                                <p className="font-medium text-secondary-800">Activity Log</p>
                                <p className="text-xs text-secondary-500">View audit trail</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Analytics & Charts */}
                <div className="mb-8 space-y-6">
                    <h3 className="text-lg font-semibold text-secondary-800">Analytics & Insights</h3>

                    {loadingAnalytics ? (
                        <div className="bg-white rounded-xl shadow-md p-6 border border-secondary-200">
                            <div className="text-center py-8 text-secondary-500">
                                <div className="inline-block w-8 h-8 border-4 border-secondary-200 border-t-primary-600 rounded-full animate-spin"></div>
                                <p className="mt-4">Loading analytics...</p>
                            </div>
                        </div>
                    ) : analytics ? (
                        <>
                            {/* Department & Category Charts */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white rounded-xl shadow-md p-6 border border-secondary-200">
                                    <h4 className="text-md font-semibold text-secondary-800 mb-4">Department-wise Inventory</h4>
                                    <DepartmentChart data={analytics.departmentStats} />
                                </div>

                                <div className="bg-white rounded-xl shadow-md p-6 border border-secondary-200">
                                    <h4 className="text-md font-semibold text-secondary-800 mb-4">Category Distribution</h4>
                                    <CategoryChart data={analytics.categoryStats} />
                                </div>
                            </div>

                            {/* Monthly Trends Chart */}
                            <div className="bg-white rounded-xl shadow-md p-6 border border-secondary-200">
                                <h4 className="text-md font-semibold text-secondary-800 mb-4">Issue & Return Trends (Last 12 Months)</h4>
                                <IssueTrendsChart data={analytics.monthlyTrends} />
                            </div>
                        </>
                    ) : (
                        <div className="bg-white rounded-xl shadow-md p-6 border border-secondary-200">
                            <div className="text-center py-8 text-secondary-500">
                                <p>No analytics data available</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-secondary-200">
                    <h3 className="text-lg font-semibold text-secondary-800 mb-4">Recent Activity</h3>
                    {loadingStats ? (
                        <div className="text-center py-8 text-secondary-500">
                            <div className="inline-block w-8 h-8 border-4 border-secondary-200 border-t-primary-600 rounded-full animate-spin"></div>
                            <p className="mt-4">Loading activity...</p>
                        </div>
                    ) : !stats || stats.recentActivity.length === 0 ? (
                        <div className="text-center py-8 text-secondary-500">
                            <svg className="w-16 h-16 mx-auto mb-4 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p>No recent activity</p>
                            <p className="text-sm mt-1">Activity will appear here once users start using the system</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {stats.recentActivity.map((activity) => (
                                <div key={activity.id} className="flex items-start p-3 bg-secondary-50 rounded-lg">
                                    <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <p className="text-sm text-secondary-800">
                                            <span className="font-medium">{activity.userName}</span>{' '}
                                            {activity.action.toLowerCase()} {activity.entityType.toLowerCase()}
                                        </p>
                                        <p className="text-xs text-secondary-500 mt-1">
                                            {new Date(activity.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
