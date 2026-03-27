// Email utility: sends transactional emails via SMTP.
// Uses nodemailer with Gmail App Password or any SMTP provider.
// Must NOT contain business logic or DB queries.
//
// When SMTP env vars are set → sends real emails.
// When not set → auto-creates an Ethereal test account and prints a
//   preview URL in the console so you can view the email in a browser.
//
// Required env vars (for production):
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

import nodemailer from 'nodemailer';

const isConfigured =
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS;

let transporter = null;
let transporterReady = false;

// Initialize transporter
const init = async () => {
  if (isConfigured) {
    // Production / real SMTP
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify SMTP connection at startup
    try {
      await transporter.verify();
      transporterReady = true;
      console.log("✅ [EMAIL] SMTP connected:", process.env.SMTP_HOST, "as", process.env.SMTP_USER);
    } catch (err) {
      console.error("❌ [EMAIL] SMTP connection failed:", err.message);
      console.error("   Emails will NOT be sent. Check .env SMTP_* values.");
      transporter = null; // disable so it falls through to fallback
    }
  } else {
    // Dev mode — create a free Ethereal test account automatically
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      transporterReady = true;
      console.log("[EMAIL-DEV] Using Ethereal test account:", testAccount.user);
      console.log("[EMAIL-DEV] View sent emails at: https://ethereal.email/login");
      console.log("[EMAIL-DEV] Login:", testAccount.user, "/ Pass:", testAccount.pass);
    } catch (err) {
      console.warn("[EMAIL-DEV] Could not create Ethereal account:", err.message);
      console.warn("[EMAIL-DEV] Emails will be logged to console only.");
    }
  }
};

// Start initialization immediately (non-blocking)
const initPromise = init();

/**
 * Send an email. Fire-and-forget — never throws.
 * @param {{ to: string, subject: string, text: string, html?: string }} opts
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  // Wait for transporter to be ready (only on first call)
  await initPromise;

  if (!transporter) {
    // Absolute fallback — just log
    console.log(`[EMAIL-FALLBACK] To: ${to} | Subject: ${subject}\n${text}`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER || "cms@college.dev",
      to,
      subject,
      text,
      html: html || undefined,
    });

    if (isConfigured) {
      console.log(`[EMAIL] Sent to ${to}: ${subject}`);
    } else {
      // Ethereal — print the preview URL
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[EMAIL-DEV] Sent to ${to}: ${subject}`);
      console.log(`[EMAIL-DEV] 📧 Preview: ${previewUrl}`);
    }
  } catch (error) {
    // Fire-and-forget — log but don't crash
    console.error(`[EMAIL] Failed to send to ${to}:`, error.message);
  }
};
