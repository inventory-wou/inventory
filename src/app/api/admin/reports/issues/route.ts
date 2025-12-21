import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { generateIssueHistoryExcel } from '@/lib/reports';

/**
 * GET /api/admin/reports/issues
 * Generate issue history report with optional filters
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
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const includeReturned = searchParams.get('includeReturned') !== 'false';

        // Build where clause based on filters
        const where: any = {};

        if (departmentId) {
            where.departmentId = departmentId;
        }

        if (startDate && endDate) {
            where.issueDate = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }

        if (!includeReturned) {
            where.actualReturnDate = null;
        }

        // Fetch issue records with filters
        const records = await prisma.issueRecord.findMany({
            where,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
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
                issueDate: 'desc',
            },
        });

        // Generate Excel file
        const excelBuffer = await generateIssueHistoryExcel(records);

        // Generate filename with timestamp
        const now = new Date();
        const filename = `issue_history_${now.toISOString().split('T')[0]}.xlsx`;

        // Return file as downloadable attachment
        return new NextResponse(new Uint8Array(excelBuffer), {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Error generating issue history report:', error);
        return NextResponse.json(
            { error: 'Failed to generate report' },
            { status: 500 }
        );
    }
}
