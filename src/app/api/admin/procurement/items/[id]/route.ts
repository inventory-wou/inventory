import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteContext = {
    params: Promise<{ id: string }>;
};

/**
 * PUT /api/admin/procurement/items/[id]
 * Update item department availability
 */
export async function PUT(request: NextRequest, context: RouteContext) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is an admin or procurement role
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, id: true },
        });

        if (!user || (user.role !== 'ADMIN' && user.role !== 'PROCUREMENT')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await context.params;
        const body = await request.json();
        const { availableDepartments } = body; // Array of { departmentId, canTransfer }

        if (!availableDepartments || !Array.isArray(availableDepartments)) {
            return NextResponse.json(
                { error: 'Available departments array is required' },
                { status: 400 }
            );
        }

        // Verify item exists
        const item = await prisma.item.findUnique({
            where: { id },
            include: {
                departmentAccess: true,
            },
        });

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        // Update department access in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Delete existing access records
            await tx.itemDepartmentAccess.deleteMany({
                where: { itemId: id },
            });

            // Create new access records
            if (availableDepartments.length > 0) {
                await tx.itemDepartmentAccess.createMany({
                    data: availableDepartments.map((dept: any) => ({
                        itemId: id,
                        departmentId: dept.departmentId,
                        canTransfer: dept.canTransfer !== false,
                    })),
                });
            }

            // Return updated item with access records
            return await tx.item.findUnique({
                where: { id },
                include: {
                    category: true,
                    department: true,
                    departmentAccess: {
                        include: {
                            department: true,
                        },
                    },
                },
            });
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'UPDATE_ITEM_DEPARTMENT_ACCESS',
                entityType: 'Item',
                entityId: id,
                changes: JSON.stringify({
                    manualId: item.manualId,
                    name: item.name,
                    departmentsCount: availableDepartments.length,
                    departments: availableDepartments.map((d: any) => d.departmentId),
                }),
            },
        });

        return NextResponse.json({
            message: 'Department availability updated successfully',
            item: result,
        });
    } catch (error) {
        console.error('Error updating department availability:', error);
        return NextResponse.json(
            { error: 'Failed to update department availability' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/admin/procurement/items/[id]
 * Get single item with department access details
 */
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is authenticated
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await context.params;

        const item = await prisma.item.findUnique({
            where: { id },
            include: {
                category: true,
                department: true,
                addedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                departmentAccess: {
                    include: {
                        department: true,
                    },
                },
            },
        });

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        return NextResponse.json(item);
    } catch (error) {
        console.error('Error fetching item:', error);
        return NextResponse.json(
            { error: 'Failed to fetch item' },
            { status: 500 }
        );
    }
}
