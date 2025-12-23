'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Department {
    id: string;
    name: string;
    code: string;
}

interface Category {
    id: string;
    name: string;
}

export default function AddProcurementItemPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        categoryId: '',
        departmentId: '', // Primary owning department (usually PROCUREMENT)
        description: '',
        specifications: '',
        serialNumber: '',
        image: '',
        condition: 'NEW',
        isConsumable: false,
        currentStock: '',
        minStockLevel: '',
        location: '',
        purchaseDate: '',
        value: '',
        availableDepartments: [] as string[],
    });

    useEffect(() => {
        document.title = 'Add Procurement Item | WoU Inventory';
        if (status === 'authenticated') {
            fetchCategories();
            fetchDepartments();
        }
    }, [status]);

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/admin/categories');
            if (response.ok) {
                const data = await response.json();
                setCategories(data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
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
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleDepartmentToggle = (deptId: string) => {
        setFormData(prev => ({
            ...prev,
            availableDepartments: prev.availableDepartments.includes(deptId)
                ? prev.availableDepartments.filter(id => id !== deptId)
                : [...prev.availableDepartments, deptId]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.categoryId || !formData.departmentId) {
            alert('Please fill in all required fields');
            return;
        }

        if (formData.isConsumable && (!formData.currentStock || !formData.minStockLevel)) {
            alert('Please provide stock levels for consumable items');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/admin/procurement/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    currentStock: formData.isConsumable ? parseInt(formData.currentStock) : null,
                    minStockLevel: formData.isConsumable ? parseInt(formData.minStockLevel) : null,
                    value: formData.value ? parseFloat(formData.value) : null,
                }),
            });

            if (response.ok) {
                alert('Item added successfully!');
                router.push('/dashboard/procurement/inventory');
            } else {
                const data = await response.json();
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            alert('Failed to add item');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Add Procurement Item</h1>
                <p className="text-gray-600 mt-2">Add a new item to the procurement inventory</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                {/* Basic Information */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Item Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Owning Department <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="departmentId"
                                value={formData.departmentId}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select department</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                            <input
                                type="text"
                                name="serialNumber"
                                value={formData.serialNumber}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                            <select
                                name="condition"
                                value={formData.condition}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="NEW">NEW</option>
                                <option value="GOOD">GOOD</option>
                                <option value="FAIR">FAIR</option>
                                <option value="DAMAGED">DAMAGED</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="e.g., Room 101, Shelf A"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={2}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Specifications</label>
                            <textarea
                                name="specifications"
                                value={formData.specifications}
                                onChange={handleChange}
                                rows={2}
                                placeholder="Technical specifications..."
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                            <input
                                type="url"
                                name="image"
                                value={formData.image}
                                onChange={handleChange}
                                placeholder="https://..."
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Stock Information */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Stock Information</h2>
                    <div className="mb-4">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="isConsumable"
                                checked={formData.isConsumable}
                                onChange={handleChange}
                                className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm font-medium">This is a consumable item</span>
                        </label>
                    </div>

                    {formData.isConsumable && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Current Stock <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="currentStock"
                                    value={formData.currentStock}
                                    onChange={handleChange}
                                    min="0"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required={formData.isConsumable}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Minimum Stock Level <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="minStockLevel"
                                    value={formData.minStockLevel}
                                    onChange={handleChange}
                                    min="0"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required={formData.isConsumable}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Purchase Information */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Purchase Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                            <input
                                type="date"
                                name="purchaseDate"
                                value={formData.purchaseDate}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Value (₹)</label>
                            <input
                                type="number"
                                name="value"
                                value={formData.value}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Department Availability */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Department Availability</h2>
                    <p className="text-sm text-gray-600 mb-4">Select which departments can access this item</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {departments.map(dept => (
                            <label key={dept.id} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-blue-50">
                                <input
                                    type="checkbox"
                                    checked={formData.availableDepartments.includes(dept.id)}
                                    onChange={() => handleDepartmentToggle(dept.id)}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-sm">{dept.name}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Submit */}
                <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Adding Item...' : 'Add Item'}
                    </button>
                </div>
            </form>
        </div>
    );
}
