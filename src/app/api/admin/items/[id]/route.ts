import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/utils';

/**
 * GET /api/admin/items/[id]
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['ADMIN', 'INCHARGE'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;
        const item = await prisma.item.findUnique({
            where: { id },
            include: {
                category: true,
                department: true,
                addedBy: { select: { name: true, email: true } }
            }
        });

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        // Incharge restriction
        if (session.user.role === 'INCHARGE' && item.department.inchargeId !== session.user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        return NextResponse.json({ item });
    } catch (error) {
        console.error('Error fetching item:', error);
        return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
    }
}

/**
 * PUT /api/admin/items/[id]
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['ADMIN', 'INCHARGE'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();

        // Check if item exists
        const item = await prisma.item.findUnique({
            where: { id },
            include: { department: true }
        });

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        // Incharge restriction
        if (session.user.role === 'INCHARGE' && item.department.inchargeId !== session.user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Validate serial number uniqueness if changed
        if (body.serialNumber && body.serialNumber !== item.serialNumber) {
            const existing = await prisma.item.findFirst({
                where: {
                    serialNumber: body.serialNumber,
                    NOT: { id }
                }
            });
            if (existing) {
                return NextResponse.json({ error: 'Serial number already exists' }, { status: 400 });
            }
        }

        // Update item
        const updatedItem = await prisma.item.update({
            where: { id },
            data: {
                ...(body.name && { name: body.name }),
                ...(body.description !== undefined && { description: body.description }),
                ...(body.specifications !== undefined && { specifications: body.specifications }),
                ...(body.categoryId && { categoryId: body.categoryId }),
                ...(body.serialNumber !== undefined && { serialNumber: body.serialNumber }),
                ...(body.condition && { condition: body.condition }),
                ...(body.status && { status: body.status }),
                ...(body.isConsumable !== undefined && { isConsumable: body.isConsumable }),
                ...(body.currentStock !== undefined && { currentStock: body.currentStock }),
                ...(body.minStockLevel !== undefined && { minStockLevel: body.minStockLevel }),
                ...(body.location !== undefined && { location: body.location }),
                ...(body.purchaseDate !== undefined && { purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null }),
                ...(body.value !== undefined && { value: body.value ? parseFloat(body.value) : null }),
                ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl })
            },
            include: {
                category: true,
                department: true
            }
        });

        // Log audit
        await logAudit({
            userId: session.user.id,
            action: 'ITEM_UPDATED',
            entityType: 'Item',
            entityId: id,
            changes: body,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        });

        return NextResponse.json({
            message: 'Item updated successfully',
            item: updatedItem
        });
    } catch (error) {
        console.error('Error updating item:', error);
        return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/items/[id]
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['ADMIN', 'INCHARGE'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;

        // Check if item exists
        const item = await prisma.item.findUnique({
            where: { id },
            include: {
                department: true,
                _count: { select: { issueRecords: true } }
            }
        });

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        // Incharge restriction
        if (session.user.role === 'INCHARGE' && item.department.inchargeId !== session.user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Check if item is currently issued
        if (item.status === 'ISSUED') {
            return NextResponse.json(
                { error: 'Cannot delete item that is currently issued' },
                { status: 400 }
            );
        }

        // Delete item
        await prisma.item.delete({ where: { id } });

        // Log audit
        await logAudit({
            userId: session.user.id,
            action: 'ITEM_DELETED',
            entityType: 'Item',
            entityId: id,
            changes: { manualId: item.manualId, name: item.name },
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        });

        return NextResponse.json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Error deleting item:', error);
        return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }
}
