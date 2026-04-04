# 💸 Expense Tracker

A modern, full-stack **Expense Tracking Web App** built with a focus on **clean UI, real-world features, and production readiness**.

🔗 **Live App:** https://expense-tracker-awlz.onrender.com/

---

## 🚀 Overview

Expense Tracker Pro helps users manage their daily expenses with a sleek dashboard, category insights, and authentication system.

This project was built as a **full-stack capstone project** with real-world considerations like authentication, email verification, and deployment.

---

## ✨ Features

* 🔐 User Authentication (Login / Register)
* 📧 Email OTP Verification (Multiple providers tested)
* 📊 Interactive Dashboard
* 💰 Expense Tracking
* 📁 Category-wise Breakdown
* 📈 Analytics-ready structure
* 🌙 Modern Dark UI
* 📱 Responsive Design
* ☁️ Deployed on Render

---

## 🖥️ UI Preview

### 🔑 Authentication Page

Clean and minimal login experience with OTP support.

<p align="center">
  <img src="./assets/login.png" width="600"/>
</p>

---

### 📊 Dashboard

Modern dashboard with insights, recent expenses, and category breakdown.

<p align="center">
  <img src="./assets/dashboard.png" width="1000"/>
</p>

---

## 🛠️ Tech Stack

### Frontend

* HTML
* CSS (Custom styling, no heavy frameworks)
* JavaScript (Vanilla)

### Backend

* Node.js
* Express.js

### Database

* MySQL

### Email Services (Experimented)

* Nodemailer (Gmail SMTP - for local testing)
* Resend (Faced free-tier limitations)
* SendGrid (Working but sometimes delayed / spam issues)

### Deployment

* Render

---

## ⚙️ Key Engineering Decisions

### 📧 Email Delivery Challenges

Email verification was implemented with real-world constraints:

* **Nodemailer (Gmail SMTP)**
  ✔️ Works well locally
  ❌ Not reliable for production

* **Resend**
  ❌ Free tier limitations affected OTP delivery

* **SendGrid**
  ✔️ Works but
  ⚠️ Occasional delays
  ⚠️ Emails may land in spam

👉 **Future Improvement:**
Will integrate a **custom domain + verified sender identity** to ensure:

* Better deliverability
* No spam issues
* Faster OTP delivery

---

## 📂 Project Structure

```
Expense_Tracker/
│
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── config/
│   └── server.js
│
├── frontend/
│   ├── dashboard.html
│   ├── login.html
│   ├── styles.css
│   └── script.js
│
├── database/
│   └── schema.sql
│
└── README.md
```

---

## 🚀 Getting Started

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/ashish6123/Expense_Tracker.git
cd Expense_Tracker
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Setup Environment Variables

Create a `.env` file:

```
PORT=5000
DB_HOST=your_host
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_db

EMAIL_USER=your_email
EMAIL_PASS=your_password
```

### 4️⃣ Run the Server

```bash
npm start
```

---

## 🧠 What I Learned

* Building a **complete full-stack app from scratch**
* Handling **authentication + OTP flows**
* Debugging **real-world email delivery issues**
* Designing a **clean UI without heavy frameworks**
* Deploying and managing a live production app

---

## 🔮 Future Improvements

* ✅ Domain-based email authentication (SPF, DKIM)
* 📊 Advanced analytics (charts & trends)
* 🔔 Notifications & reminders
* 📱 Progressive Web App (PWA)
* 🔐 JWT + refresh token system
* 💳 Budgeting & savings goals

---

## 🤝 Contributing

Contributions are welcome! Feel free to fork the repo and submit a PR.

---

## ⭐ Support

If you like this project:

* ⭐ Star the repo
* 🍴 Fork it
* 📢 Share it

---

## 👨‍💻 Author

**Ashish Ranjan**

* GitHub: https://github.com/ashish6123
* Project: Expense Tracker Pro

---

## 💬 Final Note

This project reflects **real-world problem solving**, not just coding — especially handling **email delivery challenges in production environments**.

More improvements are coming 🚀
