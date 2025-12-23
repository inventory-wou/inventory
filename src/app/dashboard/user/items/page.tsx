'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Item {
    id: string;
    manualId: string;
    name: string;
    description: string;
    image: string;
    condition: string;
    status: string;
    isConsumable: boolean;
    category: {
        name: string;
        maxBorrowDuration: number;
    };
    department: {
        name: string;
        code: string;
    };
}

interface UserRequest {
    id: string;
    itemId: string;
    status: string;
}

export default function UserItemsPage() {
    const [items, setItems] = useState<Item[]>([]);
    const [userRequests, setUserRequests] = useState<UserRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [purpose, setPurpose] = useState('');
    const [requestedDays, setRequestedDays] = useState(7);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        document.title = 'Browse Items | Multigyan';
        fetchItems();
        fetchUserRequests();
    }, []);

    const fetchItems = async () => {
        try {
            const response = await fetch('/api/admin/items?perPage=100');
            if (response.ok) {
                const data = await response.json();
                // Filter only available, non-consumable items
                const availableItems = data.items.filter(
                    (item: Item) => item.status === 'AVAILABLE' && !item.isConsumable
                );
                setItems(availableItems);
            }
        } catch (error) {
            console.error('Error fetching items:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserRequests = async () => {
        try {
            const response = await fetch('/api/user/requests');
            if (response.ok) {
                const data = await response.json();
                setUserRequests(data);
            }
        } catch (error) {
            console.error('Error fetching user requests:', error);
        }
    };

    const openRequestModal = (item: Item) => {
        setSelectedItem(item);
        setRequestedDays(Math.min(7, item.category.maxBorrowDuration));
        setPurpose('');
        setShowModal(true);
    };

    const submitRequest = async () => {
        if (!selectedItem || !purpose.trim()) {
            alert('Please enter the purpose for borrowing');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch('/api/user/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemId: selectedItem.id,
                    purpose: purpose.trim(),
                    requestedDays,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Request submitted successfully!');
                setShowModal(false);
                fetchUserRequests();
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            alert('Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    const hasActiveRequest = (itemId: string) => {
        return userRequests.some(
            (req) =>
                req.itemId === itemId &&
                (req.status === 'PENDING' || req.status === 'APPROVED')
        );
    };

    const filteredItems = items.filter((item) => {
        const matchesSearch =
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.manualId.toLowerCase().includes(search.toLowerCase());
        const matchesDept = !departmentFilter || item.department.code === departmentFilter;
        const matchesCat = !categoryFilter || item.category.name === categoryFilter;
        return matchesSearch && matchesDept && matchesCat;
    });

    const conditionColors: Record<string, string> = {
        NEW: 'bg-green-100 text-green-800',
        GOOD: 'bg-blue-100 text-blue-800',
        FAIR: 'bg-yellow-100 text-yellow-800',
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Browse Available Items</h1>
                    <p className="text-gray-600 mt-2">
                        Find equipment to borrow from our labs
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="px-4 py-2 border rounded-lg"
                        />
                        <select
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                            className="px-4 py-2 border rounded-lg"
                        >
                            <option value="">All Departments</option>
                            <option value="ROBO">Robotics</option>
                            <option value="AI">AI Research</option>
                            <option value="META">Metaverse</option>
                        </select>
                        <Link
                            href="/dashboard/user/requests"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-center hover:bg-blue-700"
                        >
                            My Requests
                        </Link>
                    </div>
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((item) => (
                        <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                            {item.image ? (
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-48 object-cover"
                                />
                            ) : (
                                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-400">No Image</span>
                                </div>
                            )}

                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg">{item.name}</h3>
                                    <span
                                        className={`px-2 py-1 rounded text-xs font-semibold ${conditionColors[item.condition] || 'bg-gray-100'
                                            }`}
                                    >
                                        {item.condition}
                                    </span>
                                </div>

                                <p className="text-sm text-gray-600 mb-2">{item.manualId}</p>
                                <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                                    {item.description}
                                </p>

                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                                    <span className="bg-gray-100 px-2 py-1 rounded">
                                        {item.department.name}
                                    </span>
                                    <span className="bg-gray-100 px-2 py-1 rounded">
                                        {item.category.name}
                                    </span>
                                </div>

                                {hasActiveRequest(item.id) ? (
                                    <button
                                        disabled
                                        className="w-full bg-gray-300 text-gray-600 py-2 rounded cursor-not-allowed"
                                    >
                                        Already Requested
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => openRequestModal(item)}
                                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                                    >
                                        Request Item
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {filteredItems.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No items found matching your filters
                    </div>
                )}
            </div>

            {/* Request Modal */}
            {showModal && selectedItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold mb-4">Request Item</h2>

                        <div className="mb-4">
                            <h3 className="font-semibold">{selectedItem.name}</h3>
                            <p className="text-sm text-gray-600">{selectedItem.manualId}</p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">
                                Purpose <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                                placeholder="Why do you need this item?"
                                className="w-full px-3 py-2 border rounded-lg"
                                rows={3}
                                required
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2">
                                Requested Duration (days)
                            </label>
                            <input
                                type="number"
                                value={requestedDays}
                                onChange={(e) =>
                                    setRequestedDays(
                                        Math.min(
                                            parseInt(e.target.value) || 1,
                                            selectedItem.category.maxBorrowDuration
                                        )
                                    )
                                }
                                min="1"
                                max={selectedItem.category.maxBorrowDuration}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Maximum: {selectedItem.category.maxBorrowDuration} days
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                                Expected return:{' '}
                                {new Date(
                                    Date.now() + requestedDays * 24 * 60 * 60 * 1000
                                ).toLocaleDateString()}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitRequest}
                                disabled={submitting}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {submitting ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
