# ⚡ QUICK START - ROOT FILES REFERENCE

**What should be in root directories when uploading.**

---

## 📦 FRONTEND ROOT: `college-client/`

### Essential Files (Must Include)

```
✅ .env.example              Template for environment setup
✅ .env.production           Production environment (not in git)
✅ .gitignore                What to exclude from git
✅ package.json              Dependencies and npm scripts
✅ package-lock.json         Locked dependency versions
✅ README.md                 Project documentation
✅ vite.config.js            Build configuration
✅ tailwind.config.js        CSS framework config
✅ postcss.config.js         CSS processing config
✅ eslint.config.js          Linting configuration
✅ index.html                HTML entry point
```

### Folders (Must Include)

```
✅ src/                      React source code
✅ public/                   Static assets (if exists)
```

### Should NOT Include

```
❌ node_modules/             Install via npm ci
❌ dist/                     Build artifact (generate on deploy)
❌ .env                      Local only, use .env.production
❌ AUDIT_*.md                Debug files
❌ CHECKLIST.md              Debug files
❌ DEPLOYMENT_*.md           Debug files
❌ diag.txt, reset_output.txt  Debug files
❌ .idea/                    IDE config
```

---

## 📦 BACKEND ROOT: `college-server/`

### Essential Files (Must Include)

```
✅ .env.example              Template for environment setup
✅ .env.production           Production environment (not in git)
✅ .gitignore                What to exclude from git
✅ package.json              Dependencies and npm scripts
✅ package-lock.json         Locked dependency versions
✅ README.md                 Backend documentation
✅ server.js                 Entry point (or src/server.js)
✅ seed.js                   Database seeder script
✅ verify-indexes.js         Index verification script
```

### Folders (Must Include)

```
✅ src/                      Server source code
   ✅ server.js              App initialization
   ✅ app.js                 Express setup
   ✅ config/                Configuration files
   ✅ modules/               Feature modules
   ✅ middlewares/           Middleware functions
   ✅ utils/                 Utilities

✅ sql/                      Database migrations
   ✅ *.sql                  Migration files
```

### Should NOT Include

```
❌ node_modules/             Install via npm ci
❌ .env                      Use .env.production
❌ logs/                     Generate on server
❌ server.log                Generated on runtime
❌ ANNOUNCEMENT_*.md         Debug files
❌ DATABASE_*.md             Debug files
❌ FINAL_*.md                Debug files
❌ INDEXING_*.md             Debug files
❌ VIEW_MARKS_*.md           Debug files
❌ .idea/                    IDE config
```

---

## 🔐 ENVIRONMENT VARIABLES TEMPLATE

### Frontend: `.env.example`

```env
# Frontend Environment Variables
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ENV=development
VITE_LOG_LEVEL=debug
```

**For Production:**
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_ENV=production
VITE_LOG_LEVEL=error
```

### Backend: `.env.example`

```env
# Server
NODE_ENV=development
PORT=5000
DEBUG=false

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=college_db
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_POOL_MIN=5
DB_POOL_MAX=50

# Auth
JWT_SECRET=generate_32_char_random_string_here
JWT_EXPIRES_IN=8h

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=debug
LOG_DIR=./logs

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**For Production:**
```env
NODE_ENV=production
DB_HOST=your-prod-db.com
JWT_SECRET=<strong-32-char-string>
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=warn
ENABLE_EMAIL_NOTIFICATIONS=true
```

---

## ✅ PRE-UPLOAD CHECKLIST

### Clean Directories

```bash
# Frontend cleanup
cd college-client
git rm -f AUDIT_*.md CHECKLIST.md DEPLOYMENT_*.md diag.txt
git rm -f QUICK_*.md STARTUP_*.md EXECUTIVE_*.md MISSING_*.md
git rm -f IMPLEMENTED_*.md FEATURES_*.md PRODUCTION_*.md
git rm -f reset_output.txt

# Backend cleanup
git rm -f college-server/ANNOUNCEMENT_*.md
git rm -f college-server/DATABASE_*.md college-server/FINAL_*.md
git rm -f college-server/FILES_*.md college-server/INDEXING_*.md
git rm -f college-server/NPM_*.md college-server/VIEW_*.md
git rm -f college-server/server.log

git add -A
git commit -m "Clean: Remove debug files"
git push
```

### Verify Environment Files

```bash
# Frontend
cat college-client/.env.example
# Should show: VITE_API_BASE_URL, VITE_ENV, VITE_LOG_LEVEL

# Backend
cat college-server/.env.example
# Should show: NODE_ENV, DB_HOST, JWT_SECRET, CORS_ORIGIN
```

### Verify .gitignore

```bash
# Frontend
grep "^\.env$" college-client/.gitignore     # Should exist
grep "^node_modules" college-client/.gitignore  # Should exist
grep "^dist" college-client/.gitignore       # Should exist

# Backend
grep "^\.env$" college-server/.gitignore     # Should exist
grep "^node_modules" college-server/.gitignore  # Should exist
grep "^logs" college-server/.gitignore       # Should exist
```

---

## 🚀 DEPLOYMENT COMMANDS

### Build & Deploy Frontend

```bash
cd college-client
npm ci                  # Install exact versions
npm run build           # Create dist/
# Deploy dist/ to hosting (Vercel, AWS S3, Nginx, etc)
```

### Deploy Backend

```bash
cd college-server
npm ci
cp .env.example .env.production
# Edit .env.production with real credentials
npm run seed:prod       # Optional: seed database
NODE_ENV=production npm start
```

---

## 📋 FILE-BY-FILE CHECKLIST

### Root Level

| File | Frontend | Backend | Required | Include in Git |
|------|----------|---------|----------|----------------|
| `.env.example` | ✅ | ✅ | YES | YES |
| `.env.production` | ✅ | ✅ | NO (generated) | **NO** |
| `.gitignore` | ✅ | ✅ | YES | YES |
| `package.json` | ✅ | ✅ | YES | YES |
| `package-lock.json` | ✅ | ✅ | YES | YES |
| `README.md` | ✅ | ✅ | YES | YES |
| `vite.config.js` | ✅ | ❌ | YES | YES |
| `tailwind.config.js` | ✅ | ❌ | YES | YES |
| `postcss.config.js` | ✅ | ❌ | YES | YES |
| `eslint.config.js` | ✅ | ❌ | YES | YES |
| `index.html` | ✅ | ❌ | YES | YES |
| `server.js` | ❌ | ✅ | YES | YES |
| `seed.js` | ❌ | ✅ | NO (optional) | YES |

---

## 🎯 QUICK REFERENCE

### For Developers

**Clone & Setup:**
```bash
git clone <repo>
cd college-client
cp .env.example .env.development
npm install
npm run dev
```

### For DevOps/Deployment

**Production Setup:**
```bash
git clone <repo> /app
cd /app/college-server
npm ci
cp .env.example .env.production
# Edit credentials
npm run seed:prod
NODE_ENV=production npm start
```

---

## ⚠️ COMMON MISTAKES

❌ **Mistake:** Committing `.env` file  
✅ **Fix:** Always use `git rm --cached .env` and add to `.gitignore`

❌ **Mistake:** Missing `package-lock.json`  
✅ **Fix:** Always commit lock file for exact dependency versions

❌ **Mistake:** Including `node_modules/` in upload  
✅ **Fix:** `.gitignore` should have `node_modules` and use `npm ci` on deploy

❌ **Mistake:** `.env.example` with actual credentials  
✅ **Fix:** Use placeholder values like `your_password_here`

❌ **Mistake:** Not setting CORS_ORIGIN correctly  
✅ **Fix:** Must match frontend domain exactly

❌ **Mistake:** Weak JWT_SECRET  
✅ **Fix:** Use `openssl rand -base64 32` to generate strong secret

---

## 🔗 RELATED DOCUMENTS

- `DEPLOYMENT_ROOT_FILES.md` - Detailed guide on each file
- `DEPLOYMENT_CHECKLIST.md` - Pre-deployment verification
- `SETUP_GUIDE.md` - Complete setup instructions
- `README.md` - Project overview and features

---

**Status:** ✅ Ready for Production Upload

**Last Updated:** March 18, 2026

