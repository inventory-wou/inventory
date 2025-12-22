import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/users
 * Fetch all users with optional filters, search, and pagination
 * Admin only
 */
export async function GET(request: NextRequest) {
    try {
        // Check authentication and admin role
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 403 }
            );
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const role = searchParams.get('role') || '';
        const isApproved = searchParams.get('isApproved');
        const isActive = searchParams.get('isActive');
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        // Build where clause for filters
        const where: any = {
            AND: []
        };

        // Search filter (name or email)
        if (search) {
            where.AND.push({
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { studentId: { contains: search, mode: 'insensitive' } },
                    { employeeId: { contains: search, mode: 'insensitive' } }
                ]
            });
        }

        // Role filter
        if (role) {
            where.AND.push({ role });
        }

        // Approval status filter
        if (isApproved !== null && isApproved !== undefined && isApproved !== '') {
            where.AND.push({ isApproved: isApproved === 'true' });
        }

        // Active status filter
        if (isActive !== null && isActive !== undefined && isActive !== '') {
            where.AND.push({ isActive: isActive === 'true' });
        }

        // Clean up empty AND array
        if (where.AND.length === 0) {
            delete where.AND;
        }

        // Get total count for pagination
        const totalCount = await prisma.user.count({ where });

        // Fetch users with pagination
        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isApproved: true,
                isActive: true,
                isBanned: true,
                bannedUntil: true,
                phone: true,
                studentId: true,
                employeeId: true,
                createdAt: true,
                updatedAt: true,
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { [sortBy]: sortOrder }
        });

        // Get pending users count
        const pendingCount = await prisma.user.count({
            where: { isApproved: false }
        });

        // Calculate total pages
        const totalPages = Math.ceil(totalCount / limit);

        return NextResponse.json({
            users,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages,
                hasMore: page < totalPages
            },
            stats: {
                pendingCount
            }
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/users
 * Bulk approve users
 * Admin only
 */
export async function POST(request: NextRequest) {
    try {
        // Check authentication and admin role
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { userIds, action } = body;

        // Validate input
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json(
                { error: 'User IDs array is required' },
                { status: 400 }
            );
        }

        if (action !== 'approve') {
            return NextResponse.json(
                { error: 'Invalid action. Only "approve" is supported' },
                { status: 400 }
            );
        }

        // Bulk approve users in a transaction
        const result = await prisma.user.updateMany({
            where: {
                id: { in: userIds },
                isApproved: false // Only approve pending users
            },
            data: {
                isApproved: true,
                isActive: true
            }
        });

        return NextResponse.json({
            success: true,
            message: `Successfully approved ${result.count} user(s)`,
            count: result.count
        });

    } catch (error) {
        console.error('Error bulk approving users:', error);
        return NextResponse.json(
            { error: 'Failed to approve users' },
            { status: 500 }
        );
    }
}
