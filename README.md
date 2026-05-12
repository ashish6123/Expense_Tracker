# Expense Tracker Pro

A full-stack expense management application built with **Node.js, Express, MySQL, and vanilla JavaScript**.  
It enables users to securely manage transactions, categorize spending, and view actionable financial insights.

---

## 🚀 Why This Project Stands Out

This project demonstrates practical, production-style engineering across the full stack:

- End-to-end feature ownership (backend APIs, DB schema, frontend UX, deployment setup)
- Secure authentication lifecycle (register, verify, login, password reset)
- Security hardening with modern middleware and abuse protection
- Analytics workflows from SQL aggregations to visual summaries
- Dockerized setup for fast local onboarding and deployment readiness

---

## 🧱 Tech Stack

- **Backend:** Node.js, Express
- **Database:** MySQL
- **Frontend:** HTML, CSS, JavaScript (vanilla)
- **Security/Auth:** JWT, bcrypt, httpOnly cookies, Helmet, rate limiting
- **DevOps:** Docker, Docker Compose, environment-based configuration

---

## ✨ Core Features

- User authentication and account security flows
- Expense CRUD and category-based organization
- Analytics summaries (monthly totals, category breakdowns, trends)
- Responsive UI with dark-mode-friendly styling
- Health-check endpoint for runtime monitoring

---

## 🏗️ High-Level Architecture

- `server.js` — app bootstrap, middleware, static hosting
- `routes/auth.js` — authentication and account-related APIs
- `routes/expenses.js` — expense operations
- `routes/categories.js` — category management
- `database/connection.js` — MySQL connection setup
- `scripts/init-database.js` — schema/bootstrap scripts
- `public/` — frontend pages and static assets
- `public/js/app.js` — shared client-side helpers

---

## 🔐 Security Practices

- Password hashing with bcrypt
- JWT-based session/auth handling
- httpOnly cookie usage
- Helmet-based security headers (including CSP)
- Rate limiting for abuse-prone endpoints
- Account recovery flows designed to reduce user enumeration risk

---

## 📈 Product/Business Value

- Improves personal finance visibility with structured tracking
- Encourages user retention via intuitive UX and analytics feedback
- Built as a foundation for future features (budgets, alerts, advanced reports)

---

## 🧪 Local Development

1. Clone the repository
2. Configure environment variables
3. Start with Docker Compose (recommended) or run app + MySQL manually
4. Initialize database using provided script
5. Access app in browser

---

## ✅ Production Readiness Signals

- Containerized application runtime
- Configuration via environment variables
- Health endpoint for monitoring and uptime checks
- Modular route structure for maintainability and scaling

---

## 🛣️ Next Improvements

- Add complete test coverage (unit + integration)
- Add linting/format enforcement in CI
- Complete budgets feature wiring
- Resolve email provider configuration consistency
- Remove/modernize any legacy frontend pages

---

## 👨‍💻 Author Note

This project is intended to showcase full-stack development capability, secure backend design, and practical product thinking in a real-world style application.
