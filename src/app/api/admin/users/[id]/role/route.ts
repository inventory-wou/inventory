import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/utils';

/**
 * PUT /api/admin/users/[id]/role
 * Update user role
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
        const { role } = body;

        // Validate role
        const validRoles = ['USER', 'INCHARGE', 'ADMIN'];
        if (!validRoles.includes(role)) {
            return NextResponse.json(
                { error: 'Invalid role. Must be USER, INCHARGE, or ADMIN' },
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

        // Prevent changing own role
        if (id === session.user.id) {
            return NextResponse.json(
                { error: 'Cannot change your own role' },
                { status: 400 }
            );
        }

        // Update user role
        const updatedUser = await prisma.user.update({
            where: { id },
            data: { role },
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
            action: 'USER_ROLE_UPDATED',
            entityType: 'User',
            entityId: id,
            changes: { email: user.email, oldRole: user.role, newRole: role },
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        });

        // TODO: Send role change notification email
        // await sendRoleChangeEmail(user.email, user.name, user.role, role);

        return NextResponse.json({
            message: 'User role updated successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error('Error updating user role:', error);
        return NextResponse.json(
            { error: 'Failed to update user role' },
            { status: 500 }
        );
    }
}
