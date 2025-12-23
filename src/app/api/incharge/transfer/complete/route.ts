import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * POST /api/incharge/transfer/complete
 * Complete an approved transfer request
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

        if (!user || (user.role !== 'INCHARGE' && user.role !== 'ADMIN' && user.role !== 'PROCUREMENT')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { requestId, notes } = body;

        if (!requestId) {
            return NextResponse.json(
                { error: 'Request ID is required' },
                { status: 400 }
            );
        }

        // Get the transfer request
        const transferRequest = await prisma.transferRequest.findUnique({
            where: { id: requestId },
            include: {
                item: {
                    include: {
                        category: true,
                        department: true,
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

        if (!transferRequest) {
            return NextResponse.json({ error: 'Transfer request not found' }, { status: 404 });
        }

        // Verify request is approved
        if (transferRequest.status !== 'APPROVED') {
            return NextResponse.json(
                { error: 'Only approved requests can be completed' },
                { status: 400 }
            );
        }

        // Verify user has access (can be completed by either department incharge)
        if (user.role === 'INCHARGE') {
            const hasAccess = user.departments.some(
                (dept: { id: string }) =>
                    dept.id === transferRequest.fromDepartmentId ||
                    dept.id === transferRequest.toDepartmentId
            );
            if (!hasAccess) {
                return NextResponse.json(
                    { error: 'You do not have access to complete this transfer' },
                    { status: 403 }
                );
            }
        }

        // Complete transfer in a transaction
        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const item = transferRequest.item;

            if (item.isConsumable) {
                // For consumables: update stock levels
                // Decrease from source
                if (item.currentStock !== null) {
                    await tx.item.update({
                        where: { id: item.id },
                        data: {
                            currentStock: Math.max(0, item.currentStock - transferRequest.quantity),
                        },
                    });
                }

                // Find or create item in destination department
                const destItem = await tx.item.findFirst({
                    where: {
                        name: item.name,
                        categoryId: item.categoryId,
                        departmentId: transferRequest.toDepartmentId,
                        isConsumable: true,
                    },
                });

                if (destItem) {
                    // Update existing stock
                    await tx.item.update({
                        where: { id: destItem.id },
                        data: {
                            currentStock: (destItem.currentStock || 0) + transferRequest.quantity,
                        },
                    });
                } else {
                    // Create new item entry in destination
                    const destDepartment = await tx.department.findUnique({
                        where: { id: transferRequest.toDepartmentId },
                    });

                    const manualId = await generateManualId(tx, destDepartment!.code);

                    await tx.item.create({
                        data: {
                            manualId,
                            name: item.name,
                            categoryId: item.categoryId,
                            departmentId: transferRequest.toDepartmentId,
                            description: item.description,
                            specifications: item.specifications,
                            image: item.image,
                            condition: item.condition,
                            status: 'AVAILABLE',
                            isConsumable: true,
                            currentStock: transferRequest.quantity,
                            minStockLevel: item.minStockLevel,
                            location: item.location,
                            addedById: user.id,
                            sourceDepartmentId: item.departmentId,
                        },
                    });
                }
            } else {
                // For non-consumables: transfer item ownership
                await tx.item.update({
                    where: { id: item.id },
                    data: {
                        departmentId: transferRequest.toDepartmentId,
                        sourceDepartmentId: item.departmentId,
                        status: 'AVAILABLE',
                    },
                });
            }

            // Create transfer record
            const transferRecord = await tx.transferRecord.create({
                data: {
                    requestId,
                    itemId: item.id,
                    fromDepartmentId: transferRequest.fromDepartmentId,
                    toDepartmentId: transferRequest.toDepartmentId,
                    transferredById: user.id,
                    quantity: transferRequest.quantity,
                    notes,
                },
                include: {
                    item: true,
                    fromDepartment: true,
                    toDepartment: true,
                    transferredBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });

            // Update transfer request status
            await tx.transferRequest.update({
                where: { id: requestId },
                data: {
                    status: 'COMPLETED',
                },
            });

            return transferRecord;
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'COMPLETE_TRANSFER',
                entityType: 'TransferRecord',
                entityId: result.id,
                changes: JSON.stringify({
                    itemName: transferRequest.item.name,
                    fromDepartment: transferRequest.fromDepartment.name,
                    toDepartment: transferRequest.toDepartment.name,
                    quantity: transferRequest.quantity,
                }),
            },
        });

        // TODO: Send completion emails to both departments

        return NextResponse.json({
            message: 'Transfer completed successfully',
            transferRecord: result,
        });
    } catch (error) {
        console.error('Error completing transfer:', error);
        return NextResponse.json(
            { error: 'Failed to complete transfer' },
            { status: 500 }
        );
    }
}

// Helper function to generate manual ID
async function generateManualId(tx: Prisma.TransactionClient, departmentCode: string): Promise<string> {
    const lastItem = await tx.item.findFirst({
        where: {
            manualId: {
                startsWith: `${departmentCode}-`,
            },
        },
        orderBy: {
            manualId: 'desc',
        },
    });

    let nextNumber = 1;
    if (lastItem) {
        const lastNumber = parseInt(lastItem.manualId.split('-')[1]);
        nextNumber = lastNumber + 1;
    }

    return `${departmentCode}-${String(nextNumber).padStart(3, '0')}`;
}
