import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/incharge/requests
 * Get all requests for incharge's departments
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
        const status = searchParams.get('status');
        const search = searchParams.get('search');

        // Get department IDs for this incharge (admins see all)
        const departmentIds =
            user.role === 'ADMIN'
                ? undefined
                : user.departments.map((dept: { id: string }) => dept.id);

        const requests = await prisma.issueRequest.findMany({
            where: {
                ...(departmentIds && {
                    item: {
                        departmentId: { in: departmentIds },
                    },
                }),
                ...(status && { status: status as any }),
                ...(search && {
                    OR: [
                        { user: { name: { contains: search, mode: 'insensitive' } } },
                        { item: { name: { contains: search, mode: 'insensitive' } } },
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
                requestDate: 'desc',
            },
        });

        return NextResponse.json(requests);
    } catch (error) {
        console.error('Error fetching requests:', error);
        return NextResponse.json(
            { error: 'Failed to fetch requests' },
            { status: 500 }
        );
    }
}
