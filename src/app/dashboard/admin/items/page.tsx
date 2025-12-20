'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import ItemFormModal from '@/components/admin/ItemFormModal';

interface Item {
    id: string;
    manualId: string;
    name: string;
    description: string | null;
    specifications: string | null;
    serialNumber: string | null;
    condition: string;
    status: string;
    isConsumable: boolean;
    currentStock: number | null;
    minStockLevel: number | null;
    location: string | null;
    purchaseDate: Date | null;
    value: number | null;
    imageUrl: string | null;
    category: { id: string; name: string };
    department: { id: string; name: string; code: string };
}

interface Department {
    id: string;
    name: string;
    code: string;
}

interface Category {
    id: string;
    name: string;
}

export default function ItemsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [items, setItems] = useState<Item[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCondition, setFilterCondition] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        specifications: '',
        categoryId: '',
        departmentId: '',
        serialNumber: '',
        condition: 'GOOD',
        status: 'AVAILABLE',
        isConsumable: false,
        currentStock: 0,
        minStockLevel: 0,
        location: '',
        purchaseDate: '',
        value: '',
        imageUrl: ''
    });

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        available: 0,
        issued: 0,
        damaged: 0
    });

    // Redirect if not authorized
    if (status === 'authenticated' && !['ADMIN', 'INCHARGE'].includes(session.user.role)) {
        router.push('/dashboard');
        return null;
    }

    const fetchItems = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '12'
            });
            if (searchQuery) params.append('search', searchQuery);
            if (filterDept) params.append('departmentId', filterDept);
            if (filterCategory) params.append('categoryId', filterCategory);
            if (filterStatus) params.append('status', filterStatus);
            if (filterCondition) params.append('condition', filterCondition);

            const response = await fetch(`/api/admin/items?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch items');

            const data = await response.json();
            setItems(data.items);
            setTotalPages(data.pagination.totalPages);

            // Calculate stats
            const total = data.pagination.totalCount;
            const available = data.items.filter((i: Item) => i.status === 'AVAILABLE').length;
            const issued = data.items.filter((i: Item) => i.status === 'ISSUED').length;
            const damaged = data.items.filter((i: Item) => i.condition === 'DAMAGED').length;
            setStats({ total, available, issued, damaged });

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await fetch('/api/admin/departments');
            if (!response.ok) throw new Error('Failed to fetch departments');
            const data = await response.json();
            setDepartments(data.departments);
        } catch (err: any) {
            console.error('Error fetching departments:', err);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/admin/categories');
            if (!response.ok) throw new Error('Failed to fetch categories');
            const data = await response.json();
            setCategories(data.categories);
        } catch (err: any) {
            console.error('Error fetching categories:', err);
        }
    };

    useEffect(() => {
        if (status === 'authenticated') {
            fetchItems();
            fetchDepartments();
            fetchCategories();
        }
    }, [status, page, searchQuery, filterDept, filterCategory, filterStatus, filterCondition]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editingItem
                ? `/api/admin/items/${editingItem.id}`
                : '/api/admin/items';

            const response = await fetch(url, {
                method: editingItem ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }

            setShowModal(false);
            setEditingItem(null);
            resetForm();
            fetchItems();
            alert(editingItem ? 'Item updated successfully' : 'Item created successfully');
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleEdit = (item: Item) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            description: item.description || '',
            specifications: item.specifications || '',
            categoryId: item.category.id,
            departmentId: item.department.id,
            serialNumber: item.serialNumber || '',
            condition: item.condition,
            status: item.status,
            isConsumable: item.isConsumable,
            currentStock: item.currentStock || 0,
            minStockLevel: item.minStockLevel || 0,
            location: item.location || '',
            purchaseDate: item.purchaseDate ? new Date(item.purchaseDate).toISOString().split('T')[0] : '',
            value: item.value?.toString() || '',
            imageUrl: item.imageUrl || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete item "${name}"?`)) return;

        try {
            const response = await fetch(`/api/admin/items/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }

            fetchItems();
            alert('Item deleted successfully');
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleFormChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            specifications: '',
            categoryId: '',
            departmentId: '',
            serialNumber: '',
            condition: 'GOOD',
            status: 'AVAILABLE',
            isConsumable: false,
            currentStock: 0,
            minStockLevel: 0,
            location: '',
            purchaseDate: '',
            value: '',
            imageUrl: ''
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'AVAILABLE': return 'bg-green-100 text-green-700';
            case 'ISSUED': return 'bg-blue-100 text-blue-700';
            case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-700';
            case 'PENDING_REPLACEMENT': return 'bg-red-100 text-red-700';
            default: return 'bg-secondary-100 text-secondary-700';
        }
    };

    const getConditionColor = (condition: string) => {
        switch (condition) {
            case 'NEW': return 'text-green-600';
            case 'GOOD': return 'text-blue-600';
            case 'FAIR': return 'text-yellow-600';
            case 'DAMAGED': return 'text-red-600';
            case 'UNDER_REPAIR': return 'text-orange-600';
            default: return 'text-secondary-600';
        }
    };

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
            <header className="bg-white border-b border-secondary-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-secondary-800">Inventory Management</h1>
                            <p className="text-sm text-secondary-600 mt-1">Manage all inventory items</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setEditingItem(null);
                                    resetForm();
                                    setShowModal(true);
                                }}
                                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium"
                            >
                                + Add Item
                            </button>
                            <button
                                onClick={() => router.push('/dashboard/admin')}
                                className="px-4 py-2 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 rounded-lg text-sm font-medium"
                            >
                                ← Back
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-4 border border-secondary-200">
                        <p className="text-sm text-secondary-600">Total Items</p>
                        <p className="text-2xl font-bold text-secondary-800">{stats.total}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4 border border-secondary-200">
                        <p className="text-sm text-secondary-600">Available</p>
                        <p className="text-2xl font-bold text-green-600">{stats.available}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4 border border-secondary-200">
                        <p className="text-sm text-secondary-600">Issued</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.issued}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4 border border-secondary-200">
                        <p className="text-sm text-secondary-600">Damaged</p>
                        <p className="text-2xl font-bold text-red-600">{stats.damaged}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-secondary-200">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <div className="md:col-span-2">
                            <input
                                type="text"
                                placeholder="Search items..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                            />
                        </div>
                        <select
                            value={filterDept}
                            onChange={(e) => setFilterDept(e.target.value)}
                            className="px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        >
                            <option value="">All Departments</option>
                            {departments.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        >
                            <option value="">All Categories</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        >
                            <option value="">All Status</option>
                            <option value="AVAILABLE">Available</option>
                            <option value="ISSUED">Issued</option>
                            <option value="MAINTENANCE">Maintenance</option>
                            <option value="PENDING_REPLACEMENT">Pending Replacement</option>
                        </select>
                        <select
                            value={filterCondition}
                            onChange={(e) => setFilterCondition(e.target.value)}
                            className="px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        >
                            <option value="">All Conditions</option>
                            <option value="NEW">New</option>
                            <option value="GOOD">Good</option>
                            <option value="FAIR">Fair</option>
                            <option value="DAMAGED">Damaged</option>
                            <option value="UNDER_REPAIR">Under Repair</option>
                        </select>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
                )}

                {/* Items Grid */}
                {isLoading ? (
                    <div className="bg-white rounded-xl shadow-md p-8 text-center">
                        <div className="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                    </div>
                ) : items.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-8 text-center">
                        <p className="text-secondary-500">No items found</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                            {items.map((item) => (
                                <div key={item.id} className="bg-white rounded-xl shadow-md border border-secondary-200 overflow-hidden hover:shadow-lg transition-shadow">
                                    {/* Image */}
                                    <div className="h-48 bg-secondary-100 relative">
                                        {item.imageUrl ? (
                                            <Image
                                                src={item.imageUrl}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <svg className="w-16 h-16 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="font-bold text-secondary-800">{item.name}</h3>
                                                <p className="text-xs text-primary-600 font-mono">{item.manualId}</p>
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </div>

                                        <div className="space-y-1 text-sm mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-secondary-600">Dept:</span>
                                                <span className="font-medium">{item.department.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-secondary-600">Category:</span>
                                                <span className="font-medium">{item.category.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-secondary-600">Condition:</span>
                                                <span className={`font-medium ${getConditionColor(item.condition)}`}>{item.condition}</span>
                                            </div>
                                            {item.location && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-secondary-600">Location:</span>
                                                    <span className="font-medium">{item.location}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => window.open(`/api/items/${item.id}/label?print=true`, '_blank')}
                                                className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded text-sm font-medium"
                                                title="Print Label"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="flex-1 px-3 py-2 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded text-sm font-medium"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id, item.name)}
                                                className="flex-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm font-medium"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 bg-white border border-secondary-300 rounded-lg disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <span className="px-4 py-2 bg-white border border-secondary-300 rounded-lg">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 bg-white border border-secondary-300 rounded-lg disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Item Form Modal */}
            <ItemFormModal
                isOpen={showModal}
                editingItem={editingItem}
                departments={departments}
                categories={categories}
                formData={formData}
                onClose={() => {
                    setShowModal(false);
                    setEditingItem(null);
                    resetForm();
                }}
                onSubmit={handleSubmit}
                onChange={handleFormChange}
            />
        </div>
    );
}
