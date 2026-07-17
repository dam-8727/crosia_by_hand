const express = require('express');
const multer = require('multer');
const { protect, adminOnly } = require('../middleware/auth');
const { cloudinary, cloudinaryEnabled } = require('../config/cloudinary');

const router = express.Router();

// Keep the file in memory (never written to the ephemeral disk), max 5 MB, images only.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

function streamUpload(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'crosia_by_hand' },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });
}

// Wrap multer so its errors return clean 400 messages instead of a generic 500
function uploadSingle(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (err) {
      const msg =
        err.code === 'LIMIT_FILE_SIZE' ? 'Image must be under 5 MB' : err.message;
      return res.status(400).json({ message: msg });
    }
    next();
  });
}

// POST /api/upload  (admin, multipart form field: "image")
router.post('/', protect, adminOnly, uploadSingle, async (req, res) => {
  if (!cloudinaryEnabled) {
    return res
      .status(503)
      .json({ message: 'Image upload is not configured. Add Cloudinary keys to .env.' });
  }
  if (!req.file) {
    return res.status(400).json({ message: 'No image file provided' });
  }

  try {
    const result = await streamUpload(req.file.buffer);
    res.status(201).json({ url: result.secure_url });
  } catch (err) {
    console.error('Cloudinary upload failed:', err.message);
    res.status(500).json({ message: 'Image upload failed' });
  }
});

module.exports = router;
