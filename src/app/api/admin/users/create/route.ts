import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and is an admin
        if (!session || !session.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, email, password, role, phone, studentId, employeeId } = body;

        // Validate required fields
        if (!name || !email || !password || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate password length
        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        // Validate role
        const validRoles = ['ADMIN', 'INCHARGE', 'PROCUREMENT', 'FACULTY', 'STAFF', 'STUDENT'];
        if (!validRoles.includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        // Check if user with email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                phone: phone || null,
                studentId: studentId || null,
                employeeId: employeeId || null,
                isApproved: true, // Admin-created users are automatically approved
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isApproved: true,
                isActive: true,
                createdAt: true,
            }
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'CREATE_USER',
                entityType: 'User',
                entityId: newUser.id,
                changes: JSON.stringify({
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role,
                }),
            }
        });

        return NextResponse.json({
            message: 'User created successfully',
            user: newUser
        }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating user:', error);
        return NextResponse.json(
            { error: 'Failed to create user', details: error.message },
            { status: 500 }
        );
    }
}
