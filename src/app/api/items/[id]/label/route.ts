import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';

/**
 * GET /api/items/[id]/label
 * Generate printable label with QR code for an item
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'INCHARGE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    // Fetch item details
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        department: { select: { name: true, code: true, inchargeId: true } },
        category: { select: { name: true } }
      }
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Incharge access control
    if (session.user.role === 'INCHARGE' && item.department.inchargeId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Generate QR code (encode item URL or manual ID)
    const qrData = `${process.env.NEXTAUTH_URL}/items/${item.id}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Generate HTML for printable label
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Label - ${item.manualId}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    @page {
      size: 4in 2in;
      margin: 0;
    }
    
    body {
      font-family: Arial, sans-serif;
      width: 4in;
      height: 2in;
      padding: 0.25in;
      display: flex;
      flex-direction: column;
      justify-conten: center;
    }
    
    .label-container {
      border: 2px solid #000;
      padding: 0.15in;
      height: 100%;
      display: flex;
      gap: 0.2in;
    }
    
    .qr-section {
      flex-shrink: 0;
    }
    
    .qr-code {
      width: 1.3in;
      height: 1.3in;
      border: 1px solid #ccc;
    }
    
    .info-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    
    .manual-id {
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 4pt;
      font-family: 'Courier New', monospace;
    }
    
    .item-name {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 4pt;
      line-height: 1.2;
    }
    
    .department {
      font-size: 10pt;
      color: #555;
      margin-bottom: 2pt;
    }
    
    .category {
      font-size: 9pt;
      color: #777;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="label-container">
    <div class="qr-section">
      <img src="${qrCodeDataUrl}" alt="QR Code" class="qr-code">
    </div>
    <div class="info-section">
      <div class="manual-id">${item.manualId}</div>
      <div class="item-name">${item.name}</div>
      <div class="department">${item.department.name}</div>
      <div class="category">${item.category.name}</div>
    </div>
  </div>
  
  <script>
    // Auto-print when loaded
    window.onload = function() {
      if (window.location.search.includes('print=true')) {
        window.print();
      }
    }
  </script>
</body>
</html>
    `;

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('Error generating label:', error);
    return NextResponse.json({ error: 'Failed to generate label' }, { status: 500 });
  }
}
