// src/services/email.service.js
// Solo API de AWS SES v3 (sin SMTP, sin BD).
// ENV requeridos:
//   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION=us-east-1
//   SENDER_EMAIL=admin@fireguard-gt.org
//   ALERT_RECIPIENTS=skyfall1321@gmail.com
//   (opcional) FRONTEND_URL, REPLY_TO, SES_CONFIGURATION_SET

import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const TZ = process.env.APP_TZ || "America/Guatemala";

function normEmail(e) {
  return String(e || "").trim().toLowerCase();
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatLocalDate(d) {
  return new Date(d || Date.now()).toLocaleString("es-GT", {
    hour12: false,
    timeZone: TZ,
  });
}

let _ses = null;
function getSes() {
  if (_ses) return _ses;
  _ses = new SESv2Client({ region: process.env.AWS_REGION || "us-east-1" });
  return _ses;
}

// Reintentos para errores transitorios (throttling/unavailable/timeout)
async function sendEmailWithRetry(cmd, tries = 3, baseMs = 500) {
  const ses = getSes();
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      return await ses.send(cmd);
    } catch (e) {
      lastErr = e;
      const msg = String(e?.name || e?.message || e);
      const transient = /Throttl|Timeout|Service|Unavailable|Rate|TooMany|ECONNRESET|ETIMEDOUT/i.test(msg);
      if (!transient || i === tries - 1) break;
      const wait = baseMs * Math.pow(2, i);
      await new Promise(r => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

// === Destinatarios: EXACTAMENTE los de ALERT_RECIPIENTS ===
function resolveRecipientsNoDB() {
  const recipients = (process.env.ALERT_RECIPIENTS || "")
    .split(",")
    .map(normEmail)
    .filter(e => e.includes("@"));
  if (!recipients.length) {
    throw new Error("ALERT_RECIPIENTS no configurado o vacío");
  }
  return recipients;
}

// === Render ===
function renderAlertSubject(alert, deviceName) {
  const level = (alert.level || "info").toUpperCase();
  return `🚨 [${level}] ${alert.type} - ${deviceName}`;
}

function renderAlertHtmlText(alert, deviceName) {
  const created = formatLocalDate(alert.createdAt);
  const colors = { critical: "#e63946", warning: "#ffb703", info: "#219ebc" };
  const levelColor = colors[alert.level] || "#219ebc";

  const detailsHtml = alert.details
    ? `<table width="100%" cellpadding="6" cellspacing="0" style="margin-top:20px;border-collapse:collapse;font-size:14px;">
         <tr style="background-color:#f2f4f6;">
           <th align="left">Parámetro</th>
           <th align="left">Valor</th>
         </tr>
         ${Object.entries(alert.details)
           .slice(0, 50)
           .map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`)
           .join("")}
       </table>`
    : "";

  const html = `
  <div style="background-color:#f6f8fa;padding:40px 0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.08);">
        <tr>
          <td style="background-color:${levelColor};color:white;padding:20px 30px;font-size:22px;font-weight:600;text-align:center;">
            🔥 FireGuard Alert Center
          </td>
        </tr>
        <tr>
          <td style="padding:30px;">
            <h2 style="margin:0 0 10px;color:#111;">${escapeHtml(alert.type)} (${(alert.level || "info").toUpperCase()})</h2>
            <p style="margin:0 0 15px;font-size:15px;color:#333;line-height:1.6;">
              <strong>Dispositivo:</strong> ${escapeHtml(deviceName)}<br>
              <strong>Fecha:</strong> ${escapeHtml(created)}<br>
              <strong>Nivel:</strong> <span style="color:${levelColor};font-weight:bold;">${escapeHtml(alert.level || "info")}</span>
            </p>

            <div style="margin:25px 0;padding:15px 20px;border-left:5px solid ${levelColor};background-color:#f9fafb;">
              <p style="margin:0;font-size:15px;color:#222;">${escapeHtml(alert.message)}</p>
            </div>

            ${detailsHtml}

            <p style="margin-top:30px;font-size:14px;color:#555;text-align:center;">
              Este mensaje fue generado automáticamente por FireGuard.<br>
              <a href="${process.env.FRONTEND_URL || "#"}" style="color:${levelColor};text-decoration:none;">Ver en el panel</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#f2f4f6;padding:15px;text-align:center;font-size:12px;color:#777;">
            &copy; ${new Date().getFullYear()} FireGuard Monitoring System. Todos los derechos reservados.
          </td>
        </tr>
      </table>
    </td></tr></table>
  </div>`.trim();

  const text = `
FireGuard Alert Center

Tipo: ${alert.type}
Nivel: ${alert.level}
Dispositivo: ${deviceName}
Fecha: ${created}
Mensaje: ${alert.message ?? ""}
`.trim();

  return { html, text };
}

// === Envío genérico por SES ===
export async function sendEmail({ from, to, subject, html, text, replyTo, configurationSetName, tags }) {
  const cmd = new SendEmailCommand({
    FromEmailAddress: from, // Debe ser identidad/correo verificado en la misma región
    Destination: { ToAddresses: Array.isArray(to) ? to : [to] },
    ReplyToAddresses: replyTo ? (Array.isArray(replyTo) ? replyTo : [replyTo]) : undefined,
    ConfigurationSetName: configurationSetName || process.env.SES_CONFIGURATION_SET || undefined,
    EmailTags: Array.isArray(tags) ? tags.map(([Name, Value]) => ({ Name, Value: String(Value) })) : undefined,
    Content: {
      Simple: {
        Subject: { Data: subject },
        Body: {
          Html: { Data: html },
          Text: { Data: text || "" },
        },
      },
    },
  });

  const out = await sendEmailWithRetry(cmd);
  return out.MessageId;
}

// === Caso de uso: enviar alerta (From = SENDER_EMAIL, To = ALERT_RECIPIENTS) ===
/**
 * Envía un correo para UNA alerta con plantilla elegante (solo SES).
 * @param {Object} alert { deviceId, type, level, message, details, createdAt, deviceName? }
 */
export async function sendAlertEmail(alert) {
  const recipients = resolveRecipientsNoDB(); // => exactamente ALERT_RECIPIENTS
  const from = normEmail(process.env.SENDER_EMAIL);
  if (!from) {
    console.error("[email] 'SENDER_EMAIL' no configurado. Se omite envío.");
    return;
  }

  const deviceName =
    alert.deviceName && String(alert.deviceName).trim()
      ? String(alert.deviceName).trim()
      : `Device #${alert.deviceId}`;

  const subject = renderAlertSubject(alert, deviceName);
  const { html, text } = renderAlertHtmlText(alert, deviceName);

  try {
    const messageId = await sendEmail({
      from,
      to: recipients,
      subject,
      html,
      text,
      replyTo: process.env.REPLY_TO || undefined,
      configurationSetName: process.env.SES_CONFIGURATION_SET || undefined,
      tags: [
        ["app", "fireguard"],
        ["deviceId", alert.deviceId ?? "n/a"],
        ["level", alert.level ?? "info"],
        ["type", alert.type ?? "n/a"],
      ],
    });
    console.log(`[email] Enviado por SES API → ${messageId}`);
  } catch (e) {
    console.error("[email] SES API falló:", e?.message || e);
  }
}

// === Healthcheck / prueba ===
export async function sendTestEmail(to = process.env.ALERT_RECIPIENTS) {
  const recipients = (to || "")
    .split(",")
    .map(normEmail)
    .filter(Boolean);

  if (!recipients.length) throw new Error("ALERT_RECIPIENTS no configurado");

  const from = normEmail(process.env.SENDER_EMAIL);
  if (!from) throw new Error("SENDER_EMAIL no configurado");

  const subject = "✅ FireGuard SES Test";
  const html = `<p>Prueba SES ${escapeHtml(new Date().toISOString())}</p>`;
  const text = `Prueba SES ${new Date().toISOString()}`;

  const id = await sendEmail({
    from,
    to: recipients,
    subject,
    html,
    text,
    configurationSetName: process.env.SES_CONFIGURATION_SET || undefined,
    tags: [
      ["app", "fireguard"],
      ["type", "healthcheck"],
    ],
  });

  console.log(`[email] Test enviado → ${id}`);
  return id;
}
