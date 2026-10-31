import nodemailer from 'nodemailer';
import { env } from '../config/env';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  name?: string;
}

export type EmailProviderName = 'RESEND' | 'NODEMAILER' | 'BREVO';

interface ProviderResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface ProviderDefinition {
  name: EmailProviderName;
  send: (payload: EmailPayload) => Promise<ProviderResult>;
}

/**
 * 1. RESEND PROVIDER (REST API)
 */
async function sendViaResend(payload: EmailPayload): Promise<ProviderResult> {
  if (!env.RESEND_API_KEY) {
    return { success: false, error: 'RESEND_API_KEY is not configured in .env' };
  }

  try {
    const fromAddress = `${env.SMTP_FROM_NAME} <onboarding@resend.dev>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    });

    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: data.message || `Resend responded with status ${res.status}`,
      };
    }

    return { success: true, messageId: data.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Resend network request failed' };
  }
}

/**
 * 2. NODEMAILER PROVIDER (SMTP / GMAIL)
 */
async function sendViaNodemailer(payload: EmailPayload): Promise<ProviderResult> {
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;

  if (!user || !pass) {
    return { success: false, error: 'Nodemailer SMTP credentials (SMTP_USER/SMTP_PASS) not configured in .env' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST || 'smtp.gmail.com',
      port: env.SMTP_PORT || 465,
      secure: env.SMTP_SECURE,
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });

    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    return { success: false, error: err.message || 'Nodemailer transport error' };
  }
}

/**
 * 3. BREVO / SENDINBLUE PROVIDER (REST API)
 */
async function sendViaBrevo(payload: EmailPayload): Promise<ProviderResult> {
  if (!env.BREVO_API_KEY) {
    return { success: false, error: 'BREVO_API_KEY is not configured in .env' };
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: env.SMTP_FROM_NAME,
          email: env.SMTP_FROM_EMAIL,
        },
        to: [
          {
            email: payload.to,
            name: payload.name || 'Member',
          },
        ],
        subject: payload.subject,
        htmlContent: payload.html,
      }),
    });

    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: data.message || `Brevo responded with status ${res.status}`,
      };
    }

    return { success: true, messageId: data.messageId };
  } catch (err: any) {
    return { success: false, error: err.message || 'Brevo network request failed' };
  }
}

/**
 * CIRCULAR FALLBACK POOL
 * Order: RESEND -> NODEMAILER -> BREVO (Cycles in circle)
 */
const PROVIDERS: ProviderDefinition[] = [
  { name: 'RESEND', send: sendViaResend },
  { name: 'NODEMAILER', send: sendViaNodemailer },
  { name: 'BREVO', send: sendViaBrevo },
];

let currentProviderIndex = 0;

/**
 * Send email using circular fallback.
 * If Provider A fails -> switches to Provider B -> switches to Provider C -> cycles in circle.
 */
export const sendCircularEmail = async (
  payload: EmailPayload
): Promise<{ success: boolean; providerUsed?: EmailProviderName }> => {
  const total = PROVIDERS.length;
  console.log(`\n[MAIL DISPATCH] Sending to: ${payload.to} | Subject: "${payload.subject}"`);

  for (let attempt = 0; attempt < total; attempt++) {
    const index = (currentProviderIndex + attempt) % total;
    const provider = PROVIDERS[index];

    console.log(`  -> [CYCLE STEP ${attempt + 1}/${total}] Attempting via ${provider.name}...`);
    const result = await provider.send(payload);

    if (result.success) {
      console.log(`  [SUCCESS] Email delivered via ${provider.name} | ID: ${result.messageId || 'OK'}`);
      // Shift primary starting pointer to next provider in circle for balanced rotation
      currentProviderIndex = (index + 1) % total;
      return { success: true, providerUsed: provider.name };
    }

    console.warn(`  [FAILED: ${provider.name}] ${result.error}. Falling back to next in circle...`);
  }

  console.error(`  [CIRCUIT EXHAUSTED] All 3 email providers failed for ${payload.to}.`);
  return { success: false };
};

/**
 * Send OTP Email for Registration, Verification, or Password Reset
 */
export const sendOtpEmail = async (email: string, otp: string, name?: string): Promise<boolean> => {
  console.log(`[AUTH OTP DISPATCH] Target: ${email} | Pass Key: ${otp}`);

  const htmlContent = `
    <div style="background-color: #0d0d0f; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; text-align: center;">
      <div style="max-width: 480px; margin: 0 auto; background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 32px 24px;">
        <h2 style="letter-spacing: 0.2em; font-size: 20px; color: #ffffff; margin-bottom: 8px;">DRAPZA</h2>
        <p style="color: #a1a1aa; font-size: 13px; letter-spacing: 0.05em; margin-bottom: 24px;">ATELIER VERIFICATION PROTOCOL</p>
        <p style="color: #d4d4d8; font-size: 15px; margin-bottom: 16px;">Hello ${name || 'Member'}, here is your 6-digit access pass key:</p>
        <div style="letter-spacing: 0.35em; font-size: 32px; font-weight: 700; color: #ffffff; background: #27272a; padding: 14px 20px; border-radius: 8px; display: inline-block; margin-bottom: 24px;">
          ${otp}
        </div>
        <p style="color: #71717a; font-size: 12px; line-height: 1.5;">This key will expire in 10 minutes. If you did not request this verification, please disregard this email.</p>
      </div>
    </div>
  `;

  const result = await sendCircularEmail({
    to: email,
    subject: `Your DRAPZA Access Key: ${otp}`,
    html: htmlContent,
    name: name || 'Member',
  });

  return result.success;
};

export interface MailSystemStatus {
  name: EmailProviderName;
  status: 'CONNECTED' | 'READY' | 'DISCONNECTED';
  details: string;
}

/**
 * Check and log status of all circular mail providers on startup
 */
export const checkAndLogMailSystems = async (): Promise<MailSystemStatus[]> => {
  const results: MailSystemStatus[] = [];

  // 1. RESEND
  if (env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` },
        signal: AbortSignal.timeout(3500),
      });
      const data: any = await res.json().catch(() => ({}));
      if (res.ok) {
        results.push({ name: 'RESEND', status: 'CONNECTED', details: 'API Key Active' });
      } else if (res.status === 401 || (data.message && data.message.toLowerCase().includes('invalid'))) {
        results.push({ name: 'RESEND', status: 'DISCONNECTED', details: data.message || 'Invalid API Key' });
      } else {
        results.push({ name: 'RESEND', status: 'READY', details: `Configured (${data.message || `HTTP ${res.status}`})` });
      }
    } catch {
      results.push({ name: 'RESEND', status: 'READY', details: 'API Key Configured' });
    }
  } else {
    results.push({ name: 'RESEND', status: 'DISCONNECTED', details: 'Not Configured (RESEND_API_KEY missing)' });
  }

  // 2. NODEMAILER (SMTP / Gmail)
  if (env.SMTP_USER && env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST || 'smtp.gmail.com',
        port: env.SMTP_PORT || 465,
        secure: env.SMTP_SECURE,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 4000,
      });
      await transporter.verify();
      results.push({
        name: 'NODEMAILER',
        status: 'CONNECTED',
        details: `${env.SMTP_USER} via ${env.SMTP_HOST || 'smtp.gmail.com'}:${env.SMTP_PORT || 465}`,
      });
    } catch (err: any) {
      results.push({
        name: 'NODEMAILER',
        status: 'DISCONNECTED',
        details: `Connection failed (${err.message || 'Auth/Network Error'})`,
      });
    }
  } else {
    results.push({ name: 'NODEMAILER', status: 'DISCONNECTED', details: 'Not Configured (SMTP_USER/PASS missing)' });
  }

  // 3. BREVO
  if (env.BREVO_API_KEY) {
    try {
      const res = await fetch('https://api.brevo.com/v3/account', {
        headers: { 'api-key': env.BREVO_API_KEY, Accept: 'application/json' },
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const data: any = await res.json().catch(() => ({}));
        results.push({
          name: 'BREVO',
          status: 'CONNECTED',
          details: data.email ? `Active (${data.email})` : 'API Key Active',
        });
      } else if (res.status === 401) {
        results.push({ name: 'BREVO', status: 'DISCONNECTED', details: 'Invalid API Key' });
      } else {
        results.push({ name: 'BREVO', status: 'READY', details: `Configured (HTTP ${res.status})` });
      }
    } catch {
      results.push({ name: 'BREVO', status: 'READY', details: 'API Key Configured' });
    }
  } else {
    results.push({ name: 'BREVO', status: 'DISCONNECTED', details: 'Not Configured (BREVO_API_KEY missing)' });
  }

  for (const item of results) {
    console.log(`- ${item.name}: ${item.status} (${item.details})`);
  }

  return results;
};
