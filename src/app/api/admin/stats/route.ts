import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/stats
 * Get comprehensive statistics for admin dashboard
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is an admin
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        });

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get all statistics in parallel for better performance
        const [
            totalUsers,
            approvedUsers,
            pendingUsers,
            bannedUsers,
            totalItems,
            availableItems,
            issuedItems,
            maintenanceItems,
            totalDepartments,
            totalCategories,
            pendingRequests,
            allIssuedRecords,
            recentActivity,
        ] = await Promise.all([
            // User statistics
            prisma.user.count(),
            prisma.user.count({ where: { isApproved: true, isActive: true } }),
            prisma.user.count({ where: { isApproved: false } }),
            prisma.user.count({ where: { isBanned: true } }),

            // Item statistics
            prisma.item.count(),
            prisma.item.count({ where: { status: 'AVAILABLE' } }),
            prisma.item.count({ where: { status: 'ISSUED' } }),
            prisma.item.count({ where: { status: 'MAINTENANCE' } }),

            // Department and Category counts
            prisma.department.count(),
            prisma.category.count(),

            // Request statistics
            prisma.issueRequest.count({ where: { status: 'PENDING' } }),

            // Get issued records for overdue calculation
            prisma.issueRecord.findMany({
                where: { actualReturnDate: null },
                select: { expectedReturnDate: true },
            }),

            // Recent activity from audit logs
            prisma.auditLog.findMany({
                take: 10,
                orderBy: { timestamp: 'desc' },
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                },
            }),
        ]);

        // Calculate overdue items
        const now = new Date();
        const overdueCount = allIssuedRecords.filter(
            (record) => new Date(record.expectedReturnDate) < now
        ).length;

        return NextResponse.json({
            users: {
                total: totalUsers,
                approved: approvedUsers,
                pending: pendingUsers,
                banned: bannedUsers,
            },
            items: {
                total: totalItems,
                available: availableItems,
                issued: issuedItems,
                maintenance: maintenanceItems,
            },
            departments: totalDepartments,
            categories: totalCategories,
            requests: {
                pending: pendingRequests,
            },
            overdue: overdueCount,
            recentActivity: recentActivity.map((log) => ({
                id: log.id,
                action: log.action,
                entityType: log.entityType,
                userName: log.user.name,
                timestamp: log.timestamp,
            })),
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch statistics' },
            { status: 500 }
        );
    }
}
