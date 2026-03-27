# 🚨 DEPLOYMENT TROUBLESHOOTING GUIDE

**Quick fixes for common deployment issues.**

---

## 🔴 FRONTEND BUILD FAILS

### Error: "Module not found"

```bash
# Cause: Missing dependency
# Fix:
cd college-client
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Error: "Cannot find vite.config.js"

```bash
# Cause: File not in root
# Fix: Verify structure
ls -la college-client/vite.config.js

# Should output file path
# If not found, restore from git:
git checkout college-client/vite.config.js
```

### Error: "VITE_API_BASE_URL is undefined"

```bash
# Cause: Missing .env file
# Fix:
cd college-client
cp .env.example .env.production

# Edit with actual backend URL:
cat > .env.production << EOF
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_ENV=production
VITE_LOG_LEVEL=error
EOF

npm run build
```

### Error: "Port 5173 already in use"

```bash
# Cause: Another process on port
# Fix:
lsof -i :5173
kill -9 <PID>

# Or use different port:
npm run dev -- --port 5174
```

---

## 🔴 BACKEND WON'T START

### Error: "Cannot find module './config/db.js'"

```bash
# Cause: Missing src/config/db.js file
# Fix: Verify file exists
ls -la college-server/src/config/db.js

# If missing, restore:
git checkout college-server/src/config/db.js

# Then:
npm install
npm start
```

### Error: "ECONNREFUSED: Connection refused"

```bash
# Cause 1: Database not running
# Fix:
sudo systemctl status postgresql
sudo systemctl start postgresql

# Cause 2: .env has wrong DB_HOST
# Fix:
cat college-server/.env.production | grep DB_HOST

# Should show actual database host
# Edit if needed:
nano college-server/.env.production
```

### Error: "SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string"

```bash
# Cause: DB_PASSWORD empty in .env
# Fix:
grep DB_PASSWORD college-server/.env.production

# If empty or has issue, update:
cat college-server/.env.production | sed 's/DB_PASSWORD=.*/DB_PASSWORD=your_actual_password/'

# Or edit manually:
nano college-server/.env.production
```

### Error: "Port 5000 already in use"

```bash
# Find process on port 5000
lsof -i :5000

# Kill it
kill -9 <PID>

# Or use PM2:
pm2 stop all
pm2 delete all
pm2 start college-server/src/server.js --name college-api
```

### Error: "npm: command not found"

```bash
# Cause: Node.js not installed
# Fix:
node --version
npm --version

# If not found, install Node.js:
# Ubuntu/Debian:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS:
brew install node

# Verify:
npm --version  # Should be 9+
```

---

## 🔴 DATABASE ISSUES

### Error: "database does not exist"

```bash
# Cause: Database not created
# Fix:
createdb -U postgres college_db

# Or with psql:
psql -U postgres -c "CREATE DATABASE college_db;"

# Verify:
psql -U postgres -d college_db -c "SELECT 1;"
```

### Error: "permission denied for database"

```bash
# Cause: User doesn't have permissions
# Fix:
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE college_db TO college_user;"

# Or recreate user:
psql -U postgres << EOF
DROP USER college_user;
CREATE USER college_user WITH PASSWORD 'your_password';
CREATE DATABASE college_db OWNER college_user;
GRANT ALL PRIVILEGES ON DATABASE college_db TO college_user;
EOF
```

### Error: "table does not exist"

```bash
# Cause: Migrations not applied
# Fix:
cd college-server
npm run verify-indexes

# This applies all SQL migrations from sql/ folder
# Then verify:
npm run seed:prod
```

### Error: "index already exists"

```bash
# Cause: Index created twice
# Fix (DROP existing):
psql -U postgres -d college_db << EOF
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_marks_student_id;
EOF

# Then reapply:
npm run verify-indexes
```

---

## 🔴 API ERRORS

### Error: "504 Bad Gateway"

```bash
# Cause: Backend crashed or not responding
# Fix:
# Check if running:
ps aux | grep node

# Check logs:
tail -f logs/error.log
tail -f logs/combined.log

# Restart:
npm start
# Or with PM2:
pm2 restart college-api
```

### Error: "CORS error" in browser console

```
Access to XMLHttpRequest from origin 'https://yourdomain.com' has been blocked by CORS policy
```

```bash
# Fix: CORS_ORIGIN mismatch
# Check current setting:
grep CORS_ORIGIN college-server/.env.production

# Update to match frontend:
sed -i 's/CORS_ORIGIN=.*/CORS_ORIGIN=https:\/\/yourdomain.com/' college-server/.env.production

# Restart:
npm restart
```

### Error: "401 Unauthorized"

```bash
# Cause 1: Invalid JWT token
# Fix: Login again (token expires after 8 hours)

# Cause 2: JWT_SECRET changed
# Fix: Don't change JWT_SECRET after deployment!
# If you must:
# 1. Users need to re-login
# 2. Old tokens invalid

# Check secret is consistent:
grep JWT_SECRET college-server/.env.production
```

### Error: "403 Forbidden"

```bash
# Cause: User role doesn't have permission
# Fix: Verify user role:
psql -U postgres -d college_db -c "SELECT email, role FROM users WHERE email='student@college.com';"

# Only admin can access /admin routes
# Only teacher can access /teacher routes
# Only student can access /student routes
```

### Error: "429 Too Many Requests"

```bash
# Cause: Rate limiting kicked in
# Fix: Wait 15 minutes (default rate limit window)

# Or increase limit in .env:
cat >> college-server/.env.production << EOF
RATE_LIMIT_WINDOW_MS=1800000
RATE_LIMIT_MAX_REQUESTS=500
EOF

npm restart
```

---

## 🔴 PERFORMANCE ISSUES

### Server is slow (>1000ms response time)

```bash
# Check database query performance:
psql -U postgres -d college_db << EOF
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;
EOF

# Check indexes exist:
npm run verify-indexes

# Check memory usage:
free -h
top -p $(pgrep -f "node")

# Check connection pool:
psql -U postgres -c "SELECT count(*) FROM pg_stat_activity WHERE datname='college_db';"
```

### Database connection pool exhausted

```bash
# Error: "ENOMEM" or "getaddrinfo ENOTFOUND"
# Fix: Increase pool size in .env:
cat >> college-server/.env.production << EOF
DB_POOL_MIN=10
DB_POOL_MAX=100
EOF

npm restart
```

### Memory leak (RAM keeps growing)

```bash
# Cause: Unresolved promises, circular references
# Fix: Check for async issues
grep -r "\.catch()" college-server/src/ | grep -v "reject"

# Monitor memory:
watch -n 1 'ps aux | grep node'

# If stuck: restart with PM2
pm2 restart college-api
pm2 set college-api max_memory_restart 500M
```

---

## 🔴 FILE/PERMISSION ISSUES

### Error: "EACCES: permission denied"

```bash
# Cause: Files not writable
# Fix:
sudo chown -R $(whoami):$(whoami) college-client
sudo chown -R $(whoami):$(whoami) college-server

# Or for www-data (Nginx):
sudo chown -R www-data:www-data /var/www/html
sudo chown -R www-data:www-data /opt/college-api
```

### Error: "ENOENT: no such file or directory"

```bash
# Cause: File doesn't exist
# Fix:
# Verify structure:
ls -la college-server/src/
ls -la college-server/sql/

# If missing, restore from git:
git status

# See what's missing
git checkout missing-file.js
```

### Error: "logs/ directory not writable"

```bash
# Cause: Directory doesn't exist or wrong permissions
# Fix:
mkdir -p college-server/logs
chmod 755 college-server/logs

# Or:
sudo mkdir -p /var/log/college-api
sudo chown -R www-data:www-data /var/log/college-api
```

---

## 🔴 DEPLOYMENT PLATFORM ISSUES

### Vercel Frontend Deploy Fails

```bash
# Issue: Missing environment variables
# Fix: Set in Vercel dashboard:
# Settings → Environment Variables
VITE_API_BASE_URL=https://api.yourdomain.com/api

# Then redeploy
```

### Heroku Backend Deploy Fails

```bash
# Issue: Missing Procfile
# Fix: Create college-server/Procfile:
echo "web: npm start" > college-server/Procfile

# Push again:
git push heroku main
```

### AWS EC2 Backend Won't Start

```bash
# Check user permissions:
id

# Should be ubuntu or ec2-user, not root

# Check systemd service:
sudo systemctl status college-api

# View logs:
sudo journalctl -u college-api -f

# Start manually:
cd /opt/college-api/college-server
npm start
```

---

## ✅ VERIFY AFTER FIX

After applying any fix, verify everything:

```bash
# 1. Frontend builds
npm run build
echo "✅ Build successful"

# 2. Backend starts
npm start
echo "✅ Server running"

# 3. Database connects
psql -U postgres -d college_db -c "SELECT 1;"
echo "✅ Database connected"

# 4. API responds
curl http://localhost:5000/api/health
echo "✅ API healthy"

# 5. Can login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@college.com","password":"admin123"}'
echo "✅ Login works"
```

---

## 📊 COMMON ERROR MATRIX

| Error | Cause | Fix |
|-------|-------|-----|
| "Cannot find module" | Missing file or npm not installed | `npm install` or `git checkout` |
| "ECONNREFUSED" | Service not running | Start database or backend |
| "Port already in use" | Process running on port | Kill process or use different port |
| "CORS error" | Origin mismatch | Check CORS_ORIGIN in .env |
| "401 Unauthorized" | Token missing/invalid | Login again |
| "403 Forbidden" | Wrong user role | Check user.role in database |
| "429 Too Many Requests" | Rate limit | Wait or increase limit |
| "504 Bad Gateway" | Backend crashed | Check logs and restart |

---

## 🆘 STILL STUCK?

### Debug Mode

```bash
# Enable debug logging
cd college-server
DEBUG=* npm start

# Shows all internal operations
```

### Check Logs

```bash
# Frontend browser console
F12 → Console tab → Look for red errors

# Backend error log
tail -f logs/error.log

# Backend combined log
tail -f logs/combined.log

# Database log
tail -f /var/log/postgresql/postgresql.log
```

### Get Help

1. Check `.env` file has all required variables
2. Verify database is running: `psql -U postgres -d college_db -c "SELECT 1;"`
3. Check firewall isn't blocking ports
4. Ensure Git history is clean: `git status`
5. Review error logs carefully - they usually tell you what's wrong

---

**Last Updated:** March 18, 2026  
**Status:** Ready for Production

