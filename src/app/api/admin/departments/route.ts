import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/utils';

/**
 * GET /api/admin/departments
 * Fetch all departments with optional search and pagination
 * Admin only
 */
export async function GET(request: NextRequest) {
    try {
        // Check authentication and admin role
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 403 }
            );
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';

        // Build where clause
        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Get total count
        const totalCount = await prisma.department.count({ where });

        // Fetch departments with pagination
        const departments = await prisma.department.findMany({
            where,
            include: {
                incharge: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                _count: {
                    select: { items: true }
                }
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' }
        });

        // Get stats
        const totalWithIncharge = await prisma.department.count({
            where: { inchargeId: { not: null } }
        });

        const totalWithoutIncharge = totalCount - totalWithIncharge;

        return NextResponse.json({
            departments,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
                hasMore: page < Math.ceil(totalCount / limit)
            },
            stats: {
                totalDepartments: totalCount,
                withIncharge: totalWithIncharge,
                withoutIncharge: totalWithoutIncharge
            }
        });

    } catch (error) {
        console.error('Error fetching departments:', error);
        return NextResponse.json(
            { error: 'Failed to fetch departments' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/departments
 * Create a new department
 * Admin only
 */
export async function POST(request: NextRequest) {
    try {
        // Check authentication and admin role
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { name, code, description, inchargeId } = body;

        // Validate required fields
        if (!name || !code) {
            return NextResponse.json(
                { error: 'Name and code are required' },
                { status: 400 }
            );
        }

        // Validate code format (uppercase, alphanumeric, 2-10 chars)
        const codeRegex = /^[A-Z0-9]{2,10}$/;
        if (!codeRegex.test(code)) {
            return NextResponse.json(
                { error: 'Code must be 2-10 uppercase alphanumeric characters' },
                { status: 400 }
            );
        }

        // Check for duplicate name or code
        const existing = await prisma.department.findFirst({
            where: {
                OR: [
                    { name: { equals: name, mode: 'insensitive' } },
                    { code: { equals: code, mode: 'insensitive' } }
                ]
            }
        });

        if (existing) {
            if (existing.name.toLowerCase() === name.toLowerCase()) {
                return NextResponse.json(
                    { error: 'Department name already exists' },
                    { status: 400 }
                );
            }
            if (existing.code.toLowerCase() === code.toLowerCase()) {
                return NextResponse.json(
                    { error: 'Department code already exists' },
                    { status: 400 }
                );
            }
        }

        // If inchargeId provided, validate it
        if (inchargeId) {
            const incharge = await prisma.user.findUnique({
                where: { id: inchargeId }
            });

            if (!incharge) {
                return NextResponse.json(
                    { error: 'Incharge user not found' },
                    { status: 404 }
                );
            }

            if (incharge.role !== 'INCHARGE') {
                return NextResponse.json(
                    { error: 'User must have INCHARGE role' },
                    { status: 400 }
                );
            }

            if (!incharge.isApproved || !incharge.isActive) {
                return NextResponse.json(
                    { error: 'Incharge must be approved and active' },
                    { status: 400 }
                );
            }
        }

        // Create department
        const department = await prisma.department.create({
            data: {
                name,
                code: code.toUpperCase(),
                description,
                inchargeId: inchargeId || null
            },
            include: {
                incharge: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        // Log audit trail
        await logAudit({
            userId: session.user.id,
            action: 'DEPARTMENT_CREATED',
            entityType: 'Department',
            entityId: department.id,
            changes: { name, code: code.toUpperCase(), inchargeId },
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        });

        return NextResponse.json({
            message: 'Department created successfully',
            department
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating department:', error);
        return NextResponse.json(
            { error: 'Failed to create department' },
            { status: 500 }
        );
    }
}

