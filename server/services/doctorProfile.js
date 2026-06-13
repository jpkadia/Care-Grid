const Doctor = require('../models/Doctor');
const { uploadToCloudinary, deleteFromCloudinary } = require('./cloudinary');

const personalFields = ['education', 'speciality', 'clinicName', 'location', 'phone', 'workDays', 'visitingHours'];
const contentFields = ['about', 'tagline', 'heroHeadline'];

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const uploadImages = async files => {
  const results = await Promise.allSettled(files.map(file => uploadToCloudinary(file.buffer, 'image')));
  const urls = results.filter(result => result.status === 'fulfilled').map(result => result.value);
  const failed = results.find(result => result.status === 'rejected');
  if (failed) {
    await Promise.allSettled(urls.map(url => deleteFromCloudinary(url)));
    throw failed.reason;
  }
  return urls;
};

const cleanupUploadedMedia = async urls => {
  await Promise.allSettled(urls.filter(Boolean).map(url => deleteFromCloudinary(url)));
};

const applyDoctorProfileUpdate = async ({ doctor, body, files, allowEmailChange = false }) => {
  const newUploads = [];
  const oldMedia = [];

  try {
    const profilePhoto = files?.profilePhoto?.[0];
    const sliderImages = files?.sliderImages || [];

    if (profilePhoto) {
      const uploadedPhoto = await uploadToCloudinary(profilePhoto.buffer, 'image');
      newUploads.push(uploadedPhoto);
      if (doctor.photoUrl) oldMedia.push(doctor.photoUrl);
      doctor.photoUrl = uploadedPhoto;
    }

    if (sliderImages.length) {
      const uploadedGallery = await uploadImages(sliderImages);
      newUploads.push(...uploadedGallery);
      oldMedia.push(...(doctor.sliderImages || []));
      doctor.sliderImages = uploadedGallery;
    }

    if (!doctor.personalDetails) doctor.personalDetails = {};
    if (!doctor.aiContent) doctor.aiContent = {};

    if (hasOwn(body, 'name')) doctor.name = body.name;
    if (hasOwn(body, 'theme')) doctor.theme = body.theme;

    personalFields.forEach(field => {
      if (hasOwn(body, field)) doctor.personalDetails[field] = body[field];
    });

    if (allowEmailChange && hasOwn(body, 'email')) {
      const email = body.email.toLowerCase().trim();
      const duplicate = await Doctor.exists({ _id: { $ne: doctor._id }, 'personalDetails.email': email });
      if (duplicate) {
        const error = new Error('Another doctor account already uses this email address.');
        error.statusCode = 409;
        throw error;
      }
      doctor.personalDetails.email = email;
    }

    contentFields.forEach(field => {
      if (hasOwn(body, field)) doctor.aiContent[field] = body[field];
    });
    if (hasOwn(body, 'services')) {
      doctor.aiContent.services = body.services.split(',').map(service => service.trim()).filter(Boolean);
    }

    await doctor.save();
  } catch (error) {
    await cleanupUploadedMedia(newUploads);
    throw error;
  }

  // Old media is removed only after the database update succeeds.
  await cleanupUploadedMedia(oldMedia);

  const response = doctor.toObject();
  delete response.password;
  delete response.authVersion;
  return response;
};

module.exports = { applyDoctorProfileUpdate };
