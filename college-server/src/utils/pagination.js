// Pagination utility for handling limit/offset queries
// Provides consistent pagination across all GET endpoints

import Joi from 'joi';

/**
 * Pagination query schema
 * Validates limit and offset query parameters
 * limit: number of records per page (default 20, max 100)
 * offset: number of records to skip (default 0)
 */
export const paginationSchema = Joi.object({
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),
  offset: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .messages({
      'number.min': 'Offset cannot be negative'
    })
});

/**
 * Middleware to validate and parse pagination parameters
 * Adds validated limit/offset to req.pagination
 */
export const validatePagination = (req, res, next) => {
  const { error, value } = paginationSchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const messages = error.details.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));

    return res.status(400).json({
      message: 'Pagination validation failed',
      errors: messages
    });
  }

  // Attach validated pagination to request
  req.pagination = {
    limit: value.limit,
    offset: value.offset
  };

  next();
};

/**
 * Format paginated response
 * Returns data with pagination metadata
 *
 * @param {Array} data - Array of records
 * @param {number} total - Total count of all records
 * @param {number} limit - Records per page
 * @param {number} offset - Current offset
 * @returns {Object} Formatted response with pagination
 */
export const formatPaginatedResponse = (data, total, limit, offset) => {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = offset + limit < total;
  const hasPreviousPage = offset > 0;

  return {
    data,
    pagination: {
      total,
      limit,
      offset,
      currentPage,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      nextOffset: hasNextPage ? offset + limit : null,
      previousOffset: hasPreviousPage ? offset - limit : null
    }
  };
};

/**
 * Get SQL LIMIT and OFFSET clause
 * @param {number} limit - Records per page
 * @param {number} offset - Current offset
 * @returns {Object} {limitClause, params} for parameterized query
 */
export const getLimitOffsetClause = (limit, offset) => {
  return {
    limitClause: 'LIMIT $1 OFFSET $2',
    params: [limit, offset]
  };
};

/**
 * Build paginated query with COUNT
 * Executes two queries: one for data, one for total count
 *
 * @param {Object} db - Database pool
 * @param {string} countQuery - Query to get total count (must have COUNT(*) AS total)
 * @param {string} dataQuery - Query to get paginated data (must have LIMIT $x OFFSET $y)
 * @param {Array} countParams - Parameters for count query
 * @param {Array} dataParams - Parameters for data query
 * @returns {Object} {data, total, limit, offset}
 */
export const executePaginatedQuery = async (db, countQuery, dataQuery, countParams, dataParams) => {
  // Get total count
  const countResult = await db.query(countQuery, countParams);
  const total = parseInt(countResult.rows[0].total, 10);

  // Get paginated data
  const dataResult = await db.query(dataQuery, dataParams);

  return {
    data: dataResult.rows,
    total
  };
};
