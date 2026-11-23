import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().default('postgresql://localhost:5432/trg'),
  JWT_ACCESS_SECRET: z.string().default('dev-access-secret-change-me'),
  JWT_REFRESH_SECRET: z.string().default('dev-refresh-secret-change-me'),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  ADMIN_SETUP_SECRET: z.string().default('dev-setup-secret'),
  EMAIL_PROVIDER: z.enum(['brevo', 'resend']).default('brevo'),
  EMAIL_FROM_NAME: z.string().default('TrG_studio'),
  EMAIL_FROM_ADDRESS: z.string().default('hello@example.com'),
  STORE_NOTIFY_EMAIL: z.string().default('store@example.com'),
  BREVO_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().url().optional(),
  DEFAULT_WHATSAPP_NUMBER: z.string().default(''),
  CRON_SECRET: z.string().optional(),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  ACCESS_TOKEN_TTL_MINUTES: process.env.ACCESS_TOKEN_TTL_MINUTES,
  REFRESH_TOKEN_TTL_DAYS: process.env.REFRESH_TOKEN_TTL_DAYS,
  ADMIN_SETUP_SECRET: process.env.ADMIN_SETUP_SECRET,
  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
  EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS,
  STORE_NOTIFY_EMAIL: process.env.STORE_NOTIFY_EMAIL,
  BREVO_API_KEY: process.env.BREVO_API_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
  DEFAULT_WHATSAPP_NUMBER: process.env.DEFAULT_WHATSAPP_NUMBER,
  CRON_SECRET: process.env.CRON_SECRET,
});

export const siteUrlIsPublic = !(
  process.env.NODE_ENV === 'production' &&
  (env.NEXT_PUBLIC_SITE_URL.includes('localhost') || env.NEXT_PUBLIC_SITE_URL.includes('127.0.0.1'))
);

if (!siteUrlIsPublic && process.env.NODE_ENV === 'production') {
  console.warn('[env] NEXT_PUBLIC_SITE_URL is set to a localhost address in production. Email logos and links will be broken. Set it to your live domain (e.g. https://trgstudio.com).');
}
