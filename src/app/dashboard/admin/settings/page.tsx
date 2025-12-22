'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SettingsState {
    late_return_ban_months: string;
    late_return_auto_ban: string;
    default_max_borrow_days: string;
    reminder_3days_enabled: string;
    reminder_1day_enabled: string;
    overdue_reminder_enabled: string;
    email_sender_name: string;
    email_footer_text: string;
    max_items_per_user: string;
    consumable_min_stock_alert: string;
    // Role-based permissions
    faculty_max_borrow_days: string;
    staff_max_borrow_days: string;
    student_max_borrow_days: string;
    faculty_max_items: string;
    staff_max_items: string;
    student_max_items: string;
    faculty_requires_approval: string;
    staff_requires_approval: string;
    student_requires_approval: string;
}

export default function SettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [settings, setSettings] = useState<SettingsState>({
        late_return_ban_months: '6',
        late_return_auto_ban: 'true',
        default_max_borrow_days: '7',
        reminder_3days_enabled: 'true',
        reminder_1day_enabled: 'true',
        overdue_reminder_enabled: 'true',
        email_sender_name: 'Inventory System',
        email_footer_text: 'Woxsen University Inventory Management',
        max_items_per_user: '3',
        consumable_min_stock_alert: '10',
        // Role-based defaults
        faculty_max_borrow_days: '30',
        staff_max_borrow_days: '21',
        student_max_borrow_days: '7',
        faculty_max_items: '5',
        staff_max_items: '3',
        student_max_items: '2',
        faculty_requires_approval: 'false',
        staff_requires_approval: 'true',
        student_requires_approval: 'true',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (session?.user?.role !== 'ADMIN') {
            router.push('/dashboard');
        }
    }, [session, status, router]);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/admin/settings');
            if (response.ok) {
                const data = await response.json();
                setSettings(data.settings);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            showMessage('error', 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key: keyof SettingsState, value: string) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    const handleToggle = (key: keyof SettingsState) => {
        setSettings((prev) => ({
            ...prev,
            [key]: prev[key] === 'true' ? 'false' : 'true',
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const settingsArray = Object.entries(settings).map(([key, value]) => ({
                key,
                value,
            }));

            const response = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings: settingsArray }),
            });

            if (response.ok) {
                showMessage('success', 'Settings saved successfully');
            } else {
                const data = await response.json();
                showMessage('error', data.error || 'Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            showMessage('error', 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleResetDefaults = async () => {
        if (!confirm('Are you sure you want to reset all settings to defaults?')) {
            return;
        }

        setSaving(true);
        setMessage(null);

        try {
            const response = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resetDefaults: true }),
            });

            if (response.ok) {
                await fetchSettings();
                showMessage('success', 'Settings reset to defaults');
            } else {
                showMessage('error', 'Failed to reset settings');
            }
        } catch (error) {
            console.error('Error resetting settings:', error);
            showMessage('error', 'Failed to reset settings');
        } finally {
            setSaving(false);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    if (status === 'loading' || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    if (session?.user?.role !== 'ADMIN') {
        return null;
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Back to Dashboard Button */}
            <div className="mb-6">
                <Link
                    href="/dashboard/admin"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-secondary-700 bg-white hover:bg-secondary-50 border border-secondary-300 rounded-lg transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Dashboard
                </Link>
            </div>

            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
                <p className="text-gray-600 mt-2">Configure business rules and system behavior</p>
            </div>

            {/* Message Display */}
            {message && (
                <div
                    className={`mb-6 p-4 rounded-lg ${message.type === 'success'
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-red-100 text-red-800 border border-red-300'
                        }`}
                >
                    {message.text}
                </div>
            )}

            <div className="space-y-6">
                {/* Late Return Settings */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Late Return Settings</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ban Duration (months)
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="24"
                                value={settings.late_return_ban_months}
                                onChange={(e) => handleChange('late_return_ban_months', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Number of months to ban users who return items late
                            </p>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Automatic Ban on Late Return
                                </label>
                                <p className="text-sm text-gray-500">
                                    Automatically ban users when they return items late
                                </p>
                            </div>
                            <button
                                onClick={() => handleToggle('late_return_auto_ban')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.late_return_auto_ban === 'true' ? 'bg-blue-600' : 'bg-gray-300'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.late_return_auto_ban === 'true' ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Borrow Duration Settings */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Borrow Duration Settings</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Default Max Borrow Duration (days)
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="365"
                            value={settings.default_max_borrow_days}
                            onChange={(e) => handleChange('default_max_borrow_days', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            Default maximum number of days items can be borrowed (used for new categories)
                        </p>
                    </div>
                </div>

                {/* Email Reminder Settings */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Email Reminder Settings</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    3-Day Reminder
                                </label>
                                <p className="text-sm text-gray-500">Send reminder 3 days before due date</p>
                            </div>
                            <button
                                onClick={() => handleToggle('reminder_3days_enabled')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.reminder_3days_enabled === 'true' ? 'bg-blue-600' : 'bg-gray-300'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.reminder_3days_enabled === 'true' ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    1-Day Reminder
                                </label>
                                <p className="text-sm text-gray-500">Send reminder 1 day before due date</p>
                            </div>
                            <button
                                onClick={() => handleToggle('reminder_1day_enabled')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.reminder_1day_enabled === 'true' ? 'bg-blue-600' : 'bg-gray-300'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.reminder_1day_enabled === 'true' ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Overdue Reminder
                                </label>
                                <p className="text-sm text-gray-500">Send reminder for overdue items</p>
                            </div>
                            <button
                                onClick={() => handleToggle('overdue_reminder_enabled')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.overdue_reminder_enabled === 'true' ? 'bg-blue-600' : 'bg-gray-300'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.overdue_reminder_enabled === 'true' ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Email Template Settings */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Email Template Settings</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Sender Name
                            </label>
                            <input
                                type="text"
                                value={settings.email_sender_name}
                                onChange={(e) => handleChange('email_sender_name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Display name for email sender
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Footer Text
                            </label>
                            <textarea
                                rows={3}
                                value={settings.email_footer_text}
                                onChange={(e) => handleChange('email_footer_text', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Footer text appearing in all email notifications
                            </p>
                        </div>
                    </div>
                </div>

                {/* Business Rules */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Rules</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Max Items Per User
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={settings.max_items_per_user}
                                onChange={(e) => handleChange('max_items_per_user', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Maximum number of items a user can borrow simultaneously
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Consumable Stock Alert Threshold
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="1000"
                                value={settings.consumable_min_stock_alert}
                                onChange={(e) => handleChange('consumable_min_stock_alert', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Minimum stock level to trigger low stock alert for consumables
                            </p>
                        </div>
                    </div>
                </div>

                {/* Role-Based Permissions */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Role-Based Permissions</h2>

                    {/* Faculty Section */}
                    <div className="mb-6 pb-6 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-blue-700 mb-4">Faculty</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Max Borrow Days
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="365"
                                    value={settings.faculty_max_borrow_days}
                                    onChange={(e) => handleChange('faculty_max_borrow_days', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Max Items
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={settings.faculty_max_items}
                                    onChange={(e) => handleChange('faculty_max_items', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div className="flex items-center justify-between pt-6">
                                <label className="text-sm font-medium text-gray-700">Requires Approval</label>
                                <button
                                    onClick={() => handleToggle('faculty_requires_approval')}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.faculty_requires_approval === 'true' ? 'bg-blue-600' : 'bg-gray-300'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.faculty_requires_approval === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Staff Section */}
                    <div className="mb-6 pb-6 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-green-700 mb-4">Staff</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Max Borrow Days
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="365"
                                    value={settings.staff_max_borrow_days}
                                    onChange={(e) => handleChange('staff_max_borrow_days', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Max Items
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={settings.staff_max_items}
                                    onChange={(e) => handleChange('staff_max_items', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div className="flex items-center justify-between pt-6">
                                <label className="text-sm font-medium text-gray-700">Requires Approval</label>
                                <button
                                    onClick={() => handleToggle('staff_requires_approval')}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.staff_requires_approval === 'true' ? 'bg-blue-600' : 'bg-gray-300'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.staff_requires_approval === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Student Section */}
                    <div>
                        <h3 className="text-lg font-medium text-purple-700 mb-4">Students</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Max Borrow Days
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="365"
                                    value={settings.student_max_borrow_days}
                                    onChange={(e) => handleChange('student_max_borrow_days', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Max Items
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={settings.student_max_items}
                                    onChange={(e) => handleChange('student_max_items', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div className="flex items-center justify-between pt-6">
                                <label className="text-sm font-medium text-gray-700">Requires Approval</label>
                                <button
                                    onClick={() => handleToggle('student_requires_approval')}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.student_requires_approval === 'true' ? 'bg-blue-600' : 'bg-gray-300'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.student_requires_approval === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center">
                    <button
                        onClick={handleResetDefaults}
                        disabled={saving}
                        className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                    >
                        Reset to Defaults
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={fetchSettings}
                            disabled={saving}
                            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
