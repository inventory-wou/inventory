'use client';

import { useState } from 'react';

interface Department {
    id: string;
    name: string;
    code: string;
}

interface Category {
    id: string;
    name: string;
}

interface Item {
    id: string;
    manualId: string;
    name: string;
    description: string | null;
    specifications: string | null;
    serialNumber: string | null;
    condition: string;
    status: string;
    isConsumable: boolean;
    currentStock: number | null;
    minStockLevel: number | null;
    location: string | null;
    purchaseDate: Date | null;
    value: number | null;
    imageUrl: string | null;
    category: { id: string; name: string };
    department: { id: string; name: string; code: string };
}

interface ItemFormModalProps {
    isOpen: boolean;
    editingItem: Item | null;
    departments: Department[];
    categories: Category[];
    formData: {
        name: string;
        description: string;
        specifications: string;
        categoryId: string;
        departmentId: string;
        serialNumber: string;
        condition: string;
        status: string;
        isConsumable: boolean;
        currentStock: number;
        minStockLevel: number;
        location: string;
        purchaseDate: string;
        value: string;
        imageUrl: string;
    };
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    onChange: (field: string, value: any) => void;
}

export default function ItemFormModal({
    isOpen,
    editingItem,
    departments,
    categories,
    formData,
    onClose,
    onSubmit,
    onChange
}: ItemFormModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 my-8">
                <h2 className="text-xl font-bold text-secondary-800 mb-4">
                    {editingItem ? 'Edit Item' : 'Add New Item'}
                </h2>

                <form onSubmit={onSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
                        {/* Name */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-secondary-700 mb-1">
                                Item Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => onChange('name', e.target.value)}
                                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="e.g. Arduino Uno R3"
                            />
                        </div>

                        {/* Department */}
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">
                                Department *
                            </label>
                            <select
                                required
                                value={formData.departmentId}
                                onChange={(e) => onChange('departmentId', e.target.value)}
                                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="">Select Department</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                                ))}
                            </select>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">
                                Category *
                            </label>
                            <select
                                required
                                value={formData.categoryId}
                                onChange={(e) => onChange('categoryId', e.target.value)}
                                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="">Select Category</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Serial Number */}
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">
                                Serial Number
                            </label>
                            <input
                                type="text"
                                value={formData.serialNumber}
                                onChange={(e) => onChange('serialNumber', e.target.value)}
                                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="Optional"
                            />
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">
                                Location
                            </label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => onChange('location', e.target.value)}
                                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="e.g. Lab 301, Shelf A"
                            />
                        </div>

                        {/* Condition */}
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">
                                Condition
                            </label>
                            <select
                                value={formData.condition}
                                onChange={(e) => onChange('condition', e.target.value)}
                                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="NEW">New</option>
                                <option value="GOOD">Good</option>
                                <option value="FAIR">Fair</option>
                                <option value="DAMAGED">Damaged</option>
                                <option value="UNDER_REPAIR">Under Repair</option>
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">
                                Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => onChange('status', e.target.value)}
                                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="AVAILABLE">Available</option>
                                <option value="ISSUED">Issued</option>
                                <option value="MAINTENANCE">Maintenance</option>
                                <option value="PENDING_REPLACEMENT">Pending Replacement</option>
                            </select>
                        </div>

                        {/* Purchase Date */}
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">
                                Purchase Date
                            </label>
                            <input
                                type="date"
                                value={formData.purchaseDate}
                                onChange={(e) => onChange('purchaseDate', e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        {/* Value */}
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">
                                Value (₹)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.value}
                                onChange={(e) => onChange('value', e.target.value)}
                                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="0.00"
                            />
                        </div>

                        {/* Consumable Checkbox */}
                        <div className="md:col-span-2">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.isConsumable}
                                    onChange={(e) => onChange('isConsumable', e.target.checked)}
                                    className="mr-2"
                                />
                                <span className="text-sm font-medium">This is a consumable item</span>
                            </label>
                        </div>

                        {/* Consumable Fields */}
                        {formData.isConsumable && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Current Stock *
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        required={formData.isConsumable}
                                        value={formData.currentStock}
                                        onChange={(e) => onChange('currentStock', parseInt(e.target.value))}
                                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Min Stock Level *
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        required={formData.isConsumable}
                                        value={formData.minStockLevel}
                                        onChange={(e) => onChange('minStockLevel', parseInt(e.target.value))}
                                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                            </>
                        )}

                        {/* Description */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-secondary-700 mb-1">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => onChange('description', e.target.value)}
                                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                rows={2}
                                placeholder="Brief description of the item..."
                            />
                        </div>

                        {/* Specifications */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-secondary-700 mb-1">
                                Specifications
                            </label>
                            <textarea
                                value={formData.specifications}
                                onChange={(e) => onChange('specifications', e.target.value)}
                                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                rows={2}
                                placeholder="Technical specs..."
                            />
                        </div>

                        {/* Image URL */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-secondary-700 mb-1">
                                Image URL
                            </label>
                            <input
                                type="url"
                                value={formData.imageUrl}
                                onChange={(e) => onChange('imageUrl', e.target.value)}
                                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="https://example.com/image.jpg"
                            />
                            <p className="text-xs text-secondary-500 mt-1">
                                Upload image to Cloudinary and paste URL here
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                        >
                            {editingItem ? 'Update Item' : 'Create Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
