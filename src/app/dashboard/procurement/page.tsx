'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ProcurementDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [stats, setStats] = useState({
        totalItems: 0,
        pendingTransfers: 0,
        completedTransfers: 0,
        activeItems: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = 'Procurement Dashboard | WoU Inventory';

        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (session?.user?.role !== 'PROCUREMENT' && session?.user?.role !== 'ADMIN') {
            router.push('/dashboard');
        } else {
            fetchStats();
        }
    }, [session, status, router]);

    const fetchStats = async () => {
        try {
            // TODO: Create stats API endpoint
            // For now, using placeholder values
            setStats({
                totalItems: 0,
                pendingTransfers: 0,
                completedTransfers: 0,
                activeItems: 0,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Procurement Dashboard</h1>
                <p className="text-gray-600 mt-2">Manage procurement inventory and transfers</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Items</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalItems}</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Pending Transfers</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingTransfers}</p>
                        </div>
                        <div className="bg-yellow-100 p-3 rounded-lg">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Completed Transfers</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.completedTransfers}</p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-lg">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Active Items</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activeItems}</p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-lg">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <button
                    onClick={() => router.push('/dashboard/procurement/inventory')}
                    className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left group"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                                Manage Inventory
                            </h3>
                            <p className="text-sm text-gray-600 mt-2">
                                Add, edit, and manage procurement items
                            </p>
                        </div>
                        <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </button>

                <button
                    onClick={() => router.push('/dashboard/procurement/transfers')}
                    className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left group"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                                Transfer Requests
                            </h3>
                            <p className="text-sm text-gray-600 mt-2">
                                Review and approve transfer requests
                            </p>
                        </div>
                        <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </button>

                <button
                    onClick={() => router.push('/dashboard/procurement/inventory?action=add')}
                    className="bg-blue-600 p-6 rounded-lg shadow-sm hover:bg-blue-700 transition-colors text-left group"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-white">
                                Add New Item
                            </h3>
                            <p className="text-sm text-blue-100 mt-2">
                                Quick add items to inventory
                            </p>
                        </div>
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                </button>
            </div>
        </div>
    );
}
