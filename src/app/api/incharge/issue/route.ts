import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * POST /api/incharge/issue
 * Issue an approved item to a user
 */
export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const { requestId, isReturnable = true, projectName } = body;

        if (!requestId) {
            return NextResponse.json(
                { error: 'Request ID is required' },
                { status: 400 }
            );
        }

        // Validate non-returnable items requirements
        if (!isReturnable) {
            if (!projectName) {
                return NextResponse.json(
                    { error: 'Project Name is required for non-returnable items' },
                    { status: 400 }
                );
            }
        }

        // Get the request
        const issueRequest = await prisma.issueRequest.findUnique({
            where: { id: requestId },
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

        // Verify request is approved
        if (issueRequest.status !== 'APPROVED') {
            return NextResponse.json(
                { error: 'Only approved requests can be issued' },
                { status: 400 }
            );
        }

        // Check if item is still available
        if (issueRequest.item.status !== 'AVAILABLE') {
            return NextResponse.json(
                { error: 'Item is not available for issuance' },
                { status: 400 }
            );
        }

        // Check if already issued
        const existingRecord = await prisma.issueRecord.findUnique({
            where: { requestId: requestId },
        });

        if (existingRecord) {
            return NextResponse.json(
                { error: 'This request has already been issued' },
                { status: 400 }
            );
        }

        // Calculate expected return date
        const expectedReturnDate = new Date();
        expectedReturnDate.setDate(
            expectedReturnDate.getDate() + issueRequest.requestedDays
        );

        // Create issue record and update item status in a transaction
        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Create issue record
            const issueRecord = await tx.issueRecord.create({
                data: {
                    requestId: requestId,
                    itemId: issueRequest.itemId,
                    userId: issueRequest.userId,
                    departmentId: issueRequest.item.departmentId,
                    issuedBy: user.id,
                    issueDate: new Date(),
                    expectedReturnDate: expectedReturnDate,
                    isReturnable: isReturnable,
                    projectName: isReturnable ? null : projectName,
                    projectIncharge: isReturnable ? null : issueRequest.user.name,
                },
                include: {
                    item: true,
                    user: true,
                    department: true,
                },
            });

            // Update item status to ISSUED
            await tx.item.update({
                where: { id: issueRequest.itemId },
                data: { status: 'ISSUED' },
            });

            return issueRecord;
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'ISSUE',
                entityType: 'IssueRecord',
                entityId: result.id,
                changes: JSON.stringify({
                    itemName: issueRequest.item.name,
                    itemId: issueRequest.item.manualId,
                    issuedTo: issueRequest.user.name,
                    expectedReturnDate: expectedReturnDate.toISOString(),
                }),
            },
        });

        return NextResponse.json({
            message: 'Item issued successfully',
            issueRecord: result,
        });
    } catch (error) {
        console.error('Error issuing item:', error);
        return NextResponse.json(
            { error: 'Failed to issue item' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/incharge/issue
 * Get approved requests ready for issuance
 */
export async function GET(request: NextRequest) {
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

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');

        // Get department IDs for this incharge (admins see all)
        const departmentIds =
            user.role === 'ADMIN'
                ? undefined
                : user.departments.map((dept: { id: string }) => dept.id);

        // Get approved requests that haven't been issued yet
        const requests = await prisma.issueRequest.findMany({
            where: {
                status: 'APPROVED',
                issueRecord: null, // Not yet issued
                ...(departmentIds && {
                    item: {
                        departmentId: { in: departmentIds },
                    },
                }),
                ...(search && {
                    OR: [
                        { user: { name: { contains: search, mode: 'insensitive' } } },
                        { item: { name: { contains: search, mode: 'insensitive' } } },
                        { item: { manualId: { contains: search, mode: 'insensitive' } } },
                        {
                            item: { serialNumber: { contains: search, mode: 'insensitive' } },
                        },
                    ],
                }),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        studentId: true,
                        employeeId: true,
                        phone: true,
                    },
                },
                item: {
                    include: {
                        category: true,
                        department: true,
                    },
                },
            },
            orderBy: {
                approvalDate: 'asc',
            },
        });

        return NextResponse.json(requests);
    } catch (error) {
        console.error('Error fetching approved requests:', error);
        return NextResponse.json(
            { error: 'Failed to fetch approved requests' },
            { status: 500 }
        );
    }
}

