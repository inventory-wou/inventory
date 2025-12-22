import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAllSettings, updateSettings, resetToDefaults } from '@/lib/settings';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/settings
 * Fetch all system settings
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 403 }
            );
        }

        const settings = await getAllSettings();

        return NextResponse.json({ settings });
    } catch (error) {
        console.error('Settings GET error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/settings
 * Update system settings (admin only)
 */
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { settings, resetDefaults } = body;

        // Handle reset to defaults
        if (resetDefaults === true) {
            await resetToDefaults();

            // Log the action
            await prisma.auditLog.create({
                data: {
                    userId: session.user.id,
                    action: 'RESET_SETTINGS',
                    entityType: 'Settings',
                    changes: JSON.stringify({ action: 'Reset all settings to defaults' }),
                },
            });

            return NextResponse.json({
                message: 'Settings reset to defaults successfully',
            });
        }

        // Validate settings array
        if (!Array.isArray(settings)) {
            return NextResponse.json(
                { error: 'Settings must be an array' },
                { status: 400 }
            );
        }

        // Validate each setting
        for (const setting of settings) {
            if (!setting.key || typeof setting.value !== 'string') {
                return NextResponse.json(
                    { error: 'Each setting must have a key and value' },
                    { status: 400 }
                );
            }

            // Validate number settings
            if (
                ['late_return_ban_months', 'default_max_borrow_days', 'max_items_per_user', 'consumable_min_stock_alert'].includes(
                    setting.key
                )
            ) {
                const num = parseInt(setting.value, 10);
                if (isNaN(num) || num < 0) {
                    return NextResponse.json(
                        { error: `${setting.key} must be a positive number` },
                        { status: 400 }
                    );
                }
            }

            // Validate boolean settings
            if (
                ['late_return_auto_ban', 'reminder_3days_enabled', 'reminder_1day_enabled', 'overdue_reminder_enabled'].includes(
                    setting.key
                )
            ) {
                if (setting.value !== 'true' && setting.value !== 'false') {
                    return NextResponse.json(
                        { error: `${setting.key} must be 'true' or 'false'` },
                        { status: 400 }
                    );
                }
            }
        }

        // Update settings
        await updateSettings(settings);

        // Log the action
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'UPDATE_SETTINGS',
                entityType: 'Settings',
                changes: JSON.stringify({ settings }),
            },
        });

        return NextResponse.json({
            message: 'Settings updated successfully',
        });
    } catch (error) {
        console.error('Settings PUT error:', error);
        return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500 }
        );
    }
}
