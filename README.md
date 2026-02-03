# 🔐 VeriSchol - Secure Research Data Integrity System

**Live URLs:**
- Frontend: [audit-proof.vercel.app](https://audit-proof.vercel.app)
- Backend: [verischol-api.onrender.com](https://verischol-api.onrender.com)

---

## 🔑 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `real@gmail.com` 
| Researcher | `researcher1@example.com` 
| Auditor | `auditor1@example.com` 

---

## �️ Security Modules Implemented

| Module | Technology | Location |
|--------|------------|----------|
| Password Hashing | bcrypt (10 rounds) | `authController.js` |
| MFA/OTP | 6-digit, 5-min expiry | `authController.js` |
| JWT Authentication | RS256, 1h expiry | `jwtUtils.js` |
| Symmetric Encryption | AES-256-GCM | `cryptoUtils.js` |
| Asymmetric Encryption | RSA-2048 | `cryptoUtils.js` |
| Integrity Hashing | SHA-256 | `cryptoUtils.js` |
| Digital Signatures | RSA-SHA256 | `cryptoUtils.js` |
| Email OTP | Resend API | `emailService.js` |

---

## 🌐 Deployment Info

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | audit-proof.vercel.app |
| Backend | Render | verischol-api.onrender.com |
| Database | Render PostgreSQL | (internal) |
| Email | Resend | resend.com |

---

## 📁 Key Files Reference

```
backend/
├── src/controllers/authController.js    # Login, OTP, JWT
├── src/controllers/dataController.js    # Research data CRUD
├── src/utils/cryptoUtils.js             # All encryption/hashing
├── src/services/emailService.js         # OTP email sending
├── src/middleware/auth.js               # JWT verification
└── src/config/autoInit.js               # DB auto-setup

frontend/
├── src/pages/Login.jsx                  # MFA login flow
├── src/pages/Dashboard.jsx              # Main dashboard
├── src/components/VerifyModal.jsx       # Integrity verification
└── src/services/api.js                  # API client
```

---

## 🔧 Environment Variables (Render)

| Key | Purpose |
|-----|---------|
| `DB_*` | PostgreSQL connection |
| `JWT_SECRET` | Token signing |
| `SYSTEM_SALT` | Hash salt |
| `FRONTEND_URL` | CORS allowlist |
| `RESEND_API_KEY` | Email OTP |
| `EMAIL_FROM` | Sender address |

---

## � For Detailed Module Explanation

See: **[MODULES.md](MODULES.md)** - Complete breakdown of each security module with viva questions.
