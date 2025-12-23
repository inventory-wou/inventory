import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteContext = {
    params: Promise<{ id: string }>;
};

/**
 * PUT /api/incharge/transfer/requests/[id]/reject
 * Reject a transfer request
 */
export async function PUT(request: NextRequest, context: RouteContext) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is an incharge or admin
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                departments: true,
            },
        });

        if (!user || (user.role !== 'INCHARGE' && user.role !== 'ADMIN' && user.role !== 'PROCUREMENT')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await context.params;
        const body = await request.json();
        const { rejectionReason } = body;

        if (!rejectionReason) {
            return NextResponse.json(
                { error: 'Rejection reason is required' },
                { status: 400 }
            );
        }

        // Get the transfer request
        const transferRequest = await prisma.transferRequest.findUnique({
            where: { id },
            include: {
                item: true,
                fromDepartment: true,
                toDepartment: true,
                requestedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!transferRequest) {
            return NextResponse.json({ error: 'Transfer request not found' }, { status: 404 });
        }

        // Verify request is pending
        if (transferRequest.status !== 'PENDING') {
            return NextResponse.json(
                { error: 'Only pending requests can be rejected' },
                { status: 400 }
            );
        }

        // Verify incharge manages source department
        if (user.role === 'INCHARGE') {
            const hasAccess = user.departments.some(
                (dept: { id: string }) => dept.id === transferRequest.fromDepartmentId
            );
            if (!hasAccess) {
                return NextResponse.json(
                    { error: 'You do not have access to reject this transfer' },
                    { status: 403 }
                );
            }
        }

        // Update request status
        const updatedRequest = await prisma.transferRequest.update({
            where: { id },
            data: {
                status: 'REJECTED',
                approvedById: user.id,
                approvalDate: new Date(),
                rejectionReason,
            },
            include: {
                item: true,
                fromDepartment: true,
                toDepartment: true,
                requestedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'REJECT_TRANSFER',
                entityType: 'TransferRequest',
                entityId: id,
                changes: JSON.stringify({
                    itemName: transferRequest.item.name,
                    fromDepartment: transferRequest.fromDepartment.name,
                    toDepartment: transferRequest.toDepartment.name,
                    requester: transferRequest.requestedBy.name,
                    reason: rejectionReason,
                }),
            },
        });

        // TODO: Send rejection email

        return NextResponse.json({
            message: 'Transfer request rejected successfully',
            transferRequest: updatedRequest,
        });
    } catch (error) {
        console.error('Error rejecting transfer request:', error);
        return NextResponse.json(
            { error: 'Failed to reject transfer request' },
            { status: 500 }
        );
    }
}
