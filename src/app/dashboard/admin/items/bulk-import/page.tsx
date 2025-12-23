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

    // Batch Image Upload
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [imageUploadResults, setImageUploadResults] = useState<any>(null);
    const [showImageTab, setShowImageTab] = useState(false);

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

    // Batch Image Upload Functions
    const handleImageFiles = (files: FileList | null) => {
        if (!files) return;

        const fileArray = Array.from(files);
        if (fileArray.length > 50) {
            alert('Maximum 50 images allowed. Please select fewer files.');
            return;
        }

        setImageFiles(fileArray);
    };

    const uploadBatchImages = async () => {
        if (imageFiles.length === 0) {
            alert('Please select images to upload');
            return;
        }

        try {
            setUploadingImages(true);
            const formData = new FormData();

            imageFiles.forEach(file => {
                formData.append('files', file);
            });

            const response = await fetch('/api/admin/items/bulk-upload-images', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Upload failed');
            }

            const data = await response.json();
            setImageUploadResults(data);
        } catch (error: any) {
            alert(error.message || 'Failed to upload images');
        } finally {
            setUploadingImages(false);
        }
    };

    const downloadImageMapping = () => {
        if (!imageUploadResults || !imageUploadResults.results) return;

        const csv = [
            ['filename', 'cloudinaryUrl', 'status'],
            ...imageUploadResults.results.map((r: any) => [
                r.filename,
                r.url || '',
                r.success ? 'success' : `failed: ${r.error}`
            ]),
        ]
            .map((row) => row.join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'image-urls-mapping.csv';
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

            {/* Import Rules */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h2 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Important Rules for Bulk Import
                </h2>
                <ul className="space-y-2 text-sm text-yellow-800">
                    <li className="flex items-start gap-2">
                        <span className="text-yellow-600 font-bold">•</span>
                        <span><strong>File Size Limits:</strong> Maximum 10MB for CSV files, 20MB for Excel files (larger if containing images)</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-yellow-600 font-bold">•</span>
                        <span><strong>Row Limit:</strong> Maximum 1,000 items per import</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-yellow-600 font-bold">•</span>
                        <span><strong>Required Fields:</strong> name, description, departmentCode, categoryName are mandatory</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-yellow-600 font-bold">•</span>
                        <span><strong>Serial Numbers:</strong> Auto-generated based on department code (no need to provide)</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-yellow-600 font-bold">•</span>
                        <span><strong>Department Codes:</strong> Use ROBO, AI, or META only</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-yellow-600 font-bold">•</span>
                        <span><strong>Images:</strong> Provide Cloudinary URLs in imageUrl column, or use the image uploader for individual items</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-yellow-600 font-bold">•</span>
                        <span><strong>Date Format:</strong> Use YYYY-MM-DD format for dates (e.g., 2024-01-15)</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-yellow-600 font-bold">•</span>
                        <span><strong>Boolean Fields:</strong> Use 'true' or 'false' for isConsumable field</span>
                    </li>
                </ul>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b">
                <button
                    onClick={() => setShowImageTab(false)}
                    className={`px-4 py-2 font-medium transition-colors ${!showImageTab
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    📥 Bulk Import
                </button>
                <button
                    onClick={() => setShowImageTab(true)}
                    className={`px-4 py-2 font-medium transition-colors ${showImageTab
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    🖼️ Batch Upload Images
                </button>
            </div>

            {/* Batch Image Upload Section */}
            {showImageTab ? (
                <div className="space-y-6">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h2 className="text-lg font-semibold text-purple-900 mb-2">How to Use Batch Image Upload</h2>
                        <ol className="space-y-2 text-sm text-purple-800 list-decimal list-inside">
                            <li>Select up to 50 images to upload</li>
                            <li>Click "Upload All Images" to upload them to Cloudinary</li>
                            <li>Download the generated URL mapping CSV</li>
                            <li>Open your import CSV/Excel file</li>
                            <li>Copy the image URLs from the mapping file to your import file</li>
                            <li>Use the "Bulk Import" tab to import your items with image URLs</li>
                        </ol>
                    </div>

                    {/* Image Upload */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Images</h2>
                        <input
                            type="file"
                            multiple
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={(e) => handleImageFiles(e.target.files)}
                            className="mb-4 block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-lg file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100"
                        />
                        <p className="text-xs text-gray-500 mb-4">
                            Select up to 50 images • JPG, PNG, WEBP • Max 5MB each
                        </p>

                        {imageFiles.length > 0 && (
                            <div className="mb-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">
                                    Selected: {imageFiles.length} image(s)
                                </p>
                                <div className="max-h-40 overflow-y-auto bg-gray-50 rounded p-2">
                                    {imageFiles.map((file, idx) => (
                                        <div key={idx} className="text-xs text-gray-600 py-1">
                                            ✓ {file.name} ({Math.round(file.size / 1024)} KB)
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={uploadBatchImages}
                                disabled={uploadingImages || imageFiles.length === 0}
                                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                            >
                                {uploadingImages ? 'Uploading...' : 'Upload All Images'}
                            </button>
                            <button
                                onClick={() => setImageFiles([])}
                                disabled={uploadingImages || imageFiles.length === 0}
                                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    {/* Upload Results */}
                    {imageUploadResults && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Results</h2>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-sm text-blue-600 font-medium">Total</p>
                                    <p className="text-2xl font-bold text-blue-900">{imageUploadResults.total}</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <p className="text-sm text-green-600 font-medium">Successful</p>
                                    <p className="text-2xl font-bold text-green-900">{imageUploadResults.uploaded}</p>
                                </div>
                                <div className="bg-red-50 p-4 rounded-lg">
                                    <p className="text-sm text-red-600 font-medium">Failed</p>
                                    <p className="text-2xl font-bold text-red-900">{imageUploadResults.failed}</p>
                                </div>
                            </div>

                            <button
                                onClick={downloadImageMapping}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 mb-4"
                            >
                                📥 Download URL Mapping CSV
                            </button>

                            <div className="max-h-60 overflow-y-auto border rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Filename</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {imageUploadResults.results.map((r: any, idx: number) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-3 text-sm text-gray-900">{r.filename}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    {r.success ? (
                                                        <span className="text-green-600">✓ Success</span>
                                                    ) : (
                                                        <span className="text-red-600">✗ {r.error}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-blue-600 truncate max-w-xs">
                                                    {r.url ? (
                                                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                            {r.url.substring(0, 50)}...
                                                        </a>
                                                    ) : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <>
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
                                CSV files (Max 10MB, 1000 items) • Excel files (Max 20MB, 1000 items)
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
                </>
            )}
        </div>
    );
}
