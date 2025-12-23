import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/admin/procurement/items
 * Add items to procurement inventory with multi-department access
 */
export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const {
            name,
            categoryId,
            departmentId, // Primary/owning department (usually PROCUREMENT dept)
            description,
            specifications,
            serialNumber,
            image,
            condition,
            isConsumable,
            currentStock,
            minStockLevel,
            location,
            purchaseDate,
            value,
            availableDepartments, // Array of department IDs that can access this item
        } = body;

        // Validate required fields
        if (!name || !categoryId || !departmentId) {
            return NextResponse.json(
                { error: 'Name, category, and department are required' },
                { status: 400 }
            );
        }

        // Verify category exists
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
        });

        if (!category) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        // Verify department exists
        const department = await prisma.department.findUnique({
            where: { id: departmentId },
        });

        if (!department) {
            return NextResponse.json({ error: 'Department not found' }, { status: 404 });
        }

        // Generate manual ID
        const departmentCode = department.code;
        const lastItem = await prisma.item.findFirst({
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
        const manualId = `${departmentCode}-${String(nextNumber).padStart(3, '0')}`;

        // Create item with department access in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create the item
            const item = await tx.item.create({
                data: {
                    manualId,
                    name,
                    categoryId,
                    departmentId,
                    description,
                    specifications,
                    serialNumber,
                    image,
                    condition: condition || 'GOOD',
                    status: 'AVAILABLE',
                    isConsumable: isConsumable || false,
                    currentStock: isConsumable ? currentStock : null,
                    minStockLevel: isConsumable ? minStockLevel : null,
                    location,
                    purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
                    value: value ? parseFloat(value) : null,
                    addedById: user.id,
                },
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
                },
            });

            // Create department access records if provided
            if (availableDepartments && Array.isArray(availableDepartments)) {
                await tx.itemDepartmentAccess.createMany({
                    data: availableDepartments.map((deptId: string) => ({
                        itemId: item.id,
                        departmentId: deptId,
                        canTransfer: true,
                    })),
                    skipDuplicates: true,
                });
            }

            return item;
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'CREATE_PROCUREMENT_ITEM',
                entityType: 'Item',
                entityId: result.id,
                changes: JSON.stringify({
                    manualId: result.manualId,
                    name: result.name,
                    department: department.name,
                    availableDepartments: availableDepartments?.length || 0,
                }),
            },
        });

        return NextResponse.json({
            message: 'Item added to procurement inventory successfully',
            item: result,
        });
    } catch (error) {
        console.error('Error adding procurement item:', error);
        return NextResponse.json(
            { error: 'Failed to add item' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/admin/procurement/items
 * List procurement inventory items
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is an admin or procurement role
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        });

        if (!user || (user.role !== 'ADMIN' && user.role !== 'PROCUREMENT')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const departmentId = searchParams.get('departmentId');
        const categoryId = searchParams.get('categoryId');
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const skip = (page - 1) * limit;

        const where: any = {};

        // Search filter
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { manualId: { contains: search, mode: 'insensitive' } },
                { serialNumber: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Filters
        if (departmentId) where.departmentId = departmentId;
        if (categoryId) where.categoryId = categoryId;
        if (status) where.status = status;

        const [items, total] = await Promise.all([
            prisma.item.findMany({
                where,
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
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            }),
            prisma.item.count({ where }),
        ]);

        return NextResponse.json({
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching procurement items:', error);
        return NextResponse.json(
            { error: 'Failed to fetch items' },
            { status: 500 }
        );
    }
}
