import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateInventoryExcel } from '@/lib/reports';

/**
 * GET /api/admin/reports/inventory
 * Generate inventory report with optional filters
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

        // Get filter parameters from URL
        const searchParams = request.nextUrl.searchParams;
        const departmentId = searchParams.get('departmentId');
        const categoryId = searchParams.get('categoryId');
        const status = searchParams.get('status');
        const condition = searchParams.get('condition');

        // Build where clause based on filters
        const where: any = {};

        if (departmentId) {
            where.departmentId = departmentId;
        }

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (status) {
            where.status = status;
        }

        if (condition) {
            where.condition = condition;
        }

        // Fetch items with filters
        const items = await prisma.item.findMany({
            where,
            include: {
                category: {
                    select: { name: true },
                },
                department: {
                    select: { name: true },
                },
            },
            orderBy: {
                manualId: 'asc',
            },
        });

        // Generate Excel file
        const excelBuffer = await generateInventoryExcel(items);

        // Generate filename with timestamp
        const now = new Date();
        const filename = `inventory_report_${now.toISOString().split('T')[0]}.xlsx`;

        // Return file as downloadable attachment
        return new NextResponse(new Uint8Array(excelBuffer), {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Error generating inventory report:', error);
        return NextResponse.json(
            { error: 'Failed to generate report' },
            { status: 500 }
        );
    }
}

