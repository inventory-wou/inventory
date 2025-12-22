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

    // Advanced Search Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
    const [minValue, setMinValue] = useState('');
    const [maxValue, setMaxValue] = useState('');
    const [purchasedAfter, setPurchasedAfter] = useState('');
    const [purchasedBefore, setPurchasedBefore] = useState('');
    const [lowStockOnly, setLowStockOnly] = useState(false);
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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
                limit: '12',
                sortBy,
                sortOrder
            });

            if (searchQuery) params.append('search', searchQuery);
            if (selectedDepartments.length > 0) params.append('departments', selectedDepartments.join(','));
            if (selectedCategories.length > 0) params.append('categories', selectedCategories.join(','));
            if (selectedStatuses.length > 0) params.append('statuses', selectedStatuses.join(','));
            if (selectedConditions.length > 0) params.append('conditions', selectedConditions.join(','));
            if (minValue) params.append('minValue', minValue);
            if (maxValue) params.append('maxValue', maxValue);
            if (purchasedAfter) params.append('purchasedAfter', purchasedAfter);
            if (purchasedBefore) params.append('purchasedBefore', purchasedBefore);
            if (lowStockOnly) params.append('lowStock', 'true');

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
    }, [status, page, searchQuery, selectedDepartments, selectedCategories, selectedStatuses, selectedConditions, minValue, maxValue, purchasedAfter, purchasedBefore, lowStockOnly, sortBy, sortOrder]);

    const clearAllFilters = () => {
        setSearchQuery('');
        setSelectedDepartments([]);
        setSelectedCategories([]);
        setSelectedStatuses([]);
        setSelectedConditions([]);
        setMinValue('');
        setMaxValue('');
        setPurchasedAfter('');
        setPurchasedBefore('');
        setLowStockOnly(false);
        setSortBy('createdAt');
        setSortOrder('desc');
        setPage(1);
    };

    const toggleArrayFilter = (value: string, current: string[], setter: (val: string[]) => void) => {
        if (current.includes(value)) {
            setter(current.filter(v => v !== value));
        } else {
            setter([...current, value]);
        }
    };

    const getActiveFilterCount = () => {
        let count = 0;
        if (searchQuery) count++;
        if (selectedDepartments.length > 0) count++;
        if (selectedCategories.length > 0) count++;
        if (selectedStatuses.length > 0) count++;
        if (selectedConditions.length > 0) count++;
        if (minValue || maxValue) count++;
        if (purchasedAfter || purchasedBefore) count++;
        if (lowStockOnly) count++;
        return count;
    };

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

                {/* Advanced Search Panel */}
                <div className="bg-white rounded-lg shadow-md border border-secondary-200 mb-6">
                    <div className="p-4">
                        <div className="flex gap-3 mb-3">
                            <input
                                type="text"
                                placeholder="🔍 Search items (name, ID, serial, description, specs)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                            />
                            <button
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${showAdvancedFilters ? 'bg-primary-600 text-white' : 'bg-secondary-100 text-secondary-700'
                                    }`}
                            >
                                Advanced
                                {getActiveFilterCount() > 0 && (
                                    <span className="bg-white text-primary-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                        {getActiveFilterCount()}
                                    </span>
                                )}
                            </button>
                            {getActiveFilterCount() > 0 && (
                                <button onClick={clearAllFilters} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
                                    Clear All
                                </button>
                            )}
                            <button
                                onClick={() => router.push('/dashboard/admin/items/bulk-import')}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                            >
                                📤 Bulk Import
                            </button>
                        </div>

                        {/* Advanced Filters Panel */}
                        {showAdvancedFilters && (
                            <div className="p-4 bg-gray-50 rounded-lg border border-secondary-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                    {/* Departments */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Departments</label>
                                        <div className="max-h-32 overflow-y-auto border rounded-lg p-2 bg-white">
                                            {departments.map(d => (
                                                <label key={d.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedDepartments.includes(d.id)}
                                                        onChange={() => toggleArrayFilter(d.id, selectedDepartments, setSelectedDepartments)}
                                                    />
                                                    <span className="text-sm">{d.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Categories */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Categories</label>
                                        <div className="max-h-32 overflow-y-auto border rounded-lg p-2 bg-white">
                                            {categories.map(c => (
                                                <label key={c.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCategories.includes(c.id)}
                                                        onChange={() => toggleArrayFilter(c.id, selectedCategories, setSelectedCategories)}
                                                    />
                                                    <span className="text-sm">{c.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Status</label>
                                        <div className="space-y-1">
                                            {['AVAILABLE', 'ISSUED', 'MAINTENANCE', 'PENDING_REPLACEMENT'].map(s => (
                                                <label key={s} className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedStatuses.includes(s)}
                                                        onChange={() => toggleArrayFilter(s, selectedStatuses, setSelectedStatuses)}
                                                    />
                                                    <span className="text-sm">{s.replace('_', ' ')}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Condition */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Condition</label>
                                        <div className="space-y-1">
                                            {['NEW', 'GOOD', 'FAIR', 'DAMAGED', 'UNDER_REPAIR'].map(c => (
                                                <label key={c} className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedConditions.includes(c)}
                                                        onChange={() => toggleArrayFilter(c, selectedConditions, setSelectedConditions)}
                                                    />
                                                    <span className="text-sm">{c.replace('_', ' ')}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Value Range */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Value Range (₹)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                placeholder="Min"
                                                value={minValue}
                                                onChange={(e) => setMinValue(e.target.value)}
                                                className="w-1/2 px-3 py-2 border rounded text-sm"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Max"
                                                value={maxValue}
                                                onChange={(e) => setMaxValue(e.target.value)}
                                                className="w-1/2 px-3 py-2 border rounded text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Date Range */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Purchase Date</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="date"
                                                value={purchasedAfter}
                                                onChange={(e) => setPurchasedAfter(e.target.value)}
                                                className="w-1/2 px-3 py-2 border rounded text-sm"
                                            />
                                            <input
                                                type="date"
                                                value={purchasedBefore}
                                                onChange={(e) => setPurchasedBefore(e.target.value)}
                                                className="w-1/2 px-3 py-2 border rounded text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} />
                                        <span className="text-sm">📉 Low Stock Only</span>
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium">Sort:</label>
                                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-1 border rounded text-sm">
                                            <option value="createdAt">Date Added</option>
                                            <option value="name">Name</option>
                                            <option value="value">Value</option>
                                            <option value="purchaseDate">Purchase Date</option>
                                        </select>
                                        <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="px-2 py-1 bg-gray-200 rounded text-sm">
                                            {sortOrder === 'asc' ? '↑' : '↓'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Active Filters */}
                        {getActiveFilterCount() > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                                {searchQuery && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">Search: {searchQuery.substring(0, 20)}</span>}
                                {selectedDepartments.length > 0 && <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">Depts: {selectedDepartments.length}</span>}
                                {selectedCategories.length > 0 && <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">Cats: {selectedCategories.length}</span>}
                                {selectedStatuses.length > 0 && <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Status: {selectedStatuses.length}</span>}
                                {selectedConditions.length > 0 && <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">Cond: {selectedConditions.length}</span>}
                                {(minValue || maxValue) && <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs">Value Range</span>}
                                {(purchasedAfter || purchasedBefore) && <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs">Date Range</span>}
                                {lowStockOnly && <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs">Low Stock</span>}
                            </div>
                        )}
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
