'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface ImportError {
    row: number;
    field: string;
    message: string;
}

interface ImportResult {
    success?: boolean;
    imported?: number;
    failed?: number;
    totalRows?: number;
    errors?: ImportError[];
    message?: string;
    dryRun?: boolean;
    validRows?: number;
    invalidRows?: number;
}

export default function BulkImportPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [showResults, setShowResults] = useState(false);

    if (status === 'loading') {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'INCHARGE')) {
        router.push('/dashboard');
        return null;
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const downloadTemplate = async (format: 'csv' | 'excel') => {
        try {
            const response = await fetch(`/api/admin/items/bulk-import/template?format=${format}`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `items-import-template.${format === 'csv' ? 'csv' : 'xlsx'}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Template download error:', error);
            alert('Failed to download template');
        }
    };

    const handleUpload = async (dryRun: boolean = false) => {
        if (!file) {
            alert('Please select a file');
            return;
        }

        setUploading(true);
        setShowResults(false);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('dryRun', dryRun.toString());
            formData.append('skipInvalid', 'true');

            const response = await fetch('/api/admin/items/bulk-import', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            setResult(data);
            setShowResults(true);

            if (!dryRun && data.success) {
                // Clear file after successful import
                setFile(null);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert(error instanceof Error ? error.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const downloadErrorReport = () => {
        if (!result || !result.errors || result.errors.length === 0) return;

        const csv = [
            ['Row', 'Field', 'Error'],
            ...result.errors.map((e) => [e.row, e.field, e.message]),
        ]
            .map((row) => row.join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'import-errors.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => router.back()}
                    className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
                >
                    ← Back to Items
                </button>
                <h1 className="text-3xl font-bold text-gray-900">Bulk Item Import</h1>
                <p className="text-gray-600 mt-2">
                    Upload a CSV or Excel file to import multiple items at once
                </p>
            </div>

            {/* Template Downloads */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h2 className="text-lg font-semibold text-blue-900 mb-2">Download Templates</h2>
                <p className="text-sm text-blue-800 mb-3">
                    Start by downloading a template file with the correct column headers
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={() => downloadTemplate('csv')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Download CSV Template
                    </button>
                    <button
                        onClick={() => downloadTemplate('excel')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        Download Excel Template
                    </button>
                </div>
            </div>

            {/* File Upload */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload File</h2>

                {/* Drag-and-Drop Zone */}
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragActive
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                        }`}
                >
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                    </svg>
                    <div className="space-y-2">
                        <p className="text-lg font-medium text-gray-700">
                            {file ? file.name : 'Drag and drop your file here'}
                        </p>
                        <p className="text-sm text-gray-500">or</p>
                        <label className="inline-block px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                            <span className="text-blue-600">Browse Files</span>
                            <input
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                        CSV or Excel files only (Max 10MB, 1000 items)
                    </p>
                </div>

                {/* Upload Buttons */}
                {file && (
                    <div className="mt-4 flex gap-3">
                        <button
                            onClick={() => handleUpload(true)}
                            disabled={uploading}
                            className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                        >
                            {uploading ? 'Validating...' : 'Validate Only'}
                        </button>
                        <button
                            onClick={() => handleUpload(false)}
                            disabled={uploading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {uploading ? 'Importing...' : 'Upload & Import'}
                        </button>
                        <button
                            onClick={() => setFile(null)}
                            disabled={uploading}
                            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                        >
                            Clear
                        </button>
                    </div>
                )}
            </div>

            {/* Results */}
            {showResults && result && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Import Results</h2>

                    {/* Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-blue-600 font-medium">Total Rows</p>
                            <p className="text-2xl font-bold text-blue-900">{result.totalRows || 0}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm text-green-600 font-medium">
                                {result.dryRun ? 'Valid Rows' : 'Imported'}
                            </p>
                            <p className="text-2xl font-bold text-green-900">
                                {result.dryRun ? result.validRows || 0 : result.imported || 0}
                            </p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                            <p className="text-sm text-red-600 font-medium">
                                {result.dryRun ? 'Invalid Rows' : 'Failed'}
                            </p>
                            <p className="text-2xl font-bold text-red-900">
                                {result.dryRun ? result.invalidRows || 0 : result.failed || 0}
                            </p>
                        </div>
                    </div>

                    {/* Success Message */}
                    {result.message && (
                        <div
                            className={`p-4 rounded-lg mb-4 ${result.success
                                    ? 'bg-green-100 text-green-800 border border-green-300'
                                    : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                }`}
                        >
                            {result.message}
                        </div>
                    )}

                    {/* Errors Table */}
                    {result.errors && result.errors.length > 0 && (
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-lg font-semibold text-gray-900">Errors</h3>
                                <button
                                    onClick={downloadErrorReport}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                                >
                                    Download Error Report
                                </button>
                            </div>
                            <div className="overflow-x-auto max-h-96 overflow-y-auto border rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Row
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Field
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Error
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {result.errors.map((error, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm text-gray-900">{error.row}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{error.field}</td>
                                                <td className="px-4 py-3 text-sm text-red-600">{error.message}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Dry Run Note */}
                    {result.dryRun && (
                        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-sm text-yellow-800">
                                <strong>Dry Run Mode:</strong> No items were imported. Fix the errors above and
                                upload again to perform the actual import.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
