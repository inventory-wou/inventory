'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DepartmentCard from '@/components/DepartmentCard';
import Link from 'next/link';

interface Department {
    id: string;
    name: string;
    description: string | null;
    code: string;
    itemCount: number;
}

export default function BrowseDepartmentsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Redirect if not authenticated
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        // Only allow Faculty, Staff, and Students
        if (session && !['FACULTY', 'STAFF', 'STUDENT'].includes(session.user.role)) {
            router.push('/dashboard');
            return;
        }

        if (status === 'authenticated') {
            fetchDepartments();
        }
    }, [status, session, router]);

    const fetchDepartments = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/departments');

            if (!response.ok) {
                throw new Error('Failed to fetch departments');
            }

            const data = await response.json();
            setDepartments(data.departments);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (status === 'loading' || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                    <p className="mt-4 text-secondary-600">Loading departments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-secondary-900">Browse Departments</h1>
                        <p className="text-secondary-600 mt-2">
                            Select a department to view available equipment
                        </p>
                    </div>
                    <Link
                        href="/dashboard/user"
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-secondary-700 bg-white hover:bg-secondary-50 border border-secondary-300 rounded-lg transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Dashboard
                    </Link>
                </div>

                {/* User Role Badge */}
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {session?.user?.role}
                    </span>
                    <span className="text-sm text-secondary-600">
                        • You have access to browse all department inventories
                    </span>
                </div>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Department Grid */}
            {departments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {departments.map((dept) => (
                        <DepartmentCard
                            key={dept.id}
                            id={dept.id}
                            name={dept.name}
                            description={dept.description || 'No description available'}
                            itemCount={dept.itemCount}
                            icon={dept.code}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-md p-12 text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="text-secondary-600 text-lg">No departments available</p>
                    <p className="text-secondary-500 text-sm mt-2">Please contact administrator</p>
                </div>
            )}
        </div>
    );
}
