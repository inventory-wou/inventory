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

export interface CellError {
    row: number;
    column: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
}

export interface DuplicateCheck {
    row: number;
    serialNumber: string;
    existingItemId?: string;
    fieldsMatch: boolean;
    differences?: string[];
    suggestedSerialNumber?: string;
}

export interface BulkImportResult {
    success: boolean;
    imported: number;
    failed: number;
    errors: ValidationError[];
    missingDepartments?: string[];
    missingCategories?: string[];
    createdDepartments?: number;
    createdCategories?: number;
    // New fields for interactive validation
    cellErrors?: CellError[];
    duplicates?: DuplicateCheck[];
    validationData?: ImportRow[];
    quantityUpdates?: number; // Count of quantity updates for duplicates
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
 * Check if serial number exists and compare fields
 */
export async function checkDuplicateSerialNumber(
    serialNumber: string,
    rowData: ImportRow,
    rowIndex: number
): Promise<DuplicateCheck> {
    if (!serialNumber || serialNumber.trim() === '') {
        return {
            row: rowIndex,
            serialNumber: '',
            fieldsMatch: false,
        };
    }

    try {
        const existing = await prisma.item.findFirst({
            where: { serialNumber: serialNumber.trim() },
            include: {
                category: true,
                department: true
            }
        });

        if (!existing) {
            return {
                row: rowIndex,
                serialNumber,
                fieldsMatch: false,
            };
        }

        // Check if all key fields match
        const differences: string[] = [];

        if (existing.name !== rowData.name) differences.push('name');
        if (existing.category.name !== rowData.category) differences.push('category');
        if (existing.department.name !== rowData.department &&
            existing.department.code !== rowData.department) {
            differences.push('department');
        }

        const fieldsMatch = differences.length === 0;

        // Generate suggested serial number if conflict
        let suggestedSerialNumber: string | undefined;
        if (!fieldsMatch && existing.department) {
            try {
                suggestedSerialNumber = await generateSerialNumber(existing.department.code);
            } catch (error) {
                console.error('Error generating suggested serial number:', error);
            }
        }

        return {
            row: rowIndex,
            serialNumber,
            existingItemId: existing.id,
            fieldsMatch,
            differences: fieldsMatch ? undefined : differences,
            suggestedSerialNumber,
        };
    } catch (error) {
        console.error(`Error checking duplicate for ${serialNumber}:`, error);
        return {
            row: rowIndex,
            serialNumber,
            fieldsMatch: false,
        };
    }
}

/**
 * Create missing departments and categories
 */
export async function createMissingEntities(
    missingDepartments: string[],
    missingCategories: string[],
    userId: string
): Promise<{ createdDepartments: number; createdCategories: number }> {
    let createdDepartments = 0;
    let createdCategories = 0;

    // Create missing departments
    for (const deptName of missingDepartments) {
        try {
            // Generate a simple code from name (first 4 chars uppercase)
            const code = deptName.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '') +
                Math.random().toString(36).substring(2, 4).toUpperCase();

            await prisma.department.create({
                data: {
                    name: deptName,
                    code: code,
                    description: `Auto-created during bulk import`,
                },
            });
            createdDepartments++;
        } catch (error) {
            console.error(`Failed to create department ${deptName}:`, error);
        }
    }

    // Create missing categories
    for (const catName of missingCategories) {
        try {
            await prisma.category.create({
                data: {
                    name: catName,
                    description: `Auto-created during bulk import`,
                },
            });
            createdCategories++;
        } catch (error) {
            console.error(`Failed to create category ${catName}:`, error);
        }
    }

    return { createdDepartments, createdCategories };
}

/**
 * Comprehensive validation with duplicate checking and cell-level errors
 */
export async function validateWithDuplicates(
    rows: ImportRow[]
): Promise<{
    cellErrors: CellError[];
    duplicates: DuplicateCheck[];
    validationData: ImportRow[];
}> {
    const cellErrors: CellError[] = [];
    const duplicates: DuplicateCheck[] = [];
    const existingSerialNumbers = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowIndex = i + 2; // +2 because row 1 is header

        // Basic field validation
        const rowErrors = await validateItemRow(row, rowIndex, existingSerialNumbers);

        // Convert ValidationError[] to CellError[]
        for (const error of rowErrors) {
            cellErrors.push({
                row: error.row,
                column: error.field,
                message: error.message,
                severity: 'error'
            });
        }

        // Check for duplicate serial numbers
        if (row.serialNumber && row.serialNumber.trim() !== '') {
            const duplicateCheck = await checkDuplicateSerialNumber(
                row.serialNumber,
                row,
                rowIndex
            );

            if (duplicateCheck.existingItemId) {
                duplicates.push(duplicateCheck);

                // Add info/warning based on match status
                if (duplicateCheck.fieldsMatch) {
                    cellErrors.push({
                        row: rowIndex,
                        column: 'serialNumber',
                        message: 'Serial number exists. Quantity will be updated.',
                        severity: 'info'
                    });
                } else {
                    cellErrors.push({
                        row: rowIndex,
                        column: 'serialNumber',
                        message: `Serial number exists for different item. Fields differ: ${duplicateCheck.differences?.join(', ')}`,
                        severity: 'warning'
                    });
                }
            }
        }
    }

    return {
        cellErrors,
        duplicates,
        validationData: rows
    };
}

/**
 * Bulk create items from validated data
 */
export async function bulkCreateItems(
    rows: ImportRow[],
    userId: string,
    skipInvalid: boolean = true,
    autoCreateMissing: boolean = false
): Promise<BulkImportResult> {
    const errors: ValidationError[] = [];
    let imported = 0;
    let failed = 0;
    const existingSerialNumbers = new Set<string>();
    const missingDepartmentsSet = new Set<string>();
    const missingCategoriesSet = new Set<string>();

    // First pass: validate and collect missing entities
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowIndex = i + 2; // +2 because row 1 is header, and array is 0-indexed

        try {
            // Basic validation
            const rowErrors = await validateItemRow(row, rowIndex, existingSerialNumbers);

            if (rowErrors.length > 0) {
                errors.push(...rowErrors);
                continue;
            }

            // Check if department exists
            const department = await prisma.department.findFirst({
                where: {
                    OR: [
                        { name: row.department },
                        { code: row.department },
                    ],
                },
            });

            if (!department) {
                missingDepartmentsSet.add(row.department);
            }

            // Check if category exists
            const category = await prisma.category.findFirst({
                where: { name: row.category },
            });

            if (!category) {
                missingCategoriesSet.add(row.category);
            }
        } catch (error) {
            console.error(`Error validating row ${rowIndex}:`, error);
        }
    }

    const missingDepartments = Array.from(missingDepartmentsSet);
    const missingCategories = Array.from(missingCategoriesSet);

    // If there are missing entities and auto-create is enabled, create them
    let createdDepartments = 0;
    let createdCategories = 0;

    if (autoCreateMissing && (missingDepartments.length > 0 || missingCategories.length > 0)) {
        const created = await createMissingEntities(missingDepartments, missingCategories, userId);
        createdDepartments = created.createdDepartments;
        createdCategories = created.createdCategories;
    }

    // If not auto-creating and there are missing entities, add errors and return
    if (!autoCreateMissing && (missingDepartments.length > 0 || missingCategories.length > 0)) {
        // Add errors for missing entities
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowIndex = i + 2;

            if (missingDepartments.includes(row.department)) {
                errors.push({
                    row: rowIndex,
                    field: 'department',
                    message: `Department "${row.department}" not found`,
                });
                failed++;
            }

            if (missingCategories.includes(row.category)) {
                errors.push({
                    row: rowIndex,
                    field: 'category',
                    message: `Category "${row.category}" not found`,
                });
                failed++;
            }
        }

        return {
            success: false,
            imported: 0,
            failed,
            errors,
            missingDepartments,
            missingCategories,
        };
    }

    // Second pass: import items
    const finalExistingSerialNumbers = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowIndex = i + 2;

        try {
            // Re-validate row
            const rowErrors = await validateItemRow(row, rowIndex, finalExistingSerialNumbers);

            if (rowErrors.length > 0) {
                failed++;
                if (!skipInvalid) {
                    throw new Error('Validation failed');
                }
                continue;
            }

            // Find department (should exist now)
            const department = await prisma.department.findFirst({
                where: {
                    OR: [
                        { name: row.department },
                        { code: row.department },
                    ],
                },
            });

            // Find category (should exist now)
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

            // Check for duplicate serial number
            const duplicateCheck = await checkDuplicateSerialNumber(serialNumber, row, rowIndex);

            if (duplicateCheck.existingItemId && duplicateCheck.fieldsMatch) {
                // Matching duplicate: Update quantity
                const quantityToAdd = row.currentStock ? parseInt(row.currentStock) : 0;

                if (quantityToAdd > 0) {
                    const existingItem = await prisma.item.findUnique({
                        where: { id: duplicateCheck.existingItemId }
                    });

                    if (existingItem) {
                        await prisma.item.update({
                            where: { id: duplicateCheck.existingItemId },
                            data: {
                                currentStock: (existingItem.currentStock || 0) + quantityToAdd
                            }
                        });
                        imported++; // Count as successful import (quantity update)
                    }
                } else {
                    imported++; // Count as import even if no quantity to add
                }
            } else if (duplicateCheck.existingItemId && !duplicateCheck.fieldsMatch) {
                // Conflicting duplicate: Skip this row (user should resolve in frontend)
                errors.push({
                    row: rowIndex,
                    field: 'serialNumber',
                    message: `Serial number conflict: Fields differ (${duplicateCheck.differences?.join(', ')})`,
                });
                failed++;
                continue;
            } else {
                // No duplicate: Create new item
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
            }
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
        missingDepartments: missingDepartments.length > 0 ? missingDepartments : undefined,
        missingCategories: missingCategories.length > 0 ? missingCategories : undefined,
        createdDepartments: createdDepartments > 0 ? createdDepartments : undefined,
        createdCategories: createdCategories > 0 ? createdCategories : undefined,
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
