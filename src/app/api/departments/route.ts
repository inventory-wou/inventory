import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/departments
 * Get all departments with item counts
 * Accessible to authenticated users (Faculty, Staff, Students)
 */
export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized. Please login.' },
                { status: 401 }
            );
        }

        // Fetch all departments with item counts
        const departments = await prisma.department.findMany({
            select: {
                id: true,
                name: true,
                description: true,
                code: true,
                _count: {
                    select: {
                        items: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        // Format response
        const formattedDepartments = departments.map(dept => ({
            id: dept.id,
            name: dept.name,
            description: dept.description,
            code: dept.code,
            itemCount: dept._count.items
        }));

        return NextResponse.json({
            departments: formattedDepartments
        });

    } catch (error) {
        console.error('Error fetching departments:', error);
        return NextResponse.json(
            { error: 'Failed to fetch departments' },
            { status: 500 }
        );
    }
}
