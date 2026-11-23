import { formatNaira } from '@/server/common/utils/format';
import { escapeHtml } from '@/server/common/utils/escape';
import { env } from '@/server/common/utils/env';

const LOGO_PATH = '/trg-logo-600.jpg';
export function logoUrl(): string { return `${env.NEXT_PUBLIC_SITE_URL}${LOGO_PATH}`; }

type EmailData = {
  reference?: string;
  customerName?: string;
  totalEstimate?: number;
  items?: Array<{ productName?: string; quantity?: number; unitPrice?: number; originalPrice?: number; discountPercent?: number; imageUrl?: string | null; availability?: string; leadTimeText?: string | null }>;
  leadTimeText?: string | null;
  preorderNote?: string | null;
  whatsappNumber?: string;
  message?: string;
  name?: string;
};

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f3f0;font-family:Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3f0;padding:24px 0">
<tr><td align="center">
<table width="620" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06)">
<tr><td align="center" style="background:#0f0d0b;padding:24px 0;border-bottom:3px solid #c9a96a">
<img src="${logoUrl()}" width="132" height="132" alt="TrG_studio" style="display:block;margin:0 auto">
</td></tr>
<tr><td style="padding:32px 40px">
<h1 style="margin:0 0 20px;color:#1a1714;font-family:Georgia,serif;font-size:24px">${title}</h1>
${body}
</td></tr>
<tr><td style="padding:0 40px 32px">
<p style="margin:24px 0 0;padding-top:20px;border-top:1px solid #e8e2d9;color:#6f655b;font-size:13px">TrG_studio &middot; Style. Confidence. You.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function itemList(data: EmailData): string {
  return (data.items ?? []).map((item) => {
    const discount = item.discountPercent && item.discountPercent > 0 && item.originalPrice && item.originalPrice > (item.unitPrice ?? 0);
    const thumb = item.imageUrl ? `<img src="${item.imageUrl}" width="48" height="48" alt="" style="border-radius:6px;vertical-align:middle;margin-right:12px">` : '';
    const price = discount
      ? `<span style="color:#8a6236;font-weight:bold">${formatNaira(item.unitPrice ?? 0)}</span> <del style="color:#999;font-size:13px">${formatNaira(item.originalPrice ?? 0)}</del>`
      : `<span style="font-weight:bold">${formatNaira(item.unitPrice ?? 0)}</span>`;
    const preorderTag = item.availability === 'preorder'
      ? `<br><span style="font-size:12px;color:#8a6236">Preorder${item.leadTimeText ? ` &middot; arrives ${item.leadTimeText}` : ''}</span>`
      : '';
    return `<tr><td style="padding:10px 0;border-bottom:1px solid #f0ece5">${thumb}${escapeHtml(item.productName ?? '')} &times; ${item.quantity}${preorderTag}</td><td style="padding:10px 0;border-bottom:1px solid #f0ece5;text-align:right;white-space:nowrap">${price}</td></tr>`;
  }).join('');
}

export function interestCustomerConfirmation(data: EmailData) {
  return {
    subject: `We received your interests \u00b7 ${data.reference}`,
    html: layout('Interest received', `<p style="color:#3d3833;line-height:1.6">Hi ${escapeHtml(data.customerName ?? '')},</p><p style="color:#3d3833;line-height:1.6">We received your picks. Your reference is <strong style="color:#8a6236">${escapeHtml(data.reference ?? '')}</strong>.</p><table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0">${itemList(data)}</table><p style="margin:16px 0;color:#3d3833">Estimated total: <strong style="font-size:18px;color:#8a6236">${formatNaira(data.totalEstimate ?? 0)}</strong></p>${data.leadTimeText ? `<p style="color:#6f655b;font-size:14px;line-height:1.5">Preorder pieces usually arrive ${escapeHtml(data.leadTimeText)} after confirmation.</p>` : ''}${data.preorderNote ? `<p style="color:#6f655b;font-size:14px;line-height:1.5">${escapeHtml(data.preorderNote)}</p>` : ''}`),
    text: `We received your interests. Reference ${data.reference}.`,
  };
}

export function interestAdminNotification(data: EmailData) {
  return {
    subject: `New interest \u00b7 ${data.reference}`,
    html: layout('New customer interest', `<p style="color:#3d3833;line-height:1.6">${escapeHtml(data.customerName ?? '')} submitted an interest.</p><p style="color:#6f655b;font-size:14px">${escapeHtml(data.reference ?? '')} \u00b7 ${escapeHtml(data.customerName ?? '')} \u00b7 ${data.totalEstimate ? formatNaira(data.totalEstimate) : ''}</p><table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0">${itemList(data)}</table><p style="color:#3d3833">Estimated total: <strong>${formatNaira(data.totalEstimate ?? 0)}</strong></p>`),
    text: `New interest ${data.reference} from ${data.customerName}.`,
  };
}

export function interestReminder(data: EmailData) {
  return {
    subject: `A quick follow-up from TrG_studio \u00b7 ${data.reference}`,
    html: layout('A quick follow-up', `<p style="color:#3d3833;line-height:1.6">Hi ${escapeHtml(data.customerName ?? '')}, we wanted to check in about your interest <strong style="color:#8a6236">${escapeHtml(data.reference ?? '')}</strong>.</p>${data.message ? `<p style="color:#3d3833;line-height:1.6">${escapeHtml(data.message)}</p>` : ''}<p style="color:#3d3833;line-height:1.6">Reply to this email or reach us on WhatsApp: ${escapeHtml(data.whatsappNumber ?? '')}</p>`),
    text: `Follow-up for ${data.reference}.`,
  };
}

export function contactAutoReply(data: EmailData) {
  return {
    subject: 'We received your message \u00b7 TrG_studio',
    html: layout('Message received', `<p style="color:#3d3833;line-height:1.6">Hi ${escapeHtml(data.name ?? '')},</p><p style="color:#3d3833;line-height:1.6">${escapeHtml(data.message ?? 'Thank you for reaching out. We usually reply within 24 hours.')}</p>`),
    text: 'We received your message and will reply within 24 hours.',
  };
}

export function contactAdminNotification(data: EmailData) {
  return {
    subject: `New contact message from ${data.name}`,
    html: layout('New message', `<p style="color:#3d3833;line-height:1.6"><strong>${escapeHtml(data.name ?? '')}</strong></p><p style="color:#3d3833;line-height:1.6">${escapeHtml(data.message ?? '')}</p>`),
    text: `New message from ${data.name}: ${data.message}`,
  };
}

export function contactReplyToCustomer(data: EmailData) {
  return {
    subject: 'Reply from TrG_studio',
    html: layout('A reply from TrG_studio', `<p style="color:#3d3833;line-height:1.6">Hi ${escapeHtml(data.name ?? '')},</p><p style="color:#3d3833;line-height:1.6">${escapeHtml(data.message ?? '')}</p>`),
    text: data.message ?? '',
  };
}
