/**
 * Notification Service — SMS (Africa's Talking), Email (nodemailer), Browser Push
 * All channels gracefully fall back to console.log when credentials are absent.
 */
const nodemailer = require('nodemailer');

const AT_KEY    = process.env.AT_API_KEY;
const AT_USER   = process.env.AT_USERNAME || 'sandbox';
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// ── SMS via Africa's Talking ──────────────────────────────────────────────────
async function sendSMS(to, message) {
  if (!AT_KEY || AT_KEY === 'your_at_api_key_here') {
    console.log(`[SMS SIMULATION] To: ${to} | ${message}`);
    return { simulated: true, to, message };
  }
  try {
    const AT = require('africastalking')({ apiKey: AT_KEY, username: AT_USER });
    const result = await AT.SMS.send({ to: Array.isArray(to) ? to : [to], message, from: 'AgriMgr' });
    return result;
  } catch (e) {
    console.error('SMS error:', e.message);
    return { error: e.message };
  }
}

// ── Email via nodemailer ──────────────────────────────────────────────────────
let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: EMAIL_HOST, port: 587, secure: false,
      auth: EMAIL_USER ? { user: EMAIL_USER, pass: EMAIL_PASS } : undefined,
    });
  }
  return transporter;
}

async function sendEmail(to, subject, html) {
  if (!EMAIL_USER || EMAIL_USER === 'your_email@gmail.com') {
    console.log(`[EMAIL SIMULATION] To: ${to} | Subject: ${subject}`);
    return { simulated: true, to, subject };
  }
  try {
    const info = await getTransporter().sendMail({
      from: `CropMind <${EMAIL_USER}>`,
      to: Array.isArray(to) ? to.join(',') : to,
      subject, html,
    });
    return { messageId: info.messageId };
  } catch (e) {
    console.error('Email error:', e.message);
    return { error: e.message };
  }
}

// ── Push notification (Web Push placeholder) ──────────────────────────────────
async function sendPush(subscription, payload) {
  // In production: use web-push library with VAPID keys
  console.log(`[PUSH SIMULATION] ${JSON.stringify(payload)}`);
  return { simulated: true };
}

// ── Dispatch based on channels ────────────────────────────────────────────────
async function dispatch(notification, recipients) {
  const { channels = ['in_app'], title, message } = notification;
  const results = {};

  if (channels.includes('sms')) {
    const phones = recipients.filter(r => r.phone).map(r => r.phone);
    if (phones.length) results.sms = await sendSMS(phones, `${title}: ${message}`);
  }

  if (channels.includes('email')) {
    const emails = recipients.filter(r => r.email).map(r => r.email);
    if (emails.length) {
      const html = `<h2>${title}</h2><p>${message}</p><p style="color:#666;font-size:12px">CropMind Platform</p>`;
      results.email = await sendEmail(emails, title, html);
    }
  }

  return results;
}

module.exports = { sendSMS, sendEmail, sendPush, dispatch };
