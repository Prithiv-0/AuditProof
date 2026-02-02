import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Resend client (only if API key is provided)
const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

// Email sender address (must be from a verified domain in Resend)
const FROM_EMAIL = process.env.EMAIL_FROM || 'VeriSchol <onboarding@resend.dev>';

/**
 * Send OTP via email
 * Falls back to console logging if email service is not configured
 */
export async function sendOTPEmail(toEmail, otpCode, userName) {
    const subject = `Your VeriSchol Security Code: ${otpCode}`;

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0f; color: #e4e4e7; padding: 40px 20px;">
            <div style="max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #18181b 0%, #1f1f23 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1);">
                <div style="text-align: center; margin-bottom: 32px;">
                    <div style="display: inline-block; padding: 12px 20px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px;">
                        <span style="font-size: 24px; font-weight: bold; color: white;">🔐 VeriSchol</span>
                    </div>
                </div>
                
                <h1 style="color: #ffffff; font-size: 24px; margin-bottom: 16px; text-align: center;">
                    Security Verification Code
                </h1>
                
                <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                    Hello${userName ? ` ${userName}` : ''},<br><br>
                    Your one-time verification code for VeriSchol is:
                </p>
                
                <div style="background: rgba(99, 102, 241, 0.1); border: 2px solid rgba(99, 102, 241, 0.3); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                    <span style="font-family: 'SF Mono', 'Monaco', monospace; font-size: 36px; font-weight: bold; color: #818cf8; letter-spacing: 8px;">
                        ${otpCode}
                    </span>
                </div>
                
                <p style="color: #71717a; font-size: 14px; text-align: center; margin-bottom: 24px;">
                    This code expires in <strong style="color: #f59e0b;">5 minutes</strong>.<br>
                    If you didn't request this code, please ignore this email.
                </p>
                
                <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 24px; text-align: center;">
                    <p style="color: #52525b; font-size: 12px; margin: 0;">
                        VeriSchol - Secure Research Data Integrity System<br>
                        <span style="color: #6366f1;">🔒 Military-Grade Encryption • 🛡️ Tamper Detection</span>
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;

    const textContent = `
VeriSchol Security Verification Code

Hello${userName ? ` ${userName}` : ''},

Your one-time verification code is: ${otpCode}

This code expires in 5 minutes.

If you didn't request this code, please ignore this email.

---
VeriSchol - Secure Research Data Integrity System
    `.trim();

    // Check if email service is configured
    if (!resend) {
        console.log('📧 Email service not configured. OTP for demo:');
        console.log(`   To: ${toEmail}`);
        console.log(`   Code: ${otpCode}`);
        return { success: true, demo: true, otp: otpCode };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: toEmail,
            subject: subject,
            html: htmlContent,
            text: textContent
        });

        if (error) {
            console.error('❌ Email send error:', error);
            // Fallback to demo mode
            return { success: true, demo: true, otp: otpCode, error: error.message };
        }

        console.log(`✅ OTP email sent to ${toEmail} (ID: ${data.id})`);
        return { success: true, demo: false, emailId: data.id };
    } catch (error) {
        console.error('❌ Email service error:', error);
        // Fallback to demo mode
        return { success: true, demo: true, otp: otpCode, error: error.message };
    }
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured() {
    return !!resend;
}
