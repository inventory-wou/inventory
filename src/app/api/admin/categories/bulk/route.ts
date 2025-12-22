import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/utils';

interface BulkCategoryInput {
    name: string;
    description?: string;
    maxBorrowDuration?: number;
    requiresApproval?: boolean;
    visibleToStudents?: boolean;
    visibleToStaff?: boolean;
}

interface BulkCategoryError {
    index: number;
    name: string;
    error: string;
}

/**
 * POST /api/admin/categories/bulk
 * Create multiple categories at once
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
        const { categories } = body as { categories: BulkCategoryInput[] };

        // Validate input
        if (!categories || !Array.isArray(categories) || categories.length === 0) {
            return NextResponse.json(
                { error: 'Categories array is required and must not be empty' },
                { status: 400 }
            );
        }

        // Limit bulk creation to prevent abuse
        if (categories.length > 50) {
            return NextResponse.json(
                { error: 'Cannot create more than 50 categories at once' },
                { status: 400 }
            );
        }

        const errors: BulkCategoryError[] = [];
        const created: any[] = [];
        const skipped: string[] = [];

        // Get all existing category names for duplicate checking
        const existingCategories = await prisma.category.findMany({
            select: { name: true },
        });
        const existingNames = new Set(existingCategories.map((c) => c.name.toLowerCase()));
        const batchNames = new Set<string>();

        for (let i = 0; i < categories.length; i++) {
            const category = categories[i];

            try {
                // Validate name
                if (!category.name || category.name.trim() === '') {
                    errors.push({
                        index: i + 1,
                        name: category.name || '(empty)',
                        error: 'Name is required',
                    });
                    continue;
                }

                // Validate name length
                if (category.name.length < 3 || category.name.length > 100) {
                    errors.push({
                        index: i + 1,
                        name: category.name,
                        error: 'Name must be 3-100 characters',
                    });
                    continue;
                }

                const nameLower = category.name.toLowerCase();

                // Check for duplicate in database
                if (existingNames.has(nameLower)) {
                    skipped.push(category.name);
                    continue;
                }

                // Check for duplicate in current batch
                if (batchNames.has(nameLower)) {
                    errors.push({
                        index: i + 1,
                        name: category.name,
                        error: 'Duplicate name in batch',
                    });
                    continue;
                }

                batchNames.add(nameLower);

                // Validate maxBorrowDuration
                const borrowDuration = category.maxBorrowDuration || 7;
                if (borrowDuration < 1 || borrowDuration > 365) {
                    errors.push({
                        index: i + 1,
                        name: category.name,
                        error: 'Max borrow duration must be between 1 and 365 days',
                    });
                    continue;
                }

                // Create category
                const newCategory = await prisma.category.create({
                    data: {
                        name: category.name.trim(),
                        description: category.description?.trim() || null,
                        maxBorrowDuration: borrowDuration,
                        requiresApproval: category.requiresApproval !== undefined ? category.requiresApproval : false,
                        visibleToStudents: category.visibleToStudents !== undefined ? category.visibleToStudents : true,
                        visibleToStaff: category.visibleToStaff !== undefined ? category.visibleToStaff : true,
                    },
                });

                created.push(newCategory);
                existingNames.add(nameLower); // Add to set to prevent duplicates in subsequent iterations
            } catch (error) {
                console.error(`Error creating category ${i + 1}:`, error);
                errors.push({
                    index: i + 1,
                    name: category.name,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        // Log audit trail
        if (created.length > 0) {
            await logAudit({
                userId: session.user.id,
                action: 'BULK_CATEGORIES_CREATED',
                entityType: 'Category',
                entityId: 'bulk',
                changes: { count: created.length, names: created.map((c) => c.name) },
                ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            });
        }

        return NextResponse.json({
            success: errors.length === 0,
            created: created.length,
            skipped: skipped.length,
            failed: errors.length,
            total: categories.length,
            categories: created,
            skippedNames: skipped,
            errors,
            message: `Created ${created.length} categories. ${skipped.length} skipped (already exist). ${errors.length} failed.`,
        });
    } catch (error) {
        console.error('Bulk category creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create categories' },
            { status: 500 }
        );
    }
}
