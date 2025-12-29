'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DepartmentCard from '@/components/DepartmentCard';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { Building2 } from 'lucide-react';

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
        <div className="min-h-screen bg-gradient-light">
            <PageHeader
                title="Browse Departments"
                subtitle="Select a department to view available equipment"
                showBackButton
                backButtonLabel="Back to Dashboard"
                backUrl="/dashboard/user"
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

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
                    <EmptyState
                        icon={Building2}
                        title="No departments available"
                        description="Please contact administrator"
                    />
                )}
            </main>
        </div>
    );
}
