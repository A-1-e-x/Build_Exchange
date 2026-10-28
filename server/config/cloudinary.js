const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

/**
 * Configure Cloudinary securely from environment variables.
 * Supports both CLOUDINARY_URL (standard format) and individual variables
 * (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).
 */
const initCloudinaryConfig = () => {
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  } else if (process.env.CLOUDINARY_URL) {
    cloudinary.config(true);
    cloudinary.config({ secure: true });
  } else {
    cloudinary.config(true);
  }
};

initCloudinaryConfig();

const isCloudinaryConfigured = () => {
  initCloudinaryConfig();
  const config = cloudinary.config();
  return Boolean(config.cloud_name && config.api_key && config.api_secret);
};

if (isCloudinaryConfigured()) {
  console.log('[Cloudinary]: Configured successfully with cloud credentials.');
} else {
  console.log('[Cloudinary]: No Cloudinary API keys supplied in .env. Using built-in local static uploads directory as fallback.');
}

/**
 * Saves a file buffer to the local /public/uploads/ directory
 */
const saveToLocalUploads = (file) => {
  const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Derive safe extension from verified detectedFormat or mimetype, NEVER untrusted originalname
  let safeExt = '.jpg';
  if (file.detectedFormat === 'png' || file.mimetype === 'image/png') {
    safeExt = '.png';
  } else if (file.detectedFormat === 'webp' || file.mimetype === 'image/webp') {
    safeExt = '.webp';
  } else {
    safeExt = '.jpg';
  }

  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
  const filePath = path.join(uploadsDir, filename);

  fs.writeFileSync(filePath, file.buffer);
  const publicUrl = `/uploads/${filename}`;

  return {
    url: publicUrl,
    public_id: filename,
  };
};

/**
 * Uploads an image buffer to Cloudinary (or writes to local /uploads/ directory as fallback)
 */
const uploadImage = async (file, folder = 'construction_materials') => {
  if (isCloudinaryConfigured()) {
    try {
      return await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) return reject(error);
            resolve({
              url: result.secure_url,
              public_id: result.public_id,
            });
          }
        );
        uploadStream.end(file.buffer);
      });
    } catch (err) {
      console.warn(
        `[Cloudinary Upload Warning]: Cloudinary upload failed (${err.message}). Falling back to local static storage.`
      );
      return saveToLocalUploads(file);
    }
  } else {
    // Local uploads directory fallback
    return saveToLocalUploads(file);
  }
};

/**
 * Delete image from Cloudinary or local disk
 */
const deleteImage = async (public_id) => {
  if (!public_id || typeof public_id !== 'string') return;
  if (public_id.startsWith('manual_')) return;

  // Check if image exists locally in public/uploads
  const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
  const localFilePath = path.join(uploadsDir, path.basename(public_id));
  if (fs.existsSync(localFilePath)) {
    try {
      fs.unlinkSync(localFilePath);
      return;
    } catch (err) {
      console.warn('Failed to delete local image:', err.message);
    }
  }

  // Attempt Cloudinary deletion if configured
  if (isCloudinaryConfigured()) {
    try {
      await cloudinary.uploader.destroy(public_id);
    } catch (err) {
      console.warn('Failed to delete image from Cloudinary:', err.message);
    }
  }
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadImage,
  deleteImage,
};
