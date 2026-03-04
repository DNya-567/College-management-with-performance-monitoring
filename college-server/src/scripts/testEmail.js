// Verifies SMTP connection and sends a test email.
// Usage: node src/scripts/testEmail.js your-email@gmail.com
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const nodemailer = require("nodemailer");

const to = process.argv[2];
if (!to) {
  console.error("Usage: node src/scripts/testEmail.js <recipient-email>");
  process.exit(1);
}

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
  console.error("❌ SMTP not configured in .env");
  process.exit(1);
}

console.log("SMTP Config:");
console.log("  Host:", SMTP_HOST);
console.log("  Port:", SMTP_PORT || 587);
console.log("  User:", SMTP_USER);
console.log("  From:", SMTP_FROM || SMTP_USER);
console.log("");

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT) || 587,
  secure: Number(SMTP_PORT) === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

(async () => {
  try {
    console.log("⏳ Verifying SMTP connection...");
    await transporter.verify();
    console.log("✅ SMTP connection successful!\n");

    console.log(`⏳ Sending test email to ${to}...`);
    const info = await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to,
      subject: "✅ Test Email — College Management System",
      text: "If you see this, email notifications are working correctly!",
      html: `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0f172a;">✅ Email Setup Successful</h2>
          <p style="color: #64748b; font-size: 14px;">
            If you see this email, your College Management System is properly configured to send notifications.
          </p>
          <p style="color: #64748b; font-size: 14px;">
            Password change alerts, announcements, and other notifications will be delivered to this inbox.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
          <p style="color: #94a3b8; font-size: 12px;">— College Management System</p>
        </div>
      `,
    });

    console.log("✅ Email sent! Message ID:", info.messageId);
    console.log("\n🎉 Check your inbox (and spam folder) for the test email.");
  } catch (err) {
    console.error("❌ Failed:", err.message);
    if (err.message.includes("Invalid login")) {
      console.error("\nMake sure you're using an App Password, not your regular Gmail password.");
      console.error("Generate one at: https://myaccount.google.com/apppasswords");
    }
  }
  process.exit(0);
})();

