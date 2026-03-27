# 🚀 SETUP GUIDE - College Management System

**Quick setup from scratch (both development and production)**

---

## 📋 Prerequisites

- **Node.js:** v18+ (check: `node --version`)
- **npm:** v9+ (check: `npm --version`)
- **PostgreSQL:** v12+ (check: `psql --version`)
- **Git:** (check: `git --version`)

---

## 🔧 DEVELOPMENT SETUP (Local Machine)

### Step 1: Clone Repository

```bash
git clone <your-repo-url>
cd college-client
```

### Step 2: Frontend Setup

```bash
# Install dependencies
npm install

# Create development environment
cp .env.example .env.development

# Edit with local values
# VITE_API_BASE_URL=http://localhost:5000/api
nano .env.development

# Start dev server
npm run dev
# Opens at http://localhost:5173
```

### Step 3: Backend Setup

```bash
cd college-server

# Install dependencies
npm install

# Create development environment
cp .env.example .env

# Edit with local values
cat > .env << EOF
NODE_ENV=development
PORT=5000
DEBUG=true

DB_HOST=localhost
DB_PORT=5432
DB_NAME=college_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_POOL_MIN=5
DB_POOL_MAX=20

JWT_SECRET=your_dev_secret_at_least_32_chars_long
JWT_EXPIRES_IN=8h

CORS_ORIGIN=http://localhost:5173

LOG_LEVEL=debug
LOG_DIR=./logs

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

ENABLE_EMAIL_NOTIFICATIONS=false
EOF
```

### Step 4: Database Setup

```bash
# Create database
createdb -U postgres college_db

# Verify connection
psql -U postgres -d college_db -c "SELECT 1;"

# Apply migrations (if needed)
cd college-server
npm run verify-indexes

# Seed sample data
npm run seed
```

### Step 5: Start Backend

```bash
cd college-server
npm run dev
# Starts at http://localhost:5000
# API available at http://localhost:5000/api
```

### Step 6: Login

**Access frontend at:** http://localhost:5173

**Use seeded credentials:**
```
Admin:
Email: admin@college.com
Password: admin123

Teacher:
Email: teacher1@college.com
Password: teacher123

Student:
Email: student1@college.com
Password: student123

HOD:
Email: hod@college.com
Password: hod123
```

---

## 🏭 PRODUCTION DEPLOYMENT

### Option 1: Deploy to AWS (EC2 + RDS)

#### Prerequisites
- AWS account
- EC2 instance (Ubuntu 20.04+, t2.medium minimum)
- RDS PostgreSQL database

#### Step 1: SSH into EC2

```bash
ssh -i your-key.pem ec2-user@your-instance-ip
```

#### Step 2: Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
```

#### Step 3: Clone Repository

```bash
git clone <your-repo-url> /opt/college-app
cd /opt/college-app
```

#### Step 4: Frontend Build

```bash
cd /opt/college-app
npm ci
npm run build
# Output: dist/ folder

# Copy to web server
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html/
```

#### Step 5: Backend Setup

```bash
cd /opt/college-app/college-server

npm ci

# Create production environment
sudo nano .env.production
```

**Template:**
```env
NODE_ENV=production
PORT=5000

DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=5432
DB_NAME=college_db
DB_USER=college_user
DB_PASSWORD=YOUR_SECURE_PASSWORD_HERE

JWT_SECRET=YOUR_SECURE_JWT_SECRET_HERE
CORS_ORIGIN=https://yourdomain.com

LOG_LEVEL=warn
```

#### Step 6: Start with PM2

```bash
sudo npm install -g pm2

pm2 start src/server.js --name college-api \
  --env NODE_ENV=production \
  --log /var/log/college-api.log

pm2 startup
pm2 save
```

#### Step 7: Setup Nginx (Reverse Proxy)

```bash
sudo apt-get install -y nginx

# Create config
sudo nano /etc/nginx/sites-available/college-app
```

**Config:**
```nginx
upstream college_api {
  server 127.0.0.1:5000;
}

server {
  listen 80;
  server_name api.yourdomain.com;

  location / {
    proxy_pass http://college_api;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
  }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/college-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 8: Setup SSL (Let's Encrypt)

```bash
sudo apt-get install -y certbot python3-certbot-nginx

sudo certbot --nginx -d api.yourdomain.com -d yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

---

### Option 2: Deploy to Heroku

```bash
# Login
heroku login

# Create apps
heroku create college-app-frontend
heroku create college-app-backend

# Set environment variables
heroku config:set -a college-app-backend \
  NODE_ENV=production \
  DB_HOST=your-postgres \
  JWT_SECRET=your-secret

# Deploy frontend
git subtree push --prefix college-client heroku main

# Deploy backend
cd college-server
git subtree push --prefix college-server heroku main
```

---

### Option 3: Deploy to Vercel + Railway

**Frontend (Vercel):**
```bash
npm i -g vercel
vercel --prod
```

**Backend (Railway):**
1. Push to GitHub
2. Connect on railway.app
3. Set environment variables
4. Deploy

---

## 📊 Verify Deployment

```bash
# Frontend loads
curl https://yourdomain.com

# API responds
curl https://api.yourdomain.com/api/auth/health

# Login works
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"admin@college.com",
    "password":"admin123"
  }'
```

---

## 🐛 Common Issues & Fixes

### Node modules not installing
```bash
rm -rf node_modules package-lock.json
npm install
```

### Port already in use
```bash
# Find process on port 5000
lsof -i :5000
# Kill it
kill -9 <PID>
```

### Database connection refused
```bash
# Check PostgreSQL running
sudo systemctl status postgresql

# Verify credentials
psql -h DB_HOST -U DB_USER -d DB_NAME

# Check .env file has correct values
cat .env
```

### CORS errors
```bash
# Verify CORS_ORIGIN in .env matches frontend URL
CORS_ORIGIN=https://yourdomain.com

# Restart server
pm2 restart college-api
```

### Disk space full
```bash
# Check disk usage
df -h

# Clear old logs
sudo rm -rf logs/archived/*

# Clear npm cache
npm cache clean --force
```

---

## 📈 Performance Tuning

### Database Optimization
```bash
# Apply indexes
cd college-server
npm run verify-indexes

# Check index usage
psql -U postgres -d college_db
SELECT * FROM pg_stat_user_indexes;
```

### Connection Pool Tuning
```env
# In .env.production
DB_POOL_MIN=10      # Minimum connections
DB_POOL_MAX=50      # Maximum connections
DB_IDLE_TIMEOUT=30000  # 30 seconds idle
```

### Nginx Caching
```nginx
location ~* \.(js|css|png|jpg)$ {
  expires 30d;
  add_header Cache-Control "public, immutable";
}
```

---

## 🔐 Security Checklist

- [ ] JWT_SECRET is 32+ random characters
- [ ] DB_PASSWORD is 16+ random characters
- [ ] .env file not committed
- [ ] HTTPS enabled on all endpoints
- [ ] CORS_ORIGIN doesn't include *
- [ ] Database backups configured
- [ ] Rate limiting enabled
- [ ] Authentication required for all private routes
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive info

---

## 📝 Monitoring

### Check Server Status
```bash
pm2 status
pm2 logs college-api
```

### Monitor Resources
```bash
# Memory usage
free -h

# CPU usage
top -p $(pgrep -f "node")

# Disk usage
df -h
```

### Database Health
```bash
psql -U postgres -d college_db -c "SELECT 1;"
```

---

## 🆘 Support

- **Documentation:** See README.md
- **Issues:** Check error logs in logs/ folder
- **Contact:** Refer to project maintainers

---

**Setup Complete! 🎉**

