'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Department {
    id: string;
    name: string;
    code: string;
}

interface Item {
    id: string;
    manualId: string;
    name: string;
    description?: string;
    serialNumber?: string;
    image?: string;
    condition: string;
    status: string;
    isConsumable: boolean;
    currentStock?: number;
    category: { name: string };
    department: Department;
}

export default function BrowseTransferItemsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [items, setItems] = useState<Item[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedDept, setSelectedDept] = useState<string>('all');
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [purpose, setPurpose] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [userDeptId, setUserDeptId] = useState<string>('');
    const [requesting, setRequesting] = useState(false);

    useEffect(() => {
        document.title = 'Browse Items for Transfer | WoU Inventory';
        fetchDepartments();
        fetchUserDepartment();
    }, []);

    useEffect(() => {
        if (selectedDept && selectedDept !== 'all') {
            fetchItems();
        }
    }, [selectedDept, search]);

    const fetchUserDepartment = async () => {
        // Get user's department for transfer requests
        try {
            const response = await fetch('/api/user/profile');
            if (response.ok) {
                const data = await response.json();
                if (data.departments && data.departments.length > 0) {
                    setUserDeptId(data.departments[0].id);
                }
            }
        } catch (error) {
            console.error('Error fetching user department:', error);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await fetch('/api/admin/departments');
            if (response.ok) {
                const data = await response.json();
                setDepartments(data);
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchItems = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            params.append('departmentId', selectedDept);
            params.append('status', 'AVAILABLE');

            const response = await fetch(`/api/admin/items?${params}`);
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

    const openRequestModal = (item: Item) => {
        setSelectedItem(item);
        setPurpose('');
        setQuantity(1);
        setShowModal(true);
    };

    const handleRequestTransfer = async () => {
        if (!selectedItem || !userDeptId) return;

        if (!purpose.trim()) {
            alert('Please provide a purpose for the transfer');
            return;
        }

        if (selectedItem.isConsumable && (quantity < 1 || (selectedItem.currentStock && quantity > selectedItem.currentStock))) {
            alert('Invalid quantity');
            return;
        }

        setRequesting(true);
        try {
            const response = await fetch('/api/incharge/transfer/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemId: selectedItem.id,
                    toDepartmentId: userDeptId,
                    purpose: purpose.trim(),
                    quantity: selectedItem.isConsumable ? quantity : 1,
                }),
            });

            if (response.ok) {
                alert('Transfer request submitted successfully!');
                setShowModal(false);
                router.push('/dashboard/incharge/transfer');
            } else {
                const data = await response.json();
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            alert('Failed to submit transfer request');
        } finally {
            setRequesting(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            AVAILABLE: 'bg-green-100 text-green-800',
            ISSUED: 'bg-yellow-100 text-yellow-800',
            MAINTENANCE: 'bg-orange-100 text-orange-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Browse Items for Transfer</h1>
                <p className="text-gray-600 mt-2">Request items from other departments</p>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Department
                        </label>
                        <select
                            value={selectedDept}
                            onChange={(e) => setSelectedDept(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">-- Select a department --</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>
                                    {dept.name} ({dept.code})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Search Items
                        </label>
                        <input
                            type="text"
                            placeholder="Search by name or manual ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            disabled={selectedDept === 'all'}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                    </div>
                </div>
            </div>

            {selectedDept === 'all' && (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="text-gray-600">Please select a department to view available items</p>
                </div>
            )}

            {/* Items Grid */}
            {selectedDept !== 'all' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item) => (
                        <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                            {item.image && (
                                <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
                            )}
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

                                <div className="space-y-2 text-sm mb-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Category:</span>
                                        <span className="font-medium">{item.category.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Condition:</span>
                                        <span className="font-medium">{item.condition}</span>
                                    </div>
                                    {item.isConsumable && item.currentStock !== null && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Stock:</span>
                                            <span className="font-medium">{item.currentStock} units</span>
                                        </div>
                                    )}
                                </div>

                                {item.description && (
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.description}</p>
                                )}

                                <button
                                    onClick={() => openRequestModal(item)}
                                    disabled={item.status !== 'AVAILABLE'}
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                                >
                                    Request Transfer
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedDept !== 'all' && items.length === 0 && !loading && (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-gray-600">No available items found in this department</p>
                </div>
            )}

            {/* Request Modal */}
            {showModal && selectedItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold mb-4">Request Transfer</h2>

                        <div className="mb-6 space-y-3">
                            <div>
                                <span className="text-sm text-gray-600">Item:</span>
                                <p className="font-semibold">{selectedItem.name}</p>
                                <p className="text-sm text-gray-600">{selectedItem.manualId}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">From:</span>
                                <p className="font-semibold">{selectedItem.department.name}</p>
                            </div>

                            {selectedItem.isConsumable && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Quantity <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={selectedItem.currentStock || 999}
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Available: {selectedItem.currentStock} units
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Purpose <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={purpose}
                                    onChange={(e) => setPurpose(e.target.value)}
                                    placeholder="Explain why you need this item..."
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                disabled={requesting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRequestTransfer}
                                disabled={requesting}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {requesting ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            )}
        </div>
    );
}
