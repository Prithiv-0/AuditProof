# VeriSchol – Secure Research Data Integrity, Audit & Controlled Access System

**Course:** 23CSE313 – Foundations of Cyber Security  
**Implementation:** Manual PERN Stack (No Firebase/Supabase – All security logic written from scratch)

---

## 📋 Project Overview

VeriSchol is a secure web portal designed to protect the integrity of academic research data. Researchers upload encrypted data that is cryptographically hashed, digitally signed, and access-controlled to prevent academic fraud and data tampering.

**Key Differentiator:** Unlike projects using pre-built authentication services, all cryptographic primitives (hashing, encryption, signatures) are implemented manually using Node.js `crypto` module, demonstrating deep understanding of security concepts.

---

## 🛡️ Security Modules Implemented

### Module 1: Authentication (NIST SP 800-63-2 Compliant)

| Concept | Implementation |
|---------|----------------|
| Password Security | Salted hashing using `bcrypt` (10 rounds) |
| Multi-Factor Auth | Server-generated 6-digit OTP with 5-minute expiry |
| Session Management | JWT tokens with 1-hour expiry |
| NIST Compliance | Password complexity enforcement, session timeouts |

**Files:** `authController.js`, `jwtUtils.js`, `emailService.js`

---

### Module 2: Authorization (Access Control Matrix)

**Subjects (Roles):**
| Subject | Description |
|---------|-------------|
| Researcher | Creates and signs research data |
| Auditor | Verifies data integrity, cannot modify |
| Admin | Manages users/projects, BLINDED from data content |

**Objects & Permissions:**
| Object | Researcher | Auditor | Admin |
|--------|------------|---------|-------|
| Research Data | Read/Write (own) | Read/Verify | ❌ BLINDED |
| Audit Logs | ❌ | Read | Read |
| System Settings | ❌ | ❌ | Full Access |

**Implementation:** Custom Express middleware (`verifyRole`) intercepts requests and enforces matrix.

**Files:** `auth.js` (middleware), `adminRoutes.js`, `dataRoutes.js`

---

### Module 3: Encryption (Hybrid Cryptographic Approach)

**Architecture:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    HYBRID ENCRYPTION FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Research Data                                                   │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────┐                                            │
│  │ AES-256-GCM     │◀── Random 256-bit Key (per record)         │
│  │ Encryption      │                                             │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │ Encrypted Data  │    │ AES Key         │                     │
│  │ (Ciphertext)    │    │ Encrypted with  │◀── Auditor's RSA    │
│  └────────┬────────┘    │ RSA-2048        │    Public Key       │
│           │             └────────┬────────┘                     │
│           ▼                      ▼                               │
│  ┌─────────────────────────────────────────┐                    │
│  │           PostgreSQL Database            │                    │
│  │  (Encrypted data + Wrapped AES key)      │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                  │
│  DECRYPTION: Auditor uses Private RSA Key → Unwrap AES Key →    │
│              Decrypt Data with AES                               │
└─────────────────────────────────────────────────────────────────┘
```

**Security Guarantee:** Even if database is stolen, data remains unreadable without Auditor's private RSA key.

**Files:** `cryptoUtils.js`, `dataController.js`

---

### Module 4: Data Integrity (Hashing & Digital Signatures)

**Tamper Detection Flow:**
```
UPLOAD:
  Content → SHA-256(Content + System_Salt) → Hash
  Hash → RSA_Sign(Hash, Researcher_Private_Key) → Signature
  Store: Encrypted_Content + Hash + Signature

VERIFICATION:
  Decrypt Content → Recalculate SHA-256 → Compare with stored Hash
  Verify Signature with Researcher's Public Key
  Result: ✅ VERIFIED or ❌ TAMPERING DETECTED
```

**Properties Achieved:**
- **Integrity:** SHA-256 hash detects any modification
- **Non-repudiation:** Digital signature proves researcher authored the data
- **Salting:** System salt prevents pre-computation attacks

**Files:** `cryptoUtils.js`, `dataController.js`

---

### Module 5: Encoding & Verification

| Technique | Usage |
|-----------|-------|
| Base64 | Encoding binary attachments/images before encryption |
| Hex | Encoding cryptographic outputs (hashes, ciphertexts) |
| QR Code | Contains `Record_ID + Integrity_Hash` for offline mobile verification |

**Library:** `qrcode.react` for frontend QR generation

**Files:** `DataCard.jsx`, `VerifyModal.jsx`

---

## 🔧 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React.js + Tailwind CSS | UI with responsive design |
| Backend | Node.js + Express | RESTful API server |
| Database | PostgreSQL | Relational schema with strict constraints |
| Auth | `bcrypt` + `jsonwebtoken` | Password hashing + session tokens |
| Crypto | Node.js `crypto` module | AES, RSA, SHA-256, digital signatures |
| Email | Resend API | OTP delivery |
| QR | `qrcode.react` | Integrity verification codes |

---

## 🏗️ Architecture Diagram

```
┌──────────────┐     HTTPS/TLS      ┌──────────────┐     SSL        ┌──────────────┐
│              │◀──────────────────▶│              │◀──────────────▶│              │
│    React     │                    │   Express    │                │  PostgreSQL  │
│   Frontend   │                    │   Backend    │                │   Database   │
│              │                    │              │                │              │
└──────────────┘                    └──────────────┘                └──────────────┘
       │                                   │                               │
       │                                   │                               │
       ▼                                   ▼                               ▼
  ┌─────────┐                      ┌─────────────┐                 ┌─────────────┐
  │ QR Code │                      │ Crypto Ops: │                 │ Stored:     │
  │ Display │                      │ • bcrypt    │                 │ • Hashes    │
  └─────────┘                      │ • AES-GCM   │                 │ • Ciphertext│
                                   │ • RSA-2048  │                 │ • Signatures│
                                   │ • SHA-256   │                 │ • Keys (enc)│
                                   └─────────────┘                 └─────────────┘
```

---

## 📊 Security Levels Matrix

| State | Protection | Implementation |
|-------|------------|----------------|
| **At Rest** | AES-256-GCM encryption | Data encrypted in database |
| **In Transit** | TLS 1.3 (HTTPS) | Vercel + Render enforce HTTPS |
| **In Use** | Memory isolation | Node.js process isolation |
| **Key Storage** | RSA-wrapped AES keys | Keys encrypted per-record |
| **Credentials** | bcrypt hashing | Passwords never stored plaintext |

---

## 🔐 Cryptographic Algorithms Summary

| Algorithm | Key Size | Purpose | Standard |
|-----------|----------|---------|----------|
| bcrypt | - | Password hashing | - |
| AES-256-GCM | 256-bit | Data encryption | NIST FIPS 197 |
| RSA | 2048-bit | Key exchange & signatures | PKCS#1 |
| SHA-256 | 256-bit | Integrity hashing | NIST FIPS 180-4 |
| HMAC-SHA256 | 256-bit | JWT signing | RFC 7518 |

---

## 📁 Project Structure

```
VeriSchol/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js      # Login, OTP, MFA
│   │   │   ├── dataController.js      # Encrypt, decrypt, verify
│   │   │   └── adminController.js     # User management
│   │   ├── middleware/
│   │   │   └── auth.js                # JWT + RBAC verification
│   │   ├── utils/
│   │   │   ├── cryptoUtils.js         # AES, RSA, SHA-256, signatures
│   │   │   └── jwtUtils.js            # Token generation/verification
│   │   └── services/
│   │       └── emailService.js        # OTP email delivery
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx              # MFA login flow
│   │   │   └── Dashboard.jsx          # Role-based views
│   │   └── components/
│   │       └── VerifyModal.jsx        # Integrity verification UI
│   └── package.json
└── README.md
```

---

## ✅ Evaluation Criteria Mapping

| Criteria | Module | Evidence |
|----------|--------|----------|
| NIST SP 800-63-2 Compliance | Module 1 | MFA, password complexity, session timeout |
| Access Control Matrix | Module 2 | 3 Subjects × 3 Objects with middleware |
| Hybrid Encryption | Module 3 | AES-256-GCM + RSA-2048 key wrapping |
| Digital Signatures | Module 4 | RSA-SHA256 signing + verification |
| Encoding Techniques | Module 5 | Base64, Hex, QR code generation |

---

*Document Version: 1.0 | Last Updated: February 2026*
