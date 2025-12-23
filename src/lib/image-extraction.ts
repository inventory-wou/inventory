import ExcelJS from 'exceljs';
import AdmZip from 'adm-zip';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

interface ImageMapping {
    rowIndex: number;
    filename: string;
    cloudinaryUrl: string;
}

/**
 * Upload image buffer to Cloudinary
 */
async function uploadImageToCloudinary(buffer: Buffer, filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder: 'inventory-items',
                allowed_formats: ['jpg', 'png', 'webp', 'jpeg'],
                transformation: [
                    {
                        width: 600,
                        height: 400,
                        crop: 'fit',
                        quality: 'auto:good',
                        fetch_format: 'auto'
                    }
                ],
                resource_type: 'image',
                public_id: filename.replace(/\.[^/.]+$/, '') // Remove extension
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result!.secure_url);
            }
        ).end(buffer);
    });
}

/**
 * Extract images from Excel file using ExcelJS
 */
export async function extractExcelImages(fileBuffer: Buffer): Promise<Map<number, string>> {
    const imageMap = new Map<number, string>();

    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(fileBuffer as any); // Cast to any for type compatibility

        const worksheet = workbook.worksheets[0];
        if (!worksheet) return imageMap;

        // Get all images from the worksheet
        const images = worksheet.getImages();

        // Process each image
        for (const image of images) {
            try {
                // Get image data
                const imageId = image.imageId;
                const imageData = workbook.model.media.find((m: any) => m.index === imageId);

                if (!imageData || !imageData.buffer) continue;

                // Determine row index from image position
                // Excel images have range property with position
                const range = (image as any).range;
                let rowIndex = 1; // Default to first data row

                if (range && range.tl) {
                    // tl = top-left corner
                    rowIndex = range.tl.row ? range.tl.row - 1 : 1; // Subtract 1 for header row
                }

                // Upload to Cloudinary
                const filename = `excel-image-row${rowIndex}-${Date.now()}`;
                const cloudinaryUrl = await uploadImageToCloudinary(
                    Buffer.from(imageData.buffer),
                    filename
                );

                imageMap.set(rowIndex, cloudinaryUrl);
            } catch (err) {
                console.error('Error processing image:', err);
                // Continue with other images
            }
        }

        return imageMap;
    } catch (error) {
        console.error('Excel image extraction error:', error);
        return imageMap;
    }
}

/**
 * Extract images from ZIP file (for CSV imports)
 * ZIP should contain CSV + image files
 */
export async function extractZipImages(zipBuffer: Buffer): Promise<Map<string, string>> {
    const imageMap = new Map<string, string>();

    try {
        const zip = new AdmZip(zipBuffer);
        const zipEntries = zip.getEntries();

        for (const entry of zipEntries) {
            // Skip directories and CSV files
            if (entry.isDirectory || entry.name.toLowerCase().endsWith('.csv')) {
                continue;
            }

            // Check if it's an image file
            const ext = entry.name.toLowerCase();
            if (!ext.match(/\.(jpg|jpeg|png|webp)$/)) {
                continue;
            }

            try {
                // Get image buffer
                const imageBuffer = entry.getData();

                // Upload to Cloudinary
                const filename = entry.name.replace(/\.[^/.]+$/, ''); // Remove extension
                const cloudinaryUrl = await uploadImageToCloudinary(imageBuffer, filename);

                // Map filename (without extension) to URL
                const baseFilename = entry.name.toLowerCase();
                imageMap.set(baseFilename, cloudinaryUrl);
            } catch (err) {
                console.error(`Error uploading ${entry.name}:`, err);
                // Continue with other images
            }
        }

        return imageMap;
    } catch (error) {
        console.error('ZIP extraction error:', error);
        return imageMap;
    }
}

/**
 * Match images to rows by filename
 * For CSV imports with separate image files
 */
export function matchImagesToRows(
    rows: any[],
    imageMap: Map<string, string>
): any[] {
    return rows.map(row => {
        // Check if row has image field that's a filename (not a full URL)
        if (row.image && !row.image.startsWith('http')) {
            const filename = row.image.toLowerCase();

            // Try exact match first
            if (imageMap.has(filename)) {
                row.image = imageMap.get(filename);
            } else {
                // Try without extension
                const baseFilename = filename.replace(/\.[^/.]+$/, '');
                for (const [key, url] of imageMap.entries()) {
                    const baseKey = key.replace(/\.[^/.]+$/, '');
                    if (baseKey === baseFilename) {
                        row.image = url;
                        break;
                    }
                }
            }
        }
        return row;
    });
}

/**
 * Apply Excel image URLs to parsed rows
 */
export function applyExcelImages(
    rows: any[],
    imageMap: Map<number, string>
): any[] {
    return rows.map((row, index) => {
        const rowIndex = index + 1; // +1 because Excel is 1-indexed after header

        if (imageMap.has(rowIndex)) {
            row.image = imageMap.get(rowIndex);
        }

        return row;
    });
}
