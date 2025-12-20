'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface Department {
    id: string;
    name: string;
    code: string;
    description: string | null;
    inchargeId: string | null;
    incharge: {
        id: string;
        name: string;
        email: string;
    } | null;
    _count: {
        items: number;
    };
    createdAt: Date;
}

interface Stats {
    totalDepartments: number;
    withIncharge: number;
    withoutIncharge: number;
}

export default function DepartmentsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [departments, setDepartments] = useState<Department[]>([]);
    const [stats, setStats] = useState<Stats>({ totalDepartments: 0, withIncharge: 0, withoutIncharge: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Incharge users
    const [inchargeUsers, setInchargeUsers] = useState<{ id: string; name: string; email: string }[]>([]);

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        inchargeId: ''
    });

    // Redirect if not admin
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
        router.push('/dashboard');
        return null;
    }

    // Fetch departments
    const fetchDepartments = async () => {
        try {
            setIsLoading(true);
            setError('');

            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);

            const response = await fetch(`/api/admin/departments?${params.toString()}`);

            if (!response.ok) {
                throw new Error('Failed to fetch departments');
            }

            const data = await response.json();
            setDepartments(data.departments);
            setStats(data.stats);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch incharge users
    const fetchInchargeUsers = async () => {
        try {
            const response = await fetch('/api/admin/users?role=INCHARGE&isApproved=true&limit=100');
            if (!response.ok) throw new Error('Failed to fetch incharge users');

            const data = await response.json();
            setInchargeUsers(data.users.map((u: any) => ({
                id: u.id,
                name: u.name,
                email: u.email
            })));
        } catch (err: any) {
            console.error('Error fetching incharge users:', err);
        }
    };

    useEffect(() => {
        if (status === 'authenticated') {
            fetchDepartments();
            fetchInchargeUsers();
        }
    }, [status, searchQuery]);

    // Handle create department
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/admin/departments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create department');
            }

            setShowCreateModal(false);
            setFormData({ name: '', code: '', description: '', inchargeId: '' });
            fetchDepartments();
            alert('Department created successfully');
        } catch (err: any) {
            alert(err.message);
        }
    };

    // Handle update department
    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingDepartment) return;

        try {
            const response = await fetch(`/api/admin/departments/${editingDepartment.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update department');
            }

            setEditingDepartment(null);
            setFormData({ name: '', code: '', description: '', inchargeId: '' });
            fetchDepartments();
            alert('Department updated successfully');
        } catch (err: any) {
            alert(err.message);
        }
    };

    // Handle delete department
    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;

        try {
            const response = await fetch(`/api/admin/departments/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete department');
            }

            fetchDepartments();
            alert('Department deleted successfully');
        } catch (err: any) {
            alert(err.message);
        }
    };

    // Open edit modal
    const openEditModal = (dept: Department) => {
        setEditingDepartment(dept);
        setFormData({
            name: dept.name,
            code: dept.code,
            description: dept.description || '',
            inchargeId: dept.inchargeId || ''
        });
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
            {/* Header */}
            <header className="bg-white border-b border-secondary-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-secondary-800">Department Management</h1>
                            <p className="text-sm text-secondary-600 mt-1">Manage departments and assign incharges</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                + Create Department
                            </button>
                            <button
                                onClick={() => router.push('/dashboard/admin')}
                                className="px-4 py-2 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 rounded-lg text-sm font-medium transition-colors"
                            >
                                ← Back
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-4 border border-secondary-200">
                        <p className="text-sm text-secondary-600">Total Departments</p>
                        <p className="text-2xl font-bold text-secondary-800">{stats.totalDepartments}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4 border border-secondary-200">
                        <p className="text-sm text-secondary-600">With Incharge</p>
                        <p className="text-2xl font-bold text-green-600">{stats.withIncharge}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4 border border-secondary-200">
                        <p className="text-sm text-secondary-600">Without Incharge</p>
                        <p className="text-2xl font-bold text-yellow-600">{stats.withoutIncharge}</p>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-secondary-200">
                    <input
                        type="text"
                        placeholder="Search departments by name or code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Departments Grid */}
                {isLoading ? (
                    <div className="bg-white rounded-xl shadow-md p-8 text-center">
                        <div className="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                        <p className="mt-4 text-secondary-600">Loading departments...</p>
                    </div>
                ) : departments.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-8 text-center">
                        <svg className="w-16 h-16 mx-auto mb-4 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <p className="text-secondary-500">No departments found</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium"
                        >
                            Create Your First Department
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {departments.map((dept) => (
                            <div key={dept.id} className="bg-white rounded-xl shadow-md border border-secondary-200 p-6 hover:shadow-lg transition-shadow">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-secondary-800">{dept.name}</h3>
                                        <span className="inline-block mt-1 px-2 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded">
                                            {dept.code}
                                        </span>
                                    </div>
                                    {dept._count.items > 0 && (
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                            {dept._count.items} items
                                        </span>
                                    )}
                                </div>

                                {/* Description */}
                                <p className="text-sm text-secondary-600 mb-4 min-h-[2.5rem]">
                                    {dept.description || 'No description'}
                                </p>

                                {/* Incharge Info */}
                                <div className="mb-4 pb-4 border-b border-secondary-100">
                                    <p className="text-xs text-secondary-500 mb-1">Incharge:</p>
                                    {dept.incharge ? (
                                        <div>
                                            <p className="text-sm font-medium text-secondary-800">{dept.incharge.name}</p>
                                            <p className="text-xs text-secondary-500">{dept.incharge.email}</p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-yellow-600">Not assigned</p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openEditModal(dept)}
                                        className="flex-1 px-3 py-2 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded text-sm font-medium transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(dept.id, dept.name)}
                                        className="flex-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm font-medium transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Create/Edit Modal */}
            {(showCreateModal || editingDepartment) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-secondary-800 mb-4">
                            {editingDepartment ? 'Edit Department' : 'Create Department'}
                        </h2>
                        <form onSubmit={editingDepartment ? handleUpdate : handleCreate}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Department Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="e.g. Computer Science"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Department Code *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase"
                                        placeholder="e.g. CS"
                                        maxLength={10}
                                        pattern="[A-Z0-9]{2,10}"
                                    />
                                    <p className="text-xs text-secondary-500 mt-1">2-10 uppercase alphanumeric characters</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="Department description..."
                                        rows={3}
                                        maxLength={500}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Assign Incharge
                                    </label>
                                    <select
                                        value={formData.inchargeId}
                                        onChange={(e) => setFormData({ ...formData, inchargeId: e.target.value })}
                                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    >
                                        <option value="">No Incharge (Assign Later)</option>
                                        {inchargeUsers.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.name} ({user.email})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-secondary-500 mt-1">
                                        {inchargeUsers.length === 0
                                            ? 'No INCHARGE users available. Create INCHARGE users first.'
                                            : 'Select a user with INCHARGE role to manage this department'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setEditingDepartment(null);
                                        setFormData({ name: '', code: '', description: '', inchargeId: '' });
                                    }}
                                    className="flex-1 px-4 py-2 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    {editingDepartment ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
