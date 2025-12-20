import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/utils';

/**
 * DELETE /api/admin/users/[id]
 * Delete a user from the system
 * Admin only
 */
export async function DELETE(
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
            where: { id },
            include: {
                issueRecords: {
                    where: {
                        returnDate: null // Active borrows
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Prevent deleting yourself
        if (id === session.user.id) {
            return NextResponse.json(
                { error: 'Cannot delete your own account' },
                { status: 400 }
            );
        }

        // Check for active borrows
        if (user.issueRecords && user.issueRecords.length > 0) {
            return NextResponse.json(
                { error: 'Cannot delete user with active borrowed items. Please ensure all items are returned first.' },
                { status: 400 }
            );
        }

        // Delete user
        await prisma.user.delete({
            where: { id }
        });

        // Log audit trail
        await logAudit({
            userId: session.user.id,
            action: 'USER_DELETED',
            entityType: 'User',
            entityId: id,
            changes: { email: user.email, name: user.name, action: 'deleted' },
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        });

        return NextResponse.json({
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
            { error: 'Failed to delete user' },
            { status: 500 }
        );
    }
}
