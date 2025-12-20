import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/utils';

/**
 * PUT /api/admin/users/[id]/status
 * Toggle user active status (activate/deactivate)
 * Admin only
 */
export async function PUT(
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
        const { isActive } = body;

        // Validate isActive
        if (typeof isActive !== 'boolean') {
            return NextResponse.json(
                { error: 'isActive must be a boolean value' },
                { status: 400 }
            );
        }

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

        // Prevent deactivating yourself
        if (id === session.user.id && !isActive) {
            return NextResponse.json(
                { error: 'Cannot deactivate your own account' },
                { status: 400 }
            );
        }

        // Update user status
        const updatedUser = await prisma.user.update({
            where: { id },
            data: { isActive },
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
            action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
            entityType: 'User',
            entityId: id,
            changes: { email: user.email, action: isActive ? 'activated' : 'deactivated', isActive },
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        });

        return NextResponse.json({
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            user: updatedUser
        });

    } catch (error) {
        console.error('Error updating user status:', error);
        return NextResponse.json(
            { error: 'Failed to update user status' },
            { status: 500 }
        );
    }
}
