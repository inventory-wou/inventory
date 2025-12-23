'use client';

import { useState, useEffect } from 'react';

interface ApprovedRequest {
    id: string;
    purpose: string;
    requestedDays: number;
    approvalDate: string;
    user: {
        name: string;
        email: string;
        studentId?: string;
        employeeId?: string;
    };
    item: {
        id: string;
        name: string;
        manualId: string;
        serialNumber?: string;
        image?: string;
        category: { name: string };
        department: { name: string };
    };
}

export default function InchargeIssuePage() {
    const [requests, setRequests] = useState<ApprovedRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<ApprovedRequest | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [issuing, setIssuing] = useState(false);

    // Non-returnable fields
    const [isReturnable, setIsReturnable] = useState(true);
    const [projectName, setProjectName] = useState('');

    useEffect(() => {
        document.title = 'Issue Items | Multigyan';
        fetchApprovedRequests();
    }, [search]);

    const fetchApprovedRequests = async () => {
        setLoading(true);
        try {
            const params = search ? `?search=${encodeURIComponent(search)}` : '';
            const response = await fetch(`/api/incharge/issue${params}`);
            if (response.ok) {
                const data = await response.json();
                setRequests(data);
            }
        } catch (error) {
            console.error('Error fetching approved requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const openIssueModal = (request: ApprovedRequest) => {
        setSelectedRequest(request);
        setIsReturnable(true);
        setProjectName('');
        setShowModal(true);
    };

    const handleIssue = async () => {
        if (!selectedRequest) return;

        // Validate non-returnable requirements
        if (!isReturnable && !projectName.trim()) {
            alert('Project Name is required for non-returnable items');
            return;
        }

        setIssuing(true);
        try {
            const response = await fetch('/api/incharge/issue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestId: selectedRequest.id,
                    isReturnable,
                    projectName: isReturnable ? null : projectName.trim(),
                }),
            });

            if (response.ok) {
                alert('Item issued successfully!');
                setShowModal(false);
                setIsReturnable(true);
                setProjectName('');
                fetchApprovedRequests();
            } else {
                const data = await response.json();
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            alert('Failed to issue item');
        } finally {
            setIssuing(false);
        }
    };

    const calculateExpectedReturn = (days: number) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toLocaleDateString();
    };

    if (loading) {
        return <div className="min-h-screen bg-gray-50 p-8"><div className="text-center">Loading...</div></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Issue Items</h1>
                    <p className="text-gray-600 mt-2">Issue approved items to users</p>
                </div>

                {/* Search */}
                <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                    <input
                        type="text"
                        placeholder="Search by user name, item name, manual ID, or serial number..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                    />
                </div>

                {/* Approved Requests */}
                <div className="space-y-4">
                    {requests.map((request) => (
                        <div key={request.id} className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-start gap-4">
                                {request.item.image && (
                                    <img src={request.item.image} alt={request.item.name} className="w-24 h-24 object-cover rounded" />
                                )}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-bold text-lg">{request.item.name}</h3>
                                            <p className="text-sm text-gray-600">{request.item.manualId}</p>
                                            {request.item.serialNumber && (
                                                <p className="text-xs text-gray-500">SN: {request.item.serialNumber}</p>
                                            )}
                                        </div>
                                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                                            Ready to Issue
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                                        <div>
                                            <span className="text-gray-600">User:</span>
                                            <p className="font-medium">{request.user.name}</p>
                                            <p className="text-xs text-gray-500">{request.user.email}</p>
                                            {request.user.studentId && <p className="text-xs text-gray-500">ID: {request.user.studentId}</p>}
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Purpose:</span>
                                            <p className="font-medium line-clamp-2">{request.purpose}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Duration:</span>
                                            <p className="font-medium">{request.requestedDays} days</p>
                                            <p className="text-xs text-gray-500">
                                                Return by: {calculateExpectedReturn(request.requestedDays)}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => openIssueModal(request)}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Issue Item
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {requests.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No approved requests waiting to be issued
                    </div>
                )}
            </div>

            {/* Issue Confirmation Modal */}
            {showModal && selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
                        <h2 className="text-2xl font-bold mb-4">Confirm Item Issuance</h2>

                        <div className="mb-6 space-y-4">
                            <div>
                                <span className="text-sm text-gray-600">Item:</span>
                                <p className="font-semibold">{selectedRequest.item.name}</p>
                                <p className="text-sm text-gray-600">{selectedRequest.item.manualId}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">Issuing to:</span>
                                <p className="font-semibold">{selectedRequest.user.name}</p>
                                <p className="text-sm text-gray-600">{selectedRequest.user.email}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">Duration:</span>
                                <p className="font-semibold">{selectedRequest.requestedDays} days</p>
                            </div>

                            <div className="border-t pt-4">
                                <label className="text-sm font-medium text-gray-700 mb-2 block">
                                    Item Return Type
                                </label>
                                <div className="space-y-2">
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={isReturnable}
                                            onChange={() => setIsReturnable(true)}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span className="text-sm">Returnable (Temporary)</span>
                                    </label>
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={!isReturnable}
                                            onChange={() => setIsReturnable(false)}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span className="text-sm">Non-Returnable (Project-based)</span>
                                    </label>
                                </div>
                            </div>

                            {!isReturnable && (
                                <div className="bg-yellow-50 p-4 rounded-lg space-y-3 border border-yellow-200">
                                    <div className="flex items-start gap-2">
                                        <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <p className="text-sm text-yellow-800">
                                            This item will be permanently allocated to {selectedRequest.user.name}'s project and will not require return.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Project Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={projectName}
                                            onChange={(e) => setProjectName(e.target.value)}
                                            placeholder="e.g., AI Research - Neural Networks"
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Project Incharge
                                        </label>
                                        <input
                                            type="text"
                                            value={selectedRequest.user.name}
                                            disabled
                                            className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Auto-populated from requesting user</p>
                                    </div>
                                </div>
                            )}

                            {isReturnable && (
                                <div className="bg-blue-50 p-3 rounded">
                                    <span className="text-sm text-gray-600">Expected Return Date:</span>
                                    <p className="font-bold text-blue-800">
                                        {calculateExpectedReturn(selectedRequest.requestedDays)}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                disabled={issuing}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleIssue}
                                disabled={issuing}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {issuing ? 'Issuing...' : 'Confirm Issue'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
