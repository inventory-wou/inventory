'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        studentId: '',
        employeeId: '',
        role: 'STUDENT' as 'STUDENT' | 'FACULTY' | 'STAFF' | 'INCHARGE',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        if (!formData.email.endsWith('@woxsen.edu.in')) {
            setError('Please use your Woxsen University email (@woxsen.edu.in)');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone || undefined,
                    studentId: formData.studentId || undefined,
                    employeeId: formData.employeeId || undefined,
                    role: formData.role,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-secondary-200 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-secondary-800 mb-2">
                        Registration Successful!
                    </h2>
                    <p className="text-secondary-600 mb-4">
                        Your account has been created and is pending admin approval.
                    </p>
                    <p className="text-secondary-500 text-sm">
                        You will be notified via email once your account is approved.
                    </p>
                    <p className="text-secondary-400 text-xs mt-4">
                        Redirecting to login...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-secondary-800 mb-2">
                    Create Account
                </h1>
                <p className="text-secondary-600">
                    Join Woxsen University Inventory System
                </p>
            </div>

            {/* Registration Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-secondary-200">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-secondary-700 mb-2">
                            Full Name *
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                            placeholder="John Doe"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
                            Email Address *
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                            placeholder="your.email@woxsen.edu.in"
                        />
                        <p className="mt-1 text-xs text-secondary-500">Must be a @woxsen.edu.in email</p>
                    </div>

                    {/* Password & Confirm Password */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-2">
                                Password *
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                                className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary-700 mb-2">
                                Confirm Password *
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                minLength={6}
                                className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {/* Phone */}
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-secondary-700 mb-2">
                            Phone Number
                        </label>
                        <input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                            placeholder="+91 XXXXXXXXXX"
                        />
                    </div>

                    {/* Student ID or Employee ID */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="studentId" className="block text-sm font-medium text-secondary-700 mb-2">
                                Student ID
                            </label>
                            <input
                                id="studentId"
                                name="studentId"
                                type="text"
                                value={formData.studentId}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                                placeholder="STU12345"
                            />
                        </div>
                        <div>
                            <label htmlFor="employeeId" className="block text-sm font-medium text-secondary-700 mb-2">
                                Employee ID
                            </label>
                            <input
                                id="employeeId"
                                name="employeeId"
                                type="text"
                                value={formData.employeeId}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                                placeholder="EMP12345"
                            />
                        </div>
                    </div>

                    {/* Role */}
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-secondary-700 mb-2">
                            I am a *
                        </label>
                        <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                        >
                            <option value="STUDENT">Student</option>
                            <option value="FACULTY">Faculty</option>
                            <option value="STAFF">Staff</option>
                            <option value="INCHARGE">Lab Incharge</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-primary text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-secondary-600 text-sm">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                            Sign in here
                        </Link>
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-secondary-500 text-sm">
                <p>© 2025 Woxsen University. All rights reserved.</p>
            </div>
        </div>
    );
}
