'use client';

import { useState, useEffect } from 'react';

interface IssueRequest {
    id: string;
    purpose: string;
    requestedDays: number;
    requestDate: string;
    status: string;
    rejectionReason?: string;
    user: {
        name: string;
        email: string;
        studentId?: string;
        employeeId?: string;
        phone?: string;
    };
    item: {
        name: string;
        manualId: string;
        imageUrl?: string;
        category: { name: string; maxBorrowDuration: number };
        department: { name: string };
    };
}

export default function InchargeRequestsPage() {
    const [requests, setRequests] = useState<IssueRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('PENDING');
    const [search, setSearch] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<IssueRequest | null>(null);
    const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
    const [collectionInstructions, setCollectionInstructions] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        document.title = 'Request Management | Multigyan';
        fetchRequests();
    }, [statusFilter, search]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (search) params.append('search', search);

            const response = await fetch(`/api/incharge/requests?${params}`);
            if (response.ok) {
                const data = await response.json();
                setRequests(data);
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const openApproveModal = (request: IssueRequest) => {
        setSelectedRequest(request);
        setActionType('approve');
        setCollectionInstructions('Please collect the item from the lab during working hours (9 AM - 5 PM).');
        setShowModal(true);
    };

    const openRejectModal = (request: IssueRequest) => {
        setSelectedRequest(request);
        setActionType('reject');
        setRejectionReason('');
        setShowModal(true);
    };

    const handleApprove = async () => {
        if (!selectedRequest) return;

        setProcessing(true);
        try {
            const response = await fetch(`/api/incharge/requests/${selectedRequest.id}/approve`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ collectionInstructions }),
            });

            if (response.ok) {
                alert('Request approved successfully!');
                setShowModal(false);
                fetchRequests();
            } else {
                const data = await response.json();
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            alert('Failed to approve request');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedRequest || !rejectionReason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }

        setProcessing(true);
        try {
            const response = await fetch(`/api/incharge/requests/${selectedRequest.id}/reject`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rejectionReason: rejectionReason.trim() }),
            });

            if (response.ok) {
                alert('Request rejected');
                setShowModal(false);
                fetchRequests();
            } else {
                const data = await response.json();
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            alert('Failed to reject request');
        } finally {
            setProcessing(false);
        }
    };

    const statusColors: Record<string, string> = {
        PENDING: 'bg-yellow-100 text-yellow-800',
        APPROVED: 'bg-green-100 text-green-800',
        REJECTED: 'bg-red-100 text-red-800',
    };

    if (loading) {
        return <div className="min-h-screen bg-gray-50 p-8"><div className="text-center">Loading...</div></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Request Management</h1>
                    <p className="text-gray-600 mt-2">Approve or reject item requests from users</p>
                </div>

                {/* Filters */}
                <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border rounded-lg"
                        >
                            <option value="">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Search by user or item name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="px-4 py-2 border rounded-lg"
                        />
                    </div>
                </div>

                {/* Requests List */}
                <div className="space-y-4">
                    {requests.map((request) => (
                        <div key={request.id} className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex gap-4 flex-1">
                                    {request.item.imageUrl && (
                                        <img src={request.item.imageUrl} alt={request.item.name} className="w-24 h-24 object-cover rounded" />
                                    )}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-bold text-lg">{request.item.name}</h3>
                                                <p className="text-sm text-gray-600">{request.item.manualId}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[request.status]}`}>
                                                {request.status}
                                            </span>
                                        </div>

                                        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-600">Requester:</span>
                                                <p className="font-medium">{request.user.name}</p>
                                                <p className="text-xs text-gray-500">{request.user.email}</p>
                                                {request.user.studentId && <p className="text-xs text-gray-500">Student ID: {request.user.studentId}</p>}
                                                {request.user.employeeId && <p className="text-xs text-gray-500">Employee ID: {request.user.employeeId}</p>}
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Purpose:</span>
                                                <p className="font-medium">{request.purpose}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Duration:</span>
                                                <p className="font-medium">{request.requestedDays} days</p>
                                                <p className="text-xs text-gray-500">Max: {request.item.category.maxBorrowDuration} days</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Request Date:</span>
                                                <p className="font-medium">{new Date(request.requestDate).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {request.status === 'PENDING' && (
                                <div className="flex gap-3 mt-4 pt-4 border-t">
                                    <button
                                        onClick={() => openApproveModal(request)}
                                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => openRejectModal(request)}
                                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}

                            {request.status === 'REJECTED' && request.rejectionReason && (
                                <div className="mt-4 pt-4 border-t bg-red-50 p-3 rounded">
                                    <p className="text-sm font-semibold text-red-800">Rejection Reason:</p>
                                    <p className="text-sm text-red-700">{request.rejectionReason}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {requests.length === 0 && (
                    <div className="text-center py-12 text-gray-500">No requests found</div>
                )}
            </div>

            {/* Action Modal */}
            {showModal && selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold mb-4">
                            {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
                        </h2>

                        <div className="mb-4">
                            <h3 className="font-semibold">{selectedRequest.item.name}</h3>
                            <p className="text-sm text-gray-600">Requested by: {selectedRequest.user.name}</p>
                        </div>

                        {actionType === 'approve' ? (
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2">Collection Instructions</label>
                                <textarea
                                    value={collectionInstructions}
                                    onChange={(e) => setCollectionInstructions(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    rows={3}
                                />
                            </div>
                        ) : (
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2">
                                    Rejection Reason <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Please provide a reason for rejection"
                                    className="w-full px-3 py-2 border rounded-lg"
                                    rows={3}
                                    required
                                />
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                disabled={processing}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={actionType === 'approve' ? handleApprove : handleReject}
                                disabled={processing}
                                className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 ${actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                    }`}
                            >
                                {processing ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
