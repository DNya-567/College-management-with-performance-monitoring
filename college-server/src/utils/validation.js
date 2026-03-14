// Validation schemas using Joi for all API endpoints
// Centralized validation to prevent invalid data from reaching database

const Joi = require('joi');

// ─── AUTH SCHEMAS ───────────────────────────────────────────────────────────

exports.loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required'
  })
});

exports.registerStudentSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).max(100).required(),
  roll_no: Joi.string().required(),
  year: Joi.number().integer().min(1).max(4).required(),
  department_id: Joi.string().uuid().required()
});

exports.registerTeacherSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).max(100).required(),
  department_id: Joi.string().uuid().required()
});

exports.forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

exports.resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

// ─── CLASS SCHEMAS ──────────────────────────────────────────────────────────

exports.createClassSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  subject_id: Joi.string().uuid().required(),
  year: Joi.number().integer().min(1).max(4).required()
});

// ─── MARKS SCHEMAS ─────────────────────────────────────────────────────────

exports.createMarkSchema = Joi.object({
  student_id: Joi.string().uuid().required(),
  subject_id: Joi.string().uuid().required(),
  score: Joi.number().min(0).required(),
  total_marks: Joi.number().min(0).required(),
  exam_type: Joi.string().valid('Unit Test', 'Midterm', 'Final').required(),
  year: Joi.number().integer().min(1).max(4).required()
});

exports.updateMarkSchema = Joi.object({
  score: Joi.number().min(0).required(),
  total_marks: Joi.number().min(0).required(),
  exam_type: Joi.string().valid('Unit Test', 'Midterm', 'Final').required()
});

// ─── ATTENDANCE SCHEMAS ────────────────────────────────────────────────────

exports.markAttendanceSchema = Joi.object({
  date: Joi.date().required(),
  records: Joi.array().items(
    Joi.object({
      student_id: Joi.string().uuid().required(),
      status: Joi.string().valid('present', 'absent', 'late').required()
    })
  ).min(1).required()
});

// ─── ANNOUNCEMENT SCHEMAS ──────────────────────────────────────────────────

exports.createAnnouncementSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  content: Joi.string().min(10).max(5000).required(),
  class_id: Joi.string().uuid().allow(null)
});

// ─── ENROLLMENT SCHEMAS ────────────────────────────────────────────────────

exports.approveEnrollmentSchema = Joi.object({
  // No body required, uses URL param
});

exports.rejectEnrollmentSchema = Joi.object({
  // No body required, uses URL param
});

// ─── SEMESTER SCHEMAS ──────────────────────────────────────────────────────

exports.createSemesterSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  academic_year: Joi.string().pattern(/^\d{4}-\d{4}$/).required(),
  start_date: Joi.date().required(),
  end_date: Joi.date().min(Joi.ref('start_date')).required()
});

// ─── IMPORTS SCHEMAS ───────────────────────────────────────────────────────

exports.bulkImportStudentsSchema = Joi.object({
  file: Joi.any().required().messages({
    'any.required': 'CSV file is required'
  })
});

exports.bulkImportMarksSchema = Joi.object({
  file: Joi.any().required().messages({
    'any.required': 'CSV file is required'
  })
});

// ─── UTILITY: Validation Middleware ────────────────────────────────────────

/**
 * Returns middleware function that validates req.body against schema
 * Returns 400 if validation fails with detailed error messages
 */
exports.validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const messages = error.details.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return res.status(400).json({
        message: 'Validation failed',
        errors: messages
      });
    }

    // Replace req.body with validated/sanitized value
    req.body = value;
    next();
  };
};

/**
 * Validates query parameters
 */
exports.validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const messages = error.details.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return res.status(400).json({
        message: 'Query validation failed',
        errors: messages
      });
    }

    req.query = value;
    next();
  };
};

/**
 * Validates URL parameters
 */
exports.validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const messages = error.details.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return res.status(400).json({
        message: 'Parameter validation failed',
        errors: messages
      });
    }

    req.params = value;
    next();
  };
};

