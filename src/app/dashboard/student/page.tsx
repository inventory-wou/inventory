'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface UserStats {
    pendingRequests: number;
    approvedRequests: number;
    currentlyIssued: number;
    overdueCount: number;
    upcomingDue: string | null;
    isBanned: boolean;
    bannedUntil: string | null;
}

interface RoleSettings {
    maxBorrowDays: number;
    maxItems: number;
    requiresApproval: boolean;
}

export default function StudentDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [roleSettings, setRoleSettings] = useState<RoleSettings>({
        maxBorrowDays: 7,
        maxItems: 2,
        requiresApproval: true
    });
    const [loadingSettings, setLoadingSettings] = useState(true);

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.role === 'STUDENT') {
            fetchStats();
            fetchRoleSettings();
        }
    }, [status, session]);

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/user/stats');
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

    const fetchRoleSettings = async () => {
        try {
            const response = await fetch('/api/admin/settings');
            if (response.ok) {
                const data = await response.json();
                const settings = data.settings;

                setRoleSettings({
                    maxBorrowDays: parseInt(settings.students_max_borrow_days) || 7,
                    maxItems: parseInt(settings.students_max_items) || 2,
                    requiresApproval: settings.students_requires_approval === 'true'
                });
            }
        } catch (error) {
            console.error('Error fetching role settings:', error);
        } finally {
            setLoadingSettings(false);
        }
    };

    // Redirect if not student
    useEffect(() => {
        if (status === 'authenticated' && session?.user?.role !== 'STUDENT') {
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
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-secondary-200">
                    <h2 className="text-2xl font-bold text-secondary-800 mb-2">
                        Welcome back, {session?.user?.name}! 👋
                    </h2>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                            STUDENT
                        </span>
                        <span className="text-secondary-600">
                            • You have student access to the inventory system
                        </span>
                    </div>
                    <p className="text-secondary-600">
                        You can borrow up to <strong>{loadingSettings ? '...' : roleSettings.maxItems} items</strong> for <strong>{loadingSettings ? '...' : roleSettings.maxBorrowDays} days</strong> with <strong>{loadingSettings ? '...' : (roleSettings.requiresApproval ? 'approval required' : 'no approval required')}</strong>.
                    </p>
                </div>

                {/* Ban Warning */}
                {stats?.isBanned && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
                        <div className="flex items-start">
                            <svg className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                                <h3 className="text-lg font-semibold text-red-800 mb-1">Account Temporarily Suspended</h3>
                                <p className="text-red-700">
                                    Your borrowing privileges are suspended until <strong>{stats.bannedUntil ? new Date(stats.bannedUntil).toLocaleDateString() : 'further notice'}</strong>.
                                    Please return overdue items or contact the administrator.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Borrowed Items */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-secondary-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-secondary-600">Items Borrowed</p>
                                <p className="text-3xl font-bold text-secondary-800 mt-1">
                                    {loadingStats ? '...' : `${stats?.currentlyIssued || 0}`}
                                    <span className="text-lg text-secondary-500"> / {loadingSettings ? '...' : roleSettings.maxItems}</span>
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Pending Requests */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-secondary-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-secondary-600">Pending Requests</p>
                                <p className="text-3xl font-bold text-secondary-800 mt-1">
                                    {loadingStats ? '...' : stats?.pendingRequests || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Overdue Items */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-red-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-secondary-600">Overdue Items</p>
                                <p className="text-3xl font-bold text-red-600 mt-1">
                                    {loadingStats ? '...' : stats?.overdueCount || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Approved Requests */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-secondary-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-secondary-600">Approved Requests</p>
                                <p className="text-3xl font-bold text-green-600 mt-1">
                                    {loadingStats ? '...' : stats?.approvedRequests || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-secondary-200">
                    <h3 className="text-lg font-semibold text-secondary-800 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Link
                            href="/dashboard/user/browse"
                            className="flex items-center p-4 border-2 border-secondary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                        >
                            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <div className="ml-3 text-left">
                                <p className="font-medium text-secondary-800">Browse Departments</p>
                                <p className="text-xs text-secondary-500">View available equipment</p>
                            </div>
                        </Link>

                        <Link
                            href="/dashboard/user/items"
                            className="flex items-center p-4 border-2 border-secondary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                        >
                            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <div className="ml-3 text-left">
                                <p className="font-medium text-secondary-800">My Borrowed Items</p>
                                <p className="text-xs text-secondary-500">View your items</p>
                            </div>
                        </Link>

                        <Link
                            href="/dashboard/user/requests"
                            className="flex items-center p-4 border-2 border-secondary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                        >
                            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <div className="ml-3 text-left">
                                <p className="font-medium text-secondary-800">My Requests</p>
                                <p className="text-xs text-secondary-500">Track your requests</p>
                            </div>
                        </Link>

                        <Link
                            href="/dashboard/user/browse"
                            className="flex items-center p-4 border-2 border-primary-500 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                        >
                            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <div className="ml-3 text-left">
                                <p className="font-medium text-secondary-800">Request New Item</p>
                                <p className="text-xs text-secondary-500">Borrow equipment</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Student Permissions */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-purple-900 mb-4">Student Borrowing Privileges</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-purple-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="font-medium text-purple-900">Maximum Items</p>
                                <p className="text-sm text-purple-700">Borrow up to {loadingSettings ? '...' : roleSettings.maxItems} items simultaneously</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-purple-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="font-medium text-purple-900">Borrow Period</p>
                                <p className="text-sm text-purple-700">{loadingSettings ? '...' : roleSettings.maxBorrowDays} days per item</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-purple-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="font-medium text-purple-900">Approval Status</p>
                                <p className="text-sm text-purple-700">{loadingSettings ? '...' : (roleSettings.requiresApproval ? 'Approval required from incharge' : 'No approval required')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-purple-200">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-purple-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="font-medium text-purple-900">Item Visibility</p>
                                <p className="text-sm text-purple-700">You can only view and request items from student-visible categories</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
