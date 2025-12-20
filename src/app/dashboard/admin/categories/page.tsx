'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface Category {
    id: string;
    name: string;
    description: string | null;
    maxBorrowDuration: number;
    requiresApproval: boolean;
    visibleToStudents: boolean;
    visibleToStaff: boolean;
    _count: {
        items: number;
    };
}

export default function CategoriesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        maxBorrowDuration: 7,
        requiresApproval: false,
        visibleToStudents: true,
        visibleToStaff: true
    });

    // Redirect if not authorized
    if (status === 'authenticated' && !['ADMIN', 'INCHARGE'].includes(session.user.role)) {
        router.push('/dashboard');
        return null;
    }

    const fetchCategories = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);

            const response = await fetch(`/api/admin/categories?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch categories');

            const data = await response.json();
            setCategories(data.categories);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (status === 'authenticated') {
            fetchCategories();
        }
    }, [status, searchQuery]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editingCategory
                ? `/api/admin/categories/${editingCategory.id}`
                : '/api/admin/categories';

            const response = await fetch(url, {
                method: editingCategory ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }

            setShowModal(false);
            setEditingCategory(null);
            setFormData({ name: '', description: '', maxBorrowDuration: 7, requiresApproval: false, visibleToStudents: true, visibleToStaff: true });
            fetchCategories();
            alert(editingCategory ? 'Category updated successfully' : 'Category created successfully');
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description || '',
            maxBorrowDuration: category.maxBorrowDuration,
            requiresApproval: category.requiresApproval,
            visibleToStudents: category.visibleToStudents,
            visibleToStaff: category.visibleToStaff
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete category "${name}"?`)) return;

        try {
            const response = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }

            fetchCategories();
            alert('Category deleted successfully');
        } catch (err: any) {
            alert(err.message);
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
                            <h1 className="text-2xl font-bold text-secondary-800">Category Management</h1>
                            <p className="text-sm text-secondary-600 mt-1">Manage item categories</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setEditingCategory(null);
                                    setFormData({ name: '', description: '', maxBorrowDuration: 7, requiresApproval: false, visibleToStudents: true, visibleToStaff: true });
                                    setShowModal(true);
                                }}
                                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium"
                            >
                                + Create Category
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
                {/* Search */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-secondary-200">
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
                )}

                {isLoading ? (
                    <div className="bg-white rounded-xl shadow-md p-8 text-center">
                        <div className="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                    </div>
                ) : categories.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-8 text-center">
                        <p className="text-secondary-500">No categories found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categories.map((cat) => (
                            <div key={cat.id} className="bg-white rounded-xl shadow-md border border-secondary-200 p-6">
                                <h3 className="text-lg font-bold text-secondary-800 mb-2">{cat.name}</h3>
                                <p className="text-sm text-secondary-600 mb-4 min-h-[2.5rem]">{cat.description || 'No description'}</p>

                                <div className="space-y-2 mb-4 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-secondary-600">Max Duration:</span>
                                        <span className="font-medium">{cat.maxBorrowDuration} days</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-secondary-600">Items:</span>
                                        <span className="font-medium">{cat._count.items}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {cat.requiresApproval && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">Approval Required</span>}
                                        {cat.visibleToStudents && <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Students</span>}
                                        {cat.visibleToStaff && <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Staff</span>}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(cat)}
                                        className="flex-1 px-3 py-2 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded text-sm font-medium"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cat.id, cat.name)}
                                        className="flex-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm font-medium"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-secondary-800 mb-4">
                            {editingCategory ? 'Edit Category' : 'Create Category'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        rows={3}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">Max Borrow Duration (days)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="365"
                                        value={formData.maxBorrowDuration}
                                        onChange={(e) => setFormData({ ...formData, maxBorrowDuration: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.requiresApproval}
                                            onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                                            className="mr-2"
                                        />
                                        <span className="text-sm">Requires approval</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.visibleToStudents}
                                            onChange={(e) => setFormData({ ...formData, visibleToStudents: e.target.checked })}
                                            className="mr-2"
                                        />
                                        <span className="text-sm">Visible to students</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.visibleToStaff}
                                            onChange={(e) => setFormData({ ...formData, visibleToStaff: e.target.checked })}
                                            className="mr-2"
                                        />
                                        <span className="text-sm">Visible to staff</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium"
                                >
                                    {editingCategory ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
