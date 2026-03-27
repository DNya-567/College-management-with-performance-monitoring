# ✅ DEPLOYMENT CHECKLIST - College Management System

**Last Updated:** March 18, 2026  
**Status:** Production Ready  
**Version:** 1.0.0

---

## 📋 PRE-DEPLOYMENT REVIEW

### Code Quality
- [ ] All console.error logs reviewed
- [ ] No hardcoded secrets or passwords
- [ ] All TODO/FIXME comments resolved or documented
- [ ] ESLint runs without errors: `npm run lint`
- [ ] No console.log() statements in production code

### Security
- [ ] JWT_SECRET is 32+ random characters
- [ ] DB_PASSWORD is 16+ random characters
- [ ] .env files not committed (check .gitignore)
- [ ] CORS_ORIGIN set to your domain only (not *)
- [ ] HTTPS configured on production domain
- [ ] Input validation on all endpoints
- [ ] Rate limiting configured
- [ ] Authentication middleware on protected routes

### Testing
- [ ] All major flows tested manually:
  - [ ] Student registration & login
  - [ ] Teacher registration & login
  - [ ] HOD registration & login
  - [ ] Admin login
  - [ ] Create class & mark attendance
  - [ ] Student view marks & attendance
- [ ] Errors handled gracefully
- [ ] Error messages don't leak sensitive info

---

## 📦 ROOT DIRECTORY CLEANUP

### Frontend (college-client/)

**DELETE these files before upload:**
```bash
AUDIT_*.md
AUDIT_*.md
CHECKLIST.md
DEPLOYMENT_*.md
EXECUTIVE_*.md
FEATURES_*.md
IMPLEMENTATION_*.md
IMPLEMENTED_*.md
MISSING_*.md
PRODUCTION_*.md
QUICK_*.md
STARTUP_*.md
diag.txt
reset_output.txt
```

**KEEP these files:**
```
✅ .env.example
✅ .env.production (with real values)
✅ .gitignore
✅ README.md
✅ package.json
✅ package-lock.json
✅ vite.config.js
✅ tailwind.config.js
✅ postcss.config.js
✅ eslint.config.js
✅ index.html
✅ src/ (entire folder)
✅ public/ (if exists)
```

### Backend (college-server/)

**DELETE these files before upload:**
```bash
ANNOUNCEMENT_*.md
DATABASE_*.md
FILES_*.md
FINAL_*.md
INDEXING_*.md
NPM_*.md
VIEW_MARKS_*.md
server.log
```

**KEEP these files:**
```
✅ .env.example
✅ .env.production (with real values)
✅ .gitignore
✅ README.md
✅ package.json
✅ package-lock.json
✅ src/ (entire folder)
✅ sql/ (migration files)
✅ seed.js
✅ verify-indexes.js
```

---

## 🔐 ENVIRONMENT VARIABLES

### Frontend: .env.production

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_ENV=production
VITE_LOG_LEVEL=error
```

### Backend: .env.production

```env
NODE_ENV=production
PORT=5000
DEBUG=false

DB_HOST=your-db-host.com
DB_PORT=5432
DB_NAME=college_db
DB_USER=college_user
DB_PASSWORD=YOUR_SECURE_PASSWORD_HERE
DB_POOL_MIN=5
DB_POOL_MAX=50

JWT_SECRET=YOUR_32_CHAR_RANDOM_STRING_HERE
JWT_EXPIRES_IN=8h

CORS_ORIGIN=https://yourdomain.com

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=YOUR_EMAIL_APP_PASSWORD
SMTP_FROM=noreply@yourdomain.com

LOG_LEVEL=warn
LOG_DIR=/var/log/college-api

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

ENABLE_STUDENT_REGISTRATION=true
ENABLE_EMAIL_NOTIFICATIONS=true
```

---

## 🗂️ FILE STRUCTURE VERIFICATION

### Check Frontend Structure
```bash
cd college-client
test -f package.json && echo "✅ package.json" || echo "❌ Missing package.json"
test -f vite.config.js && echo "✅ vite.config.js" || echo "❌ Missing"
test -f index.html && echo "✅ index.html" || echo "❌ Missing"
test -f .env.example && echo "✅ .env.example" || echo "❌ Missing"
test -d src && echo "✅ src/" || echo "❌ Missing src/"
```

### Check Backend Structure
```bash
cd college-server
test -f package.json && echo "✅ package.json" || echo "❌ Missing"
test -f server.js && echo "✅ server.js" || echo "❌ Missing"
test -f .env.example && echo "✅ .env.example" || echo "❌ Missing"
test -d src && echo "✅ src/" || echo "❌ Missing src/"
test -d sql && echo "✅ sql/" || echo "❌ Missing sql/"
```

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Prepare Repository

```bash
# Navigate to project
cd college-client

# Verify git is clean
git status

# Remove debug files
git rm AUDIT_*.md CHECKLIST.md DEPLOYMENT_*.md EXECUTIVE_*.md FEATURES_*.md IMPLEMENTATION_*.md IMPLEMENTED_*.md MISSING_*.md PRODUCTION_*.md QUICK_*.md STARTUP_*.md diag.txt reset_output.txt

git rm college-server/ANNOUNCEMENT_*.md college-server/DATABASE_*.md college-server/FILES_*.md college-server/FINAL_*.md college-server/INDEXING_*.md college-server/NPM_*.md college-server/VIEW_MARKS_*.md college-server/server.log

git add -A
git commit -m "Clean: Remove debug documentation"
git push origin main
```

### Step 2: Frontend Deployment

```bash
# Build frontend
cd college-client
npm ci                  # Use lock file for exact versions
npm run build           # Creates dist/ folder
# Upload dist/ to your hosting (Vercel, Netlify, or web server)

# OR if using web server:
# scp -r dist/* user@your-server:/var/www/html/
```

### Step 3: Backend Deployment

```bash
# SSH into server
ssh user@your-server

# Clone repository
git clone <your-repo-url> /opt/college-api
cd /opt/college-api/college-server

# Install dependencies
npm ci

# Create production environment
cp .env.example .env.production
nano .env.production      # Edit with real values

# Verify database connection
npm run verify-indexes

# Initialize database (if first time)
npm run seed:prod

# Start service
NODE_ENV=production npm start

# OR use PM2 for process management:
npm install -g pm2
pm2 start src/server.js --name college-api --env NODE_ENV=production
pm2 startup
pm2 save
```

### Step 4: Verify Deployment

```bash
# Check frontend loads
curl https://yourdomain.com

# Check API responds
curl https://api.yourdomain.com/api/health

# Check database connected
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@college.com","password":"changeme123"}'

# Check logs
tail -f /var/log/college-api/combined.log
```

---

## 🔍 POST-DEPLOYMENT VERIFICATION

### Frontend Checklist
- [ ] Page loads without errors
- [ ] Can navigate between pages
- [ ] Login page displays
- [ ] Can submit login form
- [ ] Logout works
- [ ] Forms validate input
- [ ] Error messages display properly

### Backend Checklist
- [ ] Server starts without errors
- [ ] Database connected (check logs)
- [ ] All migrations applied
- [ ] Health check endpoint responds
- [ ] Login endpoint works
- [ ] Protected routes require token
- [ ] Rate limiting active
- [ ] Logging working

### Database Checklist
- [ ] All tables created
- [ ] All indexes created
- [ ] Connection pool active
- [ ] Backup scheduled
- [ ] Monitoring active

---

## 🐛 TROUBLESHOOTING

### Frontend won't build
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install
npm run build

# Check for missing env vars
cat .env.production
```

### Backend won't start
```bash
# Check environment
env | grep DB_
env | grep JWT_

# Check database connection
npm run verify-indexes

# Check logs
cat logs/error.log

# Restart database if needed
# psql -h DB_HOST -U DB_USER -d DB_NAME -c "SELECT 1"
```

### API returns 500 errors
```bash
# Check server logs
tail -f logs/error.log

# Check for unhandled exceptions
npm run dev    # Run locally to debug

# Verify database connection
psql -h localhost -U postgres -d college_db -c "SELECT COUNT(*) FROM users;"
```

---

## 📊 MONITORING

### Essential Metrics

```bash
# Server uptime
ps aux | grep "node"

# Memory usage
top -p $(pgrep -f "node src/server.js")

# Log errors
grep ERROR logs/error.log | tail -20

# Database connections
psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

### Create Monitoring Script

Create `college-server/monitor.sh`:

```bash
#!/bin/bash
while true; do
  echo "=== $(date) ==="
  echo "CPU & Memory:"
  ps aux | grep "node" | grep -v grep
  echo "Recent Errors:"
  tail -5 logs/error.log
  echo "Database Connections:"
  psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null || echo "DB Offline"
  sleep 60
done
```

---

## 📝 FINAL CHECKLIST

### Before Going Live
- [ ] README.md updated with setup instructions
- [ ] All secrets in .env (not hardcoded)
- [ ] .gitignore blocks .env and node_modules
- [ ] Database backups configured
- [ ] SSL/HTTPS certificate installed
- [ ] Domain DNS configured
- [ ] CORS origin set correctly
- [ ] Email sending tested
- [ ] Admin account created
- [ ] Test data seeded
- [ ] Error pages configured
- [ ] Logging directory writable

### Day 1 Monitoring
- [ ] Check error logs hourly
- [ ] Monitor database connections
- [ ] Test all user roles
- [ ] Monitor server memory
- [ ] Check API response times
- [ ] Verify backups running

### Week 1 Verification
- [ ] All features working
- [ ] No memory leaks
- [ ] Database queries optimized
- [ ] Error rate < 0.1%
- [ ] Response time < 500ms

---

## 🆘 ROLLBACK PROCEDURE

If deployment fails:

```bash
# Stop current version
pm2 stop college-api
# OR
kill $(pgrep -f "node src/server.js")

# Revert to previous version
git checkout previous-version
npm ci
NODE_ENV=production npm start

# Or restore from backup
# Check your deployment platform's backup options
```

---

## 📞 SUPPORT & DOCUMENTATION

- **Frontend Issues:** Check browser console (F12 → Console tab)
- **Backend Issues:** Check `logs/error.log` and `logs/combined.log`
- **Database Issues:** Check PostgreSQL logs
- **Deployment Issues:** Check hosting platform docs

---

**Status:** ✅ Ready for Production  
**Last Reviewed:** March 18, 2026  
**Next Review:** After first week of deployment

