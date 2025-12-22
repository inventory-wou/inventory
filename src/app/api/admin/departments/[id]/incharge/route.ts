import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/utils';

/**
 * PUT /api/admin/departments/[id]/incharge
 * Assign or change incharge for a department
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
        const { inchargeId } = body;

        // Check if department exists
        const department = await prisma.department.findUnique({
            where: { id },
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

        if (!department) {
            return NextResponse.json(
                { error: 'Department not found' },
                { status: 404 }
            );
        }

        // If inchargeId is null, remove incharge
        if (inchargeId === null) {
            const updatedDepartment = await prisma.department.update({
                where: { id },
                data: { inchargeId: null }
            });

            // Log audit trail
            await logAudit({
                userId: session.user.id,
                action: 'INCHARGE_REMOVED',
                entityType: 'Department',
                entityId: id,
                changes: {
                    departmentName: department.name,
                    previousIncharge: department.incharge?.name || null
                },
                ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
            });

            return NextResponse.json({
                message: 'Incharge removed successfully',
                department: updatedDepartment
            });
        }

        // Validate incharge user
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

        // Update department incharge
        const updatedDepartment = await prisma.department.update({
            where: { id },
            data: { inchargeId },
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
            action: 'INCHARGE_ASSIGNED',
            entityType: 'Department',
            entityId: id,
            changes: {
                departmentName: department.name,
                previousIncharge: department.incharge?.name || null,
                newIncharge: incharge.name
            },
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        });

        return NextResponse.json({
            message: 'Incharge assigned successfully',
            department: updatedDepartment
        });

    } catch (error) {
        console.error('Error assigning incharge:', error);
        return NextResponse.json(
            { error: 'Failed to assign incharge' },
            { status: 500 }
        );
    }
}
