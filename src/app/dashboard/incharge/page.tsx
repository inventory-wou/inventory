'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function InchargeDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [stats, setStats] = useState({
        pendingApprovals: 0,
        readyForIssuance: 0,
        currentlyIssued: 0,
        overdueCount: 0
    });
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.role === 'INCHARGE') {
            fetchStats();
        }
    }, [status, session]);

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/incharge/stats');
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

    // Redirect if not incharge (AFTER all hooks)
    useEffect(() => {
        if (status === 'authenticated' && session?.user?.role !== 'INCHARGE') {
            router.push('/dashboard');
        }
    }, [status, session, router]);

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
            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-secondary-200">
                    <h2 className="text-2xl font-bold text-secondary-800 mb-2">
                        Welcome back, {session?.user?.name}! 👋
                    </h2>
                    <p className="text-secondary-600">
                        You're logged in as an Incharge. Manage your department's inventory from here.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Pending Approvals */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-secondary-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-secondary-600">Pending Approvals</p>
                                <p className="text-3xl font-bold text-secondary-800 mt-1">{stats.pendingApprovals}</p>
                            </div>
                            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Ready for Issuance */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-secondary-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-secondary-600">Ready for Issuance</p>
                                <p className="text-3xl font-bold text-secondary-800 mt-1">{stats.readyForIssuance}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Currently Issued */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-secondary-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-secondary-600">Currently Issued</p>
                                <p className="text-3xl font-bold text-secondary-800 mt-1">{stats.currentlyIssued}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Overdue Items */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-red-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-secondary-600">Overdue Items</p>
                                <p className="text-3xl font-bold text-red-600 mt-1">{stats.overdueCount}</p>
                            </div>
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-secondary-200">
                    <h3 className="text-lg font-semibold text-secondary-800 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                            onClick={() => router.push('/dashboard/incharge/requests')}
                            className="flex items-center p-4 border-2 border-secondary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                        >
                            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            <div className="ml-3 text-left">
                                <p className="font-medium text-secondary-800">Manage Requests</p>
                                <p className="text-xs text-secondary-500">Approve/reject borrow requests</p>
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
                                <p className="font-medium text-secondary-800">View Reports</p>
                                <p className="text-xs text-secondary-500">Department analytics</p>
                            </div>
                        </button>

                        <button
                            onClick={() => router.push('/dashboard/incharge/return')}
                            className="flex items-center p-4 border-2 border-secondary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                        >
                            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div className="ml-3 text-left">
                                <p className="font-medium text-secondary-800">Track Returns</p>
                                <p className="text-xs text-secondary-500">Monitor issued items</p>
                            </div>
                        </button>

                        <button
                            onClick={() => router.push('/dashboard/incharge/issue')}
                            className="flex items-center p-4 border-2 border-secondary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                        >
                            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <div className="ml-3 text-left">
                                <p className="font-medium text-secondary-800">Issue Items</p>
                                <p className="text-xs text-secondary-500">Issue items to users</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-secondary-200">
                    <h3 className="text-lg font-semibold text-secondary-800 mb-4">Recent Activity</h3>
                    <div className="text-center py-8 text-secondary-500">
                        <svg className="w-16 h-16 mx-auto mb-4 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p>No recent activity</p>
                        <p className="text-sm mt-1">Activity will appear here once you start managing items</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
