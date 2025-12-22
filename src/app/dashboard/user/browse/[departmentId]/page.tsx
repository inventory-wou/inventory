'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Item {
    id: string;
    name: string;
    description: string | null;
    serialNumber: string;
    status: string;
    category: {
        id: string;
        name: string;
    };
}

interface Department {
    id: string;
    name: string;
    code: string;
}

export default function DepartmentItemsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const departmentId = params?.departmentId as string;

    const [items, setItems] = useState<Item[]>([]);
    const [department, setDepartment] = useState<Department | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (session && !['FACULTY', 'STAFF', 'STUDENT'].includes(session.user.role)) {
            router.push('/dashboard');
            return;
        }

        if (status === 'authenticated' && departmentId) {
            fetchDepartmentItems();
        }
    }, [status, session, departmentId, router]);

    const fetchDepartmentItems = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/departments/${departmentId}/items`);

            if (!response.ok) {
                throw new Error('Failed to fetch items');
            }

            const data = await response.json();
            setItems(data.items);
            setDepartment(data.department);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'AVAILABLE':
                return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Available</span>;
            case 'ISSUED':
                return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">Issued</span>;
            case 'MAINTENANCE':
                return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">Maintenance</span>;
            case 'DAMAGED':
                return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">Damaged</span>;
            default:
                return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">{status}</span>;
        }
    };

    // Get unique categories
    const categories = Array.from(new Set(items.map(item => item.category.name)));
    const filteredItems = selectedCategory === 'all'
        ? items
        : items.filter(item => item.category.name === selectedCategory);

    if (status === 'loading' || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                    <p className="mt-4 text-secondary-600">Loading items...</p>
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
                        <Link
                            href="/dashboard/user/browse"
                            className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 mb-3"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Departments
                        </Link>
                        <h1 className="text-3xl font-bold text-secondary-900">
                            {department?.name || 'Department'} Inventory
                        </h1>
                        <p className="text-secondary-600 mt-2">
                            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items '} available
                        </p>
                    </div>
                </div>

                {/* Category Filter */}
                {categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === 'all'
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-white text-secondary-700 hover:bg-primary-50 border border-secondary-300'
                                }`}
                        >
                            All Categories
                        </button>
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === category
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-white text-secondary-700 hover:bg-primary-50 border border-secondary-300'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Items Grid */}
            {filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((item) => (
                        <div key={item.id} className="bg-white rounded-xl shadow-md border border-secondary-200 p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <h3 className="text-lg font-bold text-secondary-900 flex-1">{item.name}</h3>
                                {getStatusBadge(item.status)}
                            </div>

                            {item.description && (
                                <p className="text-sm text-secondary-600 mb-4 line-clamp-2">
                                    {item.description}
                                </p>
                            )}

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-secondary-500">Serial Number:</span>
                                    <span className="font-medium text-secondary-900">{item.serialNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-secondary-500">Category:</span>
                                    <span className="font-medium text-secondary-900">{item.category.name}</span>
                                </div>
                            </div>

                            {item.status === 'AVAILABLE' && (
                                <button
                                    onClick={() => router.push(`/dashboard/user/request-item/${item.id}`)}
                                    className="mt-4 w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Request Item
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-md p-12 text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-secondary-600 text-lg">No items found</p>
                    <p className="text-secondary-500 text-sm mt-2">
                        {selectedCategory !== 'all' ? 'Try selecting a different category' : 'No items available in this department'}
                    </p>
                </div>
            )}
        </div>
    );
}
