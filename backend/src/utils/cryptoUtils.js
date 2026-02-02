import crypto from 'crypto';

/**
 * VeriSchol Cryptography Utilities
 * Implements AES-256-GCM encryption, RSA key pairs, SHA-256 hashing, and digital signatures
 */

// ============================================
// RSA KEY PAIR GENERATION
// ============================================

/**
 * Generate RSA-2048 key pair for asymmetric encryption
 * @returns {Object} { publicKey, privateKey }
 */
export function generateKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });

    return { publicKey, privateKey };
}

/**
 * Encrypt RSA private key with user's password for secure storage
 * @param {string} privateKey - PEM formatted private key
 * @param {string} password - User's password for encryption
 * @returns {string} Encrypted private key (base64)
 */
export function encryptPrivateKey(privateKey, password) {
    const key = crypto.scryptSync(password, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(privateKey, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    return JSON.stringify({
        encrypted,
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64')
    });
}

/**
 * Decrypt RSA private key with user's password
 * @param {string} encryptedData - JSON string containing encrypted key data
 * @param {string} password - User's password for decryption
 * @returns {string} Decrypted private key (PEM format)
 */
export function decryptPrivateKey(encryptedData, password) {
    const { encrypted, iv, authTag } = JSON.parse(encryptedData);
    const key = crypto.scryptSync(password, 'salt', 32);

    const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        key,
        Buffer.from(iv, 'base64')
    );
    decipher.setAuthTag(Buffer.from(authTag, 'base64'));

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

// ============================================
// AES-256-GCM ENCRYPTION (SYMMETRIC)
// ============================================

/**
 * Encrypt data using AES-256-GCM
 * @param {string} plaintext - Data to encrypt
 * @returns {Object} { encrypted, iv, authTag, aesKey }
 */
export function encryptData(plaintext) {
    // Generate random 256-bit key and 128-bit IV
    const aesKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);

    // Create cipher with AES-256-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);

    // Encrypt the data
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // Get authentication tag for integrity verification
    const authTag = cipher.getAuthTag();

    return {
        encrypted,
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        aesKey: aesKey.toString('base64')
    };
}

/**
 * Decrypt data using AES-256-GCM
 * @param {string} encrypted - Encrypted data (base64)
 * @param {string} ivBase64 - Initialization vector (base64)
 * @param {string} authTagBase64 - Authentication tag (base64)
 * @param {string} aesKeyBase64 - AES key (base64)
 * @returns {string} Decrypted plaintext
 */
export function decryptData(encrypted, ivBase64, authTagBase64, aesKeyBase64) {
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    const aesKey = Buffer.from(aesKeyBase64, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

// ============================================
// HYBRID ENCRYPTION (AES + RSA)
// ============================================

/**
 * Encrypt AES key with RSA public key
 * @param {string} aesKeyBase64 - AES key in base64
 * @param {string} publicKey - RSA public key (PEM)
 * @returns {string} RSA-encrypted AES key (base64)
 */
export function encryptAesKeyWithRsa(aesKeyBase64, publicKey) {
    const aesKeyBuffer = Buffer.from(aesKeyBase64, 'base64');
    const encrypted = crypto.publicEncrypt(
        {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
        },
        aesKeyBuffer
    );
    return encrypted.toString('base64');
}

/**
 * Decrypt AES key with RSA private key
 * @param {string} encryptedAesKey - RSA-encrypted AES key (base64)
 * @param {string} privateKey - RSA private key (PEM)
 * @returns {string} Decrypted AES key (base64)
 */
export function decryptAesKeyWithRsa(encryptedAesKey, privateKey) {
    const encryptedBuffer = Buffer.from(encryptedAesKey, 'base64');
    const decrypted = crypto.privateDecrypt(
        {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
        },
        encryptedBuffer
    );
    return decrypted.toString('base64');
}

// ============================================
// SHA-256 HASHING
// ============================================

/**
 * Create SHA-256 hash of data with salt
 * @param {string} content - Content to hash
 * @param {string} salt - Salt for hashing
 * @returns {string} SHA-256 hash (hex)
 */
export function hashData(content, salt = process.env.SYSTEM_SALT) {
    return crypto
        .createHash('sha256')
        .update(content + salt)
        .digest('hex');
}

/**
 * Verify data against its hash
 * @param {string} content - Content to verify
 * @param {string} originalHash - Original hash to compare
 * @param {string} salt - Salt used in original hashing
 * @returns {boolean} True if hashes match
 */
export function verifyHash(content, originalHash, salt = process.env.SYSTEM_SALT) {
    const currentHash = hashData(content, salt);
    return currentHash === originalHash;
}

// ============================================
// DIGITAL SIGNATURES
// ============================================

/**
 * Sign data hash with private key
 * @param {string} hash - Hash to sign
 * @param {string} privateKey - RSA private key (PEM)
 * @returns {string} Digital signature (base64)
 */
export function signData(hash, privateKey) {
    const sign = crypto.createSign('SHA256');
    sign.update(hash);
    sign.end();
    return sign.sign(privateKey, 'base64');
}

/**
 * Verify digital signature
 * @param {string} hash - Hash that was signed
 * @param {string} signature - Digital signature (base64)
 * @param {string} publicKey - RSA public key (PEM)
 * @returns {boolean} True if signature is valid
 */
export function verifySignature(hash, signature, publicKey) {
    const verify = crypto.createVerify('SHA256');
    verify.update(hash);
    verify.end();
    return verify.verify(publicKey, signature, 'base64');
}

// ============================================
// OTP GENERATION
// ============================================

/**
 * Generate 6-digit OTP code
 * @returns {string} 6-digit OTP
 */
export function generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate cryptographically secure random bytes
 * @param {number} length - Number of bytes
 * @returns {string} Random bytes (hex)
 */
export function generateRandomBytes(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}
