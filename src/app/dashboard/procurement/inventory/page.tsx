'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Department {
    id: string;
    name: string;
    code: string;
}

interface Category {
    id: string;
    name: string;
}

interface Item {
    id: string;
    manualId: string;
    name: string;
    serialNumber?: string;
    description?: string;
    condition: string;
    status: string;
    isConsumable: boolean;
    currentStock?: number;
    category: Category;
    department: Department;
    departmentAccess: Array<{
        department: Department;
        canTransfer: boolean;
    }>;
}

export default function ProcurementInventoryPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        document.title = 'Procurement Inventory | WoU Inventory';

        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (session?.user?.role !== 'PROCUREMENT' && session?.user?.role !== 'ADMIN') {
            router.push('/dashboard');
        } else {
            fetchItems();
        }
    }, [session, status, router, search]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const params = search ? `?search=${encodeURIComponent(search)}` : '';
            const response = await fetch(`/api/admin/procurement/items${params}`);
            if (response.ok) {
                const data = await response.json();
                setItems(data.items || []);
            }
        } catch (error) {
            console.error('Error fetching items:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            AVAILABLE: 'bg-green-100 text-green-800',
            ISSUED: 'bg-yellow-100 text-yellow-800',
            MAINTENANCE: 'bg-orange-100 text-orange-800',
            PENDING_REPLACEMENT: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
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
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Procurement Inventory</h1>
                    <p className="text-gray-600 mt-2">Manage procurement items and department availability</p>
                </div>
                <button
                    onClick={() => router.push('/dashboard/procurement/inventory/add')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add New Item
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <input
                    type="text"
                    placeholder="Search by item name, manual ID, or serial number..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                    <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg text-gray-900 mb-1">{item.name}</h3>
                                    <p className="text-sm text-gray-600">{item.manualId}</p>
                                    {item.serialNumber && (
                                        <p className="text-xs text-gray-500">SN: {item.serialNumber}</p>
                                    )}
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                                    {item.status}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Category:</span>
                                    <span className="font-medium">{item.category.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Department:</span>
                                    <span className="font-medium">{item.department.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Condition:</span>
                                    <span className="font-medium">{item.condition}</span>
                                </div>
                                {item.isConsumable && item.currentStock !== null && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Stock:</span>
                                        <span className="font-medium">{item.currentStock}</span>
                                    </div>
                                )}
                            </div>

                            {item.departmentAccess.length > 0 && (
                                <div className="mt-4 pt-4 border-t">
                                    <p className="text-xs text-gray-600 mb-2">Available to departments:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {item.departmentAccess.map((access, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                                            >
                                                {access.department.code}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => router.push(`/dashboard/procurement/inventory/${item.id}`)}
                                    className="flex-1 px-3 py-2 text-sm border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
                                >
                                    View Details
                                </button>
                                <button
                                    onClick={() => router.push(`/dashboard/procurement/inventory/${item.id}/edit`)}
                                    className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Edit Access
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {items.length === 0 && !loading && (
                <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-gray-600 text-lg mb-2">No items found</p>
                    <p className="text-gray-500 text-sm mb-4">Start by adding items to the procurement inventory</p>
                    <button
                        onClick={() => router.push('/dashboard/procurement/inventory/add')}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Add First Item
                    </button>
                </div>
            )}
        </div>
    );
}
