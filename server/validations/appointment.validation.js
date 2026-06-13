const Joi = require('joi');

const createAppointmentSchema = Joi.object({
  patientName: Joi.string().trim().min(2).max(100).required(),
  phone: Joi.string().trim().pattern(/^[+]?[\d\s()-]{7,20}$/).required(),
  email: Joi.string().trim().email().allow('').optional(),
  treatment: Joi.string().trim().min(2).max(150).required(),
  preferredDate: Joi.date().iso().required(),
  timeSlot: Joi.string().valid('Morning', 'Afternoon', 'Evening').required(),
  message: Joi.string().trim().max(1000).allow('').optional()
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'confirmed', 'completed', 'cancelled').required()
});

const chatSchema = Joi.object({
  message: Joi.string().trim().min(2).max(1000).required(),
  history: Joi.array().items(Joi.object({
    role: Joi.string().valid('user', 'assistant').required(),
    content: Joi.string().trim().max(2000).required()
  })).max(10).default([])
});

module.exports = { createAppointmentSchema, updateStatusSchema, chatSchema };
