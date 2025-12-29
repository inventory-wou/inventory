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

        // Define template headers - IMPORTANT: Use 'department' and 'category' not 'departmentCode' and 'categoryName'
        const headers = [
            'name',
            'description',
            'specifications',
            'serialNumber',
            'department',
            'category',
            'condition',
            'isConsumable',
            'currentStock',
            'minStockLevel',
            'location',
            'purchaseDate',
            'value'
        ];

        // Sample data rows
        const sampleRows = [
            [
                'Arduino Uno R3',
                'Microcontroller board based on ATmega328P',
                'Operating Voltage: 5V; Digital I/O Pins: 14',
                'A000066',
                'ROBO',
                'Microcontrollers',
                'NEW',
                'FALSE',
                '',
                '',
                'Lab-Room',
                '2024-01-15',
                '25'
            ],
            [
                'Raspberry Pi 4',
                'Single-board computer with 4GB RAM',
                'Processor: Quad-core ARM Cortex-A72; RAM: 4GB LPDDR4',
                'RPI4B-4GB',
                'ROBO',
                'Computers',
                'NEW',
                'FALSE',
                '',
                '',
                'Storage Cabinet',
                '2024-02-20',
                '55'
            ],
            [
                'Resistor Pack 100Ω',
                'Pack of 100 resistors at 100Ω',
                'Resistance: 100Ω; Tolerance: ±5%; Power: 0.25W',
                '',
                'ROBO',
                'Electronic Components',
                'NEW',
                'TRUE',
                '500',
                '50',
                'Electronics Lab',
                '2024-01-10',
                '5'
            ],
            [
                'LED Pack Red 5mm',
                'Pack of 50 red LEDs',
                'Wavelength: 620-630nm; Forward Voltage: 2.0V',
                '',
                'ROBO',
                'Electronic Components',
                'NEW',
                'TRUE',
                '200',
                '20',
                'Electronics Lab',
                '2024-01-10',
                '3'
            ]
        ];

        if (format === 'csv') {
            // Generate CSV with proper quoting
            const csvRows = [
                headers.join(','),
                ...sampleRows.map(row => row.map(cell => {
                    // Quote cells that contain commas or special characters
                    if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                        return `"${cell.replace(/"/g, '""')}"`;
                    }
                    return cell;
                }).join(','))
            ];

            const csvContent = csvRows.join('\n') + '\n';

            return new NextResponse(csvContent, {
                status: 200,
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': 'attachment; filename="items-import-template.csv"'
                }
            });
        } else if (format === 'excel') {
            // Generate proper Excel file using xlsx library
            const XLSX = require('xlsx');

            // Create workbook and worksheet
            const workbook = XLSX.utils.book_new();

            // Create data array with headers and samples
            const data = [headers, ...sampleRows];

            // Convert to worksheet
            const worksheet = XLSX.utils.aoa_to_sheet(data);

            // Set column widths for better readability
            worksheet['!cols'] = [
                { wch: 20 },  // name
                { wch: 35 },  // description
                { wch: 40 },  // specifications
                { wch: 15 },  // serialNumber
                { wch: 12 },  // department
                { wch: 20 },  // category
                { wch: 12 },  // condition
                { wch: 12 },  // isConsumable
                { wch: 12 },  // currentStock
                { wch: 12 },  // minStockLevel
                { wch: 15 },  // location
                { wch: 12 },  // purchaseDate
                { wch: 10 },  // value
            ];

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Items');

            // Generate Excel buffer
            const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

            return new NextResponse(excelBuffer, {
                status: 200,
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
