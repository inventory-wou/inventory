'use client';

import { useState, useEffect } from 'react';

interface IssuedItem {
    id: string;
    issueDate: string;
    expectedReturnDate: string;
    isOverdue: boolean;
    daysOverdue: number;
    isReturnable: boolean;
    projectName?: string;
    projectIncharge?: string;
    user: {
        name: string;
        email: string;
        studentId?: string;
        employeeId?: string;
    };
    item: {
        name: string;
        manualId: string;
        serialNumber?: string;
        image?: string;
        condition: string;
        department: { name: string };
    };
    request: {
        purpose: string;
        requestedDays: number;
    };
}

export default function InchargeReturnPage() {
    const [issuedItems, setIssuedItems] = useState<IssuedItem[]>([]);
    const [allItems, setAllItems] = useState<IssuedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'temporary' | 'permanent'>('all');
    const [selectedRecord, setSelectedRecord] = useState<IssuedItem | null>(null);
    const [returnCondition, setReturnCondition] = useState('GOOD');
    const [damageRemarks, setDamageRemarks] = useState('');
    const [isPendingReplacement, setIsPendingReplacement] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        document.title = 'Return Items | Multigyan';
        fetchIssuedItems();
    }, [search]);

    useEffect(() => {
        // Apply filter when typeFilter changes
        applyFilter();
    }, [typeFilter, allItems]);

    const fetchIssuedItems = async () => {
        setLoading(true);
        try {
            const params = search ? `?search=${encodeURIComponent(search)}` : '';
            const response = await fetch(`/api/incharge/return${params}`);
            if (response.ok) {
                const data = await response.json();
                setAllItems(data);
                applyFilterToData(data, typeFilter);
            }
        } catch (error) {
            console.error('Error fetching issued items:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilter = () => {
        applyFilterToData(allItems, typeFilter);
    };

    const applyFilterToData = (data: IssuedItem[], filter: string) => {
        if (filter === 'temporary') {
            setIssuedItems(data.filter(item => item.isReturnable));
        } else if (filter === 'permanent') {
            setIssuedItems(data.filter(item => !item.isReturnable));
        } else {
            setIssuedItems(data);
        }
    };

    const openReturnModal = (record: IssuedItem) => {
        setSelectedRecord(record);
        setReturnCondition(record.item.condition);
        setDamageRemarks('');
        setIsPendingReplacement(false);
        setShowModal(true);
    };

    const handleReturn = async () => {
        if (!selectedRecord) return;

        // Validate damage remarks if damaged
        if ((returnCondition === 'DAMAGED' || returnCondition === 'UNDER_REPAIR') && !damageRemarks.trim()) {
            alert('Please provide damage remarks for damaged items');
            return;
        }

        setProcessing(true);
        try {
            const response = await fetch('/api/incharge/return', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    issueRecordId: selectedRecord.id,
                    returnCondition,
                    damageRemarks: damageRemarks.trim() || undefined,
                    isPendingReplacement,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                let message = 'Item returned successfully!';
                if (data.warnings?.lateBan) {
                    message += `\n\n⚠️ ${data.warnings.lateBan}`;
                }
                if (data.warnings?.compensationBan) {
                    message += `\n\n⚠️ ${data.warnings.compensationBan}`;
                }
                alert(message);
                setShowModal(false);
                fetchIssuedItems();
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            alert('Failed to process return');
        } finally {
            setProcessing(false);
        }
    };

    const calculateDaysRemaining = (expectedDate: string) => {
        const now = new Date();
        const expected = new Date(expectedDate);
        const diff = Math.ceil((expected.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    if (loading) {
        return <div className="min-h-screen bg-gray-50 p-8"><div className="text-center">Loading...</div></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Return Items</h1>
                    <p className="text-gray-600 mt-2">Process returns for issued items</p>
                </div>

                {/* Search and Filter */}
                <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <input
                                type="text"
                                placeholder="Search by user name or item name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value as any)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Issuances</option>
                                <option value="temporary">Temporary (Returnable)</option>
                                <option value="permanent">Permanent (Non-Returnable)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Issued Items */}
                <div className="space-y-4">
                    {issuedItems.map((record) => {
                        const daysRemaining = calculateDaysRemaining(record.expectedReturnDate);
                        const isOverdue = record.isOverdue;

                        return (
                            <div
                                key={record.id}
                                className={`bg-white rounded-lg shadow-md p-6 ${isOverdue ? 'border-2 border-red-500' : ''
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    {record.item.image && (
                                        <img src={record.item.image} alt={record.item.name} className="w-24 h-24 object-cover rounded" />
                                    )}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="font-bold text-lg">{record.item.name}</h3>
                                                <p className="text-sm text-gray-600">{record.item.manualId}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                {!record.isReturnable ? (
                                                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                                                        Permanent
                                                    </span>
                                                ) : isOverdue ? (
                                                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                                                        OVERDUE ({record.daysOverdue} days)
                                                    </span>
                                                ) : daysRemaining <= 3 ? (
                                                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                                                        Due Soon ({daysRemaining} days)
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                                                        On Time
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {!record.isReturnable && record.projectName && (
                                            <div className="bg-purple-50 border-l-4 border-purple-500 p-3 mb-3">
                                                <p className="text-sm font-semibold text-purple-900">Project Allocation</p>
                                                <p className="text-sm text-purple-800 mt-1">
                                                    <strong>Project:</strong> {record.projectName}
                                                </p>
                                                <p className="text-sm text-purple-800">
                                                    <strong>Incharge:</strong> {record.projectIncharge}
                                                </p>
                                                <p className="text-xs text-purple-700 mt-1">
                                                    This item is permanently allocated and does not require return
                                                </p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                                            <div>
                                                <span className="text-gray-600">Borrowed by:</span>
                                                <p className="font-medium">{record.user.name}</p>
                                                <p className="text-xs text-gray-500">{record.user.email}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Issue Date:</span>
                                                <p className="font-medium">{new Date(record.issueDate).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">{record.isReturnable ? 'Expected Return:' : 'Allocated On:'}</span>
                                                <p className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                                                    {new Date(record.expectedReturnDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        {isOverdue && (
                                            <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4">
                                                <p className="text-sm text-red-800 font-semibold">
                                                    ⚠️ WARNING: This item is {record.daysOverdue} days overdue. User will receive a 6-month ban upon return.
                                                </p>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => openReturnModal(record)}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            Process Return
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {issuedItems.length === 0 && (
                    <div className="text-center py-12 text-gray-500">No items currently issued</div>
                )}
            </div>

            {/* Return Modal */}
            {showModal && selectedRecord && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 my-8">
                        <h2 className="text-2xl font-bold mb-4">Process Item Return</h2>

                        <div className="mb-6 space-y-3">
                            <div>
                                <span className="text-sm text-gray-600">Item:</span>
                                <p className="font-semibold">{selectedRecord.item.name}</p>
                                <p className="text-sm text-gray-600">{selectedRecord.item.manualId}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">Returned by:</span>
                                <p className="font-semibold">{selectedRecord.user.name}</p>
                            </div>

                            {selectedRecord.isOverdue && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-3">
                                    <p className="text-sm text-red-800 font-semibold">
                                        ⚠️ LATE RETURN: User will be automatically banned for 6 months
                                    </p>
                                    <p className="text-xs text-red-700 mt-1">
                                        {selectedRecord.daysOverdue} days overdue
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Return Condition <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={returnCondition}
                                    onChange={(e) => {
                                        setReturnCondition(e.target.value);
                                        if (e.target.value !== 'DAMAGED' && e.target.value !== 'UNDER_REPAIR') {
                                            setDamageRemarks('');
                                            setIsPendingReplacement(false);
                                        }
                                    }}
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    <option value="NEW">NEW</option>
                                    <option value="GOOD">GOOD</option>
                                    <option value="FAIR">FAIR</option>
                                    <option value="DAMAGED">DAMAGED</option>
                                    <option value="UNDER_REPAIR">UNDER_REPAIR</option>
                                </select>
                            </div>

                            {(returnCondition === 'DAMAGED' || returnCondition === 'UNDER_REPAIR') && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Damage Remarks <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={damageRemarks}
                                            onChange={(e) => setDamageRemarks(e.target.value)}
                                            placeholder="Describe the damage..."
                                            className="w-full px-3 py-2 border rounded-lg"
                                            rows={3}
                                            required
                                        />
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <input
                                            type="checkbox"
                                            id="compensation"
                                            checked={isPendingReplacement}
                                            onChange={(e) => setIsPendingReplacement(e.target.checked)}
                                            className="mt-1"
                                        />
                                        <label htmlFor="compensation" className="text-sm">
                                            <span className="font-medium">Compensation Required</span>
                                            <p className="text-xs text-gray-600 mt-1">
                                                User will be banned indefinitely until they provide a replacement or compensation
                                            </p>
                                        </label>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                disabled={processing}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReturn}
                                disabled={processing}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {processing ? 'Processing...' : 'Confirm Return'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
