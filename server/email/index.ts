import { env } from '@/server/common/utils/env';
import { BrevoProvider } from './brevo.provider';
import { ResendProvider } from './resend.provider';
import type { EmailPayload, EmailProvider, EmailSendResult } from './email.types';

const providers = {
  brevo: new BrevoProvider(),
  resend: new ResendProvider(),
};

// Brevo is always the primary sender; Resend is the fallback when Brevo errors.
const orderedProviders: EmailProvider[] = [
  ...(env.BREVO_API_KEY ? [providers.brevo] : []),
  ...(env.RESEND_API_KEY ? [providers.resend] : []),
];

export async function sendEmail(payload: EmailPayload): Promise<EmailSendResult> {
  if (orderedProviders.length === 0) throw new Error('No email provider is configured');

  const errors: string[] = [];
  for (const provider of orderedProviders) {
    try {
      return await provider.send(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[email] ${provider.name} failed: ${message}`);
      errors.push(`${provider.name}: ${message}`);
    }
  }
  throw new Error(`All email providers failed. ${errors.join(' | ')}`);
}

export async function sendEmailSafe(payload: EmailPayload): Promise<boolean> {
  try {
    await sendEmail(payload);
    return true;
  } catch (error) {
    console.error('[email] giving up:', error instanceof Error ? error.message : error);
    return false;
  }
}
