import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';

/**
 * POST /api/auth/forgot-password
 * Send password reset email to user
 */
export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        // Always return success to prevent email enumeration
        // But only send email if user exists
        if (user) {
            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

            // Save token to database
            await prisma.user.update({
                where: { email: email.toLowerCase() },
                data: {
                    resetToken,
                    resetTokenExpiry
                }
            });

            // Send email
            const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

            try {
                await sendPasswordResetEmail(user.email, user.name, resetUrl);
            } catch (emailError) {
                console.error('Failed to send reset email:', emailError);
                // Don't fail the request if email fails - log it instead
            }
        }

        // Always return success message
        return NextResponse.json({
            message: 'If an account exists with that email, you will receive a password reset link shortly.'
        });

    } catch (error) {
        console.error('Error in forgot password:', error);
        return NextResponse.json(
            { error: 'An error occurred. Please try again.' },
            { status: 500 }
        );
    }
}
