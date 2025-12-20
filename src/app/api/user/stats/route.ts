import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/user/stats
 * Get statistics for user dashboard
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Get user with ban status
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                isBanned: true,
                bannedUntil: true,
            },
        });

        // Count pending requests
        const pendingRequests = await prisma.issueRequest.count({
            where: {
                userId,
                status: 'PENDING',
            },
        });

        // Count approved requests (not yet issued)
        const approvedRequests = await prisma.issueRequest.count({
            where: {
                userId,
                status: 'APPROVED',
                issueRecord: null,
            },
        });

        // Count currently issued items
        const currentlyIssued = await prisma.issueRecord.count({
            where: {
                userId,
                actualReturnDate: null,
            },
        });

        // Get issued items with due dates
        const issuedItems = await prisma.issueRecord.findMany({
            where: {
                userId,
                actualReturnDate: null,
            },
            include: {
                item: {
                    select: {
                        name: true,
                        manualId: true,
                    },
                },
            },
            orderBy: {
                expectedReturnDate: 'asc',
            },
        });

        // Calculate overdue count
        const now = new Date();
        const overdueCount = issuedItems.filter(
            (record: any) => new Date(record.expectedReturnDate) < now
        ).length;

        // Get upcoming due date (next item to be returned)
        const upcomingDue = issuedItems.length > 0 ? issuedItems[0].expectedReturnDate : null;

        return NextResponse.json({
            pendingRequests,
            approvedRequests,
            currentlyIssued,
            overdueCount,
            upcomingDue,
            isBanned: user?.isBanned || false,
            bannedUntil: user?.bannedUntil,
        });
    } catch (error) {
        console.error('Error fetching user stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch statistics' },
            { status: 500 }
        );
    }
}
