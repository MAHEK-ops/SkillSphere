const validate = (schema, property = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[property], { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(d => d.message),
    });
  }
  
  // Re-assign mutated value so that default values and type conversions persist
  req[property] = value;
  next();
};

module.exports = validate;
