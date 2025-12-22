'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Header() {
    const { data: session } = useSession();
    const router = useRouter();

    const handleLogout = async () => {
        await signOut({ redirect: false });
        router.push('/');
    };

    return (
        <header className="bg-white shadow-md border-b border-secondary-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo and Title */}
                    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-secondary-800">WoU Inventory Management System</h1>
                            <p className="text-xs text-secondary-500">Woxsen University</p>
                        </div>
                    </Link>

                    {/* Navigation */}
                    <nav className="flex items-center gap-4">
                        {session ? (
                            <>
                                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-secondary-50 rounded-lg">
                                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        {session.user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-secondary-800">{session.user.name}</p>
                                        <p className="text-xs text-secondary-500">{session.user.role}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="px-4 py-2 text-secondary-700 hover:text-primary-600 font-medium text-sm transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
}
