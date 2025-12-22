'use client';

import { useState } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    isApproved: boolean;
    isActive: boolean;
    isBanned: boolean;
    bannedUntil: Date | null;
    phone: string | null;
    studentId: string | null;
    employeeId: string | null;
    createdAt: Date;
    updatedAt: Date;
}


interface UserTableProps {
    users: User[];
    onApprove: (userId: string) => void;
    onReject: (userId: string) => void;
    onRoleChange: (userId: string, newRole: string) => void;
    onStatusToggle: (userId: string, isActive: boolean) => void;
    onDelete: (userId: string) => void;
    onRevokeBan?: (userId: string) => void;
    onBulkApprove?: (userIds: string[]) => void;
    isLoading?: boolean;
}

export default function UserTable({
    users,
    onApprove,
    onReject,
    onRoleChange,
    onStatusToggle,
    onDelete,
    onRevokeBan,
    onBulkApprove,
    isLoading = false
}: UserTableProps) {
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

    const toggleUserSelection = (userId: string) => {
        const newSelection = new Set(selectedUsers);
        if (newSelection.has(userId)) {
            newSelection.delete(userId);
        } else {
            newSelection.add(userId);
        }
        setSelectedUsers(newSelection);
    };

    const toggleSelectAll = () => {
        if (selectedUsers.size === users.length) {
            setSelectedUsers(new Set());
        } else {
            // Only select pending users for bulk approval
            const pendingUsers = users.filter(u => !u.isApproved);
            setSelectedUsers(new Set(pendingUsers.map(u => u.id)));
        }
    };

    const handleBulkApprove = () => {
        if (selectedUsers.size === 0) return;
        if (onBulkApprove) {
            onBulkApprove(Array.from(selectedUsers));
            setSelectedUsers(new Set()); // Clear selection after approve
        }
    };

    const pendingUsers = users.filter(u => !u.isApproved);
    const selectedPendingCount = Array.from(selectedUsers).filter(id =>
        users.find(u => u.id === id && !u.isApproved)
    ).length;

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return 'bg-purple-100 text-purple-700';
            case 'INCHARGE':
                return 'bg-blue-100 text-blue-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <div className="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-secondary-600">Loading users...</p>
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="text-secondary-500">No users found</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-secondary-200">
            {/* Bulk Actions Bar */}
            {selectedPendingCount > 0 && onBulkApprove && (
                <div className="bg-primary-50 border-b border-primary-200 px-6 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-primary-700">
                        {selectedPendingCount} pending user(s) selected
                    </span>
                    <button
                        onClick={handleBulkApprove}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Approve Selected ({selectedPendingCount})
                    </button>
                </div>
            )}

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-secondary-200">
                    <thead className="bg-secondary-50">
                        <tr>
                            <th className="px-6 py-3 text-left">
                                <input
                                    type="checkbox"
                                    checked={selectedUsers.size > 0 && selectedPendingCount === pendingUsers.length && pendingUsers.length > 0}
                                    onChange={toggleSelectAll}
                                    className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                                />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                ID
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-secondary-200">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-secondary-50 transition-colors">
                                <td className="px-6 py-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.has(user.id)}
                                        onChange={() => toggleUserSelection(user.id)}
                                        className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                                            <span className="text-primary-600 font-medium text-sm">
                                                {user.name?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-secondary-900">{user.name}</div>
                                            <div className="text-sm text-secondary-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col gap-1">
                                        {!user.isApproved && (
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                Pending
                                            </span>
                                        )}
                                        {user.isApproved && user.isActive && (
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                Active
                                            </span>
                                        )}
                                        {user.isApproved && !user.isActive && (
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                Inactive
                                            </span>
                                        )}
                                        {user.isBanned && (
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                Banned
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                                    {user.studentId || user.employeeId || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end gap-2">
                                        {!user.isApproved && (
                                            <>
                                                <button
                                                    onClick={() => onApprove(user.id)}
                                                    className="text-green-600 hover:text-green-900 px-3 py-1 rounded hover:bg-green-50 transition-colors"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => onReject(user.id)}
                                                    className="text-red-600 hover:text-red-900 px-3 py-1 rounded hover:bg-red-50 transition-colors"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                        {user.isApproved && (
                                            <>
                                                {user.isBanned && onRevokeBan && (
                                                    <button
                                                        onClick={() => onRevokeBan(user.id)}
                                                        className="text-purple-600 hover:text-purple-900 px-3 py-1 rounded hover:bg-purple-50 transition-colors font-semibold"
                                                        title={user.bannedUntil ? `Banned until ${new Date(user.bannedUntil).toLocaleDateString()}` : 'Banned indefinitely (compensation)'}
                                                    >
                                                        Revoke Ban
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => onStatusToggle(user.id, !user.isActive)}
                                                    className={`${user.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'} px-3 py-1 rounded hover:bg-secondary-50 transition-colors`}
                                                >
                                                    {user.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button
                                                    onClick={() => onDelete(user.id)}
                                                    className="text-red-600 hover:text-red-900 px-3 py-1 rounded hover:bg-red-50 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-secondary-200">
                {users.map((user) => (
                    <div key={user.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={selectedUsers.has(user.id)}
                                    onChange={() => toggleUserSelection(user.id)}
                                    className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500 mr-3"
                                />
                                <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                                    <span className="text-primary-600 font-medium text-sm">
                                        {user.name?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="ml-3">
                                    <div className="text-sm font-medium text-secondary-900">{user.name}</div>
                                    <div className="text-xs text-secondary-500">{user.email}</div>
                                </div>
                            </div>
                        </div>
                        <div className="mb-3 flex flex-wrap gap-2">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                                {user.role}
                            </span>
                            {!user.isApproved && (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                    Pending
                                </span>
                            )}
                            {user.isApproved && user.isActive && (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    Active
                                </span>
                            )}
                            {user.isApproved && !user.isActive && (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                    Inactive
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {!user.isApproved && (
                                <>
                                    <button
                                        onClick={() => onApprove(user.id)}
                                        className="flex-1 text-green-600 border border-green-600 hover:bg-green-50 px-3 py-2 rounded text-sm font-medium transition-colors"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => onReject(user.id)}
                                        className="flex-1 text-red-600 border border-red-600 hover:bg-red-50 px-3 py-2 rounded text-sm font-medium transition-colors"
                                    >
                                        Reject
                                    </button>
                                </>
                            )}
                            {user.isApproved && (
                                <>
                                    <button
                                        onClick={() => onStatusToggle(user.id, !user.isActive)}
                                        className="flex-1 text-primary-600 border border-primary-600 hover:bg-primary-50 px-3 py-2 rounded text-sm font-medium transition-colors"
                                    >
                                        {user.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button
                                        onClick={() => onDelete(user.id)}
                                        className="flex-1 text-red-600 border border-red-600 hover:bg-red-50 px-3 py-2 rounded text-sm font-medium transition-colors"
                                    >
                                        Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
