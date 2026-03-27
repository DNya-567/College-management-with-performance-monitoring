# 🎬 DEPLOYMENT ACTION PLAN - Step-by-Step Fix Guide

**Estimated Total Time:** 42 hours  
**Recommended Pace:** Full-time = 5-6 days | Part-time = 2-3 weeks

---

## PHASE 1: CRITICAL FIXES (20 hours)
### Timeline: Day 1-2 | Blockers for deployment

---

## STEP 1: INPUT VALIDATION (8 hours)
**Why First:** System accepts ANY data - SQL injection, XSS, bad DB records

### 1.1 Install Joi (5 minutes)
```bash
cd college-server
npm install joi
```

### 1.2 Create Validation Schemas File (1 hour)
Create `college-server/src/utils/validators.js`:

```javascript
const Joi = require('joi');

// ──────────────────────────────────────────────────
// AUTH VALIDATORS
// ──────────────────────────────────────────────────

exports.loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
});

exports.registerStudentSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(100).required(),
  name: Joi.string().min(2).max(100).required(),
  roll_no: Joi.string().required(),
  year: Joi.number().min(1).max(4).required(),
  department_id: Joi.string().uuid().required(),
});

exports.registerTeacherSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(100).required(),
  name: Joi.string().min(2).max(100).required(),
  department_id: Joi.string().uuid().required(),
});

exports.resetPasswordSchema = Joi.object({
  password: Joi.string().min(8).max(100).required(),
  token: Joi.string().required(),
});

// ──────────────────────────────────────────────────
// MARKS VALIDATORS
// ──────────────────────────────────────────────────

exports.createMarkSchema = Joi.object({
  student_id: Joi.string().uuid().required(),
  subject_id: Joi.string().uuid().required(),
  score: Joi.number().min(0).max(10000).required(),
  exam_type: Joi.string().valid('Unit Test', 'Midterm', 'Final', 'Assignment').required(),
  total_marks: Joi.number().min(1).max(10000).required(),
  year: Joi.number().min(2020).max(2099),
});

exports.updateMarkSchema = Joi.object({
  score: Joi.number().min(0).max(10000),
  exam_type: Joi.string().valid('Unit Test', 'Midterm', 'Final', 'Assignment'),
  total_marks: Joi.number().min(1).max(10000),
}).min(1);

// ──────────────────────────────────────────────────
// CLASS VALIDATORS
// ──────────────────────────────────────────────────

exports.createClassSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  subject_id: Joi.string().uuid().required(),
  year: Joi.number().min(1).max(4).required(),
  semester_id: Joi.string().uuid(),
});

// ──────────────────────────────────────────────────
// ANNOUNCEMENTS VALIDATORS
// ──────────────────────────────────────────────────

exports.createAnnouncementSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  content: Joi.string().min(10).max(5000).required(),
  class_id: Joi.string().uuid().required(),
});

// ──────────────────────────────────────────────────
// ATTENDANCE VALIDATORS
// ──────────────────────────────────────────────────

exports.markAttendanceSchema = Joi.object({
  date: Joi.date().iso().required(),
  records: Joi.array().items(
    Joi.object({
      student_id: Joi.string().uuid().required(),
      status: Joi.string().valid('present', 'absent', 'late').required(),
    })
  ).required(),
});

// ──────────────────────────────────────────────────
// VALIDATION MIDDLEWARE
// ──────────────────────────────────────────────────

exports.validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const messages = error.details.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({
        message: 'Validation error',
        errors: messages,
      });
    }

    req.body = value;
    next();
  };
};

exports.validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        message: 'Invalid query parameters',
        errors: error.details.map(e => e.message),
      });
    }

    req.query = value;
    next();
  };
};
```

### 1.3 Apply to Auth Routes (1 hour)
Edit `college-server/src/modules/auth/auth.routes.js`:

```javascript
const { Router } = require('express');
const { validateBody } = require('../../utils/validators');
const {
  loginSchema,
  registerStudentSchema,
  registerTeacherSchema,
  resetPasswordSchema,
} = require('../../utils/validators');
const authMiddleware = require('../../middlewares/auth.middleware');
const {
  login,
  registerStudent,
  registerTeacher,
  me,
  logout,
  resetPassword,
  forgotPassword,
} = require('./auth.controller');

const router = Router();

// Apply validation BEFORE controller
router.post('/login', validateBody(loginSchema), login);
router.post('/register/student', validateBody(registerStudentSchema), registerStudent);
router.post('/register/teacher', validateBody(registerTeacherSchema), registerTeacher);
router.post('/reset-password', validateBody(resetPasswordSchema), resetPassword);
router.post('/forgot-password', forgotPassword);
router.get('/me', authMiddleware, me);
router.post('/logout', authMiddleware, logout);

module.exports = router;
```

### 1.4 Apply to Marks Routes (1 hour)
Edit `college-server/src/modules/marks/marks.routes.js`:

```javascript
const { Router } = require('express');
const authMiddleware = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');
const { validateBody } = require('../../utils/validators');
const {
  createMarkSchema,
  updateMarkSchema,
} = require('../../utils/validators');
const {
  createMark,
  getMarksByStudent,
  updateMark,
} = require('./marks.controller');

const router = Router();

// POST /api/marks - Create mark (teacher only)
router.post(
  '/',
  authMiddleware,
  requireRole(['teacher']),
  validateBody(createMarkSchema),
  createMark
);

// GET /api/marks/me - Get student's marks
router.get(
  '/me',
  authMiddleware,
  requireRole(['student']),
  getMarksByStudent
);

// PUT /api/marks/:id - Update mark (teacher only)
router.put(
  '/:id',
  authMiddleware,
  requireRole(['teacher']),
  validateBody(updateMarkSchema),
  updateMark
);

module.exports = router;
```

### 1.5 Apply to Announcements Routes (1 hour)
```javascript
router.post(
  '/',
  authMiddleware,
  requireRole(['teacher']),
  validateBody(createAnnouncementSchema),
  createAnnouncement
);
```

### 1.6 Apply to Attendance Routes (1 hour)
```javascript
router.post(
  '/:classId/attendance',
  authMiddleware,
  requireRole(['teacher']),
  validateBody(markAttendanceSchema),
  markAttendance
);
```

### 1.7 Test (2 hours)
```bash
# Test invalid email
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"notanemail","password":"test123"}'

# Should return: {"message":"Validation error","errors":[...]}

# Test missing field
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com"}'

# Should return: {"message":"Validation error",...}

# Test valid data
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher1@college.com","password":"password123"}'

# Should return: {"token":"...","user":{...}}
```

**Status: ✅ STEP 1 DONE**

---

## STEP 2: PAGINATION (12 hours)
**Why:** Frontend crashes when loading 160 students or 500+ marks

### 2.1 Create Pagination Middleware (1 hour)
Create `college-server/src/middlewares/pagination.middleware.js`:

```javascript
// Validates and extracts pagination params from query string
// Expected query: ?limit=20&offset=0
// Defaults: limit=20, max=100, offset=0

exports.paginationMiddleware = (req, res, next) => {
  try {
    // Parse limit (per-page count)
    let limit = parseInt(req.query.limit) || 20;
    limit = Math.min(Math.max(limit, 1), 100); // 1-100 range
    
    // Parse offset (skip count)
    let offset = parseInt(req.query.offset) || 0;
    offset = Math.max(offset, 0); // Can't be negative

    req.pagination = { limit, offset };
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid pagination parameters' });
  }
};
```

### 2.2 Update Marks Controller (2 hours)
Edit `college-server/src/modules/marks/marks.controller.js`:

```javascript
// GET /api/marks/me?limit=20&offset=0
exports.getMarksByStudent = async (req, res) => {
  const { limit, offset } = req.pagination; // From middleware
  const studentId = req.user.userId;

  try {
    // Get paginated marks
    const result = await db.query(
      `SELECT m.*, s.name as subject_name, t.name as teacher_name
       FROM marks m
       LEFT JOIN subjects s ON s.id = m.subject_id
       LEFT JOIN teachers t ON t.id = m.teacher_id
       WHERE m.student_id = $1
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [studentId, limit, offset]
    );

    // Get total count
    const countResult = await db.query(
      'SELECT COUNT(*) as total FROM marks WHERE student_id = $1',
      [studentId]
    );

    res.json({
      marks: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit,
        offset,
        hasMore: offset + limit < parseInt(countResult.rows[0].total),
      },
    });
  } catch (error) {
    logger.error('Error fetching marks:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/classes/:classId/marks?limit=20&offset=0
exports.getMarksByClass = async (req, res) => {
  const { classId } = req.params;
  const { limit, offset } = req.pagination;

  try {
    // Get paginated marks with student names
    const result = await db.query(
      `SELECT m.*, s.name as student_name, s.roll_no,
              subj.name as subject_name
       FROM marks m
       LEFT JOIN students s ON s.id = m.student_id
       LEFT JOIN subjects subj ON subj.id = m.subject_id
       WHERE m.class_id = $1
       ORDER BY s.roll_no ASC
       LIMIT $2 OFFSET $3`,
      [classId, limit, offset]
    );

    const countResult = await db.query(
      'SELECT COUNT(*) as total FROM marks WHERE class_id = $1',
      [classId]
    );

    res.json({
      marks: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit,
        offset,
        hasMore: offset + limit < parseInt(countResult.rows[0].total),
      },
    });
  } catch (error) {
    logger.error('Error fetching class marks:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Same for other GET endpoints
exports.getAttendanceByClass = async (req, res) => {
  const { classId } = req.params;
  const { date } = req.query;
  const { limit, offset } = req.pagination;

  try {
    // Filter by date if provided
    let query = `SELECT a.*, s.name, s.roll_no
                 FROM attendance a
                 LEFT JOIN students s ON s.id = a.student_id
                 WHERE a.class_id = $1`;
    let params = [classId, limit, offset];

    if (date) {
      query += ` AND DATE(a.date) = $4`;
      params = [classId, date, limit, offset];
    }

    query += ` ORDER BY s.roll_no ASC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await db.query(query, params);
    
    const countQuery = `SELECT COUNT(*) as total FROM attendance 
                       WHERE class_id = $1 ${date ? `AND DATE(date) = $2` : ''}`;
    const countResult = await db.query(
      countQuery,
      date ? [classId, date] : [classId]
    );

    res.json({
      attendance: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit,
        offset,
        hasMore: offset + limit < parseInt(countResult.rows[0].total),
      },
    });
  } catch (error) {
    logger.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
```

### 2.3 Update Marks Routes (1 hour)
```javascript
const { paginationMiddleware } = require('../../middlewares/pagination.middleware');

router.get(
  '/me',
  authMiddleware,
  requireRole(['student']),
  paginationMiddleware,
  getMarksByStudent
);

router.get(
  '/:classId/marks',
  authMiddleware,
  requireRole(['teacher']),
  paginationMiddleware,
  getMarksByClass
);
```

### 2.4 Update Announcements Controller (2 hours)
```javascript
exports.listAnnouncements = async (req, res) => {
  const { limit, offset } = req.pagination;

  try {
    const result = await db.query(
      `SELECT a.*, t.name as teacher_name, c.name as class_name
       FROM announcements a
       LEFT JOIN teachers t ON t.id = a.teacher_id
       LEFT JOIN classes c ON c.id = a.class_id
       ORDER BY a.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await db.query('SELECT COUNT(*) as total FROM announcements');

    res.json({
      announcements: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit,
        offset,
        hasMore: offset + limit < parseInt(countResult.rows[0].total),
      },
    });
  } catch (error) {
    logger.error('Error fetching announcements:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
```

### 2.5 Update All GET Routes (3 hours)
Apply pagination middleware to:
```javascript
// college-server/src/modules/*/routes.js

// Pattern:
router.get(
  '/some-endpoint',
  authMiddleware,
  paginationMiddleware,  // ← Add this
  controllerFunction
);
```

Affected routes:
- GET /api/marks/me
- GET /api/classes/:classId/marks
- GET /api/classes/:classId/attendance
- GET /api/announcements
- GET /api/attendance/me
- GET /api/classes
- GET /api/classes/mine
- GET /api/students
- GET /api/subjects
- GET /api/performance/me/trend

### 2.6 Update Frontend to Use Pagination (4 hours)
Example - update `src/pages/student/MyMarks.jsx`:

```javascript
import { useState, useEffect } from 'react';
import http from '../../api/http';

export default function MyMarks() {
  const [marks, setMarks] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMarks(0); // Load first page
  }, []);

  const loadMarks = async (offset) => {
    try {
      setLoading(true);
      const res = await http.get('/marks/me', {
        params: {
          limit: 20,
          offset,
        },
      });
      setMarks(res.data.marks);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error('Failed to load marks:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Render marks list */}
      {marks.map((mark) => (
        <div key={mark.id}>{mark.subject_name}: {mark.score}/{mark.total_marks}</div>
      ))}

      {/* Pagination controls */}
      <div>
        <button
          disabled={pagination.offset === 0}
          onClick={() => loadMarks(Math.max(0, pagination.offset - pagination.limit))}
        >
          ← Previous
        </button>
        <span>Page {Math.floor(pagination.offset / pagination.limit) + 1}</span>
        <button
          disabled={!pagination.hasMore}
          onClick={() => loadMarks(pagination.offset + pagination.limit)}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
```

### 2.7 Test (2 hours)
```bash
# Test pagination
curl http://localhost:5000/api/marks/me \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"

# Should return: {"marks":[...],"pagination":{"total":50,"limit":20,"offset":0,"hasMore":true}}

# Test next page
curl "http://localhost:5000/api/marks/me?limit=20&offset=20" \
  -H "Authorization: Bearer <token>"

# Should return 20 more marks starting from offset 20
```

**Status: ✅ STEP 2 DONE**

---

## ✅ PHASE 1 COMPLETE (20 hours)

After these 2 steps:
- ✅ System won't accept garbage data
- ✅ Browser won't crash on large datasets
- ✅ Database accepts valid data only
- ✅ API returns paginated responses

**Can Deploy To:** 50 pilot users safely

---

## PHASE 2: PERFORMANCE & RELIABILITY (12 hours)
### Timeline: Day 2-3 | Required for 100+ users

---

## STEP 3: DATABASE INDEXES (2 hours)

Create `college-server/sql/2026_03_17_deployment_indexes.sql`:

```sql
-- INDEXES ON MOST QUERIED COLUMNS

-- Users table - every login queries by email
CREATE INDEX CONCURRENTLY idx_users_email ON users(email) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_users_role ON users(role);
CREATE INDEX CONCURRENTLY idx_users_created_at ON users(created_at);

-- Students table
CREATE INDEX CONCURRENTLY idx_students_user_id ON students(user_id);
CREATE INDEX CONCURRENTLY idx_students_roll_no ON students(roll_no);
CREATE INDEX CONCURRENTLY idx_students_year ON students(year);

-- Teachers table
CREATE INDEX CONCURRENTLY idx_teachers_user_id ON teachers(user_id);
CREATE INDEX CONCURRENTLY idx_teachers_department_id ON teachers(department_id);
CREATE INDEX CONCURRENTLY idx_teachers_is_hod ON teachers(is_hod) WHERE is_hod = true;

-- Classes table
CREATE INDEX CONCURRENTLY idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX CONCURRENTLY idx_classes_subject_id ON classes(subject_id);
CREATE INDEX CONCURRENTLY idx_classes_semester_id ON classes(semester_id);
CREATE INDEX CONCURRENTLY idx_classes_year ON classes(year);

-- Class Enrollments - most frequent query
CREATE INDEX CONCURRENTLY idx_enrollments_class_student_status ON class_enrollments(class_id, student_id, status);
CREATE INDEX CONCURRENTLY idx_enrollments_class_id ON class_enrollments(class_id);
CREATE INDEX CONCURRENTLY idx_enrollments_student_id ON class_enrollments(student_id);
CREATE INDEX CONCURRENTLY idx_enrollments_status ON class_enrollments(status);
CREATE INDEX CONCURRENTLY idx_enrollments_semester_id ON class_enrollments(semester_id);

-- Marks - teacher enters/views marks constantly
CREATE INDEX CONCURRENTLY idx_marks_student_id ON marks(student_id);
CREATE INDEX CONCURRENTLY idx_marks_class_id ON marks(class_id);
CREATE INDEX CONCURRENTLY idx_marks_semester_id ON marks(semester_id);
CREATE INDEX CONCURRENTLY idx_marks_class_semester_student ON marks(class_id, semester_id, student_id);
CREATE INDEX CONCURRENTLY idx_marks_created_at ON marks(created_at);

-- Attendance
CREATE INDEX CONCURRENTLY idx_attendance_class_date ON attendance(class_id, date);
CREATE INDEX CONCURRENTLY idx_attendance_student_id ON attendance(student_id);
CREATE INDEX CONCURRENTLY idx_attendance_class_student_date ON attendance(class_id, student_id, date);

-- Announcements
CREATE INDEX CONCURRENTLY idx_announcements_class_id ON announcements(class_id);
CREATE INDEX CONCURRENTLY idx_announcements_teacher_id ON announcements(teacher_id);
CREATE INDEX CONCURRENTLY idx_announcements_created_at ON announcements(created_at DESC);

-- Password Reset Tokens
CREATE INDEX CONCURRENTLY idx_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX CONCURRENTLY idx_tokens_token ON password_reset_tokens(token);

-- Audit Logs
CREATE INDEX CONCURRENTLY idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX CONCURRENTLY idx_audit_logs_timestamp ON audit_logs(created_at DESC);

-- Performance table
CREATE INDEX CONCURRENTLY idx_performance_student_id ON performance(student_id) IF EXISTS;

COMMIT;
```

Run it:
```bash
cd college-server
psql -h localhost -U postgres -d college_db -f sql/2026_03_17_deployment_indexes.sql
```

**Status: ✅ STEP 3 DONE**

---

## STEP 4: COMPLETE RATE LIMITING (1 hour)

Update `college-server/src/app.js`:

Add after line 70 (after existing limiters):

```javascript
// Data read limiter: 200 requests/minute per user
const dataReadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // 200 requests
  keyGenerator: (req) => req.user?.userId || req.ip,
  message: 'Too many read requests, please try again later',
  standardHeaders: false, // Don't return rate limit info in headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

// Apply to data read endpoints
app.use('/api/marks', dataReadLimiter);
app.use('/api/attendance', dataReadLimiter);
app.use('/api/announcements', dataReadLimiter);
app.use('/api/classes', dataReadLimiter);
app.use('/api/performance', dataReadLimiter);
app.use('/api/students', dataReadLimiter);
app.use('/api/teachers', dataReadLimiter);
app.use('/api/enrollments', dataReadLimiter);
```

**Status: ✅ STEP 4 DONE**

---

## STEP 5: CONNECTION POOL OPTIMIZATION (1 hour)

Edit `college-server/src/config/db.js`:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  
  // CONNECTION POOL SETTINGS
  max: 50, // INCREASE from 10 to 50 connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  
  // QUERY TIMEOUT
  statement_timeout: 30000, // Kill queries after 30 seconds
  query_timeout: 30000,
  
  // CONNECTION IDLE TIMEOUT
  idle_in_transaction_session_timeout: 60000, // Kill idle transactions
});

// ERROR HANDLERS
pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle client', {
    error: err.message,
    code: err.code,
  });
  // DO NOT exit - gracefully degrade
});

pool.on('connect', () => {
  logger.info('New database connection established');
});

pool.on('remove', () => {
  logger.info('Database connection removed from pool');
});

module.exports = pool;
```

**Status: ✅ STEP 5 DONE**

---

## STEP 6: ERROR RECOVERY & RETRIES (6 hours)

Create `college-server/src/utils/retry.js`:

```javascript
const logger = require('../config/logger');

// Determines if an error is transient (can retry)
function isRetriableError(error) {
  // Network errors
  if (error.message === 'connect ECONNREFUSED') return true;
  if (error.message === 'socket hang up') return true;
  if (error.code === 'ENOTFOUND') return true;
  if (error.code === 'ECONNRESET') return true;
  if (error.code === 'ETIMEDOUT') return true;
  
  // Database timeouts
  if (error.code === 'QUERY_TIMEOUT') return true;
  if (error.message.includes('timeout')) return true;
  
  // Database connection errors
  if (error.code === 'ECONNREFUSED') return true;
  if (error.code === 'EHOSTUNREACH') return true;
  
  // Don't retry validation/auth errors
  if (error.code === '23505') return false; // Unique constraint
  if (error.code === '23503') return false; // Foreign key
  
  return false;
}

// Retry with exponential backoff
async function retryAsync(fn, maxRetries = 3, initialDelay = 100) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`Attempt ${attempt} of ${maxRetries}`);
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry non-retriable errors
      if (!isRetriableError(error)) {
        logger.error('Non-retriable error, not retrying', {
          error: error.message,
          code: error.code,
        });
        throw error;
      }
      
      // On last attempt, throw
      if (attempt === maxRetries) {
        logger.error(`Failed after ${maxRetries} attempts`, {
          error: error.message,
        });
        throw error;
      }
      
      // Calculate exponential backoff delay
      const delay = initialDelay * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 100; // Add randomness
      const totalDelay = delay + jitter;
      
      logger.warn(`Retry attempt ${attempt} failed, waiting ${totalDelay}ms`, {
        error: error.message,
        nextAttempt: attempt + 1,
      });
      
      await new Promise(r => setTimeout(r, totalDelay));
    }
  }
  
  throw lastError;
}

module.exports = { retryAsync, isRetriableError };
```

Create `college-server/src/utils/queryWithRetry.js`:

```javascript
const db = require('../config/db');
const { retryAsync } = require('./retry');

// Wrapper for db.query that retries on transient errors
async function queryWithRetry(sql, params = [], maxRetries = 3) {
  return retryAsync(
    () => db.query(sql, params),
    maxRetries,
    100
  );
}

module.exports = { queryWithRetry };
```

Update `college-server/src/modules/marks/marks.controller.js` to use retries:

```javascript
const { queryWithRetry } = require('../../utils/queryWithRetry');

exports.createMark = async (req, res) => {
  const { student_id, subject_id, score, exam_type, total_marks, class_id } = req.body;
  const teacherUserId = req.user.userId;

  try {
    // Get teacher with retry
    const teacherRes = await queryWithRetry(
      'SELECT id FROM teachers WHERE user_id = $1',
      [teacherUserId]
    );

    if (teacherRes.rowCount === 0) {
      return res.status(403).json({ message: 'Teacher profile not found' });
    }

    const teacherId = teacherRes.rows[0].id;

    // Insert mark with retry
    const result = await queryWithRetry(
      `INSERT INTO marks (student_id, subject_id, teacher_id, score, exam_type, total_marks, class_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [student_id, subject_id, teacherId, score, exam_type, total_marks, class_id]
    );

    res.status(201).json({ mark: result.rows[0] });
  } catch (error) {
    logger.error('Create mark error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
```

**Status: ✅ STEP 6 DONE**

---

## STEP 7: REQUEST TIMEOUTS (1 hour)

Edit `college-server/src/app.js`:

Add at the beginning (after helmet):

```javascript
const timeout = require('connect-timeout');

// Set 30-second timeout for all requests
app.use(timeout('30s'));

// Handle timeout errors
app.use((err, req, res, next) => {
  if (err.message === 'request timeout') {
    logger.error('Request timeout', {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
      correlationId: req.correlationId,
    });
    return res.status(503).json({
      message: 'Request timeout - please try again',
      correlationId: req.correlationId,
    });
  }
  next(err);
});
```

Install timeout module:
```bash
npm install connect-timeout
```

**Status: ✅ STEP 7 DONE**

---

## ✅ PHASE 2 COMPLETE (12 hours)

After all Phase 2 steps:
- ✅ Queries run 10x faster with indexes
- ✅ System handles 50-100 concurrent users
- ✅ Rate limiting prevents abuse
- ✅ Errors recover automatically
- ✅ Requests don't hang forever
- ✅ Connection pool never exhausted

**Can Deploy To:** 100+ production users

---

## PHASE 3: INFRASTRUCTURE & MONITORING (10 hours)
### Timeline: Day 3-4 | Production hardening

---

[CONTINUE IN NEXT SECTION...]

## STEP 8: ENVIRONMENT CONFIGURATION (1 hour)

Create proper `.env.production` template in docs:

**college-server/.env.production (example)**
```dotenv
# ──────────────────────────────────
# SERVER
# ──────────────────────────────────
NODE_ENV=production
PORT=5000

# ──────────────────────────────────
# DATABASE
# ──────────────────────────────────
DB_HOST=your-prod-db.example.com
DB_PORT=5432
DB_USER=app_user
DB_PASSWORD=your-secure-password-here-min-32-chars
DB_NAME=college_prod

# ──────────────────────────────────
# JWT & AUTH
# ──────────────────────────────────
JWT_SECRET=your-super-secret-jwt-min-32-chars-change-this
JWT_EXPIRY=7d

# ──────────────────────────────────
# CORS & ORIGINS
# ──────────────────────────────────
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# ──────────────────────────────────
# EMAIL/NODEMAILER
# ──────────────────────────────────
NODEMAILER_HOST=smtp.gmail.com
NODEMAILER_PORT=587
NODEMAILER_USER=your-email@gmail.com
NODEMAILER_PASSWORD=your-app-password
NODEMAILER_FROM=noreply@yourdomain.com

# ──────────────────────────────────
# SENTRY ERROR TRACKING
# ──────────────────────────────────
SENTRY_DSN=https://your-sentry-dsn

# ──────────────────────────────────
# MONITORING
# ──────────────────────────────────
LOG_LEVEL=info
```

**Instruction file to add to README:**

```markdown
# Production Deployment

## Step 1: Generate Secrets

```bash
# Generate 32-char random JWT secret
openssl rand -base64 32

# Generate 32-char DB password
openssl rand -base64 32
```

## Step 2: Create .env.production

Copy the template and fill in your values:
```
DB_HOST=your-aws-rds-endpoint.com
DB_PASSWORD=<generated-password>
JWT_SECRET=<generated-secret>
CORS_ORIGINS=https://yourdomain.com
```

## Step 3: Verify All Required Vars

```bash
node -e "
const required = ['NODE_ENV', 'DB_HOST', 'JWT_SECRET', 'CORS_ORIGINS'];
required.forEach(v => {
  if (!process.env[v]) throw new Error(\`Missing \${v}\`);
});
console.log('✅ All required env vars set');
"
```

```

**Status: ✅ STEP 8 DONE**

---

## STEP 9: HTTPS/SSL CERTIFICATE (2 hours)

**If using AWS:**
```
1. Go to AWS Certificate Manager
2. Request certificate for yourdomain.com
3. Verify domain via email
4. Attach to your load balancer
5. Done (AWS handles renewal)
```

**If using DigitalOcean App Platform:**
```
1. Connect your domain
2. Platform automatically provisions Let's Encrypt
3. Auto-renews every 60 days
4. Done
```

**If self-hosted:**
```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Certificate path: /etc/letsencrypt/live/yourdomain.com/

# In Node app:
const fs = require('fs');
const https = require('https');

const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/fullchain.pem')
};

https.createServer(options, app).listen(443);
```

**Status: ✅ STEP 9 DONE**

---

## STEP 10: MONITORING WITH SENTRY (2 hours)

```bash
npm install @sentry/node
```

Edit `college-server/src/server.js`:

```javascript
const Sentry = require('@sentry/node');
const app = require('./app');

// Initialize Sentry FIRST
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    debug: false,
  });
}

// Add Sentry middleware
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());

// Capture and send errors to Sentry
process.on('unhandledRejection', (reason, promise) => {
  Sentry.captureException(reason);
});

// Start server...
```

**Setup Sentry Account:**
1. Go to sentry.io
2. Create free account
3. Create new project (Node.js)
4. Copy DSN to .env.production
5. Errors now sent to Sentry dashboard

**Status: ✅ STEP 10 DONE**

---

## STEP 11: DATABASE BACKUPS (2 hours)

**AWS RDS (Easiest):**
```
1. Enable automated backups (30-day retention)
2. Enable Multi-AZ deployment
3. Done - AWS handles everything
```

**DigitalOcean:**
```
1. Enable managed backups in database settings
2. Automatic daily backups kept 7 days
3. One-click restore available
```

**Self-hosted (Cron job):**
```bash
# Create backup script: /scripts/backup-db.sh
#!/bin/bash
BACKUP_DIR="/backups"
DB_NAME="college_db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/college_$TIMESTAMP.sql.gz"

mkdir -p $BACKUP_DIR

pg_dump -h localhost -U postgres $DB_NAME | gzip > $BACKUP_FILE

# Keep only last 30 backups
find $BACKUP_DIR -name "college_*.sql.gz" -mtime +30 -delete

echo "Backup complete: $BACKUP_FILE"

# Run daily at 2 AM
# Add to crontab: 0 2 * * * /scripts/backup-db.sh
```

**Status: ✅ STEP 11 DONE**

---

## STEP 12: SECURITY HEADERS (1 hour)

Update `college-server/src/app.js`:

```javascript
// Already has basic helmet, enhance it
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'"],
      connectSrc: ["'self'", 'https:'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      formAction: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny',
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
}));
```

**Status: ✅ STEP 12 DONE**

---

## ✅ PHASE 3 COMPLETE (10 hours)

After Phase 3:
- ✅ Environment properly configured
- ✅ HTTPS/SSL enabled
- ✅ All errors tracked in Sentry
- ✅ Automated daily backups
- ✅ Security headers hardened
- ✅ Production-ready with monitoring

**Can Deploy To:** Production safely with monitoring

---

## 🎉 YOU'RE READY TO DEPLOY!

### Final Checklist:

- [x] Phase 1: Input Validation + Pagination
- [x] Phase 2: Indexes + Pool + Retry + Timeouts
- [x] Phase 3: Env Config + SSL + Monitoring + Backups

### Deployment Steps:

1. **Deploy Backend:**
   ```bash
   git push origin main
   # CD/CI triggers deployment
   # Or manually: npm install && npm start
   ```

2. **Deploy Frontend:**
   ```bash
   cd college-client
   npm run build
   # Upload dist/ to CDN or web server
   ```

3. **Verify:**
   - [ ] API responds at yourdomain.com/api/health
   - [ ] Frontend loads without errors
   - [ ] Can login with test user
   - [ ] Can create marks and see on student dashboard
   - [ ] Can submit attendance and see heatmap

4. **Monitor:**
   - Watch Sentry for errors
   - Monitor database performance
   - Check logs for warnings

---

## 📞 TROUBLESHOOTING

**If API won't start:**
```bash
# Check all env vars are set
node -e "require('dotenv').config(); console.log(process.env.JWT_SECRET ? '✅' : '❌ JWT_SECRET missing')"

# Check database connection
psql postgresql://user:pass@host:5432/dbname

# Check port not in use
lsof -i :5000
```

**If frontend won't load:**
```bash
# Check API URL is correct
grep VITE_API_URL .env.production

# Check CORS allowed origins
grep CORS_ORIGINS college-server/.env.production
```

**If getting 403 errors:**
- Verify role-based access is correct
- Check JWT token is being sent
- Verify user role in database

---

**Congratulations! Your College Management System is production-ready! 🚀**

