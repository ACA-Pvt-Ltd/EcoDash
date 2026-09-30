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
    return false;
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
  return true;
}

async function sendPasswordResetEmail({ to, name, code }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`⚠️  EMAIL_USER / EMAIL_PASS not set — password reset code for ${to}: ${code}`);
      return;
    }
    throw new Error('Email is not configured (EMAIL_USER / EMAIL_PASS)');
  }

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#2ECC71;padding:28px 32px">
      <h1 style="color:#fff;margin:0;font-size:22px">Reset your password 🔐</h1>
      <p style="color:rgba(255,255,255,.85);margin:6px 0 0;font-size:14px">EcoDash account recovery</p>
    </div>
    <div style="padding:28px 32px">
      <p style="font-size:15px;color:#333">Hi <strong>${name}</strong>,</p>
      <p style="font-size:14px;color:#555;line-height:1.6">
        We received a request to reset your EcoDash password. Enter this code in the app to choose a new one:
      </p>
      <div style="background:#f8f8f8;border-radius:8px;padding:20px;margin:20px 0;text-align:center">
        <p style="margin:0;font-size:32px;font-weight:700;color:#2ECC71;letter-spacing:8px">${code}</p>
      </div>
      <p style="font-size:13px;color:#888;line-height:1.6">
        This code expires in 15 minutes. If you didn't ask to reset your password, you can ignore this email — your password won't change.
      </p>
    </div>
    <div style="background:#f0fdf4;padding:16px 32px;border-top:1px solid #e0e0e0">
      <p style="margin:0;font-size:12px;color:#999;text-align:center">
        EcoDash Waste Management Platform
      </p>
    </div>
  </div>
</body>
</html>`;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || `"EcoDash" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your EcoDash password reset code',
    html,
  });

  console.log(`✉️  Password reset email sent to ${to}`);
}

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);

// "Contact the admin team" box, listing whichever support channels are set
function supportContactBox(supportContact, heading) {
  const rows = [
    ['Email', supportContact.email],
    ['Phone', supportContact.phone],
    ['WhatsApp', supportContact.whatsapp],
  ]
    .filter(([, value]) => value)
    .map(([label, value]) =>
      `<p style="margin:0 0 6px;font-size:14px;color:#333"><span style="color:#888">${label}:</span> <strong>${escapeHtml(value)}</strong></p>`)
    .join('');
  if (!rows) return '';
  return `
      <div style="background:#f8f8f8;border-radius:8px;padding:16px 20px;margin:20px 0">
        <p style="margin:0 0 10px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:.5px">${heading}</p>
        ${rows}
        ${supportContact.hours ? `<p style="margin:8px 0 0;font-size:12px;color:#888">${escapeHtml(supportContact.hours)}</p>` : ''}
      </div>`;
}

const reasonBlock = (reason, color) => reason ? `
      <div style="border-left:4px solid ${color};background:#fdf2f2;border-radius:4px;padding:12px 16px;margin:16px 0">
        <p style="margin:0 0 4px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:.5px">Reason</p>
        <p style="margin:0;font-size:14px;color:#333;line-height:1.5;white-space:pre-line">${escapeHtml(reason)}</p>
      </div>` : '';

// Shared shell for emails the admin team sends about someone's account
const accountEmailHtml = ({ headerColor, title, subtitle, name, body }) => `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:${headerColor};padding:28px 32px">
      <h1 style="color:#fff;margin:0;font-size:22px">${title}</h1>
      <p style="color:rgba(255,255,255,.85);margin:6px 0 0;font-size:14px">${subtitle}</p>
    </div>
    <div style="padding:28px 32px">
      <p style="font-size:15px;color:#333">Hi <strong>${escapeHtml(name)}</strong>,</p>
      ${body}
    </div>
    <div style="background:#f0fdf4;padding:16px 32px;border-top:1px solid #e0e0e0">
      <p style="margin:0;font-size:12px;color:#999;text-align:center">
        EcoDash Waste Management Platform · This email was sent by the admin team
      </p>
    </div>
  </div>
</body>
</html>`;

// Sends an account email, or logs and returns false when email isn't configured
async function sendAccountEmail({ to, subject, html, logLabel }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(`⚠️  EMAIL_USER / EMAIL_PASS not set — skipping account ${logLabel} email to ${to}`);
    return false;
  }
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || `"EcoDash" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
  console.log(`✉️  Account ${logLabel} email sent to ${to}`);
  return true;
}

// Tells an account holder that an admin deactivated or reactivated their account.
// Returns true when sent, false when email isn't configured.
async function sendAccountStatusEmail({ to, name, role, isActive, reason, supportContact = {} }) {
  const roleLabel = capitalize(role);
  const body = isActive
    ? `<p style="font-size:14px;color:#555;line-height:1.6">
        Good news — an EcoDash administrator has reactivated your <strong>${roleLabel}</strong> account
        (<strong>${escapeHtml(to)}</strong>). You can log in to the app again as before.
      </p>
      ${supportContactBox(supportContact, 'Need help? Contact the admin team')}`
    : `<p style="font-size:14px;color:#555;line-height:1.6">
        An EcoDash administrator has deactivated your <strong>${roleLabel}</strong> account
        (<strong>${escapeHtml(to)}</strong>). You won't be able to log in until the account is reactivated.
      </p>
      ${reasonBlock(reason, '#E74C3C')}
      ${supportContactBox(supportContact, 'Think this is a mistake? Contact the admin team')}`;

  return sendAccountEmail({
    to,
    subject: isActive ? 'Your EcoDash account has been reactivated' : 'Your EcoDash account has been deactivated',
    logLabel: isActive ? 'reactivated' : 'deactivated',
    html: accountEmailHtml({
      headerColor: isActive ? '#2ECC71' : '#E74C3C',
      title: isActive ? 'Your EcoDash account is active again ✅' : 'Your EcoDash account has been deactivated',
      subtitle: `EcoDash ${roleLabel} account`,
      name,
      body,
    }),
  });
}

// Tells someone an admin deleted their account and removed their personal data.
// Sent to the address the account had before deletion. Returns true when sent.
async function sendAccountDeletedEmail({ to, name, role, reason, supportContact = {} }) {
  const roleLabel = capitalize(role);
  const body = `<p style="font-size:14px;color:#555;line-height:1.6">
        An EcoDash administrator has deleted your <strong>${roleLabel}</strong> account
        (<strong>${escapeHtml(to)}</strong>). Your personal details have been removed and you can no longer
        log in with this account. Any open offers or requests were cancelled.
      </p>
      ${reasonBlock(reason, '#B42318')}
      ${supportContactBox(supportContact, 'Think this is a mistake? Contact the admin team')}
      <p style="font-size:13px;color:#888;line-height:1.6">
        You're welcome to sign up for EcoDash again with this email address at any time.
      </p>`;

  return sendAccountEmail({
    to,
    subject: 'Your EcoDash account has been deleted',
    logLabel: 'deleted',
    html: accountEmailHtml({
      headerColor: '#B42318',
      title: 'Your EcoDash account has been deleted',
      subtitle: `EcoDash ${roleLabel} account`,
      name,
      body,
    }),
  });
}

module.exports = { sendWelcomeEmail, sendPasswordResetEmail, sendAccountStatusEmail, sendAccountDeletedEmail };
