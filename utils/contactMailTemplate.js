// HTML email sent to the store owner when a customer submits the website Contact form.
// Colours follow the website theme (teal / gold / cream). Inline styles + tables for email-client support.

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const row = (label, valueHtml) => `
  <tr>
    <td style="padding:14px 0;border-bottom:1px solid #E7E2D0;">
      <div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#A97A34;font-weight:700;margin-bottom:4px;">${label}</div>
      <div style="font-size:15px;color:#1C2420;line-height:22px;">${valueHtml}</div>
    </td>
  </tr>`;

export const buildContactMail = ({ name, phone, email, message }) => {
  const safeName = escapeHtml(name);
  const safePhone = escapeHtml(phone);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\r?\n/g, "<br />");
  const receivedAt = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const subject = `New enquiry from ${name} - Vernal Rx`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#F6F3EA;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F3EA;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FBF9F3;border-radius:20px;overflow:hidden;border:1px solid #DAD5C2;">

          <!-- Header -->
          <tr>
            <td style="background:#0C2E28;padding:28px 32px;">
              <div style="font-size:24px;font-weight:700;color:#F6F3EA;letter-spacing:0.5px;">Vernal <span style="color:#C79A52;">Rx</span></div>
              <div style="margin-top:4px;font-size:12px;color:#B8CFC7;letter-spacing:1px;text-transform:uppercase;">Online Pharmacy</div>
            </td>
          </tr>
          <tr><td style="height:4px;background:#C79A52;font-size:0;line-height:0;">&nbsp;</td></tr>

          <!-- Title -->
          <tr>
            <td style="padding:30px 32px 6px;">
              <div style="display:inline-block;background:#F1E4C9;color:#A97A34;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:5px 12px;border-radius:999px;">New Enquiry</div>
              <h1 style="margin:14px 0 6px;font-size:24px;line-height:30px;color:#0C2E28;">You have a new message from ${safeName}</h1>
              <p style="margin:0;font-size:14px;color:#4E5A52;">Submitted through the Contact form on your website &middot; ${escapeHtml(receivedAt)} (IST)</p>
            </td>
          </tr>

          <!-- Details -->
          <tr>
            <td style="padding:14px 32px 4px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${row("Full name", safeName)}
                ${row("Phone number", `<a href="tel:${safePhone}" style="color:#124C42;text-decoration:none;font-weight:600;">+91 ${safePhone}</a>`)}
                ${row("Email", `<a href="mailto:${safeEmail}" style="color:#124C42;text-decoration:none;font-weight:600;">${safeEmail}</a>`)}
              </table>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding:18px 32px 8px;">
              <div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#A97A34;font-weight:700;margin-bottom:8px;">Message</div>
              <div style="background:#E1EBE6;border-left:4px solid #124C42;border-radius:10px;padding:16px 18px;font-size:15px;line-height:24px;color:#1C2420;">${safeMessage}</div>
            </td>
          </tr>

          <!-- Actions -->
          <tr>
            <td style="padding:24px 32px 32px;">
              <a href="mailto:${safeEmail}?subject=${encodeURIComponent("Re: Your enquiry to Vernal Rx")}" style="display:inline-block;background:#0C2E28;color:#F6F3EA;text-decoration:none;font-weight:600;font-size:14px;padding:13px 26px;border-radius:999px;margin-right:8px;">Reply by email</a>
              <a href="tel:${safePhone}" style="display:inline-block;background:#F1E4C9;color:#0C2E28;text-decoration:none;font-weight:600;font-size:14px;padding:13px 26px;border-radius:999px;margin-top:8px;">Call customer</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0C2E28;padding:18px 32px;text-align:center;">
              <div style="font-size:12px;color:#B8CFC7;line-height:18px;">This is an automated notification from your Vernal Rx website.<br />You can reply directly to this email to reach the customer.</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
};
