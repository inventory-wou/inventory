import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/utils';

/**
 * POST /api/admin/users/[id]/approve
 * Approve a pending user
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
                { error: 'User is already approved' },
                { status: 400 }
            );
        }

        // Approve user
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                isApproved: true,
                isActive: true
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isApproved: true,
                isActive: true
            }
        });

        // Log audit trail
        await logAudit({
            userId: session.user.id,
            action: 'USER_APPROVED',
            entityType: 'User',
            entityId: id,
            changes: { email: user.email, action: 'approved' },
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        });

        // TODO: Send approval email notification
        // await sendApprovalEmail(user.email, user.name);

        return NextResponse.json({
            message: 'User approved successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error('Error approving user:', error);
        return NextResponse.json(
            { error: 'Failed to approve user' },
            { status: 500 }
        );
    }
}
