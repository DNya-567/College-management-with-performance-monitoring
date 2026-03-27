// Validation schemas using Joi for all API endpoints
// Centralized validation to prevent invalid data from reaching database

import Joi from 'joi';

// ─── AUTH SCHEMAS ───────────────────────────────────────────────────────────

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required'
  })
});

export const registerStudentSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).max(100).required(),
  roll_no: Joi.string().required(),
  year: Joi.number().integer().min(1).max(4).required(),
  department_id: Joi.string().uuid().required()
});

export const registerTeacherSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).max(100).required(),
  department_id: Joi.string().uuid().required()
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

// ─── CLASS SCHEMAS ──────────────────────────────────────────────────────────

export const createClassSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  subject_id: Joi.string().uuid().required(),
  year: Joi.number().integer().min(1).max(4).required()
});

// ─── MARKS SCHEMAS ─────────────────────────────────────────────────────────

export const createMarkSchema = Joi.object({
  student_id: Joi.string().uuid().required(),
  subject_id: Joi.string().uuid().required(),
  score: Joi.number().min(0).required(),
  total_marks: Joi.number().min(0).required(),
  exam_type: Joi.string().valid('Unit Test', 'Midterm', 'Final').required(),
  year: Joi.number().integer().min(1).max(4).required()
});

export const updateMarkSchema = Joi.object({
  score: Joi.number().min(0).required(),
  total_marks: Joi.number().min(0).required(),
  exam_type: Joi.string().valid('Unit Test', 'Midterm', 'Final').required()
});

// ─── ATTENDANCE SCHEMAS ────────────────────────────────────────────────────

export const markAttendanceSchema = Joi.object({
  date: Joi.date().required(),
  records: Joi.array().items(
    Joi.object({
      student_id: Joi.string().uuid().required(),
      status: Joi.string().valid('present', 'absent', 'late').required()
    })
  ).min(1).required()
});

// ─── ANNOUNCEMENT SCHEMAS ──────────────────────────────────────────────────

export const createAnnouncementSchema = Joi.object({
  title: Joi.string().trim().min(5).max(200).required().messages({
    'string.min': 'Title must be at least 5 characters',
    'string.max': 'Title cannot exceed 200 characters',
    'any.required': 'Title is required'
  }),
  body: Joi.string().trim().min(10).max(5000).required().messages({
    'string.min': 'Body must be at least 10 characters',
    'string.max': 'Body cannot exceed 5000 characters',
    'any.required': 'Body is required'
  })
});

// ─── ENROLLMENT SCHEMAS ────────────────────────────────────────────────────

export const approveEnrollmentSchema = Joi.object({
  // No body required, uses URL param
});

export const rejectEnrollmentSchema = Joi.object({
  // No body required, uses URL param
});

// ─── SEMESTER SCHEMAS ──────────────────────────────────────────────────────

export const createSemesterSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  academic_year: Joi.string().pattern(/^\d{4}-\d{4}$/).required(),
  start_date: Joi.date().required(),
  end_date: Joi.date().min(Joi.ref('start_date')).required()
});

// ─── IMPORTS SCHEMAS ───────────────────────────────────────────────────────

export const bulkImportStudentsSchema = Joi.object({
  file: Joi.any().required().messages({
  })
});

export const bulkImportMarksSchema = Joi.object({
  file: Joi.any().required().messages({
    'any.required': 'CSV file is required'
  })
});

// ─── UTILITY: Validation Middleware ────────────────────────────────────────

/**
 * Returns middleware function that validates req.body against schema
 * Returns 400 if validation fails with detailed error messages
 */
export const validate = (schema) => {
  return (req, res, next) => {
    console.log('=== VALIDATION MIDDLEWARE ===');
    console.log('Request Path:', req.path);
    console.log('Request Method:', req.method);
    console.log('Raw Body Received:', JSON.stringify(req.body, null, 2));
    console.log('Body Type:', typeof req.body);
    console.log('Body Keys:', Object.keys(req.body || {}));

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: false,
      convert: true,
      presence: 'required'
    });

    console.log('Validation Error:', error ? error.details : 'None');
    console.log('Validated Value:', JSON.stringify(value, null, 2));
    console.log('=============================');

    if (error) {
      const messages = error.details.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        type: err.type,
        context: err.context
      }));

      console.error('VALIDATION FAILED:', messages);

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
export const validateQuery = (schema) => {
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
export const validateParams = (schema) => {
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


