const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = async (fileBuffer, resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType },
      (error, result) => {
        if (error) {
          const serviceError = new Error('Image service is temporarily unavailable. Your existing profile was not changed. Please try again.');
          serviceError.statusCode = 503;
          serviceError.cause = error;
          reject(serviceError);
        } else if (!result?.secure_url) {
          const serviceError = new Error('Image upload did not complete. Your existing profile was not changed. Please try again.');
          serviceError.statusCode = 503;
          reject(serviceError);
        } else {
          resolve(result.secure_url);
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};

const deleteFromCloudinary = async (url) => {
  if (!url) return;
  try {
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      let path = parts[1];
      path = path.replace(/^v\d+\//, '');
      const publicId = path.substring(0, path.lastIndexOf('.'));
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    }
  } catch (error) {
    logger.error("Cloudinary Deletion Error:", error);
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary
};
