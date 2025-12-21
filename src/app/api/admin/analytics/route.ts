import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/analytics
 * Get aggregated analytics data for charts and visualizations
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

        // Get department-wise item counts
        const departments = await prisma.department.findMany({
            select: {
                id: true,
                name: true,
                code: true,
            },
        });

        const departmentStats = await Promise.all(
            departments.map(async (dept) => {
                const [total, available, issued] = await Promise.all([
                    prisma.item.count({ where: { departmentId: dept.id } }),
                    prisma.item.count({ where: { departmentId: dept.id, status: 'AVAILABLE' } }),
                    prisma.item.count({ where: { departmentId: dept.id, status: 'ISSUED' } }),
                ]);

                return {
                    name: dept.name,
                    code: dept.code,
                    total,
                    available,
                    issued,
                };
            })
        );

        // Get category-wise distribution
        const categories = await prisma.category.findMany({
            select: {
                id: true,
                name: true,
            },
        });

        const categoryStats = await Promise.all(
            categories.map(async (cat) => {
                const count = await prisma.item.count({ where: { categoryId: cat.id } });
                return {
                    name: cat.name,
                    count,
                };
            })
        );

        // Get item condition breakdown
        const conditionStats = await Promise.all([
            prisma.item.count({ where: { condition: 'NEW' } }),
            prisma.item.count({ where: { condition: 'GOOD' } }),
            prisma.item.count({ where: { condition: 'FAIR' } }),
            prisma.item.count({ where: { condition: 'DAMAGED' } }),
            prisma.item.count({ where: { condition: 'UNDER_REPAIR' } }),
        ]);

        const conditionData = [
            { name: 'New', count: conditionStats[0] },
            { name: 'Good', count: conditionStats[1] },
            { name: 'Fair', count: conditionStats[2] },
            { name: 'Damaged', count: conditionStats[3] },
            { name: 'Under Repair', count: conditionStats[4] },
        ];

        // Get monthly issue trends (last 12 months)
        const monthlyTrends = [];
        const now = new Date();

        for (let i = 11; i >= 0; i--) {
            const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

            const [issued, returned] = await Promise.all([
                prisma.issueRecord.count({
                    where: {
                        issueDate: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                }),
                prisma.issueRecord.count({
                    where: {
                        actualReturnDate: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                }),
            ]);

            monthlyTrends.push({
                month: startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                issued,
                returned,
            });
        }

        return NextResponse.json({
            departmentStats,
            categoryStats,
            conditionData,
            monthlyTrends,
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}
