'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                setEmail('');
            } else {
                setError(data.error || 'An error occurred');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md">
            {/* Logo/Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-secondary-800 mb-2">
                    Forgot Password
                </h1>
                <p className="text-secondary-600">
                    Enter your email to receive a password reset link
                </p>
            </div>

            {/* Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-secondary-200">
                {message && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                            placeholder="your.email@woxsen.edu.in"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-primary text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                        ← Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
