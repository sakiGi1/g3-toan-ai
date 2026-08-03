/**
 * Cloudinary Storage Helper
 * Uploads evidence files or provides data URL fallback
 */

export interface CloudinaryUploadResult {
  fileUrl: string;
  fileType: string;
  publicId?: string;
}

export async function uploadToCloudinary(
  fileBufferOrBase64: string,
  fileName: string,
  mimeType: string
): Promise<CloudinaryUploadResult> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  // If Cloudinary environment credentials are missing, use base64 / data URL format directly
  if (!cloudName || !apiKey || !apiSecret) {
    let finalUrl = fileBufferOrBase64;
    if (!fileBufferOrBase64.startsWith('data:')) {
      finalUrl = `data:${mimeType};base64,${fileBufferOrBase64}`;
    }

    return {
      fileUrl: finalUrl,
      fileType: mimeType.startsWith('image/')
        ? 'Hình ảnh'
        : mimeType.includes('pdf')
        ? 'Tài liệu PDF'
        : 'Tập tin Minh chứng',
    };
  }

  try {
    const formData = new FormData();
    formData.append('file', fileBufferOrBase64);
    formData.append('upload_preset', 'ml_default');
    formData.append('api_key', apiKey);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();
    if (data.secure_url) {
      return {
        fileUrl: data.secure_url,
        fileType: data.resource_type || 'file',
        publicId: data.public_id,
      };
    } else {
      throw new Error(data.error?.message || 'Cloudinary upload failed');
    }
  } catch (error) {
    console.error('Cloudinary error, falling back to data URL:', error);
    let finalUrl = fileBufferOrBase64;
    if (!fileBufferOrBase64.startsWith('data:')) {
      finalUrl = `data:${mimeType};base64,${fileBufferOrBase64}`;
    }
    return {
      fileUrl: finalUrl,
      fileType: mimeType.startsWith('image/') ? 'Hình ảnh' : 'Tài liệu',
    };
  }
}
