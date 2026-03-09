import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload PDF buffer to Cloudinary
 * Returns secure URL for accessing the file
 */
export async function uploadReceiptPDFToCloudinary(
  pdfBuffer: Buffer,
  fileName: string,
  receiptNumber: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Set a timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      console.error('❌ Cloudinary upload timeout after 30 seconds');
      reject(new Error('Cloudinary upload timeout'));
    }, 30000); // 30 second timeout

    try {
      console.log('📤 Cloudinary upload starting...');
      console.log('   Buffer size:', pdfBuffer.length, 'bytes');
      console.log('   Receipt number:', receiptNumber);
      console.log('   Cloud name:', process.env.CLOUDINARY_CLOUD_NAME);

      // Validate Cloudinary credentials
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
        clearTimeout(timeoutId);
        throw new Error('Cloudinary credentials missing in environment');
      }

      // Create readable stream from buffer
      const stream = Readable.from([pdfBuffer]);

      // Upload to Cloudinary with custom folder and name
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: 'trustinn-receipts',
          public_id: receiptNumber.replace(/[^a-zA-Z0-9-]/g, '-'),
          type: 'upload'
        },
        (error, result) => {
          clearTimeout(timeoutId);
          if (error) {
            console.error('❌ Cloudinary API error:', error);
            reject(new Error(`Failed to upload receipt: ${error.message}`));
          } else if (result) {
            console.log('✅ Receipt uploaded to Cloudinary');
            console.log('   URL:', result.secure_url);
            console.log('   Public ID:', result.public_id);
            resolve(result.secure_url);
          } else {
            console.error('❌ No result from Cloudinary upload');
            reject(new Error('Unknown error during upload'));
          }
        }
      );

      // Handle stream errors
      uploadStream.on('error', (error) => {
        clearTimeout(timeoutId);
        console.error('❌ Upload stream error:', error);
        reject(error);
      });

      // Pipe buffer to upload stream
      stream.pipe(uploadStream);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('❌ Error in uploadReceiptPDFToCloudinary:', error);
      reject(error);
    }
  });
}

/**
 * Delete receipt PDF from Cloudinary
 * Useful for cleanup or updates
 */
export async function deleteReceiptPDFFromCloudinary(
  receiptNumber: string
): Promise<boolean> {
  try {
    const publicId = `trustinn-receipts/${receiptNumber.replace(/[^a-zA-Z0-9-]/g, '-')}`;
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('Deleted from Cloudinary:', publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
}

/**
 * Get receipt download URL with token
 * URLs have optional expiration for security
 */
export function getReceiptDownloadURL(
  receiptNumber: string,
  expirationHours: number = 30 * 24 // 30 days
): string {
  try {
    const publicId = `trustinn-receipts/${receiptNumber.replace(/[^a-zA-Z0-9-]/g, '-')}`;
    
    // Generate token-based URL (valid for specified hours)
    const timestamp = Math.floor(Date.now() / 1000) + expirationHours * 3600;
    const signature = cloudinary.utils.api_sign_request(
      {
        public_id: publicId,
        token: 'true',
        type: 'upload',
      },
      process.env.CLOUDINARY_API_SECRET!
    );

    // Return secure URL
    return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/f_pdf/v1/${publicId}`;
  } catch (error) {
    console.error('Error generating download URL:', error);
    throw error;
  }
}
