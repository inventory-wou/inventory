import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteContext {
    params: Promise<{ id: string }>;
}

/**
 * PUT /api/admin/users/[id]/revoke-ban
 * Manually revoke a user's ban (6-month late return ban or compensation ban)
 * Admin only
 */
export async function PUT(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const session = await getServerSession(authOptions);

        // Verify admin access
        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
        }

        const { id } = await context.params;

        // Get the user
        const user = await prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!user.isBanned) {
            return NextResponse.json({ error: 'User is not currently banned' }, { status: 400 });
        }

        // Revoke the ban
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                isBanned: false,
                bannedUntil: null,
            },
            select: {
                id: true,
                name: true,
                email: true,
                isBanned: true,
                bannedUntil: true,
            },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'REVOKE_BAN',
                entityType: 'User',
                entityId: id,
                changes: JSON.stringify({
                    action: 'Manual ban revocation',
                    targetUser: user.name,
                    targetEmail: user.email,
                    previousBanUntil: user.bannedUntil,
                }),
            },
        });

        return NextResponse.json({
            message: 'Ban revoked successfully',
            user: updatedUser,
        });
    } catch (error) {
        console.error('Error revoking ban:', error);
        return NextResponse.json(
            { error: 'Failed to revoke ban' },
            { status: 500 }
        );
    }
}
