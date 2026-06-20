const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\d{10}$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,72}$/;

const text = value => String(value || '').trim();

export const passwordHelp = 'Use 8-72 characters with uppercase, lowercase, number, and one special character: @$!%*?&.';

export const validateDoctorRegistration = ({ formData, profilePhoto }) => {
  const errors = {};

  if (text(formData.name).length < 2) errors.name = 'Doctor name must be at least 2 characters.';
  if (text(formData.education).length < 2) errors.education = 'Qualification must be at least 2 characters.';
  if (text(formData.speciality).length < 2) errors.speciality = 'Please select or enter a speciality.';
  if (text(formData.clinicName).length < 2) errors.clinicName = 'Clinic or hospital name must be at least 2 characters.';
  if (text(formData.location).length < 5) errors.location = 'Please enter a complete clinic address.';
  if (!phonePattern.test(text(formData.phone))) errors.phone = 'Mobile number must contain exactly 10 digits.';
  if (!emailPattern.test(text(formData.email).toLowerCase())) errors.email = 'Please enter a valid email address.';
  if (!text(formData.workDays)) errors.workDays = 'Please select work days.';
  if (!text(formData.visitingHours)) errors.visitingHours = 'Please select visiting hours.';
  if (!passwordPattern.test(formData.password || '')) errors.password = passwordHelp;
  if (formData.confirmPassword !== formData.password) errors.confirmPassword = 'Passwords do not match.';
  if (!profilePhoto) errors.profilePhoto = 'Please upload a profile photo.';

  return errors;
};

export const validateDoctorUpdate = values => {
  const errors = {};
  if (text(values.name).length < 2) errors.name = 'Doctor name must be at least 2 characters.';
  if (text(values.education).length < 2) errors.education = 'Qualification must be at least 2 characters.';
  if (text(values.speciality).length < 2) errors.speciality = 'Speciality must be at least 2 characters.';
  if (text(values.clinicName).length < 2) errors.clinicName = 'Clinic or hospital name must be at least 2 characters.';
  if (!phonePattern.test(text(values.phone))) errors.phone = 'Mobile number must contain exactly 10 digits.';
  if (values.email !== undefined && !emailPattern.test(text(values.email).toLowerCase())) errors.email = 'Please enter a valid email address.';
  if (text(values.location).length < 5) errors.location = 'Please enter a complete clinic address.';
  if (!text(values.workDays)) errors.workDays = 'Work days are required.';
  if (!text(values.visitingHours)) errors.visitingHours = 'Visiting hours are required.';
  if (text(values.tagline).length < 3) errors.tagline = 'Tagline must be at least 3 characters.';
  if (text(values.heroHeadline).length < 5) errors.heroHeadline = 'Hero headline must be at least 5 characters.';
  if (text(values.about).length < 20) errors.about = 'About section must be at least 20 characters.';
  if (text(values.services).length < 10) errors.services = 'Please enter at least one clear treatment or service.';
  return errors;
};

export const validateAppointment = values => {
  const errors = {};
  if (text(values.patientName).length < 2) errors.patientName = 'Patient name must be at least 2 characters.';
  if (!/^[+]?[\d\s()-]{7,20}$/.test(text(values.phone))) errors.phone = 'Please enter a valid mobile number.';
  if (text(values.email) && !emailPattern.test(text(values.email).toLowerCase())) errors.email = 'Please enter a valid email address.';
  if (text(values.treatment).length < 2) errors.treatment = 'Please select a treatment.';
  if (!text(values.preferredDate)) errors.preferredDate = 'Please select a preferred date.';
  if (!text(values.timeSlot)) errors.timeSlot = 'Please select a time slot.';
  if (text(values.message).length > 1000) errors.message = 'Message cannot exceed 1000 characters.';
  return errors;
};

export const validateLogin = values => {
  const errors = {};
  if (!text(values.identifier || values.email)) errors.identifier = 'Email or mobile number is required.';
  if (!values.password) errors.password = 'Password is required.';
  return errors;
};

export const validatePasswordReset = values => {
  const errors = {};
  if (!passwordPattern.test(values.newPassword || '')) errors.newPassword = passwordHelp;
  if (values.confirmPassword !== values.newPassword) errors.confirmPassword = 'Passwords do not match.';
  return errors;
};

export const firstError = errors => Object.values(errors).find(Boolean) || '';

export const getApiFieldErrors = error => {
  const details = error?.response?.data?.errors;
  if (!details || typeof details !== 'object') return {};
  return details;
};
