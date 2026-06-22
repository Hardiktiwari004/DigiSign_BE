import { cloudinary } from '../config/cloudinary';
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads a PDF buffer directly to Cloudinary via a stream.
 * Avoids saving files to the local disk, which is essential for serverless or containerized environments.
 *
 * @param fileBuffer The PDF file as a memory buffer
 * @returns Promise resolving to the Cloudinary secure URL
 */
export const uploadPdfToCloudinary = (fileBuffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'digital_signatures/documents',
        resource_type: 'raw', // PDFs must be uploaded as raw or image depending on use case. 'raw' ensures it is kept exactly as is.
        public_id: `doc_${uuidv4()}`,
      },
      (error, result) => {
        if (error || !result) {
          console.error('Cloudinary PDF upload error:', error);
          reject(new Error('Failed to upload document to storage'));
        } else {
          resolve(result.secure_url);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Uploads a base64 encoded image string directly to Cloudinary.
 * Used to store the isolated signature image separately from the PDF.
 *
 * @param base64Image The image as a base64 data URI (e.g. data:image/png;base64,...)
 * @returns Promise resolving to the Cloudinary secure URL
 */
export const uploadImageToCloudinary = async (base64Image: string): Promise<string> => {
  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: 'digital_signatures/signatures',
      resource_type: 'image',
      public_id: `sig_${uuidv4()}`,
    });

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary Image upload error:', error);
    throw new Error('Failed to upload signature image to storage');
  }
};
