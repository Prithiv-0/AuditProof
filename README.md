# 🔐 VeriSchol - Secure Research Data Integrity System

[![Deploy Status](https://img.shields.io/badge/Backend-Render-blueviolet)](https://verischol-api.onrender.com)
[![Deploy Status](https://img.shields.io/badge/Frontend-Vercel-black)](https://audit-proof.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A military-grade secure platform for managing research data with **end-to-end encryption**, **digital signatures**, and **tamper detection**. Built for researchers, auditors, and administrators who need cryptographic proof of data integrity.

## 🌐 Live Demo

- **Frontend**: [audit-proof.vercel.app](https://audit-proof.vercel.app)
- **Backend API**: [verischol-api.onrender.com](https://verischol-api.onrender.com)

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `real@gmail.com` | `Prithiv@123` |
| Researcher | `researcher1@example.com` | `Prithiv@123` |
| Auditor | `auditor1@example.com` | `Prithiv@123` |

> **Note**: OTP will be sent via email if configured, otherwise displayed on screen (demo mode).

---

## ✨ Features

### 🔒 Security
- **AES-256-GCM Encryption** - Military-grade symmetric encryption for data at rest
- **RSA-2048 Key Exchange** - Asymmetric encryption for secure key distribution
- **SHA-256 Hashing** - Cryptographic integrity verification
- **Digital Signatures** - Non-repudiation and authenticity proof
- **Multi-Factor Authentication** - Password + OTP login flow

### 👥 Role-Based Access Control
- **Admin** - Full system access, user management, project creation
- **Researcher** - Create and manage research data within assigned projects
- **Auditor** - Verify data integrity, detect tampering, audit logs

### 📊 Features by Role
| Feature | Admin | Researcher | Auditor |
|---------|-------|------------|---------|
| View Dashboard | ✅ | ✅ | ✅ |
| Manage Users | ✅ | ❌ | ❌ |
| Create Projects | ✅ | ❌ | ❌ |
| Submit Research Data | ✅ | ✅ | ❌ |
| Verify Data Integrity | ✅ | ❌ | ✅ |
| View Audit Logs | ✅ | ❌ | ✅ |

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  React Frontend │────▶│  Express API    │────▶│  PostgreSQL     │
│  (Vercel)       │     │  (Render)       │     │  (Render)       │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  Tailwind CSS   │     │  Resend Email   │
│  Lucide Icons   │     │  (OTP Delivery) │
└─────────────────┘     └─────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- PostgreSQL (or use Render's free PostgreSQL)
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Prithiv-0/AuditProof.git
   cd AuditProof
   ```

2. **Setup Backend**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials
   npm install
   npm run db:init
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   cp .env.example .env
   # Edit .env if needed
   npm install
   npm run dev
   ```

4. **Access the app**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000

---

## ☁️ Deployment

### Backend (Render)

1. Create account at [render.com](https://render.com)
2. New → Web Service → Connect GitHub repo
3. Set **Root Directory**: `backend`
4. Set **Build Command**: `npm install`
5. Set **Start Command**: `npm start`
6. Add PostgreSQL database
7. Add environment variables:
   - `FRONTEND_URL` - Your Vercel URL
   - `RESEND_API_KEY` - For email OTP (optional)
   - `EMAIL_FROM` - Sender email (optional)

### Frontend (Vercel)

1. Create account at [vercel.com](https://vercel.com)
2. Import GitHub repo
3. Set **Root Directory**: `frontend`
4. Add environment variable:
   - `VITE_API_URL` - Your Render URL + `/api`

---

## � Environment Variables

### Backend
| Variable | Description | Required |
|----------|-------------|----------|
| `DB_HOST` | PostgreSQL host | ✅ |
| `DB_PORT` | PostgreSQL port | ✅ |
| `DB_NAME` | Database name | ✅ |
| `DB_USER` | Database user | ✅ |
| `DB_PASSWORD` | Database password | ✅ |
| `JWT_SECRET` | JWT signing key | ✅ |
| `SYSTEM_SALT` | Hashing salt | ✅ |
| `FRONTEND_URL` | Frontend URL for CORS | ✅ |
| `RESEND_API_KEY` | Resend API key | Optional |
| `EMAIL_FROM` | Sender email | Optional |

### Frontend
| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | ✅ |

---

## � API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login (step 1 - password) |
| POST | `/api/auth/verify-otp` | Login (step 2 - OTP) |

### Research Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/data` | List research data |
| POST | `/api/data` | Create research data |
| GET | `/api/data/:id` | Get specific record |
| POST | `/api/data/:id/verify` | Verify data integrity |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project (Admin) |
| GET | `/api/projects/:id` | Get project details |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| POST | `/api/admin/users` | Create user |
| GET | `/api/admin/stats` | System statistics |

---

## 🛡️ Security Features Explained

### Data Encryption Flow
```
User Input → SHA-256 Hash → AES-256-GCM Encrypt → RSA-2048 Wrap Key → Store
```

### Verification Flow
```
Retrieve → RSA Unwrap Key → AES Decrypt → Recalculate Hash → Compare → Result
```

### Tamper Detection
- Original content hash stored at creation
- Any modification changes the hash
- Auditors can detect tampering instantly

---

## 📁 Project Structure

```
AuditProof/
├── backend/
│   ├── src/
│   │   ├── config/          # Database & auto-init
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth & validation
│   │   ├── models/          # SQL schema
│   │   ├── routes/          # API routes
│   │   ├── services/        # Email service
│   │   └── utils/           # Crypto utilities
│   ├── package.json
│   └── render.yaml          # Render deployment config
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API client
│   │   └── App.jsx          # Main app
│   ├── package.json
│   └── vercel.json          # Vercel config
└── README.md
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Prithiv**
- GitHub: [@Prithiv-0](https://github.com/Prithiv-0)

---

<p align="center">
  <b>🔐 VeriSchol - Where Research Integrity Meets Military-Grade Security</b>
</p>
