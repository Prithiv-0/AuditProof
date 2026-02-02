# VeriSchol - Secure Research Data Integrity System

A comprehensive full-stack application for securing research data integrity with cryptographic verification, role-based access control, and tamper detection.

![VeriSchol](https://img.shields.io/badge/VeriSchol-Secure%20Research-6366f1?style=for-the-badge)

## 🔐 Features

- **Multi-Factor Authentication (MFA)** - Password + OTP verification
- **Role-Based Access Control** - Researcher, Auditor, and Admin roles
- **Project-Based Organization** - Organize research into projects with team assignments
- **AES-256-GCM Encryption** - Military-grade encryption for research data
- **SHA-256 Integrity Hashing** - Tamper detection via cryptographic hashes
- **RSA Key Exchange** - Secure key management between users
- **Audit Trail** - Complete verification history

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React (Vite)  │────▶│   Express API   │────▶│   PostgreSQL    │
│    Frontend     │     │    Backend      │     │    Database     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
      Vercel              Render                  Render
```

## 🚀 Deployment

### Backend (Render)

1. Create a [Render](https://render.com) account
2. Click **New** → **Blueprint**
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml` and deploy:
   - PostgreSQL database
   - Node.js API server
5. After deployment, run database migration:
   ```bash
   # In Render shell or via SSH
   npm run db:migrate
   ```
6. Add environment variable:
   - `FRONTEND_URL`: Your Vercel frontend URL

### Frontend (Vercel)

1. Create a [Vercel](https://vercel.com) account
2. Import your GitHub repository
3. Set the root directory to `frontend`
4. Add environment variable:
   - `VITE_API_URL`: Your Render backend URL + `/api`
     (e.g., `https://verischol-api.onrender.com/api`)
5. Deploy!

## 💻 Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run db:init
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 👥 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | real@gmail.com | Prithiv@123 |
| Researcher | researcher1@example.com | Prithiv@123 |
| Auditor | auditor1@example.com | Prithiv@123 |

> Note: In demo mode, the OTP is displayed on the login screen.

## 🔒 Security Model

| Role | Create Projects | View Data | Edit Data | Verify | Manage Users |
|------|----------------|-----------|-----------|--------|--------------|
| Admin | ✅ | ❌ (Restricted) | ❌ | ❌ | ✅ |
| Researcher | ❌ | ✅ Own only | ✅ Own only | ❌ | ❌ |
| Auditor | ❌ | ✅ Assigned | ❌ | ✅ | ❌ |

## 📁 Project Structure

```
verischol/
├── backend/
│   ├── src/
│   │   ├── config/          # Database & initialization
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth & RBAC
│   │   ├── models/          # SQL schema
│   │   ├── routes/          # API routes
│   │   └── utils/           # Crypto utilities
│   ├── render.yaml          # Render deployment config
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── context/         # Auth context
│   │   ├── pages/           # Page components
│   │   └── services/        # API client
│   ├── vercel.json          # Vercel config
│   └── package.json
└── README.md
```

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (returns OTP)
- `POST /api/auth/verify-otp` - Complete MFA login
- `GET /api/auth/me` - Get current user profile

### Projects
- `GET /api/projects` - List projects (based on role/assignment)
- `GET /api/projects/:id` - Get project details and data
- `POST /api/projects` - Create project (Admin)
- `POST /api/projects/assign` - Assign user to project (Admin)

### Research Data
- `POST /api/data/upload` - Upload encrypted research data
- `PUT /api/data/:id` - Update research data (re-encrypts)
- `GET /api/data/:id` - Get decrypted data (if authorized)
- `POST /api/data/:id/verify` - Verify integrity (Auditor)
- `POST /api/data/:id/tamper` - Simulate attack (Demo)

### Admin
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `GET /api/admin/stats` - System statistics

## 📄 License

MIT License - See LICENSE file for details.

---

Built with ❤️ for secure research integrity.
