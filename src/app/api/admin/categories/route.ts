import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/utils';

/**
 * GET /api/admin/categories
 * Fetch all categories with item counts
 * Admin and Incharge access
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['ADMIN', 'INCHARGE'].includes(session.user.role)) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';

        // Build where clause
        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Fetch categories with item counts
        const categories = await prisma.category.findMany({
            where,
            include: {
                _count: {
                    select: { items: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ categories });

    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json(
            { error: 'Failed to fetch categories' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/categories
 * Create a new category
 * Admin and Incharge access
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['ADMIN', 'INCHARGE'].includes(session.user.role)) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const {
            name,
            description,
            maxBorrowDuration,
            requiresApproval,
            visibleToStudents,
            visibleToStaff
        } = body;

        // Validate required fields
        if (!name) {
            return NextResponse.json(
                { error: 'Category name is required' },
                { status: 400 }
            );
        }

        // Validate name length
        if (name.length < 3 || name.length > 100) {
            return NextResponse.json(
                { error: 'Category name must be 3-100 characters' },
                { status: 400 }
            );
        }

        // Check for duplicate name
        const existing = await prisma.category.findUnique({
            where: { name }
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Category name already exists' },
                { status: 400 }
            );
        }

        // Validate maxBorrowDuration
        const borrowDuration = maxBorrowDuration || 7;
        if (borrowDuration < 1 || borrowDuration > 365) {
            return NextResponse.json(
                { error: 'Max borrow duration must be between 1 and 365 days' },
                { status: 400 }
            );
        }

        // Create category
        const category = await prisma.category.create({
            data: {
                name,
                description: description || null,
                maxBorrowDuration: borrowDuration,
                requiresApproval: requiresApproval !== undefined ? requiresApproval : false,
                visibleToStudents: visibleToStudents !== undefined ? visibleToStudents : true,
                visibleToStaff: visibleToStaff !== undefined ? visibleToStaff : true
            }
        });

        // Log audit trail
        await logAudit({
            userId: session.user.id,
            action: 'CATEGORY_CREATED',
            entityType: 'Category',
            entityId: category.id,
            changes: { name, maxBorrowDuration: borrowDuration },
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        });

        return NextResponse.json({
            message: 'Category created successfully',
            category
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating category:', error);
        return NextResponse.json(
            { error: 'Failed to create category' },
            { status: 500 }
        );
    }
}
