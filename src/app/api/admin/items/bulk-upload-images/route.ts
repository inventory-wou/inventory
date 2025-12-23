import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

interface UploadResult {
    filename: string;
    url: string;
    success: boolean;
    error?: string;
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !['ADMIN', 'INCHARGE'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No files provided' }, { status: 400 });
        }

        // Limit to 50 images
        if (files.length > 50) {
            return NextResponse.json(
                { error: 'Too many files. Maximum 50 images allowed.' },
                { status: 400 }
            );
        }

        const results: UploadResult[] = [];
        let successCount = 0;
        let failCount = 0;

        // Upload each image
        for (const file of files) {
            try {
                // Validate file type
                const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                if (!validTypes.includes(file.type)) {
                    results.push({
                        filename: file.name,
                        url: '',
                        success: false,
                        error: 'Invalid file type'
                    });
                    failCount++;
                    continue;
                }

                // Validate file size (5MB max)
                const maxSize = 5 * 1024 * 1024;
                if (file.size > maxSize) {
                    results.push({
                        filename: file.name,
                        url: '',
                        success: false,
                        error: 'File too large (max 5MB)'
                    });
                    failCount++;
                    continue;
                }

                // Convert to buffer
                const bytes = await file.arrayBuffer();
                const buffer = Buffer.from(bytes);

                // Upload to Cloudinary
                const uploadResult = await new Promise<any>((resolve, reject) => {
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
                            resource_type: 'image'
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    ).end(buffer);
                });

                results.push({
                    filename: file.name,
                    url: uploadResult.secure_url,
                    success: true
                });
                successCount++;
            } catch (error: any) {
                results.push({
                    filename: file.name,
                    url: '',
                    success: false,
                    error: error.message || 'Upload failed'
                });
                failCount++;
            }
        }

        return NextResponse.json({
            success: true,
            uploaded: successCount,
            failed: failCount,
            total: files.length,
            results
        });
    } catch (error) {
        console.error('Batch upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload images' },
            { status: 500 }
        );
    }
}
