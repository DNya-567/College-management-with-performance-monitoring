import http from 'k6/http';
import { check, sleep } from 'k6';

// Target: your live Render-hosted backend
const BASE_URL = 'https://college-management-with-performance.onrender.com';

export const options = {
  stages: [
    { duration: '30s', target: 5 },   // warm-up, lets Render cold-start finish
    { duration: '1m', target: 20 },   // ramp up to 20 virtual users
    { duration: '1m', target: 20 },   // hold steady at 20 virtual users
    { duration: '20s', target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // flag if 95th percentile exceeds 2s
    http_req_failed: ['rate<0.05'],    // flag if error rate exceeds 5%
  },
};

export default function () {
  // 20% of iterations: health check
  const roll = Math.random();

  if (roll < 0.2) {
    const res = http.get(`${BASE_URL}/api/health`);
    check(res, { 'health check status 200': (r) => r.status === 200 });
  } else if (roll < 0.7) {
    // 50%: browse departments (public endpoint)
    const res = http.get(`${BASE_URL}/api/departments`);
    check(res, { 'departments status 200': (r) => r.status === 200 });
  } else {
    // 30%: login flow
    const payload = JSON.stringify({
      email: 'admin@college.com',
      password: 'admin123456',
    });
    const params = { headers: { 'Content-Type': 'application/json' } };
    const res = http.post(`${BASE_URL}/api/auth/login`, payload, params);
    check(res, { 'login status 200': (r) => r.status === 200 });
  }

  sleep(1); // 1s pause between iterations per virtual user, mimics real user pacing
}