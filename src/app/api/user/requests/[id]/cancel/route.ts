import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

interface RouteContext {
    params: Promise<{ id: string }>;
}

/**
 * PATCH /api/user/requests/[id]/cancel
 * Cancel a pending request
 */
export async function PATCH(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await context.params;

        // Get the request and verify ownership
        const issueRequest = await prisma.issueRequest.findUnique({
            where: { id },
            include: {
                item: true,
            },
        });

        if (!issueRequest) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        if (issueRequest.userId !== session.user.id) {
            return NextResponse.json(
                { error: 'You can only cancel your own requests' },
                { status: 403 }
            );
        }

        if (issueRequest.status !== 'PENDING') {
            return NextResponse.json(
                { error: 'Only pending requests can be cancelled' },
                { status: 400 }
            );
        }

        // Update request status to CANCELLED
        const updatedRequest = await prisma.issueRequest.update({
            where: { id },
            data: { status: 'CANCELLED' },
            include: {
                item: {
                    include: {
                        category: true,
                        department: true,
                    },
                },
            },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'UPDATE',
                entityType: 'IssueRequest',
                entityId: id,
                changes: JSON.stringify({
                    status: 'CANCELLED',
                    itemName: issueRequest.item.name,
                }),
            },
        });

        return NextResponse.json({
            message: 'Request cancelled successfully',
            request: updatedRequest,
        });
    } catch (error) {
        console.error('Error cancelling request:', error);
        return NextResponse.json(
            { error: 'Failed to cancel request' },
            { status: 500 }
        );
    }
}
