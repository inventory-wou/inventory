import { prisma } from './prisma';

/**
 * Generate a unique manual ID for an item based on department code
 * Format: DEPT-001, DEPT-002, etc.
 */
export async function generateManualId(departmentCode: string): Promise<string> {
    // Find all items with this department code prefix
    const items = await prisma.item.findMany({
        where: {
            manualId: {
                startsWith: `${departmentCode}-`
            }
        },
        select: {
            manualId: true
        },
        orderBy: {
            manualId: 'desc'
        }
    });

    // Extract numbers and find the highest
    let maxNumber = 0;

    for (const item of items) {
        const parts = item.manualId.split('-');
        if (parts.length === 2) {
            const num = parseInt(parts[1], 10);
            if (!isNaN(num) && num > maxNumber) {
                maxNumber = num;
            }
        }
    }

    // Increment and format with leading zeros
    const nextNumber = maxNumber + 1;
    const paddedNumber = nextNumber.toString().padStart(3, '0');

    return `${departmentCode}-${paddedNumber}`;
}

/**
 * Audit log utility
 */
interface AuditLogProps {
    userId: string;
    action: string;
    entityType: string;
    entityId?: string;
    changes?: any;
    ipAddress?: string;
}

export async function logAudit({
    userId,
    action,
    entityType,
    entityId,
    changes,
    ipAddress
}: AuditLogProps) {
    await prisma.auditLog.create({
        data: {
            userId,
            action,
            entityType,
            entityId,
            changes: changes ? JSON.stringify(changes) : null,
            ipAddress: ipAddress || 'unknown',
        },
    });
}
