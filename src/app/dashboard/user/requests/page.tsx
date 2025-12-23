'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface IssueRequest {
    id: string;
    purpose: string;
    requestedDays: number;
    requestDate: string;
    status: string;
    rejectionReason?: string;
    approvalDate?: string;
    item: {
        id: string;
        name: string;
        manualId: string;
        image?: string;
        category: {
            name: string;
        };
        department: {
            name: string;
        };
    };
}

export default function UserRequestsPage() {
    const [requests, setRequests] = useState<IssueRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        document.title = 'My Requests | Multigyan';
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const url = statusFilter
                ? `/api/user/requests?status=${statusFilter}`
                : '/api/user/requests';
            const response = await fetch(url);
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

    useEffect(() => {
        fetchRequests();
    }, [statusFilter]);

    const cancelRequest = async (requestId: string) => {
        if (!confirm('Are you sure you want to cancel this request?')) {
            return;
        }

        try {
            const response = await fetch(`/api/user/requests/${requestId}/cancel`, {
                method: 'PATCH',
            });

            if (response.ok) {
                alert('Request cancelled successfully');
                fetchRequests();
            } else {
                const data = await response.json();
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            alert('Failed to cancel request');
        }
    };

    const statusColors: Record<string, string> = {
        PENDING: 'bg-yellow-100 text-yellow-800',
        APPROVED: 'bg-green-100 text-green-800',
        REJECTED: 'bg-red-100 text-red-800',
        CANCELLED: 'bg-gray-100 text-gray-800',
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
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">My Requests</h1>
                    <p className="text-gray-600 mt-2">View and manage your item requests</p>
                </div>

                {/* Actions */}
                <div className="flex gap-4 mb-6">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border rounded-lg"
                    >
                        <option value="">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                    <Link
                        href="/dashboard/user/items"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Browse Items
                    </Link>
                </div>

                {/* Requests List */}
                <div className="space-y-4">
                    {requests.map((request) => (
                        <div key={request.id} className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex gap-4">
                                    {request.item.image && (
                                        <img
                                            src={request.item.image}
                                            alt={request.item.name}
                                            className="w-20 h-20 object-cover rounded"
                                        />
                                    )}
                                    <div>
                                        <h3 className="font-bold text-lg">{request.item.name}</h3>
                                        <p className="text-sm text-gray-600">{request.item.manualId}</p>
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                {request.item.department.name}
                                            </span>
                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                {request.item.category.name}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <span
                                    className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[request.status] || 'bg-gray-100'
                                        }`}
                                >
                                    {request.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                <div>
                                    <span className="text-gray-600">Purpose:</span>
                                    <p className="font-medium">{request.purpose}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Requested Duration:</span>
                                    <p className="font-medium">{request.requestedDays} days</p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Request Date:</span>
                                    <p className="font-medium">
                                        {new Date(request.requestDate).toLocaleDateString()}
                                    </p>
                                </div>
                                {request.approvalDate && (
                                    <div>
                                        <span className="text-gray-600">Response Date:</span>
                                        <p className="font-medium">
                                            {new Date(request.approvalDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {request.status === 'REJECTED' && request.rejectionReason && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                                    <p className="text-sm font-semibold text-red-800">
                                        Rejection Reason:
                                    </p>
                                    <p className="text-sm text-red-700">{request.rejectionReason}</p>
                                </div>
                            )}

                            {request.status === 'APPROVED' && (
                                <div className="bg-green-50 border-l-4 border-green-500 p-4">
                                    <p className="text-sm text-green-800">
                                        ✓ Your request has been approved. Please collect the item from the
                                        lab.
                                    </p>
                                </div>
                            )}

                            {request.status === 'PENDING' && (
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => cancelRequest(request.id)}
                                        className="px-4 py-2 text-red-600 border border-red-600 rounded hover:bg-red-50"
                                    >
                                        Cancel Request
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {requests.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 mb-4">No requests found</p>
                        <Link
                            href="/dashboard/user/items"
                            className="text-blue-600 hover:underline"
                        >
                            Browse available items
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
