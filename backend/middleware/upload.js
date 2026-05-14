const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });

const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ecodash/offers/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    resource_type: 'image',
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  },
});

const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ecodash/offers/videos',
    allowed_formats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
    resource_type: 'video',
  },
});

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per image
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'images' && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else if (file.fieldname === 'video' && file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB for video
});

// Combined upload: up to 5 images + 1 video
const offerMediaUpload = (req, res, next) => {
  // Use a single multer instance with auto resource_type per field
  const combinedStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      if (file.fieldname === 'video') {
        return {
          folder: 'ecodash/offers/videos',
          resource_type: 'video',
          allowed_formats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
        };
      }
      return {
        folder: 'ecodash/offers/images',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      };
    },
  });

  const upload = multer({
    storage: combinedStorage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.fieldname === 'images' && file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else if (file.fieldname === 'video' && file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type for field "${file.fieldname}"`));
      }
    },
  }).fields([
    { name: 'images', maxCount: 5 },
    { name: 'video', maxCount: 1 },
  ]);

  upload(req, res, next);
};

module.exports = { offerMediaUpload };
