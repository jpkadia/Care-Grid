const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const errors = error.details.reduce((result, detail) => {
      const field = detail.path.join('.');
      if (!result[field]) result[field] = detail.message.replaceAll('"', '');
      return result;
    }, {});
    const errorMessage = Object.values(errors).join(', ');
    return res.status(400).json({ success: false, message: errorMessage, errors });
  }
  req.body = value;
  next();
};

module.exports = validate;
