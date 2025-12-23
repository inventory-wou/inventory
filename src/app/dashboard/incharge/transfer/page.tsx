'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface TransferRequest {
    id: string;
    purpose: string;
    quantity: number;
    status: string;
    requestDate: string;
    approvalDate?: string;
    rejectionReason?: string;
    item: {
        id: string;
        name: string;
        manualId: string;
        isConsumable: boolean;
        currentStock?: number;
        category: { name: string };
    };
    fromDepartment: { name: string; code: string };
    toDepartment: { name: string; code: string };
    requestedBy: { name: string; email: string };
    approvedBy?: { name: string };
}

export default function TransferManagementPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [requests, setRequests] = useState<TransferRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'incoming' | 'outgoing'>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        document.title = 'Transfer Requests | WoU Inventory';
        if (status === 'authenticated') {
            fetchRequests();
        }
    }, [status, filter, statusFilter]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter !== 'all') params.append('direction', filter);
            if (statusFilter !== 'all') params.append('status', statusFilter);

            const response = await fetch(`/api/incharge/transfer/request?${params}`);
            if (response.ok) {
                const data = await response.json();
                setRequests(data);
            }
        } catch (error) {
            console.error('Error fetching transfer requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId: string) => {
        if (!confirm('Approve this transfer request?')) return;

        try {
            const response = await fetch(`/api/incharge/transfer/requests/${requestId}/approve`, {
                method: 'PUT',
            });

            if (response.ok) {
                alert('Transfer request approved successfully!');
                fetchRequests();
            } else {
                const data = await response.json();
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            alert('Failed to approve transfer request');
        }
    };

    const handleReject = async (requestId: string) => {
        const reason = prompt('Please provide a reason for rejection:');
        if (!reason) return;

        try {
            const response = await fetch(`/api/incharge/transfer/requests/${requestId}/reject`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rejectionReason: reason }),
            });

            if (response.ok) {
                alert('Transfer request rejected');
                fetchRequests();
            } else {
                const data = await response.json();
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            alert('Failed to reject transfer request');
        }
    };

    const handleComplete = async (requestId: string) => {
        const notes = prompt('Optional notes for this transfer:');

        try {
            const response = await fetch('/api/incharge/transfer/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, notes }),
            });

            if (response.ok) {
                alert('Transfer completed successfully!');
                fetchRequests();
            } else {
                const data = await response.json();
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            alert('Failed to complete transfer');
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            APPROVED: 'bg-green-100 text-green-800',
            REJECTED: 'bg-red-100 text-red-800',
            COMPLETED: 'bg-blue-100 text-blue-800',
            CANCELLED: 'bg-gray-100 text-gray-800',
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
                    <h1 className="text-3xl font-bold text-gray-900">Transfer Requests</h1>
                    <p className="text-gray-600 mt-2">Manage inter-department item transfers</p>
                </div>
                <button
                    onClick={() => router.push('/dashboard/incharge/transfer/browse')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Request Transfer
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as any)}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Requests</option>
                        <option value="incoming">Incoming (To Approve)</option>
                        <option value="outgoing">Outgoing (My Requests)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Requests List */}
            <div className="space-y-4">
                {requests.map((request) => (
                    <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg text-gray-900">{request.item.name}</h3>
                                <p className="text-sm text-gray-600">{request.item.manualId} • {request.item.category.name}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                                {request.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                            <div>
                                <span className="text-gray-600">From:</span>
                                <p className="font-medium">{request.fromDepartment.name}</p>
                            </div>
                            <div>
                                <span className="text-gray-600">To:</span>
                                <p className="font-medium">{request.toDepartment.name}</p>
                            </div>
                            <div>
                                <span className="text-gray-600">Requested by:</span>
                                <p className="font-medium">{request.requestedBy.name}</p>
                            </div>
                            <div>
                                <span className="text-gray-600">Date:</span>
                                <p className="font-medium">{new Date(request.requestDate).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {request.item.isConsumable && (
                            <div className="bg-blue-50 p-3 rounded mb-4">
                                <p className="text-sm text-blue-800">
                                    <strong>Quantity:</strong> {request.quantity} units
                                </p>
                            </div>
                        )}

                        <div className="mb-4">
                            <span className="text-sm text-gray-600">Purpose:</span>
                            <p className="text-sm font-medium">{request.purpose}</p>
                        </div>

                        {request.rejectionReason && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4">
                                <p className="text-sm text-red-800">
                                    <strong>Rejection Reason:</strong> {request.rejectionReason}
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                            {request.status === 'PENDING' && filter === 'incoming' && (
                                <>
                                    <button
                                        onClick={() => handleApprove(request.id)}
                                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleReject(request.id)}
                                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                                    >
                                        Reject
                                    </button>
                                </>
                            )}
                            {request.status === 'APPROVED' && (
                                <button
                                    onClick={() => handleComplete(request.id)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                >
                                    Complete Transfer
                                </button>
                            )}
                            {request.status === 'COMPLETED' && request.approvedBy && (
                                <div className="text-sm text-gray-600">
                                    Completed by {request.approvedBy.name}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {requests.length === 0 && (
                <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <p className="text-gray-600 text-lg">No transfer requests found</p>
                    <p className="text-gray-500 text-sm mt-1">Request transfers from other departments to get started</p>
                </div>
            )}
        </div>
    );
}
