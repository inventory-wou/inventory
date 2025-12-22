import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
    parseCSV,
    parseExcel,
    bulkCreateItems,
    generateCSVTemplate,
    generateExcelTemplate,
} from '@/lib/bulk-import';

/**
 * POST /api/admin/items/bulk-import
 * Upload and import items from CSV or Excel file
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check authentication and authorization
        if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'INCHARGE')) {
            return NextResponse.json(
                { error: 'Unauthorized. Admin or Incharge access required.' },
                { status: 403 }
            );
        }

        // Get form data
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const dryRun = formData.get('dryRun') === 'true';
        const skipInvalid = formData.get('skipInvalid') !== 'false'; // Default true

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        const fileName = file.name.toLowerCase();
        const isCSV = fileName.endsWith('.csv');
        const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

        if (!isCSV && !isExcel) {
            return NextResponse.json(
                { error: 'Invalid file type. Only CSV and Excel files are supported' },
                { status: 400 }
            );
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File size exceeds 10MB limit' },
                { status: 400 }
            );
        }

        // Read file buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Parse file
        let rows;
        try {
            if (isCSV) {
                rows = parseCSV(buffer);
            } else {
                rows = parseExcel(buffer);
            }
        } catch (error) {
            return NextResponse.json(
                {
                    error: 'Failed to parse file',
                    details: error instanceof Error ? error.message : 'Unknown error',
                },
                { status: 400 }
            );
        }

        // Validate minimum rows
        if (rows.length === 0) {
            return NextResponse.json(
                { error: 'File contains no data rows' },
                { status: 400 }
            );
        }

        // Validate maximum rows (prevent server overload)
        if (rows.length > 1000) {
            return NextResponse.json(
                { error: 'File contains too many rows. Maximum 1000 items per import' },
                { status: 400 }
            );
        }

        // If dry run, only validate without importing
        if (dryRun) {
            const result = await bulkCreateItems(rows, session.user.id, true);
            return NextResponse.json({
                dryRun: true,
                totalRows: rows.length,
                validRows: result.imported,
                invalidRows: result.failed,
                errors: result.errors,
            });
        }

        // Perform actual import
        const result = await bulkCreateItems(rows, session.user.id, skipInvalid);

        return NextResponse.json({
            success: result.success,
            imported: result.imported,
            failed: result.failed,
            totalRows: rows.length,
            errors: result.errors,
            message: result.success
                ? `Successfully imported ${result.imported} items`
                : `Imported ${result.imported} items, ${result.failed} failed`,
        });
    } catch (error) {
        console.error('Bulk import error:', error);
        return NextResponse.json(
            {
                error: 'Bulk import failed',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/admin/items/bulk-import/template?format=csv|excel
 * Download template file for bulk import
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check authentication and authorization
        if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'INCHARGE')) {
            return NextResponse.json(
                { error: 'Unauthorized. Admin or Incharge access required.' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format') || 'csv';

        if (format === 'csv') {
            const template = generateCSVTemplate();
            return new NextResponse(template, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': 'attachment; filename="items-import-template.csv"',
                },
            });
        } else if (format === 'excel') {
            const template = generateExcelTemplate();
            // Convert Buffer to Uint8Array using Array.from for proper type compatibility
            const uint8Array = Uint8Array.from(template);
            const blob = new Blob([uint8Array], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });

            return new Response(blob, {
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': 'attachment; filename="items-import-template.xlsx"',
                },
            });
        } else {
            return NextResponse.json(
                { error: 'Invalid format. Use csv or excel' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Template download error:', error);
        return NextResponse.json(
            { error: 'Failed to generate template' },
            { status: 500 }
        );
    }
}
