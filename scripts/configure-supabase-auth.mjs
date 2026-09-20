const required = ['SUPABASE_ACCESS_TOKEN', 'SUPABASE_PROJECT_ID', 'RESEND_API_KEY'];
for (const name of required) {
  if (!process.env[name]) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
}

const token = process.env.SUPABASE_ACCESS_TOKEN;
const project = process.env.SUPABASE_PROJECT_ID;
const resendKey = process.env.RESEND_API_KEY;

const emailTemplate = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;background:#100b18;color:#f7f0ff;font-family:Inter,Arial,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#100b18;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#1b1328;border:1px solid #5b3c79;border-radius:24px;overflow:hidden">
        <tr><td style="padding:32px">
          <div style="font-size:34px;font-weight:900;letter-spacing:-1px;color:#d7b7ff">vibe ✦</div>
          <h1 style="margin:28px 0 8px;font-size:24px;color:#ffffff">Your Vibe verification code</h1>
          <p style="margin:0 0 24px;color:#cdbfda;line-height:1.7">Use this one-time code to continue. Never share it with anyone.</p>
          <div style="padding:18px 20px;border-radius:16px;background:#281a3b;border:1px solid #7f59a5;text-align:center;font-size:34px;font-weight:800;letter-spacing:8px;color:#ffffff">{{ .Token }}</div>
          <p style="margin:24px 0 0;color:#8f829e;font-size:13px;line-height:1.6">If you did not request this code, you can ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const payload = {
  external_email_enabled: true,
  mailer_autoconfirm: false,
  mailer_otp_exp: 600,
  mailer_otp_length: 6,
  smtp_admin_email: 'noreply@vibe-groups.com',
  smtp_sender_name: 'Vibe',
  smtp_host: 'smtp.resend.com',
  smtp_port: 587,
  smtp_user: 'resend',
  smtp_pass: resendKey,
  mailer_subjects_confirmation: 'Your Vibe verification code',
  mailer_subjects_magic_link: 'Your Vibe sign-in code',
  mailer_subjects_recovery: 'Your Vibe recovery code',
  mailer_templates_confirmation_content: emailTemplate,
  mailer_templates_magic_link_content: emailTemplate,
  mailer_templates_recovery_content: emailTemplate
};

const endpoint = `https://api.supabase.com/v1/projects/${encodeURIComponent(project)}/config/auth`;
const response = await fetch(endpoint, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
});

if (!response.ok) {
  console.error(`Supabase Auth configuration failed (${response.status}).`);
  process.exit(1);
}

const verify = await fetch(endpoint, {
  headers: { Authorization: `Bearer ${token}` }
});

if (!verify.ok) {
  console.error(`Supabase Auth verification failed (${verify.status}).`);
  process.exit(1);
}

const config = await verify.json();
const expected = {
  smtp_host: 'smtp.resend.com',
  smtp_port: '587',
  smtp_user: 'resend',
  smtp_admin_email: 'noreply@vibe-groups.com',
  smtp_sender_name: 'Vibe'
};

const mismatches = Object.entries(expected).filter(([key, value]) => String(config[key] ?? '') !== value);
if (mismatches.length) {
  console.error('Supabase Auth SMTP verification did not match expected non-secret settings.');
  process.exit(1);
}

console.log('Supabase Auth SMTP and branded OTP templates are configured for Vibe.');
