import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/incharge/transfer/request
 * Request transfer of an item from another department
 */
export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const { itemId, toDepartmentId, purpose, quantity } = body;

        // Validate required fields
        if (!itemId || !toDepartmentId || !purpose) {
            return NextResponse.json(
                { error: 'Item ID, department ID, and purpose are required' },
                { status: 400 }
            );
        }

        // Verify incharge has access to requesting department
        const hasAccess = user.role === 'ADMIN' || user.departments.some(
            (dept: { id: string }) => dept.id === toDepartmentId
        );

        if (!hasAccess) {
            return NextResponse.json(
                { error: 'You do not have access to request for this department' },
                { status: 403 }
            );
        }

        // Verify item exists and get source department
        const item = await prisma.item.findUnique({
            where: { id: itemId },
            include: {
                department: true,
                category: true,
                departmentAccess: {
                    where: {
                        departmentId: toDepartmentId,
                    },
                },
            },
        });

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        // Check if requesting department has access
        if (item.departmentAccess.length === 0) {
            return NextResponse.json(
                { error: 'This item is not available for transfer to your department' },
                { status: 403 }
            );
        }

        if (!item.departmentAccess[0].canTransfer) {
            return NextResponse.json(
                { error: 'Transfer is not allowed for this item' },
                { status: 403 }
            );
        }

        // Prevent requesting from same department
        if (item.departmentId === toDepartmentId) {
            return NextResponse.json(
                { error: 'Cannot request transfer from same department' },
                { status: 400 }
            );
        }

        // Validate quantity for consumables
        if (item.isConsumable) {
            if (!quantity || quantity < 1) {
                return NextResponse.json(
                    { error: 'Quantity is required for consumable items' },
                    { status: 400 }
                );
            }

            if (item.currentStock && quantity > item.currentStock) {
                return NextResponse.json(
                    { error: `Insufficient stock. Available: ${item.currentStock}` },
                    { status: 400 }
                );
            }
        }

        // Create transfer request
        const transferRequest = await prisma.transferRequest.create({
            data: {
                itemId,
                fromDepartmentId: item.departmentId,
                toDepartmentId,
                requestedById: user.id,
                quantity: item.isConsumable ? quantity : 1,
                purpose,
                status: 'PENDING',
            },
            include: {
                item: {
                    include: {
                        category: true,
                    },
                },
                fromDepartment: true,
                toDepartment: true,
                requestedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'CREATE_TRANSFER_REQUEST',
                entityType: 'TransferRequest',
                entityId: transferRequest.id,
                changes: JSON.stringify({
                    itemName: item.name,
                    itemId: item.manualId,
                    fromDepartment: item.department.name,
                    toDepartment: transferRequest.toDepartment.name,
                    purpose,
                }),
            },
        });

        // TODO: Send email notification to source department incharge

        return NextResponse.json({
            message: 'Transfer request submitted successfully',
            transferRequest,
        });
    } catch (error) {
        console.error('Error creating transfer request:', error);
        return NextResponse.json(
            { error: 'Failed to create transfer request' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/incharge/transfer/request
 * Get transfer requests for incharge's departments
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

        if (!user || (user.role !== 'INCHARGE' && user.role !== 'ADMIN' && user.role !== 'PROCUREMENT')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const direction = searchParams.get('direction'); // 'incoming' or 'outgoing'
        const status = searchParams.get('status');

        const departmentIds = user.role === 'ADMIN' || user.role === 'PROCUREMENT'
            ? undefined
            : user.departments.map((dept: { id: string }) => dept.id);

        const where: any = {};

        // Filter by direction
        if (direction === 'incoming' && departmentIds) {
            where.fromDepartmentId = { in: departmentIds };
        } else if (direction === 'outgoing' && departmentIds) {
            where.toDepartmentId = { in: departmentIds };
        } else if (departmentIds) {
            // Both incoming and outgoing
            where.OR = [
                { fromDepartmentId: { in: departmentIds } },
                { toDepartmentId: { in: departmentIds } },
            ];
        }

        if (status) {
            where.status = status;
        }

        const requests = await prisma.transferRequest.findMany({
            where,
            include: {
                item: {
                    include: {
                        category: true,
                    },
                },
                fromDepartment: true,
                toDepartment: true,
                requestedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                approvedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                requestDate: 'desc',
            },
        });

        return NextResponse.json(requests);
    } catch (error) {
        console.error('Error fetching transfer requests:', error);
        return NextResponse.json(
            { error: 'Failed to fetch transfer requests' },
            { status: 500 }
        );
    }
}
