import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/incharge/stats
 * Get statistics for incharge dashboard
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

        // Get department IDs for this incharge (admins  see all)
        const departmentIds =
            user.role === 'ADMIN'
                ? undefined
                : user.departments.map((dept: { id: string }) => dept.id);

        // Count pending approval requests
        const pendingApprovals = await prisma.issueRequest.count({
            where: {
                status: 'PENDING',
                ...(departmentIds && {
                    item: {
                        departmentId: { in: departmentIds },
                    },
                }),
            },
        });

        // Count approved requests ready for issuance
        const readyForIssuance = await prisma.issueRequest.count({
            where: {
                status: 'APPROVED',
                issueRecord: null,
                ...(departmentIds && {
                    item: {
                        departmentId: { in: departmentIds },
                    },
                }),
            },
        });

        // Count currently issued items
        const currentlyIssued = await prisma.issueRecord.count({
            where: {
                actualReturnDate: null,
                ...(departmentIds && {
                    departmentId: { in: departmentIds },
                }),
            },
        });

        // Count overdue items
        const now = new Date();
        const allIssuedRecords = await prisma.issueRecord.findMany({
            where: {
                actualReturnDate: null,
                ...(departmentIds && {
                    departmentId: { in: departmentIds },
                }),
            },
            select: {
                expectedReturnDate: true,
            },
        });

        const overdueCount = allIssuedRecords.filter(
            (record: any) => new Date(record.expectedReturnDate) < now
        ).length;

        return NextResponse.json({
            pendingApprovals,
            readyForIssuance,
            currentlyIssued,
            overdueCount,
        });
    } catch (error) {
        console.error('Error fetching incharge stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch statistics' },
            { status: 500 }
        );
    }
}

