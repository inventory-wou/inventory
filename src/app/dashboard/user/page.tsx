'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function UserDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Redirect if not user
    if (status === 'authenticated' && session?.user?.role !== 'USER') {
        router.push('/dashboard');
        return null;
    }

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
                                <p className="text-xs text-secondary-500">User Dashboard</p>
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
                        Welcome, {session?.user?.name}! 👋
                    </h2>
                    <p className="text-secondary-600">
                        You can browse and request items from the inventory here.
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-secondary-200">
                    <h3 className="text-lg font-semibold text-secondary-800 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <button
                            onClick={() => alert('Item browsing coming in Phase 4!')}
                            className="flex items-center p-4 border-2 border-secondary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                        >
                            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <div className="ml-3 text-left">
                                <p className="font-medium text-secondary-800">Browse Items</p>
                                <p className="text-xs text-secondary-500">View available inventory</p>
                            </div>
                        </button>

                        <button
                            onClick={() => alert('Request system coming in Phase 5!')}
                            className="flex items-center p-4 border-2 border-secondary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                        >
                            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <div className="ml-3 text-left">
                                <p className="font-medium text-secondary-800">Request Item</p>
                                <p className="text-xs text-secondary-500">Borrow from inventory</p>
                            </div>
                        </button>

                        <button
                            onClick={() => alert('Request history coming in Phase 5!')}
                            className="flex items-center p-4 border-2 border-secondary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                        >
                            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="ml-3 text-left">
                                <p className="font-medium text-secondary-800">My Requests</p>
                                <p className="text-xs text-secondary-500">View borrow history</p>
                            </div>
                        </button>

                        <button
                            onClick={() => alert('Borrowed items tracking coming in Phase 5!')}
                            className="flex items-center p-4 border-2 border-secondary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                        >
                            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <div className="ml-3 text-left">
                                <p className="font-medium text-secondary-800">Borrowed Items</p>
                                <p className="text-xs text-secondary-500">Items you currently have</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-start">
                        <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="ml-3">
                            <h4 className="text-sm font-semibold text-blue-800 mb-1">Getting Started</h4>
                            <p className="text-sm text-blue-700">
                                Item browsing and request features are coming in Phase 4 and Phase 5 of development.
                                You'll be able to browse available items, submit borrow requests, and track your borrowed items.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
