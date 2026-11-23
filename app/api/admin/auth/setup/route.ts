import { count, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/server/db';
import { admins } from '@/server/db/schema';
import { env } from '@/server/common/utils/env';
import { hashPassword, validatePassword } from '@/server/common/utils/password';
import { safeEqual } from '@/server/common/utils/safe-equal';
import { parseJson, getClientIp } from '@/server/common/utils/request';
import { enforceRateLimit } from '@/server/resources/rate-limit/rate-limit.service';
import { issueSession } from '@/server/resources/auth/session.service';
import { setAuthCookies } from '@/server/common/utils/cookies';
import { handleError, HttpError, ok } from '@/server/common/utils/api-response';
import { sendEmailSafe } from '@/server/email';
import { adminWelcomeEmail } from '@/server/common/email-templates';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const schema = z.object({ name:z.string().trim().min(2).max(120), email:z.string().trim().email().transform((value) => value.toLowerCase()), password:z.string().min(1), setupSecret:z.string().min(1) });
export async function POST(req: Request) { try { const body = await parseJson(req, schema); await enforceRateLimit(`setup:${getClientIp(req)}`, 5, 3600); const [{ value }] = await db.select({ value:count(admins.id) }).from(admins); if (Number(value) > 0) throw new HttpError(403, 'Admin setup is already complete.'); if (!safeEqual(body.setupSecret, env.ADMIN_SETUP_SECRET)) throw new HttpError(403, "That secret isn't correct"); if (!validatePassword(body.password)) throw new HttpError(422, 'Password must be at least 10 characters and include letters and numbers.'); const [admin] = await db.insert(admins).values({ name:body.name, email:body.email, passwordHash:await hashPassword(body.password) }).returning({ id:admins.id, name:admins.name, email:admins.email }); const session = await issueSession(admin.id, req); const loginUrl = `${env.NEXT_PUBLIC_SITE_URL}/admin/login`; await sendEmailSafe(adminWelcomeEmail({ name: admin.name, email: admin.email, loginUrl })); const response = ok({ admin }, 201); setAuthCookies(response, session.accessToken, session.refreshToken); return response; } catch (error) { return handleError(error); } }
