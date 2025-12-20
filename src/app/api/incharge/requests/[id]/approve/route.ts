import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { sendEmail, requestStatusEmailTemplate } from '@/lib/email';

interface RouteContext {
    params: Promise<{ id: string }>;
}

/**
 * PUT /api/incharge/requests/[id]/approve
 * Approve a pending request
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
        const { collectionInstructions } = body;

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
                { error: 'Only pending requests can be approved' },
                { status: 400 }
            );
        }

        // Calculate expected return date
        const expectedReturnDate = new Date();
        expectedReturnDate.setDate(
            expectedReturnDate.getDate() + issueRequest.requestedDays
        );

        // Update request
        const updatedRequest = await prisma.issueRequest.update({
            where: { id },
            data: {
                status: 'APPROVED',
                approvedBy: user.id,
                approvalDate: new Date(),
                remarks: collectionInstructions,
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

        // Send approval email to user
        const emailTemplate = requestStatusEmailTemplate({
            userName: issueRequest.user.name,
            itemName: issueRequest.item.name,
            itemId: issueRequest.item.manualId,
            status: 'approved',
            expectedReturnDate: expectedReturnDate.toLocaleDateString(),
            collectionInstructions:
                collectionInstructions ||
                'Please collect the item from the lab during working hours.',
        });

        sendEmail({
            to: issueRequest.user.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
        }).catch((error) =>
            console.error('Failed to send approval email:', error)
        );

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'APPROVE',
                entityType: 'IssueRequest',
                entityId: id,
                changes: JSON.stringify({
                    status: 'APPROVED',
                    itemName: issueRequest.item.name,
                    requester: issueRequest.user.name,
                }),
            },
        });

        return NextResponse.json({
            message: 'Request approved successfully',
            request: updatedRequest,
        });
    } catch (error) {
        console.error('Error approving request:', error);
        return NextResponse.json(
            { error: 'Failed to approve request' },
            { status: 500 }
        );
    }
}
