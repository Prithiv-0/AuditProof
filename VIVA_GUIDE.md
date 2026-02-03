# VeriSchol – Viva & Theory Preparation Guide

**Course:** 23CSE313 – Foundations of Cyber Security  
**Project:** VeriSchol – Secure Research Data Integrity System

---

## Table of Contents

1. [Why PERN Stack? (Justification)](#1-why-pern-stack-justification)
2. [Security Levels Explained](#2-security-levels-explained)
3. [Attack Scenarios & Defenses](#3-attack-scenarios--defenses)
4. [Module-Wise Q&A](#4-module-wise-qa)
5. [Cryptographic Deep Dive](#5-cryptographic-deep-dive)
6. [Common Viva Questions](#6-common-viva-questions)
7. [Quick Reference Cards](#7-quick-reference-cards)

---

## 1. Why PERN Stack? (Justification)

### Q: Why did you choose PERN stack over Firebase/Supabase?

**Answer:**
> Firebase and Supabase provide pre-built authentication and encryption as black-box services. For a Cyber Security course, the objective is to demonstrate **understanding of cryptographic primitives**, not just using SDKs.
>
> By implementing with PERN:
> - I manually implemented `bcrypt` hashing (not Firebase Auth)
> - I wrote AES-256-GCM encryption using Node.js `crypto` module
> - I implemented RSA key exchange from scratch
> - I created custom RBAC middleware (not Supabase Row-Level Security)
>
> This demonstrates I understand **how** these security mechanisms work, not just **that** they exist.

### Q: Why PostgreSQL instead of MongoDB?

**Answer:**
> PostgreSQL is a relational database with:
> - **ACID compliance** for transaction integrity
> - **Foreign key constraints** for data relationship enforcement
> - **Schema validation** that prevents malformed data
>
> For a security-focused system handling research data, strict schema enforcement prevents injection of unexpected data structures.

---

## 2. Security Levels Explained

### Q: How is data secured at different states?

| State | Threat | Protection | My Implementation |
|-------|--------|------------|-------------------|
| **At Rest** | Database theft | Encryption | AES-256-GCM encrypted storage |
| **In Transit** | MITM attacks | TLS | HTTPS enforced (Vercel/Render) |
| **In Use** | Memory dumps | Process isolation | Node.js single-process model |
| **Credentials** | Password leaks | Hashing | bcrypt with 10 rounds |
| **Keys** | Key theft | Wrapping | AES keys wrapped with RSA |

### Q: Explain "Defense in Depth" in your project

**Answer:**
> Defense in Depth means multiple security layers. In VeriSchol:
>
> 1. **Layer 1 - Authentication:** Password + OTP (something you know + have)
> 2. **Layer 2 - Authorization:** RBAC middleware blocks unauthorized access
> 3. **Layer 3 - Encryption:** Even if Layer 2 fails, data is AES encrypted
> 4. **Layer 4 - Key Protection:** AES keys are RSA-wrapped
> 5. **Layer 5 - Integrity:** Even if decrypted, tampering is detected via signatures
>
> An attacker must breach ALL layers to successfully attack the system.

---

## 3. Attack Scenarios & Defenses

### Scenario 1: Corrupt Database Administrator

**Q:** What if the DBA (Database Admin) is malicious?

**Answer:**
> The DBA can see the database contents but CANNOT:
>
> 1. **Read research data** - Data is AES-256-GCM encrypted. DBA doesn't have the AES key.
> 2. **Get the AES key** - AES key is RSA-encrypted with Auditor's public key. DBA lacks the private key.
> 3. **Forge new entries** - Legitimate entries have digital signatures. DBA lacks the Researcher's private key to sign.
> 4. **Modify existing entries** - SHA-256 hash verification will detect any tampering.
>
> **Conclusion:** Data confidentiality and integrity are preserved even against insider threats.

---

### Scenario 2: Rainbow Table Attack

**Q:** How do you prevent rainbow table attacks on passwords?

**Answer:**
> Rainbow tables are precomputed hash→password lookups. We prevent them using:
>
> 1. **Salted Hashing (bcrypt):** Each password is hashed with a unique random salt. Even if two users have the same password, their hashes are different.
>
> 2. **bcrypt's Cost Factor:** 10 rounds means 2^10 iterations. Computing rainbow tables becomes computationally infeasible.
>
> ```
> Password: "secret123"
> Without salt: SHA256("secret123") → Always same hash (vulnerable)
> With bcrypt:  bcrypt("secret123", salt) → Different hash every time (secure)
> ```

---

### Scenario 3: Stolen JWT Token

**Q:** What if an attacker steals a user's JWT token?

**Answer:**
> Mitigation strategies implemented:
>
> 1. **Short Expiry:** JWT expires in 1 hour. Stolen token has limited usefulness.
> 2. **HTTPS Only:** Tokens transmitted over TLS, reducing interception risk.
> 3. **Role Binding:** Token contains role. Attacker can't escalate privileges.
> 4. **Token Rotation:** On sensitive operations, new tokens are issued.
>
> **Additional (for future):** Implement token blacklisting on logout.

---

### Scenario 4: Man-in-the-Middle (MITM) Attack

**Q:** How do you prevent MITM attacks?

**Answer:**
> 1. **TLS 1.3:** All traffic between client and server is encrypted via HTTPS (enforced by Vercel and Render).
> 2. **Certificate Pinning (future):** Would prevent fake certificates.
> 3. **Integrity Checks:** Even if MITM modifies data, SHA-256 hash verification fails.

---

### Scenario 5: SQL Injection

**Q:** How do you prevent SQL injection?

**Answer:**
> All database queries use **parameterized queries** (prepared statements):
>
> ```javascript
> // VULNERABLE (string concatenation)
> pool.query(`SELECT * FROM users WHERE email = '${email}'`);
>
> // SECURE (parameterized)
> pool.query('SELECT * FROM users WHERE email = $1', [email]);
> ```
>
> The `$1` placeholder is handled by the PostgreSQL driver, which escapes all special characters.

---

### Scenario 6: Brute Force OTP

**Q:** What stops an attacker from brute-forcing the 6-digit OTP?

**Answer:**
> 1. **Short Expiry:** OTP expires in 5 minutes (300 seconds)
> 2. **10^6 combinations:** 1,000,000 possible codes
> 3. **Rate Limiting:** Server would block after multiple failures (to be implemented)
> 4. **Single Use:** OTP is deleted after successful verification
>
> At even 10 attempts/second, attacker would need 100,000 seconds (27+ hours) on average, but OTP expires in 5 minutes.

---

## 4. Module-Wise Q&A

### Module 1: Authentication

**Q: What is NIST SP 800-63-2?**
> A: It's the NIST Digital Identity Guidelines specifying requirements for authentication assurance levels (AAL). We implement AAL2 with password + OTP.

**Q: Why use bcrypt instead of SHA-256 for passwords?**
> A: SHA-256 is designed to be fast. For passwords, we WANT slow hashing to make brute-force impractical. bcrypt is deliberately slow and includes salting.

**Q: What's the difference between hashing and encryption?**
> A: Hashing is one-way (cannot reverse). Encryption is two-way (can decrypt with key). Passwords are hashed; data is encrypted.

---

### Module 2: Authorization

**Q: What is an Access Control Matrix?**
> A: A table mapping Subjects (users/roles) to Objects (resources) with allowed operations. We have 3 subjects × 3 objects.

**Q: Why is Admin "blinded" from research data?**
> A: Principle of Least Privilege + Privacy. Admins manage users, not research content. Separation of duties prevents single point of compromise.

**Q: Where is RBAC enforced?**
> A: In Express middleware. Every protected route checks `req.user.role` against allowed roles BEFORE executing the handler.

---

### Module 3: Encryption

**Q: Why hybrid encryption (AES + RSA)?**
> A: RSA is slow and has size limits. AES is fast for bulk data. We use RSA only to encrypt the AES key, then AES for the actual data.

**Q: What is GCM mode?**
> A: Galois/Counter Mode. It provides authenticated encryption - both confidentiality AND integrity (detects if ciphertext was modified).

**Q: What happens if the IV is reused?**
> A: Security breaks down. Same plaintext would produce same ciphertext. GCM can also leak key information with IV reuse. We generate random IV per encryption.

---

### Module 4: Integrity

**Q: Why hash with a salt?**
> A: System salt prevents attackers from precomputing hashes. Even if they know the algorithm, they don't know the salt value.

**Q: What does the digital signature prove?**
> A: 1) The data came from the claimed author (Authentication), 2) The data wasn't modified (Integrity), 3) Author can't deny creating it (Non-repudiation).

**Q: Can you detect WHICH part of the data was modified?**
> A: No, SHA-256 only tells us something changed. To detect specific changes, we'd need per-field hashes or diff algorithms.

---

### Module 5: Encoding

**Q: Is Base64 encryption?**
> A: NO! Base64 is encoding, not encryption. It converts binary to text for transmission. Anyone can decode it. We Base64 BEFORE encryption.

**Q: Why use QR codes?**
> A: For offline verification. A researcher can show the QR code to an auditor who scans it with a mobile app to verify integrity without accessing the web system.

---

## 5. Cryptographic Deep Dive

### AES-256-GCM Explained

```
Input: Plaintext + 256-bit Key + 96-bit IV

Process:
1. Split plaintext into 128-bit blocks
2. Encrypt each block with AES
3. XOR with counter value (CTR mode)
4. Compute authentication tag (Galois field multiplication)

Output: Ciphertext + 128-bit AuthTag

Decryption:
1. Verify AuthTag first
2. If valid, decrypt
3. If invalid, reject (tampering detected)
```

### RSA Key Exchange

```
Key Generation:
1. Choose two large primes p, q
2. Compute n = p × q
3. Compute φ(n) = (p-1)(q-1)
4. Choose e such that gcd(e, φ(n)) = 1
5. Compute d = e^(-1) mod φ(n)

Public Key: (n, e)
Private Key: (n, d)

Encryption: c = m^e mod n
Decryption: m = c^d mod n
```

### Digital Signature Flow

```
Signing (Researcher):
  Data → SHA-256 → Hash → RSA_Encrypt(Hash, Private_Key) → Signature

Verification (Auditor):
  Signature → RSA_Decrypt(Signature, Public_Key) → Original_Hash
  Data → SHA-256 → Current_Hash
  Compare: Original_Hash == Current_Hash ? Valid : Tampered
```

---

## 6. Common Viva Questions

### General Security

| Question | Short Answer |
|----------|--------------|
| What is CIA triad? | Confidentiality (encryption), Integrity (hashing), Availability (uptime) |
| What is AAA? | Authentication, Authorization, Accounting (audit logs) |
| Symmetric vs Asymmetric? | Symmetric = same key both sides. Asymmetric = public/private key pair |
| What is a nonce/IV? | Random value used once to ensure same plaintext → different ciphertext |
| What is salting? | Adding random data before hashing to prevent rainbow tables |

### Project-Specific

| Question | Short Answer |
|----------|--------------|
| Why not store passwords plaintext? | Anyone with DB access would see all passwords |
| Why use JWT? | Stateless authentication, scales across servers |
| Why 2048-bit RSA? | Provides ~112 bits of security, standard until 2030 |
| Why 256-bit AES? | Maximum AES security level, approved for TOP SECRET data |
| Why PostgreSQL? | ACID compliance, relational integrity, better for structured data |

---

## 7. Quick Reference Cards

### Card 1: Algorithm Cheat Sheet

| Algorithm | Type | Output Size | Use In Project |
|-----------|------|-------------|----------------|
| bcrypt | Hash | 60 chars | Password storage |
| SHA-256 | Hash | 256 bits | Integrity verification |
| AES-256-GCM | Symmetric | Variable | Data encryption |
| RSA-2048 | Asymmetric | 256 bytes | Key wrapping |
| HMAC-SHA256 | MAC | 256 bits | JWT signing |

### Card 2: Key Sizes

| Algorithm | Key Size | Security Level |
|-----------|----------|----------------|
| AES-128 | 128 bits | ~128 bits |
| AES-256 | 256 bits | ~256 bits |
| RSA-2048 | 2048 bits | ~112 bits |
| RSA-4096 | 4096 bits | ~140 bits |
| SHA-256 | N/A | ~128 bits (collision) |

### Card 3: NIST Standards Referenced

| Standard | Topic |
|----------|-------|
| NIST SP 800-63-2 | Digital Identity Guidelines |
| FIPS 197 | AES Specification |
| FIPS 180-4 | SHA Hash Functions |
| NIST SP 800-132 | Password-Based Key Derivation |

---

## 💡 Tips for Viva

1. **Know YOUR code:** Be ready to explain any function you wrote
2. **Explain "why":** Not just what it does, but why you chose that approach
3. **Draw diagrams:** Offer to draw encryption flow if asked
4. **Admit limitations:** "We could add X for production" shows maturity
5. **Reference standards:** Mentioning NIST, FIPS shows you did research

---

*Good luck with your viva! 🎓*
