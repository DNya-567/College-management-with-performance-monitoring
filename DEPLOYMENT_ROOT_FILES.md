# 📦 Root Directory Files Guide for Deployment

When uploading the college management system to production, ensure these files are in the root directories.

---

## 🎯 FRONTEND ROOT (`college-client/`)

### ✅ MUST HAVE FILES

```
college-client/
├── .env.production              ← Production environment variables
├── .env.example                 ← Template for env setup
├── .gitignore                   ← Git ignore patterns
├── package.json                 ← Dependencies & scripts
├── package-lock.json            ← Lock file (commit this)
├── README.md                    ← Project documentation
├── vite.config.js               ← Vite bundler config
├── tailwind.config.js           ← Tailwind CSS config
├── postcss.config.js            ← PostCSS config
├── eslint.config.js             ← ESLint config
└── index.html                   ← HTML entry point
```

### 📝 EXAMPLE: `.env.production`

```env
# Frontend Production Environment
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_ENV=production
VITE_LOG_LEVEL=error
```

### 📝 EXAMPLE: `package.json` scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src"
  }
}
```

### ❌ SHOULD NOT INCLUDE

- `.env` (local only)
- `node_modules/` (install on deployment)
- `dist/` (build on deployment)
- Debug/audit markdown files (clean before upload)
- `.idea/` (IDE config)

---

## 🎯 BACKEND ROOT (`college-server/`)

### ✅ MUST HAVE FILES

```
college-server/
├── .env.production              ← Production secrets & config
├── .env.example                 ← Template for setup
├── .gitignore                   ← Git patterns
├── package.json                 ← Dependencies & scripts
├── package-lock.json            ← Lock file (commit)
├── README.md                    ← Backend documentation
├── server.js                    ← Entry point
├── seed.js                      ← Database seeder (optional in prod)
├── verify-indexes.js            ← Index verification script
├── src/                         ← Source code
│   ├── server.js                ← App initialization
│   ├── app.js                   ← Express app setup
│   ├── config/
│   │   ├── db.js                ← Database connection
│   │   └── logger.js            ← Logging setup
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   └── errorHandler.js
│   ├── modules/                 ← Feature modules
│   └── utils/
│       ├── responseFormatter.js
│       ├── validation.js
│       ├── retry.js
│       └── sanitizer.js
└── sql/                         ← Migration files
    └── *.sql
```

### 📝 EXAMPLE: `.env.production`

```env
# Server Config
PORT=5000
NODE_ENV=production
DEBUG=false

# Database
DB_HOST=prod-db.example.com
DB_PORT=5432
DB_NAME=college_prod
DB_USER=college_user
DB_PASSWORD=your_secure_password_here
DB_POOL_MIN=5
DB_POOL_MAX=50
DB_CONNECTION_TIMEOUT=5000

# JWT Secret (use strong random string)
JWT_SECRET=your_very_secure_random_string_minimum_32_chars

# CORS
CORS_ORIGIN=https://yourdomain.com

# Email (for password reset, announcements)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your_email_app_password
SMTP_FROM=noreply@yourdomain.com

# Logging
LOG_LEVEL=warn
LOG_DIR=/var/log/college-api

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Session
SESSION_SECRET=your_session_secret_here
```

### 📝 EXAMPLE: `package.json` scripts

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "seed": "node seed.js",
    "seed:prod": "NODE_ENV=production node seed.js",
    "verify-indexes": "node verify-indexes.js",
    "test": "jest --coverage"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

### ❌ SHOULD NOT INCLUDE

- `.env` (use `.env.production`)
- `node_modules/` (install via npm ci)
- `logs/` folder (create on server)
- Test files (unless in `test/` folder)
- Debug markdown files
- `.idea/` or IDE configs

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Upload

- [ ] **Frontend**: Remove all `.md` debug files except README.md
- [ ] **Backend**: Remove all `.md` debug files except README.md
- [ ] **Both**: Create `.env.example` with all required keys
- [ ] **Both**: `.gitignore` blocks `.env`, `node_modules/`, `dist/`, `logs/`
- [ ] **Backend**: Verify all migration SQL files are in `sql/` folder
- [ ] **Backend**: Test `npm run verify-indexes` locally
- [ ] **Backend**: Verify database connection config

### Environment Setup

#### Frontend (.env.production)
```env
VITE_API_BASE_URL=<your_api_domain>
```

#### Backend (.env.production)
```env
NODE_ENV=production
PORT=5000
DB_HOST=<postgresql_host>
DB_USER=<pg_user>
DB_PASSWORD=<secure_password>
JWT_SECRET=<32_char_random_string>
CORS_ORIGIN=<your_frontend_domain>
```

### Deployment Steps

```bash
# 1. Clone repository
git clone <your_repo_url>

# 2. Setup Frontend
cd college-client
npm ci                  # Use lock file
npm run build
# Output: dist/ folder ready for server

# 3. Setup Backend
cd ../college-server
npm ci                  # Use lock file
cp .env.example .env.production
# Edit .env.production with production values

# 4. Initialize Database
npm run verify-indexes
npm run seed:prod       # Optional: populate demo data

# 5. Start Server
NODE_ENV=production npm start
```

---

## 📋 FILE-BY-FILE REFERENCE

### ROOT LEVEL ESSENTIALS

| File | Frontend | Backend | Purpose |
|------|----------|---------|---------|
| `.env.production` | ✅ | ✅ | Production secrets |
| `.env.example` | ✅ | ✅ | Template for setup |
| `.gitignore` | ✅ | ✅ | What to exclude from git |
| `package.json` | ✅ | ✅ | Dependencies & scripts |
| `package-lock.json` | ✅ | ✅ | Dependency lock |
| `README.md` | ✅ | ✅ | Documentation |
| `vite.config.js` | ✅ | ❌ | Build config |
| `tailwind.config.js` | ✅ | ❌ | Tailwind setup |
| `postcss.config.js` | ✅ | ❌ | PostCSS setup |
| `eslint.config.js` | ✅ | ❌ | Linting rules |
| `server.js` | ❌ | ✅ | Entry point |
| `seed.js` | ❌ | ✅ | DB seeder |

---

## 🔐 SECURITY CHECKLIST

### Before Uploading

- [ ] **No hardcoded secrets** in any file
- [ ] **All secrets in `.env.production`** (not committed)
- [ ] **`.gitignore` includes `.env`** and `node_modules/`
- [ ] **Strong JWT_SECRET** (min 32 random characters)
- [ ] **Strong DB_PASSWORD** (min 16 random characters)
- [ ] **CORS_ORIGIN set correctly** (not `*`)
- [ ] **Rate limiting enabled** in .env
- [ ] **HTTPS enforced** on production domain
- [ ] **Logging configured** (not DEBUG mode)
- [ ] **No test data** in production seeds

### Post-Deployment

- [ ] Monitor logs for errors
- [ ] Test all authentication flows
- [ ] Verify CORS settings working
- [ ] Check rate limiting active
- [ ] Monitor database connections
- [ ] Enable backups

---

## 📂 CLEAN UP BEFORE UPLOADING

### Files to DELETE (Frontend)

```bash
rm -f AUDIT_*.md
rm -f IMPLEMENTATION_*.md
rm -f MISSING_*.md
rm -f DEPLOYMENT_*.md
rm -f QUICK_*.md
rm -f EXECUTIVE_*.md
rm -f FEATURES_*.md
rm -f PRODUCTION_*.md
rm -f STARTUP_*.md
rm -f CHECKLIST.md
rm -f diag.txt
rm -f reset_output.txt
```

### Files to DELETE (Backend)

```bash
rm -f ANNOUNCEMENT_*.md
rm -f DATABASE_*.md
rm -f FILES_*.md
rm -f FINAL_*.md
rm -f INDEXING_*.md
rm -f NPM_*.md
rm -f VIEW_MARKS_*.md
rm -f server.log
```

**Keep only:**
- `README.md` (updated with setup instructions)
- Source code files
- Migration SQL files
- Config files

---

## ✅ FINAL DEPLOYMENT SUMMARY

### Frontend to Upload

```
college-client/
├── .env.example
├── .env.production (with real values)
├── .gitignore
├── README.md
├── package.json
├── package-lock.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
├── index.html
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── api/
    ├── auth/
    ├── components/
    ├── pages/
    └── routes/
```

### Backend to Upload

```
college-server/
├── .env.example
├── .env.production (with real values)
├── .gitignore
├── README.md
├── package.json
├── package-lock.json
├── server.js
├── seed.js
├── verify-indexes.js
├── src/
│   ├── server.js
│   ├── app.js
│   ├── config/
│   ├── middlewares/
│   ├── modules/
│   └── utils/
└── sql/
    └── *.sql files
```

---

## 🎯 QUICK REFERENCE: WHAT'S MISSING?

If your deployment fails, check these files exist:

### Frontend
- [ ] `.env.production` with `VITE_API_BASE_URL`
- [ ] `package.json` with build script
- [ ] `vite.config.js`
- [ ] `index.html`

### Backend
- [ ] `.env.production` with DB credentials
- [ ] `package.json` with start script
- [ ] `src/server.js` entry point
- [ ] `src/config/db.js` connection
- [ ] `sql/` folder with migrations

---

**Status:** Ready for deployment ✅

