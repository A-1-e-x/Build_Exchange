const multer = require('multer');
const sharp = require('sharp');

// Configure multer to store files in memory as buffer for Cloudinary or custom local writing
const storage = multer.memoryStorage();

// File filter to allow only image files by MIME header
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error('Invalid file type! Only JPG, JPEG, PNG, and WEBP images are allowed.'),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
  },
  fileFilter: fileFilter,
});

/**
 * Validates uploaded file buffers using Sharp to verify genuine image content (magic bytes),
 * preventing spoofed MIME types (e.g., executable disguised as .jpg).
 */
const validateUploadedImages = async (req, res, next) => {
  try {
    const filesToValidate = [];
    if (req.file) {
      filesToValidate.push(req.file);
    }
    if (req.files && Array.isArray(req.files)) {
      filesToValidate.push(...req.files);
    }

    if (filesToValidate.length === 0) {
      return next();
    }

    const validFormats = ['jpeg', 'png', 'webp'];

    for (const file of filesToValidate) {
      if (!file.buffer || file.buffer.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Uploaded file is empty or corrupted.',
        });
      }

      try {
        const metadata = await sharp(file.buffer).metadata();
        if (!metadata || !validFormats.includes(metadata.format)) {
          return res.status(400).json({
            success: false,
            message: `Invalid image content detected. Supported formats are JPEG, PNG, and WEBP. Detected: ${metadata?.format || 'unknown'}.`,
          });
        }
        // Attach genuine verified format to file object for downstream extension safety
        file.detectedFormat = metadata.format;
      } catch (sharpError) {
        return res.status(400).json({
          success: false,
          message: 'File inspection failed: Not a valid image or corrupted image payload.',
        });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = upload;
module.exports.upload = upload;
module.exports.validateUploadedImages = validateUploadedImages;
