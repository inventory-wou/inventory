import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'INCHARGE')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format') || 'csv';

        // Define template headers
        const headers = [
            'name',
            'description',
            'serialNumber',
            'departmentCode',
            'categoryName',
            'status',
            'condition',
            'purchaseDate',
            'purchaseValue',
            'location',
            'manufacturer',
            'modelNumber',
            'specifications',
            'isConsumable',
            'currentStock',
            'minStockLevel',
            'imageUrl'
        ];

        // Example row
        const exampleRow = [
            'Arduino Uno R3',
            'Microcontroller board based on ATmega328P',
            'ARD-001',
            'ROBO',
            'Microcontrollers',
            'AVAILABLE',
            'NEW',
            '2024-01-15',
            '25.00',
            'Lab Room 101',
            'Arduino',
            'A000066',
            'Operating Voltage: 5V, Digital I/O Pins: 14',
            'false',
            '',
            '',
            ''
        ];

        if (format === 'csv') {
            // Generate CSV
            const csvContent = [
                headers.join(','),
                exampleRow.map(val => `"${val}"`).join(',')
            ].join('\n');

            return new NextResponse(csvContent, {
                status: 200,
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': 'attachment; filename="items-import-template.csv"'
                }
            });
        } else if (format === 'excel') {
            // For Excel, we'll create a simple CSV format that Excel can open
            // In a production app, you'd use a library like exceljs
            const csvContent = [
                headers.join(','),
                exampleRow.map(val => `"${val}"`).join(',')
            ].join('\n');

            return new NextResponse(csvContent, {
                status: 200,
                headers: {
                    'Content-Type': 'application/vnd.ms-excel',
                    'Content-Disposition': 'attachment; filename="items-import-template.xlsx"'
                }
            });
        }

        return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    } catch (error) {
        console.error('Template generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate template' },
            { status: 500 }
        );
    }
}
