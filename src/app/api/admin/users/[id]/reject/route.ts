import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/utils';

/**
 * POST /api/admin/users/[id]/reject
 * Reject a pending user registration
 * Admin only
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check authentication and admin role
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 403 }
            );
        }

        const { id } = await params;
        const body = await request.json();
        const { reason } = body;

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Check if already approved
        if (user.isApproved) {
            return NextResponse.json(
                { error: 'Cannot reject an approved user' },
                { status: 400 }
            );
        }

        // Delete the user (rejected users are removed from system)
        await prisma.user.delete({
            where: { id }
        });

        // Log audit trail
        await logAudit({
            userId: session.user.id,
            action: 'USER_REJECTED',
            entityType: 'User',
            entityId: id,
            changes: { email: user.email, action: 'rejected', reason: reason || 'No reason provided' },
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        });

        // TODO: Send rejection email notification
        // await sendRejectionEmail(user.email, user.name, reason);

        return NextResponse.json({
            message: 'User rejected and removed from system'
        });

    } catch (error) {
        console.error('Error rejecting user:', error);
        return NextResponse.json(
            { error: 'Failed to reject user' },
            { status: 500 }
        );
    }
}
