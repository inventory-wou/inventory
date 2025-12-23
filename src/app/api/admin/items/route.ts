import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateManualId, logAudit } from '@/lib/utils';

/**
 * GET /api/admin/items
 * Fetch all items with advanced filtering (Admin sees all, Incharge sees their departments)
 * 
 * Query params:
 * - page, limit: pagination
 * - search: full-text search across name, manualId, serialNumber, description, specifications
 * - departments: comma-separated department IDs
 * - categories: comma-separated category IDs
 * - statuses: comma-separated statuses
 * - conditions: comma-separated conditions
 * - minValue, maxValue: value range
 * - purchasedAfter, purchasedBefore: purchase date range
 * - lowStock: boolean for consumables below min stock
 * - sortBy: field to sort by
 * - sortOrder: asc/desc
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

        // Multi-select filters
        const departmentsParam = searchParams.get('departments') || '';
        const categoriesParam = searchParams.get('categories') || '';
        const statusesParam = searchParams.get('statuses') || '';
        const conditionsParam = searchParams.get('conditions') || '';

        // Range filters
        const minValue = searchParams.get('minValue');
        const maxValue = searchParams.get('maxValue');
        const purchasedAfter = searchParams.get('purchasedAfter');
        const purchasedBefore = searchParams.get('purchasedBefore');
        const lowStock = searchParams.get('lowStock') === 'true';

        // Sorting
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

        // Build where clause
        const where: any = {};

        // Incharge restriction: only their departments
        if (session.user.role === 'INCHARGE') {
            where.department = {
                inchargeId: session.user.id
            };
        }

        // Full-text search across multiple fields
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { manualId: { contains: search, mode: 'insensitive' } },
                { serialNumber: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { specifications: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Multi-select filters
        if (departmentsParam) {
            const departmentIds = departmentsParam.split(',').filter(id => id.trim());
            if (departmentIds.length > 0) {
                where.departmentId = { in: departmentIds };
            }
        }

        if (categoriesParam) {
            const categoryIds = categoriesParam.split(',').filter(id => id.trim());
            if (categoryIds.length > 0) {
                where.categoryId = { in: categoryIds };
            }
        }

        if (statusesParam) {
            const statuses = statusesParam.split(',').filter(s => s.trim());
            if (statuses.length > 0) {
                where.status = { in: statuses };
            }
        }

        if (conditionsParam) {
            const conditions = conditionsParam.split(',').filter(c => c.trim());
            if (conditions.length > 0) {
                where.condition = { in: conditions };
            }
        }

        // Value range filter
        if (minValue || maxValue) {
            where.value = {};
            if (minValue) where.value.gte = parseFloat(minValue);
            if (maxValue) where.value.lte = parseFloat(maxValue);
        }

        // Purchase date range filter
        if (purchasedAfter || purchasedBefore) {
            where.purchaseDate = {};
            if (purchasedAfter) where.purchaseDate.gte = new Date(purchasedAfter);
            if (purchasedBefore) where.purchaseDate.lte = new Date(purchasedBefore);
        }

        // Low stock filter for consumables
        if (lowStock) {
            where.AND = [
                { isConsumable: true },
                { currentStock: { not: null } },
                { minStockLevel: { not: null } },
                // Note: Prisma doesn't support field comparison directly, so we'll filter in memory
            ];
        }

        // Get total count
        const totalCount = await prisma.item.count({ where });

        // Build orderBy
        const orderBy: any = {};
        if (sortBy === 'name' || sortBy === 'value' || sortBy === 'createdAt' || sortBy === 'purchaseDate') {
            orderBy[sortBy] = sortOrder;
        } else {
            orderBy.createdAt = 'desc';
        }

        // Fetch items
        let items = await prisma.item.findMany({
            where,
            include: {
                category: { select: { id: true, name: true } },
                department: { select: { id: true, name: true, code: true } },
                addedBy: { select: { id: true, name: true } }
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy
        });

        // Filter low stock items in memory (since Prisma doesn't support field comparison)
        if (lowStock) {
            items = items.filter(item =>
                item.isConsumable &&
                item.currentStock !== null &&
                item.minStockLevel !== null &&
                item.currentStock < item.minStockLevel
            );
        }

        return NextResponse.json({
            items,
            pagination: {
                page,
                limit,
                totalCount: lowStock ? items.length : totalCount,
                totalPages: Math.ceil((lowStock ? items.length : totalCount) / limit)
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
            image
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
                image: image || null,
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

