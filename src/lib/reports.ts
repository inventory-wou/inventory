import ExcelJS from 'exceljs';

/**
 * Generate Excel file for inventory report
 */
export async function generateInventoryExcel(items: any[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventory Report');

    // Define columns
    worksheet.columns = [
        { header: 'Manual ID', key: 'manualId', width: 12 },
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Category', key: 'category', width: 18 },
        { header: 'Department', key: 'department', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Condition', key: 'condition', width: 12 },
        { header: 'Location', key: 'location', width: 20 },
        { header: 'Purchase Date', key: 'purchaseDate', width: 14 },
        { header: 'Value', key: 'value', width: 12 },
        { header: 'Serial Number', key: 'serialNumber', width: 18 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' }, // primary color
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 25;

    // Add data rows
    items.forEach((item) => {
        worksheet.addRow({
            manualId: item.manualId,
            name: item.name,
            category: item.category?.name || 'N/A',
            department: item.department?.name || 'N/A',
            status: item.status,
            condition: item.condition,
            location: item.location || 'N/A',
            purchaseDate: item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString() : 'N/A',
            value: item.value ? `$${item.value.toFixed(2)}` : 'N/A',
            serialNumber: item.serialNumber || 'N/A',
        });
    });

    // Auto-filter
    worksheet.autoFilter = {
        from: 'A1',
        to: `J1`,
    };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
}

/**
 * Generate Excel file for issue history report
 */
export async function generateIssueHistoryExcel(records: any[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Issue History');

    // Define columns
    worksheet.columns = [
        { header: 'Issue ID', key: 'id', width: 12 },
        { header: 'User Name', key: 'userName', width: 20 },
        { header: 'User Email', key: 'userEmail', width: 25 },
        { header: 'Item', key: 'item', width: 25 },
        { header: 'Manual ID', key: 'manualId', width: 12 },
        { header: 'Department', key: 'department', width: 15 },
        { header: 'Issue Date', key: 'issueDate', width: 14 },
        { header: 'Expected Return', key: 'expectedReturn', width: 14 },
        { header: 'Actual Return', key: 'actualReturn', width: 14 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Condition on Return', key: 'returnCondition', width: 16 },
        { header: 'Damage Remarks', key: 'damageRemarks', width: 30 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 25;

    // Add data rows
    records.forEach((record) => {
        const isOverdue = !record.actualReturnDate && new Date(record.expectedReturnDate) < new Date();
        const status = record.actualReturnDate ? 'Returned' : isOverdue ? 'Overdue' : 'Active';

        worksheet.addRow({
            id: record.id.substring(0, 8),
            userName: record.user?.name || 'N/A',
            userEmail: record.user?.email || 'N/A',
            item: record.item?.name || 'N/A',
            manualId: record.item?.manualId || 'N/A',
            department: record.department?.name || 'N/A',
            issueDate: new Date(record.issueDate).toLocaleDateString(),
            expectedReturn: new Date(record.expectedReturnDate).toLocaleDateString(),
            actualReturn: record.actualReturnDate
                ? new Date(record.actualReturnDate).toLocaleDateString()
                : 'Not returned',
            status,
            returnCondition: record.returnCondition || 'N/A',
            damageRemarks: record.damageRemarks || 'None',
        });
    });

    // Auto-filter
    worksheet.autoFilter = {
        from: 'A1',
        to: 'L1',
    };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
}

/**
 * Generate Excel file for overdue items report
 */
export async function generateOverdueExcel(overdueItems: any[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Overdue Items');

    // Define columns
    worksheet.columns = [
        { header: 'Item', key: 'item', width: 25 },
        { header: 'Manual ID', key: 'manualId', width: 12 },
        { header: 'User Name', key: 'userName', width: 20 },
        { header: 'User Email', key: 'userEmail', width: 25 },
        { header: 'User Phone', key: 'userPhone', width: 16 },
        { header: 'Department', key: 'department', width: 15 },
        { header: 'Issue Date', key: 'issueDate', width: 14 },
        { header: 'Expected Return', key: 'expectedReturn', width: 14 },
        { header: 'Days Overdue', key: 'daysOverdue', width: 14 },
    ];

    // Style headerrow
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEF4444' }, // red for overdue
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 25;

    // Add data rows
    const now = new Date();
    overdueItems.forEach((record) => {
        const expectedReturn = new Date(record.expectedReturnDate);
        const daysOverdue = Math.floor((now.getTime() - expectedReturn.getTime()) / (1000 * 60 * 60 * 24));

        worksheet.addRow({
            item: record.item?.name || 'N/A',
            manualId: record.item?.manualId || 'N/A',
            userName: record.user?.name || 'N/A',
            userEmail: record.user?.email || 'N/A',
            userPhone: record.user?.phone || 'N/A',
            department: record.department?.name || 'N/A',
            issueDate: new Date(record.issueDate).toLocaleDateString(),
            expectedReturn: expectedReturn.toLocaleDateString(),
            daysOverdue,
        });
    });

    // Auto-filter
    worksheet.autoFilter = {
        from: 'A1',
        to: 'I1',
    };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
}
