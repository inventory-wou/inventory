import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail, requestStatusEmailTemplate } from '@/lib/email';

interface RouteContext {
    params: Promise<{ id: string }>;
}

/**
 * PUT /api/incharge/requests/[id]/reject
 * Reject a pending request
 */
export async function PUT(
    request: NextRequest,
    context: RouteContext
) {
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

        if (!user || (user.role !== 'INCHARGE' && user.role !== 'ADMIN')) {
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

        // Get the request
        const issueRequest = await prisma.issueRequest.findUnique({
            where: { id },
            include: {
                item: {
                    include: {
                        department: true,
                        category: true,
                    },
                },
                user: true,
            },
        });

        if (!issueRequest) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        // Verify incharge has access to this department (admins bypass this)
        if (user.role === 'INCHARGE') {
            const hasAccess = user.departments.some(
                (dept: { id: string }) => dept.id === issueRequest.item.departmentId
            );
            if (!hasAccess) {
                return NextResponse.json(
                    { error: 'You do not have access to this department' },
                    { status: 403 }
                );
            }
        }

        // Verify request is pending
        if (issueRequest.status !== 'PENDING') {
            return NextResponse.json(
                { error: 'Only pending requests can be rejected' },
                { status: 400 }
            );
        }

        // Update request
        const updatedRequest = await prisma.issueRequest.update({
            where: { id },
            data: {
                status: 'REJECTED',
                rejectionReason,
                approvedBy: user.id, // Track who rejected it
                approvalDate: new Date(),
            },
            include: {
                item: {
                    include: {
                        category: true,
                        department: true,
                    },
                },
                user: true,
            },
        });

        // Send rejection email to user
        const emailTemplate = requestStatusEmailTemplate({
            userName: issueRequest.user.name,
            itemName: issueRequest.item.name,
            itemId: issueRequest.item.manualId,
            status: 'rejected',
            reason: rejectionReason,
        });

        sendEmail({
            to: issueRequest.user.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
        }).catch((error) =>
            console.error('Failed to send rejection email:', error)
        );

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'REJECT',
                entityType: 'IssueRequest',
                entityId: id,
                changes: JSON.stringify({
                    status: 'REJECTED',
                    reason: rejectionReason,
                    itemName: issueRequest.item.name,
                    requester: issueRequest.user.name,
                }),
            },
        });

        return NextResponse.json({
            message: 'Request rejected successfully',
            request: updatedRequest,
        });
    } catch (error) {
        console.error('Error rejecting request:', error);
        return NextResponse.json(
            { error: 'Failed to reject request' },
            { status: 500 }
        );
    }
}
