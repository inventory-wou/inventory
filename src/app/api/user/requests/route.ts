import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail, newRequestEmailTemplate } from '@/lib/email';

/**
 * GET /api/user/requests
 * Get all requests for the logged-in user
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const requests = await prisma.issueRequest.findMany({
            where: {
                userId: session.user.id,
                ...(status && { status: status as any }),
            },
            include: {
                item: {
                    include: {
                        category: true,
                        department: true,
                    },
                },
            },
            orderBy: {
                requestDate: 'desc',
            },
        });

        return NextResponse.json(requests);
    } catch (error) {
        console.error('Error fetching user requests:', error);
        return NextResponse.json(
            { error: 'Failed to fetch requests' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/user/requests
 * Submit a new item request
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { itemId, purpose, requestedDays } = body;

        // Validate required fields
        if (!itemId || !purpose || !requestedDays) {
            return NextResponse.json(
                { error: 'Item ID, purpose, and requested days are required' },
                { status: 400 }
            );
        }

        // Get user details and check if user is approved, active, and not banned
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!user.isApproved) {
            return NextResponse.json(
                { error: 'Your account is pending approval' },
                { status: 403 }
            );
        }

        if (!user.isActive) {
            return NextResponse.json(
                { error: 'Your account is inactive' },
                { status: 403 }
            );
        }

        if (user.isBanned) {
            const banMessage = user.bannedUntil
                ? `You are banned until ${user.bannedUntil.toLocaleDateString()}`
                : 'You are banned indefinitely pending compensation';
            return NextResponse.json({ error: banMessage }, { status: 403 });
        }

        // Get item details and validate
        const item = await prisma.item.findUnique({
            where: { id: itemId },
            include: {
                category: true,
                department: true,
            },
        });

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        // Check if item is consumable
        if (item.isConsumable) {
            return NextResponse.json(
                { error: 'Consumable items cannot be borrowed' },
                { status: 400 }
            );
        }

        // Check if item is available
        if (item.status !== 'AVAILABLE') {
            return NextResponse.json(
                { error: 'Item is not available for borrowing' },
                { status: 400 }
            );
        }

        // Validate requested days against category max
        if (requestedDays > item.category.maxBorrowDuration) {
            return NextResponse.json(
                {
                    error: `Requested duration exceeds maximum allowed (${item.category.maxBorrowDuration} days)`,
                },
                { status: 400 }
            );
        }

        // Check if user already has a pending or approved request for this item
        const existingRequest = await prisma.issueRequest.findFirst({
            where: {
                userId: user.id,
                itemId: itemId,
                status: {
                    in: ['PENDING', 'APPROVED'],
                },
            },
        });

        if (existingRequest) {
            return NextResponse.json(
                { error: 'You already have a pending or approved request for this item' },
                { status: 400 }
            );
        }

        // Create the request
        const issueRequest = await prisma.issueRequest.create({
            data: {
                userId: user.id,
                itemId: itemId,
                purpose,
                requestedDays,
                status: 'PENDING',
            },
            include: {
                item: {
                    include: {
                        category: true,
                        department: true,
                    },
                },
            },
        });

        // Get department incharge(s) to send email notification
        const department = await prisma.department.findUnique({
            where: { id: item.departmentId },
            include: {
                incharge: true,
            },
        });

        if (department?.incharge) {
            const emailTemplate = newRequestEmailTemplate({
                inchargeName: department.incharge.name,
                requesterName: user.name,
                requesterEmail: user.email,
                itemName: item.name,
                itemId: item.manualId,
                purpose,
                requestedDays,
                department: department.name,
                dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/incharge/requests`,
            });

            // Send email asynchronously (don't wait for it)
            sendEmail({
                to: department.incharge.email,
                subject: emailTemplate.subject,
                html: emailTemplate.html,
            }).catch((error) =>
                console.error('Failed to send request notification email:', error)
            );
        }

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'CREATE',
                entityType: 'IssueRequest',
                entityId: issueRequest.id,
                changes: JSON.stringify({
                    itemId,
                    itemName: item.name,
                    purpose,
                    requestedDays,
                }),
            },
        });

        return NextResponse.json({
            message: 'Request submitted successfully',
            request: issueRequest,
        });
    } catch (error) {
        console.error('Error creating request:', error);
        return NextResponse.json(
            { error: 'Failed to create request' },
            { status: 500 }
        );
    }
}

