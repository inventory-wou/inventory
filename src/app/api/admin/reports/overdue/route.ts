import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { generateOverdueExcel } from '@/lib/reports';

/**
 * GET /api/admin/reports/overdue
 * Generate overdue items report
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

        // Build where clause for overdue items
        const where: any = {
            actualReturnDate: null, // Not yet returned
        };

        if (departmentId) {
            where.departmentId = departmentId;
        }

        // Fetch all active issue records
        const records = await prisma.issueRecord.findMany({
            where,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                item: {
                    select: {
                        name: true,
                        manualId: true,
                    },
                },
                department: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                expectedReturnDate: 'asc',
            },
        });

        // Filter for overdue items only
        const now = new Date();
        const overdueRecords = records.filter(
            (record) => new Date(record.expectedReturnDate) < now
        );

        // Generate Excel file
        const excelBuffer = await generateOverdueExcel(overdueRecords);

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `overdue_items_${timestamp}.xlsx`;

        // Return file as downloadable attachment
        return new NextResponse(new Uint8Array(excelBuffer), {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Error generating overdue report:', error);
        return NextResponse.json(
            { error: 'Failed to generate report' },
            { status: 500 }
        );
    }
}
