const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  const expectedClientError = (err.statusCode && err.statusCode < 500) || err.name === 'MulterError';
  if (!expectedClientError) {
    logger.error(err.message, { stack: err.stack });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, message: 'Invalid JSON request body' });
  }

  if (err.message === 'Only images are allowed') {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File size cannot exceed 5MB' });
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, message: 'The selected files could not be uploaded. Use a maximum of 8 images, each below 5MB.' });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: 'A record with these details already exists' });
  }

  res.status(500).json({ success: false, message: 'Internal Server Error' });
};

module.exports = errorHandler;
