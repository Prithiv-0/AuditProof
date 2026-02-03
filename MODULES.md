# 📚 VeriSchol - Security Modules Documentation

This document explains each security module implemented in VeriSchol with technical details and potential viva questions.

---

## Table of Contents

1. [Password Hashing (bcrypt)](#1-password-hashing-bcrypt)
2. [Multi-Factor Authentication (MFA/OTP)](#2-multi-factor-authentication-mfaotp)
3. [JWT Authentication](#3-jwt-authentication)
4. [Symmetric Encryption (AES-256-GCM)](#4-symmetric-encryption-aes-256-gcm)
5. [Asymmetric Encryption (RSA-2048)](#5-asymmetric-encryption-rsa-2048)
6. [Integrity Hashing (SHA-256)](#6-integrity-hashing-sha-256)
7. [Digital Signatures](#7-digital-signatures)
8. [Role-Based Access Control (RBAC)](#8-role-based-access-control-rbac)

---

## 1. Password Hashing (bcrypt)

### What It Does
Converts plain-text passwords into irreversible hashes before storing in the database.

### Implementation
**File:** `backend/src/controllers/authController.js`

```javascript
import bcrypt from 'bcrypt';
const SALT_ROUNDS = 10;

// Hashing during registration
const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

// Verification during login
const isValid = await bcrypt.compare(password, user.password_hash);
```

### Why bcrypt?
- **Salting**: Automatically adds random salt to prevent rainbow table attacks
- **Adaptive**: Cost factor (10 rounds) can be increased as hardware improves
- **Slow by design**: Makes brute-force attacks computationally expensive

### Viva Questions

**Q1: Why use bcrypt instead of MD5 or SHA-256 for passwords?**
> A: MD5/SHA-256 are fast hashing algorithms designed for integrity, not passwords. bcrypt is deliberately slow and includes salting, making brute-force attacks infeasible.

**Q2: What is a salt and why is it important?**
> A: A salt is random data added before hashing. It ensures identical passwords produce different hashes, defeating rainbow table attacks.

**Q3: What does "10 rounds" mean in bcrypt?**
> A: It's the cost factor (2^10 = 1024 iterations). Higher rounds = slower hashing = more secure but more CPU-intensive.

**Q4: Can you reverse a bcrypt hash to get the original password?**
> A: No, bcrypt is a one-way function. You can only verify by hashing the input and comparing.

---

## 2. Multi-Factor Authentication (MFA/OTP)

### What It Does
Requires two factors for login: something you know (password) + something you have (OTP via email).

### Implementation
**File:** `backend/src/controllers/authController.js`

```javascript
// Step 1: Verify password, generate OTP
const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

// Store OTP in database
await pool.query(
  'INSERT INTO otp_sessions (user_id, otp_code, expires_at) VALUES ($1, $2, $3)',
  [user.id, otpCode, expiresAt]
);

// Step 2: Verify OTP
const result = await pool.query(
  'SELECT * FROM otp_sessions WHERE user_id = $1 AND otp_code = $2 AND expires_at > NOW()',
  [userId, otp]
);
```

### Security Features
- 6-digit numeric code (1 million combinations)
- 5-minute expiry
- Single-use (deleted after verification)
- Sent via secure email (Resend API)

### Viva Questions

**Q1: What are the two factors in this MFA implementation?**
> A: 1) Knowledge factor (password), 2) Possession factor (access to email for OTP).

**Q2: Why does the OTP expire after 5 minutes?**
> A: To limit the window for interception attacks. If an attacker captures the OTP, they have limited time to use it.

**Q3: What happens if someone tries to brute-force the 6-digit OTP?**
> A: With 1 million combinations and the 5-minute expiry, they'd need ~3,333 attempts per second. Rate limiting would block this.

**Q4: Why delete the OTP after use instead of marking it as used?**
> A: Deleting provides cleaner data and prevents any edge-case replay attacks. It also simplifies the database schema.

---

## 3. JWT Authentication

### What It Does
After successful MFA, issues a signed token that the client uses for subsequent API requests.

### Implementation
**File:** `backend/src/utils/jwtUtils.js`

```javascript
import jwt from 'jsonwebtoken';

// Generate token
export function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// Verify token
export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
```

### JWT Structure
```
Header.Payload.Signature

Header: { "alg": "HS256", "typ": "JWT" }
Payload: { "userId": "...", "email": "...", "role": "...", "iat": ..., "exp": ... }
Signature: HMAC-SHA256(header + payload, secret)
```

### Viva Questions

**Q1: What are the three parts of a JWT?**
> A: Header (algorithm & type), Payload (claims/data), Signature (verification).

**Q2: Is the JWT payload encrypted?**
> A: No, it's Base64 encoded (readable). Never store sensitive data in JWT payload.

**Q3: How does the server verify a JWT is authentic?**
> A: It recalculates the signature using the secret key and compares. If they match, the token is valid and unmodified.

**Q4: Why use JWT instead of sessions?**
> A: JWT is stateless (no server-side storage needed), scales better, and works across distributed systems.

**Q5: What happens when a JWT expires?**
> A: The server rejects it and the client must re-authenticate. This limits damage if a token is stolen.

---

## 4. Symmetric Encryption (AES-256-GCM)

### What It Does
Encrypts research data so only authorized users with the key can read it.

### Implementation
**File:** `backend/src/utils/cryptoUtils.js`

```javascript
import crypto from 'crypto';

export function encryptData(plaintext, key) {
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return { encrypted, iv: iv.toString('hex'), authTag };
}

export function decryptData(encrypted, key, iv, authTag) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### Why AES-256-GCM?
- **AES-256**: 256-bit key = 2^256 possible keys (unbreakable by brute force)
- **GCM Mode**: Provides both encryption AND authentication (detects tampering)
- **IV**: Random initialization vector prevents identical plaintexts from producing identical ciphertexts

### Viva Questions

**Q1: What does GCM stand for and why is it important?**
> A: Galois/Counter Mode. It provides authenticated encryption - both confidentiality AND integrity verification.

**Q2: What is the purpose of the IV (Initialization Vector)?**
> A: Ensures same plaintext encrypted twice produces different ciphertexts. Must be unique per encryption but doesn't need to be secret.

**Q3: What is the authTag and why is it needed?**
> A: Authentication tag (MAC) proves the ciphertext hasn't been modified. If tampered, decryption fails.

**Q4: Why 256-bit key length?**
> A: 2^256 possible keys makes brute-force impossible. Even with all computers on Earth working together, it would take billions of years.

---

## 5. Asymmetric Encryption (RSA-2048)

### What It Does
Enables secure key exchange. The AES key is encrypted with the recipient's public key, ensuring only they can decrypt it.

### Implementation
**File:** `backend/src/utils/cryptoUtils.js`

```javascript
// Generate key pair (done during user registration)
export function generateKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  return { publicKey, privateKey };
}

// Encrypt AES key with recipient's public key
export function encryptWithPublicKey(data, publicKey) {
  return crypto.publicEncrypt(publicKey, Buffer.from(data)).toString('base64');
}

// Decrypt AES key with own private key
export function decryptWithPrivateKey(encryptedData, privateKey) {
  return crypto.privateDecrypt(privateKey, Buffer.from(encryptedData, 'base64')).toString();
}
```

### Key Exchange Flow
```
1. Researcher creates data
2. Generate random AES key
3. Encrypt data with AES key
4. Encrypt AES key with auditor's public key
5. Store both encrypted data and encrypted AES key
6. Auditor uses private key to decrypt AES key
7. Auditor uses AES key to decrypt data
```

### Viva Questions

**Q1: Why use both RSA and AES? Why not just RSA for everything?**
> A: RSA is slow and has size limits. We use RSA only to securely exchange the AES key, then AES for bulk data encryption (hybrid encryption).

**Q2: What's the difference between public and private keys?**
> A: Public key encrypts (can be shared freely). Private key decrypts (must be kept secret). Mathematically linked but can't derive private from public.

**Q3: Why 2048-bit RSA key size?**
> A: 2048-bit provides ~112 bits of security, considered secure until ~2030. 4096-bit is more future-proof but slower.

**Q4: What happens if someone gets the user's private key?**
> A: They can decrypt all data encrypted for that user. This is why private keys are encrypted with the user's password.

---

## 6. Integrity Hashing (SHA-256)

### What It Does
Creates a unique fingerprint of data. Any change to the data produces a completely different hash.

### Implementation
**File:** `backend/src/utils/cryptoUtils.js`

```javascript
export function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Usage: Store hash when data is created
const originalHash = hashContent(content);

// Verification: Recalculate and compare
const currentHash = hashContent(currentContent);
const isValid = originalHash === currentHash;
```

### Properties of SHA-256
- **Deterministic**: Same input always produces same output
- **Fixed size**: Always 256 bits (64 hex characters) regardless of input size
- **Avalanche effect**: Small change = completely different hash
- **One-way**: Cannot reverse hash to get original data
- **Collision resistant**: Virtually impossible to find two inputs with same hash

### Viva Questions

**Q1: How does hashing detect tampering?**
> A: Store original hash at creation. Later, recalculate hash of current data. If they differ, data was modified.

**Q2: What is the avalanche effect?**
> A: Changing even one bit of input completely changes the output hash. Makes it impossible to predict or manipulate.

**Q3: Can two different inputs produce the same SHA-256 hash?**
> A: Theoretically yes (collision), but practically impossible. Would take 2^128 operations on average.

**Q4: What's the difference between hashing and encryption?**
> A: Hashing is one-way (cannot reverse). Encryption is two-way (can decrypt with key).

---

## 7. Digital Signatures

### What It Does
Proves who created the data and that it hasn't been modified. Non-repudiation - signer cannot deny signing.

### Implementation
**File:** `backend/src/utils/cryptoUtils.js`

```javascript
// Sign data with private key
export function signData(data, privateKey) {
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(data);
  return sign.sign(privateKey, 'base64');
}

// Verify signature with public key
export function verifySignature(data, signature, publicKey) {
  const verify = crypto.createVerify('RSA-SHA256');
  verify.update(data);
  return verify.verify(publicKey, signature, 'base64');
}
```

### How It Works
```
Signing:
  Data → SHA-256 Hash → Encrypt hash with PRIVATE key → Signature

Verification:
  1. Decrypt signature with PUBLIC key → Original hash
  2. Hash current data → Current hash
  3. Compare: If equal, signature is valid
```

### Viva Questions

**Q1: How does a digital signature provide non-repudiation?**
> A: Only the owner of the private key can create the signature. If signature verifies with their public key, they must have signed it.

**Q2: What's the difference between signing and encrypting?**
> A: Signing uses private key (proves identity). Encrypting uses public key (provides confidentiality).

**Q3: Can someone forge a digital signature?**
> A: Only if they have the private key. The signature is the hash encrypted with the private key - impossible to forge without it.

**Q4: Why hash the data before signing instead of signing the raw data?**
> A: RSA can only sign small amounts of data. Hashing reduces any size input to fixed 256 bits.

---

## 8. Role-Based Access Control (RBAC)

### What It Does
Restricts system access based on user roles. Each role has specific permissions.

### Implementation
**File:** `backend/src/middleware/auth.js`

```javascript
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
}

// Usage in routes
router.get('/users', auth, requireRole('admin'), getAllUsers);
router.post('/data', auth, requireRole('admin', 'researcher'), createData);
```

### Role Permissions Matrix

| Permission | Admin | Researcher | Auditor |
|------------|-------|------------|---------|
| Manage Users | ✅ | ❌ | ❌ |
| Create Projects | ✅ | ❌ | ❌ |
| Submit Data | ✅ | ✅ | ❌ |
| View Data | ✅ | ✅ (own) | ✅ |
| Verify Integrity | ✅ | ❌ | ✅ |
| View Audit Logs | ✅ | ❌ | ✅ |

### Viva Questions

**Q1: What is the principle of least privilege?**
> A: Users should have only the minimum permissions needed for their job. Reduces risk if account is compromised.

**Q2: How is RBAC enforced in the backend?**
> A: Middleware checks `req.user.role` (from JWT) against allowed roles before executing the route handler.

**Q3: What's the difference between authentication and authorization?**
> A: Authentication = Who are you? (login). Authorization = What can you do? (RBAC).

**Q4: Why check roles on the backend instead of just hiding UI elements?**
> A: UI can be bypassed. Backend is the true security boundary. Always validate on server.

---

## 🔄 Complete Security Flow

```
User Login:
  1. Enter email/password
  2. Server verifies password (bcrypt compare)
  3. Server generates OTP, sends via email
  4. User enters OTP
  5. Server verifies OTP, issues JWT
  6. Client stores JWT, includes in all requests

Data Submission:
  1. Researcher creates content
  2. Generate SHA-256 hash (integrity)
  3. Generate random AES-256 key
  4. Encrypt content with AES-GCM
  5. Encrypt AES key with recipient's RSA public key
  6. Sign hash with researcher's RSA private key
  7. Store all encrypted components

Data Verification:
  1. Auditor retrieves encrypted data
  2. Decrypt AES key with own RSA private key
  3. Decrypt content with AES key
  4. Recalculate SHA-256 hash
  5. Compare with original hash
  6. Verify digital signature with researcher's public key
  7. Report: Verified ✅ or Tampered ❌
```

---

## 📝 Summary Table

| Module | Algorithm | Key Size | Purpose |
|--------|-----------|----------|---------|
| Password Hashing | bcrypt | - | Secure password storage |
| OTP | Random 6-digit | - | Second authentication factor |
| JWT | HMAC-SHA256 | 256-bit | Stateless session tokens |
| Symmetric Encryption | AES-256-GCM | 256-bit | Data confidentiality |
| Asymmetric Encryption | RSA | 2048-bit | Key exchange |
| Integrity | SHA-256 | - | Tamper detection |
| Digital Signature | RSA-SHA256 | 2048-bit | Non-repudiation |

---

*Document created for VeriSchol viva preparation.*
