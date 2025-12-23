'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function AdminReports() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [reportType, setReportType] = useState('inventory');
    const [loading, setLoading] = useState(false);

    // Filter states
    const [departmentId, setDepartmentId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [itemStatus, setItemStatus] = useState('');
    const [condition, setCondition] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [includeReturned, setIncludeReturned] = useState(true);

    // Data for dropdowns
    const [departments, setDepartments] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
            fetchDepartments();
            fetchCategories();
        }
    }, [status, session]);

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

    const handleGenerateReport = async () => {
        setLoading(true);
        try {
            let url = `/api/admin/reports/${reportType}?`;
            const params = new URLSearchParams();

            // Add filters based on report type
            if (departmentId) params.append('departmentId', departmentId);

            if (reportType === 'inventory') {
                if (categoryId) params.append('categoryId', categoryId);
                if (itemStatus) params.append('status', itemStatus);
                if (condition) params.append('condition', condition);
            } else if (reportType === 'issues') {
                if (startDate) params.append('startDate', startDate);
                if (endDate) params.append('endDate', endDate);
                params.append('includeReturned', includeReturned.toString());
            }

            url += params.toString();

            // Fetch the file
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to generate report');
            }

            // Get the filename from Content-Disposition header
            const contentDisposition = response.headers.get('Content-Disposition');
            const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
            const filename = filenameMatch ? filenameMatch[1] : `${reportType}_report.xlsx`;

            // Create blob and download
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Error generating report:', error);
            alert('Failed to generate report. Please try again.');
        } finally {
            setLoading(false);
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

    if (session?.user?.role !== 'ADMIN') {
        router.push('/dashboard');
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-light">
            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-secondary-800">Reports & Analytics</h1>
                        <p className="text-sm text-secondary-600 mt-1">Generate and download inventory reports</p>
                    </div>
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 bg-white hover:bg-secondary-50 text-secondary-700 border border-secondary-300 rounded-lg text-sm font-medium transition-colors"
                    >
                        ← Back
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 border border-secondary-200">
                    {/* Report Type Selection */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-secondary-800 mb-4">Select Report Type</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button
                                onClick={() => setReportType('inventory')}
                                className={`p-4 border-2 rounded-lg transition-all ${reportType === 'inventory'
                                    ? 'border-primary-500 bg-primary-50'
                                    : 'border-secondary-200 hover:border-primary-300'
                                    }`}
                            >
                                <div className="flex items-center">
                                    <svg className="w-8 h-8 text-primary-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    <div className="text-left">
                                        <p className="font-medium text-secondary-800">Inventory Report</p>
                                        <p className="text-xs text-secondary-500">All items with details</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => setReportType('issues')}
                                className={`p-4 border-2 rounded-lg transition-all ${reportType === 'issues'
                                    ? 'border-primary-500 bg-primary-50'
                                    : 'border-secondary-200 hover:border-primary-300'
                                    }`}
                            >
                                <div className="flex items-center">
                                    <svg className="w-8 h-8 text-primary-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    <div className="text-left">
                                        <p className="font-medium text-secondary-800">Issue History</p>
                                        <p className="text-xs text-secondary-500">All borrow records</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => setReportType('overdue')}
                                className={`p-4 border-2 rounded-lg transition-all ${reportType === 'overdue'
                                    ? 'border-primary-500 bg-primary-50'
                                    : 'border-secondary-200 hover:border-primary-300'
                                    }`}
                            >
                                <div className="flex items-center">
                                    <svg className="w-8 h-8 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <div className="text-left">
                                        <p className="font-medium text-secondary-800">Overdue Items</p>
                                        <p className="text-xs text-secondary-500">Late returns only</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-secondary-800 mb-4">Filters</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Department Filter (All Reports) */}
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-2">Department</label>
                                <select
                                    value={departmentId}
                                    onChange={(e) => setDepartmentId(e.target.value)}
                                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="">All Departments</option>
                                    {departments.map((dept) => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Inventory-specific filters */}
                            {reportType === 'inventory' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-2">Category</label>
                                        <select
                                            value={categoryId}
                                            onChange={(e) => setCategoryId(e.target.value)}
                                            className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        >
                                            <option value="">All Categories</option>
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-2">Status</label>
                                        <select
                                            value={itemStatus}
                                            onChange={(e) => setItemStatus(e.target.value)}
                                            className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        >
                                            <option value="">All Status</option>
                                            <option value="AVAILABLE">Available</option>
                                            <option value="ISSUED">Issued</option>
                                            <option value="MAINTENANCE">Maintenance</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-2">Condition</label>
                                        <select
                                            value={condition}
                                            onChange={(e) => setCondition(e.target.value)}
                                            className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        >
                                            <option value="">All Conditions</option>
                                            <option value="NEW">New</option>
                                            <option value="GOOD">Good</option>
                                            <option value="FAIR">Fair</option>
                                            <option value="DAMAGED">Damaged</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* Issue History filters */}
                            {reportType === 'issues' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-2">Start Date</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-2">End Date</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>

                                    <div className="flex items-end">
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={includeReturned}
                                                onChange={(e) => setIncludeReturned(e.target.checked)}
                                                className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                                            />
                                            <span className="ml-2 text-sm text-secondary-700">Include returned items</span>
                                        </label>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Generate Button */}
                    <div className="flex justify-center">
                        <button
                            onClick={handleGenerateReport}
                            disabled={loading}
                            className="px-8 py-3 bg-gradient-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Generating Report...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download Report
                                </>
                            )}
                        </button>
                    </div>

                    {/* Info Box */}
                    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-blue-800 mb-1">Report Information</p>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>• Reports are generated in Excel (.xlsx) format</li>
                                    <li>• Use filters to customize report scope</li>
                                    <li>• Files include relevant headers and formatting</li>
                                    <li>• Large reports may take a few moments to generate</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
