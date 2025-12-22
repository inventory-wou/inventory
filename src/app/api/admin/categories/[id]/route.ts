import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/utils';

/**
 * PUT /api/admin/categories/[id]
 * Update a category
 * Admin and Incharge access
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['ADMIN', 'INCHARGE'].includes(session.user.role)) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const { id } = await params;
        const body = await request.json();
        const {
            name,
            description,
            maxBorrowDuration,
            requiresApproval,
            visibleToStudents,
            visibleToStaff
        } = body;

        // Check if category exists
        const category = await prisma.category.findUnique({
            where: { id }
        });

        if (!category) {
            return NextResponse.json(
                { error: 'Category not found' },
                { status: 404 }
            );
        }

        // Validate name if provided
        if (name) {
            if (name.length < 3 || name.length > 100) {
                return NextResponse.json(
                    { error: 'Category name must be 3-100 characters' },
                    { status: 400 }
                );
            }

            // Check for duplicate name (excluding current category)
            const existing = await prisma.category.findFirst({
                where: {
                    name,
                    NOT: { id }
                }
            });

            if (existing) {
                return NextResponse.json(
                    { error: 'Category name already exists' },
                    { status: 400 }
                );
            }
        }

        // Validate maxBorrowDuration if provided
        if (maxBorrowDuration !== undefined) {
            if (maxBorrowDuration < 1 || maxBorrowDuration > 365) {
                return NextResponse.json(
                    { error: 'Max borrow duration must be between 1 and 365 days' },
                    { status: 400 }
                );
            }
        }

        // Update category
        const updatedCategory = await prisma.category.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(maxBorrowDuration !== undefined && { maxBorrowDuration }),
                ...(requiresApproval !== undefined && { requiresApproval }),
                ...(visibleToStudents !== undefined && { visibleToStudents }),
                ...(visibleToStaff !== undefined && { visibleToStaff })
            }
        });

        // Log audit trail
        await logAudit({
            userId: session.user.id,
            action: 'CATEGORY_UPDATED',
            entityType: 'Category',
            entityId: id,
            changes: { name, maxBorrowDuration, requiresApproval, visibleToStudents, visibleToStaff },
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        });

        return NextResponse.json({
            message: 'Category updated successfully',
            category: updatedCategory
        });

    } catch (error) {
        console.error('Error updating category:', error);
        return NextResponse.json(
            { error: 'Failed to update category' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/categories/[id]
 * Delete a category
 * Admin and Incharge access
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['ADMIN', 'INCHARGE'].includes(session.user.role)) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const { id } = await params;

        // Check if category exists
        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { items: true }
                }
            }
        });

        if (!category) {
            return NextResponse.json(
                { error: 'Category not found' },
                { status: 404 }
            );
        }

        // Check if category has items
        if (category._count.items > 0) {
            return NextResponse.json(
                { error: `Cannot delete category with ${category._count.items} items. Please reassign or remove items first.` },
                { status: 400 }
            );
        }

        // Delete category
        await prisma.category.delete({
            where: { id }
        });

        // Log audit trail
        await logAudit({
            userId: session.user.id,
            action: 'CATEGORY_DELETED',
            entityType: 'Category',
            entityId: id,
            changes: { name: category.name },
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        });

        return NextResponse.json({
            message: 'Category deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting category:', error);
        return NextResponse.json(
            { error: 'Failed to delete category' },
            { status: 500 }
        );
    }
}
