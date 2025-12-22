import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateManualId, logAudit } from '@/lib/utils';

/**
 * GET /api/admin/items
 * Fetch all items (Admin sees all, Incharge sees their departments)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['ADMIN', 'INCHARGE'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const departmentId = searchParams.get('departmentId') || '';
        const categoryId = searchParams.get('categoryId') || '';
        const status = searchParams.get('status') || '';
        const condition = searchParams.get('condition') || '';

        // Build where clause
        const where: any = {};

        // Incharge restriction: only their departments
        if (session.user.role === 'INCHARGE') {
            where.department = {
                inchargeId: session.user.id
            };
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { manualId: { contains: search, mode: 'insensitive' } },
                { serialNumber: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (departmentId) where.departmentId = departmentId;
        if (categoryId) where.categoryId = categoryId;
        if (status) where.status = status;
        if (condition) where.condition = condition;

        // Get total count
        const totalCount = await prisma.item.count({ where });

        // Fetch items
        const items = await prisma.item.findMany({
            where,
            include: {
                category: { select: { id: true, name: true } },
                department: { select: { id: true, name: true, code: true } },
                addedBy: { select: { id: true, name: true } }
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            items,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching items:', error);
        return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
    }
}

/**
 * POST /api/admin/items
 * Create new item
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['ADMIN', 'INCHARGE'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const {
            name,
            description,
            specifications,
            categoryId,
            departmentId,
            serialNumber,
            condition,
            status,
            isConsumable,
            currentStock,
            minStockLevel,
            location,
            purchaseDate,
            value,
            imageUrl
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
            where: { id: categoryId }
        });
        if (!category) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        // Verify department exists
        const department = await prisma.department.findUnique({
            where: { id: departmentId }
        });
        if (!department) {
            return NextResponse.json({ error: 'Department not found' }, { status: 404 });
        }

        // Incharge restriction
        if (session.user.role === 'INCHARGE' && department.inchargeId !== session.user.id) {
            return NextResponse.json(
                { error: 'You can only create items in departments you manage' },
                { status: 403 }
            );
        }

        // Generate manual ID
        const manualId = await generateManualId(department.code);

        // Validate serial number uniqueness if provided
        if (serialNumber) {
            const existing = await prisma.item.findFirst({
                where: { serialNumber }
            });
            if (existing) {
                return NextResponse.json(
                    { error: 'Serial number already exists' },
                    { status: 400 }
                );
            }
        }

        // Validate consumable fields
        if (isConsumable) {
            if (currentStock === undefined || minStockLevel === undefined) {
                return NextResponse.json(
                    { error: 'Current stock and minimum stock level required for consumables' },
                    { status: 400 }
                );
            }
        }

        // Create item
        const item = await prisma.item.create({
            data: {
                manualId,
                name,
                description,
                specifications,
                categoryId,
                departmentId,
                serialNumber,
                condition: condition || 'GOOD',
                status: status || 'AVAILABLE',
                isConsumable: isConsumable || false,
                currentStock: isConsumable ? currentStock : null,
                minStockLevel: isConsumable ? minStockLevel : null,
                location,
                purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
                value: value ? parseFloat(value) : null,
                imageUrl,
                addedById: session.user.id
            },
            include: {
                category: true,
                department: true
            }
        });

        // Log audit
        await logAudit({
            userId: session.user.id,
            action: 'ITEM_CREATED',
            entityType: 'Item',
            entityId: item.id,
            changes: { manualId, name, departmentId, categoryId },
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        });

        return NextResponse.json({
            message: 'Item created successfully',
            item
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating item:', error);
        return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
    }
}

