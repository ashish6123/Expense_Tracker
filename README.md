# 💰 Expense Tracker Pro

A production-ready full-stack expense tracking application with:
- 🔐 JWT Authentication (HTTP-only cookies)
- 📧 Email OTP verification on signup
- 🔑 Forgot Password with OTP reset
- 📊 Real-time analytics & category breakdown
- 🐳 Docker support for easy deployment
- 🛡️ Security: Helmet, rate limiting, bcrypt, input validation

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js + Express.js |
| Database | MySQL 8.0 |
| Auth | JWT + bcryptjs |
| Email | Nodemailer (Gmail / any SMTP) |
| Security | Helmet, express-rate-limit |
| Frontend | Vanilla HTML/CSS/JS (SPA) |

---

## 🚀 Quick Start (Local)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd expense-tracker-pro
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Open `.env` and fill in:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=expense_tracker_pro

# JWT (generate a strong secret)
JWT_SECRET=your_64_char_random_string_here

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
EMAIL_FROM="Expense Tracker Pro <your_email@gmail.com>"

# App URL
APP_URL=http://localhost:3000
```

> **Gmail App Password**: Go to Google Account → Security → 2-Step Verification → App Passwords → Generate

### 3. Initialize Database

```bash
npm run init-db
```

### 4. Start

```bash
npm start         # production
npm run dev       # development (auto-reload)
```

Open **http://localhost:3000** 🎉

---

## 🐳 Docker Deployment

### Prerequisites
- Docker + Docker Compose installed

### Steps

```bash
# 1. Copy and fill environment file
cp .env.example .env
# Edit .env — set DB_PASSWORD, JWT_SECRET, SMTP credentials

# 2. Start everything
docker-compose up -d

# 3. Initialize the database (first time only)
docker-compose exec app node scripts/init-database.js

# 4. View logs
docker-compose logs -f app
```

App is live at **http://localhost:3000**

---

## ☁️ Deploy to Railway (Free Tier)

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add a **MySQL** plugin
4. Set environment variables in Railway dashboard (copy from `.env.example`)
5. Railway auto-deploys on every push

## ☁️ Deploy to Render

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo, set:
   - Build command: `npm install`
   - Start command: `npm start`
4. Add a **MySQL** database in Render
5. Set all env vars from `.env.example`

## ☁️ Deploy to DigitalOcean / VPS

```bash
# On your server:
git clone <repo>
cd expense-tracker-pro
cp .env.example .env
# Edit .env with production values (NODE_ENV=production, real domain in APP_URL)

docker-compose up -d
docker-compose exec app node scripts/init-database.js
```

Set up Nginx as reverse proxy pointing to port 3000, then add SSL with Certbot.

---

## 📁 Project Structure

```
expense-tracker-pro/
├── server.js              # Express app entry point
├── package.json
├── .env.example           # Environment template
├── Dockerfile
├── docker-compose.yml
│
├── database/
│   └── connection.js      # MySQL connection pool
│
├── routes/
│   ├── auth.js            # Register, Login, OTP, Forgot/Reset Password
│   ├── expenses.js        # CRUD + Analytics
│   └── categories.js      # Category management
│
├── middleware/
│   └── auth.js            # JWT verification middleware
│
├── utils/
│   └── email.js           # Nodemailer OTP email sender
│
├── scripts/
│   └── init-database.js   # DB + table creation script
│
└── public/                # Frontend SPA
    ├── index.html
    ├── css/styles.css
    └── js/app.js
```

---

## 🔒 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/verify-email` | Verify email with OTP |
| POST | `/api/auth/resend-otp` | Resend OTP |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/forgot-password` | Send password reset OTP |
| POST | `/api/auth/reset-password` | Reset password with OTP |
| GET  | `/api/auth/me` | Get current user |
| PUT  | `/api/auth/profile` | Update name / password |

### Expenses (requires auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | List expenses (filterable) |
| POST | `/api/expenses` | Add expense |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |
| GET | `/api/expenses/analytics/summary` | Analytics data |

### Categories (requires auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List user categories |
| POST | `/api/categories` | Create category |
| DELETE | `/api/categories/:id` | Delete custom category |

---

## 🛡️ Security Features

- Passwords hashed with **bcrypt** (12 salt rounds)
- JWT stored in **HTTP-only cookies** (XSS-safe)
- **Helmet.js** sets security headers
- **Rate limiting** on auth (20/15min) and API (200/15min) endpoints
- OTP rate limiting: max 3 resends per 15 minutes
- Email enumeration protection on forgot-password
- Input sanitization on all endpoints

---

## 📧 Email Setup (Gmail)

1. Enable 2-Step Verification on your Google account
2. Go to: Google Account → Security → App Passwords
3. Select app: "Mail", device: "Other" → name it "Expense Tracker"
4. Copy the 16-character password into `SMTP_PASS` in your `.env`

For production, consider **SendGrid**, **Mailgun**, or **Resend** for better deliverability.
