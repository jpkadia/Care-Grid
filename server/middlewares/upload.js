const multer = require('multer');

const storage = multer.memoryStorage();
const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const fileFilter = (req, file, cb) => {
  if (allowedImageTypes.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 9,
    fields: 30,
    fieldSize: 20 * 1024
  },
  fileFilter: fileFilter
});

upload.validateImages = (req, res, next) => {
  const files = Object.values(req.files || {}).flat();
  const validSignature = file => {
    const buffer = file.buffer;
    if (file.mimetype === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    if (file.mimetype === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (file.mimetype === 'image/webp') return buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP';
    return false;
  };
  if (files.some(file => !validSignature(file))) {
    return res.status(400).json({ success: false, message: 'One or more uploaded images are invalid or corrupted' });
  }
  next();
};

module.exports = upload;
