import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/departments/[id]/items
 * Get all items in a department
 * Role-based filtering: Students see only student-visible items
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized. Please login.' },
                { status: 401 }
            );
        }

        const resolvedParams = await params;
        const departmentId = resolvedParams.id;

        // Get department info
        const department = await prisma.department.findUnique({
            where: { id: departmentId },
            select: {
                id: true,
                name: true,
                code: true
            }
        });

        if (!department) {
            return NextResponse.json(
                { error: 'Department not found' },
                { status: 404 }
            );
        }

        // Build where clause based on user role
        const whereClause: any = {
            departmentId: departmentId
        };

        // Students can only see items from student-visible categories
        if (session.user.role === 'STUDENT') {
            whereClause.category = {
                visibleToStudents: true
            };
        }
        // Faculty and Staff can see all items

        // Fetch items
        const items = await prisma.item.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                description: true,
                serialNumber: true,
                status: true,
                category: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json({
            department,
            items
        });

    } catch (error) {
        console.error('Error fetching department items:', error);
        return NextResponse.json(
            { error: 'Failed to fetch items' },
            { status: 500 }
        );
    }
}
