import { env } from '@/server/common/utils/env';
import type { EmailPayload, EmailProvider, EmailSendResult } from './email.types';

export class ResendProvider implements EmailProvider {
  readonly name = 'resend' as const;

  isConfigured(): boolean {
    return Boolean(env.RESEND_API_KEY);
  }

  async send(payload: EmailPayload): Promise<EmailSendResult> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: `${payload.fromName ?? env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`,
        to: Array.isArray(payload.to) ? payload.to : [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
      }),
    });

    if (!response.ok) throw new Error(`Resend ${response.status}: ${await response.text()}`);
    const data = (await response.json()) as { id?: string };
    return { id: data.id, provider: this.name };
  }
}
