import Notification from '../models/Notification.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import config from '../config/index.js';
import { sendPush } from './firebase.service.js';

/**
 * Unified notifier. Persists in-app notification and dispatches push (FCM)
 * + email (Resend) when credentials are configured; otherwise logs (dev mode).
 */
export async function notify({ user, title, body, type = 'general', data = {}, channels = ['in_app'] }) {
  const records = [];
  if (channels.includes('in_app')) {
    records.push(await Notification.create({ user, title, body, type, channel: 'in_app', data }));
  }
  if (channels.includes('push')) {
    const u = await User.findById(user).select('fcmTokens');
    const tokens = u?.fcmTokens || [];
    if (tokens.length) await sendPush(tokens, { title, body, data: { type, ...data } });
    else logger.info(`[PUSH] no device tokens for ${user}: ${title}`);
  }
  if (channels.includes('email')) {
    let to = data.email;
    if (!to) { const u = await User.findById(user).select('email'); to = u?.email; }
    if (to) await sendEmail({ to, subject: title, html: emailTemplate(title, body) });
  }
  return records;
}

function emailTemplate(title, body) {
  return `<div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:auto">
    <div style="background:#c2410c;color:#fff;padding:18px 24px;border-radius:14px 14px 0 0">
      <h2 style="margin:0">Maaswad</h2>
      <div style="opacity:.85;font-size:13px">Home Food, Made with Mother's Love</div>
    </div>
    <div style="border:1px solid #ffedd5;border-top:0;padding:24px;border-radius:0 0 14px 14px">
      <h3 style="margin-top:0">${title}</h3>
      <p style="color:#475569">${body}</p>
      <p style="color:#94a3b8;font-size:12px;margin-top:32px">Maaswad — Founded by Dr. Chef Vinoth</p>
    </div>
  </div>`;
}

export async function sendEmail({ to, subject, html }) {
  if (!config.resend.apiKey) { logger.info(`[EMAIL:dev] to=${to} subject="${subject}"`); return { dev: true }; }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.resend.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: config.resend.from, to, subject, html }),
    });
    return await res.json();
  } catch (e) { logger.warn(`email send failed: ${e.message}`); return { error: e.message }; }
}
