const { Resend } = require('resend');

let resend;

function getClient() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return null;
    resend = new Resend(apiKey);
  }
  return resend;
}

async function sendPasswordResetEmail(email, resetUrl) {
  const client = getClient();

  if (!client) {
    console.log(`[DEV] Password reset link for ${email}: ${resetUrl}`);
    return { success: true, dev: true };
  }

  const fromAddress = process.env.EMAIL_FROM || 'LeaseLand <noreply@leaseland.vercel.app>';

  await client.emails.send({
    from: fromAddress,
    to: email,
    subject: 'Reset your LeaseLand password',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #1a1a1a; margin-bottom: 16px;">Reset your password</h2>
        <p style="color: #4a4a4a; line-height: 1.6;">
          We received a request to reset your LeaseLand password. Click the button below to choose a new one.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px 0;">
          Reset Password
        </a>
        <p style="color: #888; font-size: 14px; line-height: 1.5;">
          This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #aaa; font-size: 12px;">LeaseLand - Tenancy help for renters in Australia</p>
      </div>
    `,
  });

  return { success: true };
}

module.exports = { sendPasswordResetEmail };
