import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { prisma } from './prisma';
import { generateManualId, generateSerialNumber } from './utils';

export interface ImportRow {
    name: string;
    description?: string;
    specifications?: string;
    serialNumber?: string;
    department: string;
    category: string;
    condition?: string;
    isConsumable?: string;
    currentStock?: string;
    minStockLevel?: string;
    location?: string;
    purchaseDate?: string;
    value?: string;
}

export interface ValidationError {
    row: number;
    field: string;
    message: string;
}

export interface BulkImportResult {
    success: boolean;
    imported: number;
    failed: number;
    errors: ValidationError[];
}

/**
 * Parse CSV file buffer to array of objects
 */
export function parseCSV(fileBuffer: Buffer): ImportRow[] {
    try {
        const records = parse(fileBuffer, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        }) as ImportRow[];
        return records;
    } catch (error) {
        console.error('CSV parse error:', error);
        throw new Error('Invalid CSV format');
    }
}

/**
 * Parse Excel file buffer to array of objects
 */
export function parseExcel(fileBuffer: Buffer): ImportRow[] {
    try {
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        return jsonData as ImportRow[];
    } catch (error) {
        console.error('Excel parse error:', error);
        throw new Error('Invalid Excel format');
    }
}

/**
 * Validate a single import row
 */
export async function validateItemRow(
    row: ImportRow,
    rowIndex: number,
    existingSerialNumbers: Set<string>
): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Required fields
    if (!row.name || row.name.trim() === '') {
        errors.push({
            row: rowIndex,
            field: 'name',
            message: 'Name is required',
        });
    }

    if (!row.department || row.department.trim() === '') {
        errors.push({
            row: rowIndex,
            field: 'department',
            message: 'Department is required',
        });
    }

    if (!row.category || row.category.trim() === '') {
        errors.push({
            row: rowIndex,
            field: 'category',
            message: 'Category is required',
        });
    }

    // Validate department exists
    if (row.department) {
        const department = await prisma.department.findFirst({
            where: {
                OR: [
                    { name: row.department },
                    { code: row.department },
                ],
            },
        });

        if (!department) {
            errors.push({
                row: rowIndex,
                field: 'department',
                message: `Department "${row.department}" not found`,
            });
        }
    }

    // Validate category exists
    if (row.category) {
        const category = await prisma.category.findFirst({
            where: { name: row.category },
        });

        if (!category) {
            errors.push({
                row: rowIndex,
                field: 'category',
                message: `Category "${row.category}" not found`,
            });
        }
    }

    // Validate serial number uniqueness
    if (row.serialNumber && row.serialNumber.trim() !== '') {
        // Check against database
        const existingItem = await prisma.item.findFirst({
            where: { serialNumber: row.serialNumber },
        });

        if (existingItem) {
            errors.push({
                row: rowIndex,
                field: 'serialNumber',
                message: `Serial number "${row.serialNumber}" already exists in database`,
            });
        }

        // Check against current import batch
        if (existingSerialNumbers.has(row.serialNumber)) {
            errors.push({
                row: rowIndex,
                field: 'serialNumber',
                message: `Duplicate serial number "${row.serialNumber}" in import file`,
            });
        } else {
            existingSerialNumbers.add(row.serialNumber);
        }
    }

    // Validate condition enum
    if (row.condition) {
        const validConditions = ['NEW', 'GOOD', 'FAIR', 'DAMAGED', 'UNDER_REPAIR'];
        if (!validConditions.includes(row.condition.toUpperCase())) {
            errors.push({
                row: rowIndex,
                field: 'condition',
                message: `Invalid condition. Must be one of: ${validConditions.join(', ')}`,
            });
        }
    }

    // Validate numeric fields
    if (row.value && isNaN(parseFloat(row.value))) {
        errors.push({
            row: rowIndex,
            field: 'value',
            message: 'Value must be a number',
        });
    }

    if (row.currentStock && isNaN(parseInt(row.currentStock))) {
        errors.push({
            row: rowIndex,
            field: 'currentStock',
            message: 'Current stock must be a number',
        });
    }

    if (row.minStockLevel && isNaN(parseInt(row.minStockLevel))) {
        errors.push({
            row: rowIndex,
            field: 'minStockLevel',
            message: 'Min stock level must be a number',
        });
    }

    // Validate date
    if (row.purchaseDate && isNaN(Date.parse(row.purchaseDate))) {
        errors.push({
            row: rowIndex,
            field: 'purchaseDate',
            message: 'Invalid date format. Use YYYY-MM-DD',
        });
    }

    return errors;
}

/**
 * Bulk create items from validated data
 */
export async function bulkCreateItems(
    rows: ImportRow[],
    userId: string,
    skipInvalid: boolean = true
): Promise<BulkImportResult> {
    const errors: ValidationError[] = [];
    let imported = 0;
    let failed = 0;
    const existingSerialNumbers = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowIndex = i + 2; // +2 because row 1 is header, and array is 0-indexed

        try {
            // Validate row
            const rowErrors = await validateItemRow(row, rowIndex, existingSerialNumbers);

            if (rowErrors.length > 0) {
                errors.push(...rowErrors);
                failed++;
                if (!skipInvalid) {
                    // If not skipping invalid, stop here
                    throw new Error('Validation failed');
                }
                continue;
            }

            // Find department
            const department = await prisma.department.findFirst({
                where: {
                    OR: [
                        { name: row.department },
                        { code: row.department },
                    ],
                },
            });

            // Find category
            const category = await prisma.category.findFirst({
                where: { name: row.category },
            });

            if (!department || !category) {
                failed++;
                continue;
            }

            // Generate manual ID
            const manualId = await generateManualId(department.code);

            // Generate serial number if not provided
            const serialNumber = row.serialNumber && row.serialNumber.trim() !== ''
                ? row.serialNumber
                : await generateSerialNumber(department.code);

            // Parse boolean
            const isConsumable = row.isConsumable?.toLowerCase() === 'true' ||
                row.isConsumable?.toLowerCase() === 'yes' ||
                row.isConsumable === '1';

            // Create item
            await prisma.item.create({
                data: {
                    name: row.name,
                    manualId,
                    description: row.description || null,
                    specifications: row.specifications || null,
                    serialNumber,
                    departmentId: department.id,
                    categoryId: category.id,
                    condition: (row.condition?.toUpperCase() as any) || 'GOOD',
                    status: 'AVAILABLE',
                    isConsumable,
                    currentStock: row.currentStock ? parseInt(row.currentStock) : null,
                    minStockLevel: row.minStockLevel ? parseInt(row.minStockLevel) : null,
                    location: row.location || null,
                    purchaseDate: row.purchaseDate ? new Date(row.purchaseDate) : null,
                    value: row.value ? parseFloat(row.value) : null,
                    addedById: userId,
                },
            });

            imported++;
        } catch (error) {
            console.error(`Error importing row ${rowIndex}:`, error);
            errors.push({
                row: rowIndex,
                field: 'general',
                message: error instanceof Error ? error.message : 'Unknown error',
            });
            failed++;

            if (!skipInvalid) {
                break;
            }
        }
    }

    return {
        success: failed === 0,
        imported,
        failed,
        errors,
    };
}

/**
 * Generate CSV template with headers and sample data
 */
export function generateCSVTemplate(): string {
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
        'value',
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

    // Convert to CSV format
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

    return csvRows.join('\n') + '\n';
}

/**
 * Generate Excel template with headers and sample data
 */
export function generateExcelTemplate(): Buffer {
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
        'value',
    ];

    // Sample data rows
    const sampleData = [
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
            25
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
            55
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
            500,
            50,
            'Electronics Lab',
            '2024-01-10',
            5
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
            200,
            20,
            'Electronics Lab',
            '2024-01-10',
            3
        ]
    ];

    // Combine headers and data
    const worksheetData = [headers, ...sampleData];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

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

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Items');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
