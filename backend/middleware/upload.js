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

const PROFILE_FOLDER = 'ecodash/profiles';
const PROFILE_MAX_BYTES = 5 * 1024 * 1024;

// One profile photo, squared around the face so it fits the round avatar
const profilePhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: PROFILE_FOLDER,
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'heic'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  },
});

const profilePhotoMulter = multer({
  storage: profilePhotoStorage,
  limits: { fileSize: PROFILE_MAX_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'photo' && file.mimetype.startsWith('image/')) cb(null, true);
    else cb(Object.assign(new Error('Please choose an image file (JPG, PNG, WebP or HEIC)'), { status: 400 }));
  },
}).single('photo');

// Upload problems are the caller's to fix, so they come back as 400 with a clear
// message — never 500, and never 401 (the mobile app signs out on any 401)
const profilePhotoUpload = (req, res, next) => {
  profilePhotoMulter(req, res, (error) => {
    if (!error) return next();
    const tooLarge = error.code === 'LIMIT_FILE_SIZE';
    const callerError = tooLarge || error.status === 400 || String(error.code || '').startsWith('LIMIT_');
    res.status(callerError ? 400 : 502).json({
      success: false,
      message: tooLarge
        ? 'That photo is too large. Please choose one under 5 MB.'
        : callerError ? error.message : `Could not upload the photo: ${error.message}`,
    });
  });
};

/** Cloudinary public id of one of our profile photos, or null for anything else (e.g. an external URL). */
const profilePhotoPublicId = (url) => {
  const match = /\/upload\/(?:[^/]+\/)*?(?:v\d+\/)?(ecodash\/profiles\/[^.\/]+)(?:\.\w+)?$/.exec(url || '');
  return match ? match[1] : null;
};

/** Best-effort removal of an old profile photo; never throws. */
const deleteProfilePhoto = async (url) => {
  const publicId = profilePhotoPublicId(url);
  if (!publicId) return false;
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    return result?.result === 'ok';
  } catch (error) {
    console.error('Could not delete old profile photo', publicId, error.message);
    return false;
  }
};

module.exports = { offerMediaUpload, profilePhotoUpload, deleteProfilePhoto, profilePhotoPublicId };
