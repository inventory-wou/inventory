import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { logAudit } from '@/lib/utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, password, phone, studentId, employeeId, role } = body;

        // Validation
        if (!name || !email || !password) {
            return NextResponse.json(
                { error: 'Name, email, and password are required' },
                { status: 400 }
            );
        }

        // Check if email is from Woxsen domain
        if (!email.endsWith('@woxsen.edu.in')) {
            return NextResponse.json(
                { error: 'Please use your Woxsen University email (@woxsen.edu.in)' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'An account with this email already exists' },
                { status: 400 }
            );
        }

        // Check if student ID or employee ID already exists
        if (studentId) {
            const existingStudent = await prisma.user.findUnique({
                where: { studentId },
            });
            if (existingStudent) {
                return NextResponse.json(
                    { error: 'This student ID is already registered' },
                    { status: 400 }
                );
            }
        }

        if (employeeId) {
            const existingEmployee = await prisma.user.findUnique({
                where: { employeeId },
            });
            if (existingEmployee) {
                return NextResponse.json(
                    { error: 'This employee ID is already registered' },
                    { status: 400 }
                );
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone: phone || null,
                studentId: studentId || null,
                employeeId: employeeId || null,
                role: role || 'USER',
                isApproved: false, // Requires admin approval
                isActive: true,
            },
        });

        // Log audit
        await logAudit({
            userId: user.id,
            action: 'USER_REGISTERED',
            entityType: 'User',
            entityId: user.id,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        });

        return NextResponse.json(
            {
                message: 'Registration successful. Your account is pending approval.',
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'An error occurred during registration' },
            { status: 500 }
        );
    }
}
