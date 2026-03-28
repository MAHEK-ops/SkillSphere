const Joi = require('joi');

const timelineSchema = Joi.object({
  address: Joi.string().min(2).max(200),
  latitude: Joi.number().min(-90).max(90),
  longitude: Joi.number().min(-180).max(180),
  radiusKm: Joi.number().min(1).max(100).default(10),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('ASC'),
  groupBy: Joi.string().valid('era', 'category').allow(null),
}).or('address', 'latitude'); // Requires at least one

module.exports = timelineSchema;
