'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'authenticated' && session?.user) {
            // Redirect based on role
            if (session.user.role === 'ADMIN') {
                router.push('/dashboard/admin');
            } else if (session.user.role === 'INCHARGE') {
                router.push('/dashboard/incharge');
            } else {
                router.push('/dashboard/user');
            }
        }
    }, [session, status, router]);

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
        <div className="min-h-screen bg-gradient-light flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 border border-secondary-200 text-center">
                <h1 className="text-2xl font-bold text-secondary-800 mb-4">
                    Welcome, {session?.user?.name}!
                </h1>
                <p className="text-secondary-600 mb-6">
                    Role: <span className="font-medium text-primary-600">{session?.user?.role}</span>
                </p>
                <p className="text-secondary-500 mb-6">Redirecting to your dashboard...</p>
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="text-red-600 hover:text-red-700 font-medium text-sm"
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
}
