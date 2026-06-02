const nodemailer = require('nodemailer');

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function sendWelcomeEmail({ to, name, role, password }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️  EMAIL_USER / EMAIL_PASS not set — skipping welcome email');
    return;
  }

  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  const loginUrl  = process.env.ADMIN_URL || 'http://localhost:3001';

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#2ECC71;padding:28px 32px">
      <h1 style="color:#fff;margin:0;font-size:22px">Welcome to EcoDash 🌿</h1>
      <p style="color:rgba(255,255,255,.85);margin:6px 0 0;font-size:14px">Your ${roleLabel} account is ready</p>
    </div>
    <div style="padding:28px 32px">
      <p style="font-size:15px;color:#333">Hi <strong>${name}</strong>,</p>
      <p style="font-size:14px;color:#555;line-height:1.6">
        An EcoDash administrator has created a <strong>${roleLabel}</strong> account for you.
        Here are your login credentials:
      </p>
      <div style="background:#f8f8f8;border-radius:8px;padding:16px 20px;margin:20px 0">
        <p style="margin:0 0 8px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:.5px">Login Email</p>
        <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#222">${to}</p>
        <p style="margin:0 0 8px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:.5px">Temporary Password</p>
        <p style="margin:0;font-size:18px;font-weight:700;color:#2ECC71;letter-spacing:1px">${password}</p>
      </div>
      <p style="font-size:13px;color:#888;line-height:1.6">
        Please change your password after your first login. Keep these credentials safe.
      </p>
    </div>
    <div style="background:#f0fdf4;padding:16px 32px;border-top:1px solid #e0e0e0">
      <p style="margin:0;font-size:12px;color:#999;text-align:center">
        EcoDash Waste Management Platform · This email was sent by the admin team
      </p>
    </div>
  </div>
</body>
</html>`;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || `"EcoDash" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Welcome to EcoDash - Your ${roleLabel} Account Details`,
    html,
  });

  console.log(`✉️  Welcome email sent to ${to}`);
}

module.exports = { sendWelcomeEmail };
