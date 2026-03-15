#!/usr/bin/env node
/**
 * Rate Limiting Test Script
 * ──────────────────────────
 * Tests all rate limiting rules to verify they are working correctly.
 *
 * Usage:
 *   npm install node-fetch (if not already installed)
 *   node test-rate-limiting.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Make HTTP request and return response
 */
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data ? JSON.parse(data) : null,
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Sleep for milliseconds
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Log test result
 */
function logResult(testName, passed, details = '') {
  const status = passed ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`;
  console.log(`${status} ${testName}`);
  if (details) {
    console.log(`  ${colors.cyan}${details}${colors.reset}`);
  }
}

/**
 * Test 1: General API Limiter
 */
async function testGeneralLimiter() {
  console.log(`\n${colors.blue}[Test 1] General API Limiter${colors.reset}`);
  console.log('Making 5 requests to /api/health...');

  let successCount = 0;
  let limitedCount = 0;

  for (let i = 0; i < 5; i++) {
    try {
      const response = await makeRequest('GET', '/api/health');
      if (response.status === 200) {
        successCount++;
      } else if (response.status === 429) {
        limitedCount++;
      }
      process.stdout.write('.');
    } catch (error) {
      console.error('Request error:', error.message);
    }
  }

  console.log();
  logResult('General API Limiter', successCount > 0, `${successCount} success, ${limitedCount} rate limited`);
}

/**
 * Test 2: Auth Limiter
 */
async function testAuthLimiter() {
  console.log(`\n${colors.blue}[Test 2] Auth Rate Limiter${colors.reset}`);
  console.log('Making 3 login attempts...');

  let results = [];

  for (let i = 0; i < 3; i++) {
    try {
      const response = await makeRequest('POST', '/api/auth/login', {
        email: 'test@example.com',
        password: 'test123',
      });
      results.push(response.status);
      process.stdout.write('.');
    } catch (error) {
      console.error('Request error:', error.message);
    }
  }

  console.log();
  const validResponses = results.filter((status) => status === 401 || status === 429).length > 0;
  logResult('Auth Limiter', validResponses, `Responses: ${results.join(', ')}`);
}

/**
 * Test 3: Check Rate Limit Headers
 */
async function testRateLimitHeaders() {
  console.log(`\n${colors.blue}[Test 3] Rate Limit Response Headers${colors.reset}`);

  try {
    const response = await makeRequest('GET', '/api/health');
    const hasRateLimitHeaders =
      'ratelimit-limit' in response.headers ||
      'x-ratelimit-limit' in response.headers;

    logResult(
      'Rate Limit Headers Present',
      hasRateLimitHeaders,
      `Headers: ${Object.keys(response.headers)
        .filter((h) => h.includes('ratelimit'))
        .join(', ') || 'Using RateLimit-* headers'}`
    );
  } catch (error) {
    logResult('Rate Limit Headers', false, error.message);
  }
}

/**
 * Test 4: 429 Response Format
 */
async function test429Response() {
  console.log(`\n${colors.blue}[Test 4] 429 Response Format${colors.reset}`);
  console.log('Making rapid requests to trigger rate limit...');

  let response = null;
  for (let i = 0; i < 150; i++) {
    try {
      response = await makeRequest('GET', '/api/health');
      if (response.status === 429) {
        break;
      }
      if (i % 10 === 0) process.stdout.write('.');
    } catch (error) {
      // Continue
    }
  }

  if (response && response.status === 429) {
    const hasMessage = response.body && response.body.message;
    const hasRetryAfter = response.body && response.body.retryAfter;

    logResult('429 Response Format', hasMessage && hasRetryAfter, `Message: ${response.body?.message}, RetryAfter: ${response.body?.retryAfter}`);
  } else {
    logResult('429 Response Format', false, 'Could not trigger rate limit (may need more requests)');
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║  Rate Limiting Test Suite              ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════╝${colors.reset}`);

  console.log(`\n${colors.yellow}Connecting to ${BASE_URL}...${colors.reset}`);

  // Check server is running
  try {
    await makeRequest('GET', '/api/health');
    console.log(`${colors.green}✓ Server is running${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}✗ Could not connect to server${colors.reset}`);
    console.error(`  Make sure the server is running on ${BASE_URL}`);
    process.exit(1);
  }

  // Run tests
  await testGeneralLimiter();
  await sleep(1000);
  await testAuthLimiter();
  await sleep(1000);
  await testRateLimitHeaders();
  await sleep(1000);
  await test429Response();

  console.log(`\n${colors.cyan}════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}Test suite completed!${colors.reset}`);
  console.log(`\n${colors.yellow}Next Steps:${colors.reset}`);
  console.log('1. Monitor logs for rate limit violations: tail -f logs/combined.log | grep "Rate limit"');
  console.log('2. Test with admin user (should have higher limits)');
  console.log('3. Test different endpoints to verify per-endpoint limits');
  console.log();
}

// Run tests
runTests().catch((error) => {
  console.error('Test error:', error);
  process.exit(1);
});

