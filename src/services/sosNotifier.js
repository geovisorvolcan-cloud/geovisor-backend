const nodemailer = require("nodemailer");

const DEFAULT_SOS_EMAIL = "leonsuarez24@gmail.com";

let cachedTransporter;

function getTransporter() {
  if (cachedTransporter !== undefined) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const useSendmail = process.env.SMTP_SENDMAIL === "true";

  if (useSendmail) {
    cachedTransporter = nodemailer.createTransport({
      sendmail: true,
      newline: "unix",
      path: process.env.SENDMAIL_PATH || undefined,
    });
    return cachedTransporter;
  }

  if (!host || !user || !pass) {
    cachedTransporter = null;
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    auth: { user, pass },
  });

  return cachedTransporter;
}

function formatPosition(position) {
  if (!Array.isArray(position) || position.length !== 2) return null;
  const [lat, lng] = position;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    lat,
    lng,
    label: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    mapsUrl: `https://maps.google.com/?q=${lat},${lng}`,
  };
}

async function sendSosAlertEmail({ alert, user }) {
  const transporter = getTransporter();
  const to = process.env.SOS_ALERT_TO || DEFAULT_SOS_EMAIL;
  const from = process.env.SOS_ALERT_FROM || process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!transporter || !from) {
    return {
      sent: false,
      skipped: true,
      to,
      reason: "smtp_not_configured",
    };
  }

  const position = formatPosition(alert.position);
  const submittedAt = new Date(alert.createdAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: process.env.SOS_ALERT_TIMEZONE || "America/Bogota",
  });

  const subject = `SOS Alert: ${user.name}`;
  const textLines = [
    `An SOS alert was emitted in VISOR.`,
    ``,
    `User: ${user.name}`,
    `Email: ${user.email}`,
    `Role: ${user.role}`,
    `Time: ${submittedAt}`,
    `Message: ${alert.message}`,
    position ? `Position: ${position.label}` : `Position: Not available`,
    position ? `Map: ${position.mapsUrl}` : null,
  ].filter(Boolean);

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;">
      <h2 style="margin:0 0 12px;color:#b91c1c;">VISOR SOS Alert</h2>
      <p style="margin:0 0 12px;">An SOS alert was emitted in VISOR.</p>
      <table style="border-collapse:collapse;">
        <tr><td style="padding:4px 12px 4px 0;font-weight:700;">User</td><td style="padding:4px 0;">${user.name}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:700;">Email</td><td style="padding:4px 0;">${user.email}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:700;">Role</td><td style="padding:4px 0;">${user.role}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:700;">Time</td><td style="padding:4px 0;">${submittedAt}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:700;">Message</td><td style="padding:4px 0;">${alert.message}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:700;">Position</td><td style="padding:4px 0;">${position ? position.label : "Not available"}</td></tr>
      </table>
      ${
        position
          ? `<p style="margin:12px 0 0;"><a href="${position.mapsUrl}" target="_blank" rel="noreferrer">Open location in Google Maps</a></p>`
          : ""
      }
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject,
    text: textLines.join("\n"),
    html,
  });

  return { sent: true, to };
}

module.exports = {
  DEFAULT_SOS_EMAIL,
  sendSosAlertEmail,
};
