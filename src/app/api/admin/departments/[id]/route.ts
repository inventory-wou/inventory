import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/utils';

/**
 * PUT /api/admin/departments/[id]
 * Update a department
 * Admin only
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check authentication and admin role
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 403 }
            );
        }

        const { id } = await params;
        const body = await request.json();
        const { name, code, description, inchargeId } = body;

        // Check if department exists
        const department = await prisma.department.findUnique({
            where: { id }
        });

        if (!department) {
            return NextResponse.json(
                { error: 'Department not found' },
                { status: 404 }
            );
        }

        // Validate code format if provided
        if (code) {
            const codeRegex = /^[A-Z0-9]{2,10}$/;
            if (!codeRegex.test(code)) {
                return NextResponse.json(
                    { error: 'Code must be 2-10 uppercase alphanumeric characters' },
                    { status: 400 }
                );
            }

            // Check for duplicate code (excluding current department)
            const existing = await prisma.department.findFirst({
                where: {
                    code: { equals: code, mode: 'insensitive' },
                    NOT: { id }
                }
            });

            if (existing) {
                return NextResponse.json(
                    { error: 'Department code already exists' },
                    { status: 400 }
                );
            }
        }

        // Check for duplicate name (excluding current department)
        if (name) {
            const existing = await prisma.department.findFirst({
                where: {
                    name: { equals: name, mode: 'insensitive' },
                    NOT: { id }
                }
            });

            if (existing) {
                return NextResponse.json(
                    { error: 'Department name already exists' },
                    { status: 400 }
                );
            }
        }

        // If inchargeId provided, validate it
        if (inchargeId !== undefined) {
            if (inchargeId !== null) {
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
        }

        // Update department
        const updatedDepartment = await prisma.department.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(code && { code: code.toUpperCase() }),
                ...(description !== undefined && { description }),
                ...(inchargeId !== undefined && { inchargeId })
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
            action: 'DEPARTMENT_UPDATED',
            entityType: 'Department',
            entityId: id,
            changes: { name, code, description, inchargeId },
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        });

        return NextResponse.json({
            message: 'Department updated successfully',
            department: updatedDepartment
        });

    } catch (error) {
        console.error('Error updating department:', error);
        return NextResponse.json(
            { error: 'Failed to update department' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/departments/[id]
 * Delete a department
 * Admin only
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check authentication and admin role
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 403 }
            );
        }

        const { id } = await params;

        // Check if department exists
        const department = await prisma.department.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { items: true }
                }
            }
        });

        if (!department) {
            return NextResponse.json(
                { error: 'Department not found' },
                { status: 404 }
            );
        }

        // Check if department has items
        if (department._count.items > 0) {
            return NextResponse.json(
                { error: `Cannot delete department with ${department._count.items} items. Please reassign or remove items first.` },
                { status: 400 }
            );
        }

        // Delete department
        await prisma.department.delete({
            where: { id }
        });

        // Log audit trail
        await logAudit({
            userId: session.user.id,
            action: 'DEPARTMENT_DELETED',
            entityType: 'Department',
            entityId: id,
            changes: { name: department.name, code: department.code },
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        });

        return NextResponse.json({
            message: 'Department deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting department:', error);
        return NextResponse.json(
            { error: 'Failed to delete department' },
            { status: 500 }
        );
    }
}
