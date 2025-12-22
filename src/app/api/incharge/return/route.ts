import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import {
    sendEmail,
    lateReturnBanEmailTemplate,
    damageCompensationEmailTemplate,
} from '@/lib/email';

/**
 * POST /api/incharge/return
 * Process item return with late ban and damage compensation logic
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
        const {
            issueRecordId,
            returnCondition,
            damageRemarks,
            isPendingReplacement,
        } = body;

        if (!issueRecordId || !returnCondition) {
            return NextResponse.json(
                { error: 'Issue record ID and return condition are required' },
                { status: 400 }
            );
        }

        // Validate damage remarks if condition is DAMAGED or UNDER_REPAIR
        if (
            (returnCondition === 'DAMAGED' || returnCondition === 'UNDER_REPAIR') &&
            !damageRemarks
        ) {
            return NextResponse.json(
                { error: 'Damage remarks are required for damaged items' },
                { status: 400 }
            );
        }

        // Get the issue record
        const issueRecord = await prisma.issueRecord.findUnique({
            where: { id: issueRecordId },
            include: {
                item: {
                    include: {
                        department: true,
                        category: true,
                    },
                },
                user: true,
                request: true,
            },
        });

        if (!issueRecord) {
            return NextResponse.json(
                { error: 'Issue record not found' },
                { status: 404 }
            );
        }

        // Verify incharge has access to this department (admins bypass this)
        if (user.role === 'INCHARGE') {
            const hasAccess = user.departments.some(
                (dept: { id: string }) => dept.id === issueRecord.departmentId
            );
            if (!hasAccess) {
                return NextResponse.json(
                    { error: 'You do not have access to this department' },
                    { status: 403 }
                );
            }
        }

        // Verify not already returned
        if (issueRecord.actualReturnDate) {
            return NextResponse.json(
                { error: 'This item has already been returned' },
                { status: 400 }
            );
        }

        const now = new Date();
        const expectedReturnDate = new Date(issueRecord.expectedReturnDate);

        // Calculate if return is late
        const isLate = now > expectedReturnDate;
        const daysLate = isLate
            ? Math.ceil(
                (now.getTime() - expectedReturnDate.getTime()) / (1000 * 60 * 60 * 24)
            )
            : 0;

        // Calculate ban date if late (6 months from now)
        let bannedUntil: Date | null = null;
        if (isLate) {
            bannedUntil = new Date();
            bannedUntil.setMonth(bannedUntil.getMonth() + 6);
        }

        // Determine item status and condition based on return condition
        let newItemStatus = 'AVAILABLE';
        if (returnCondition === 'DAMAGED' && isPendingReplacement) {
            newItemStatus = 'PENDING_REPLACEMENT';
        } else if (returnCondition === 'UNDER_REPAIR') {
            newItemStatus = 'MAINTENANCE';
        } else if (returnCondition === 'DAMAGED') {
            newItemStatus = 'AVAILABLE'; // Still available but condition is DAMAGED
        }

        // Process return in a transaction
        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Update issue record
            const updatedRecord = await tx.issueRecord.update({
                where: { id: issueRecordId },
                data: {
                    actualReturnDate: now,
                    returnCondition: returnCondition as any,
                    damageRemarks: damageRemarks || null,
                    isPendingReplacement: isPendingReplacement || false,
                },
                include: {
                    item: true,
                    user: true,
                    department: true,
                },
            });

            // Update item status and condition
            await tx.item.update({
                where: { id: issueRecord.itemId },
                data: {
                    status: newItemStatus as any,
                    condition: returnCondition as any,
                },
            });

            // Apply late return ban or damage compensation ban
            if (isLate) {
                // Late return: 6-month ban
                await tx.user.update({
                    where: { id: issueRecord.userId },
                    data: {
                        isBanned: true,
                        bannedUntil: bannedUntil,
                    },
                });
            } else if (isPendingReplacement) {
                // Damage compensation: indefinite ban
                await tx.user.update({
                    where: { id: issueRecord.userId },
                    data: {
                        isBanned: true,
                        bannedUntil: null, // Null means indefinite until admin lifts it
                    },
                });
            }

            return updatedRecord;
        });

        // Send appropriate email notifications
        if (isLate && bannedUntil) {
            // Send late return ban email
            const emailTemplate = lateReturnBanEmailTemplate({
                userName: issueRecord.user.name,
                itemName: issueRecord.item.name,
                itemId: issueRecord.item.manualId,
                daysLate,
                bannedUntil: bannedUntil.toLocaleDateString(),
            });

            sendEmail({
                to: issueRecord.user.email,
                subject: emailTemplate.subject,
                html: emailTemplate.html,
            }).catch((error) =>
                console.error('Failed to send late return ban email:', error)
            );
        }

        if (isPendingReplacement) {
            // Send damage compensation email
            const emailTemplate = damageCompensationEmailTemplate({
                userName: issueRecord.user.name,
                itemName: issueRecord.item.name,
                itemId: issueRecord.item.manualId,
                damageRemarks: damageRemarks || 'No remarks provided',
                inchargeName: user.name,
                inchargeEmail: user.email,
            });

            sendEmail({
                to: issueRecord.user.email,
                subject: emailTemplate.subject,
                html: emailTemplate.html,
            }).catch((error) =>
                console.error('Failed to send damage compensation email:', error)
            );
        }

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'RETURN',
                entityType: 'IssueRecord',
                entityId: result.id,
                changes: JSON.stringify({
                    itemName: issueRecord.item.name,
                    itemId: issueRecord.item.manualId,
                    returnedBy: issueRecord.user.name,
                    returnCondition,
                    isLate,
                    daysLate,
                    isPendingReplacement,
                }),
            },
        });

        return NextResponse.json({
            message: 'Item returned successfully',
            issueRecord: result,
            warnings: {
                lateBan: isLate
                    ? `User banned until ${bannedUntil?.toLocaleDateString()}`
                    : null,
                compensationBan: isPendingReplacement
                    ? 'User banned pending compensation'
                    : null,
            },
        });
    } catch (error) {
        console.error('Error processing return:', error);
        return NextResponse.json(
            { error: 'Failed to process return' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/incharge/return
 * Get currently issued items for the department
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

        // Get issued items that haven't been returned
        const issueRecords = await prisma.issueRecord.findMany({
            where: {
                actualReturnDate: null, // Not yet returned
                ...(departmentIds && {
                    departmentId: { in: departmentIds },
                }),
                ...(search && {
                    OR: [
                        { user: { name: { contains: search, mode: 'insensitive' } } },
                        { item: { name: { contains: search, mode: 'insensitive' } } },
                        { item: { manualId: { contains: search, mode: 'insensitive' } } },
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
                request: true,
            },
            orderBy: {
                expectedReturnDate: 'asc',
            },
        });

        // Calculate overdue status for each record
        const now = new Date();
        const recordsWithStatus = issueRecords.map((record: any) => {
            const expectedDate = new Date(record.expectedReturnDate);
            const isOverdue = now > expectedDate;
            const daysOverdue = isOverdue
                ? Math.ceil((now.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24))
                : 0;

            return {
                ...record,
                isOverdue,
                daysOverdue,
            };
        });

        return NextResponse.json(recordsWithStatus);
    } catch (error) {
        console.error('Error fetching issued items:', error);
        return NextResponse.json(
            { error: 'Failed to fetch issued items' },
            { status: 500 }
        );
    }
}

