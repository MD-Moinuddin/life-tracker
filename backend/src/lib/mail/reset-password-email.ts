import { env } from "../../config/env";

// The only place that holds the wording of the reset email and the shape of
// the link. The path must match ROUTES.resetPassword in the frontend.
const RESET_PATH = "/reset-password";

// Email clients ignore most modern CSS, so the layout is a table with inline
// styles. The colours mirror the frontend tokens (styles/tokens.css).
const COLORS = {
  page: "#f6f7fb",
  surface: "#ffffff",
  ink: "#1b1f3b",
  inkMuted: "#5b6088",
  border: "#e6e8f0",
  accent: "#0f766e",
  onAccent: "#ffffff",
};

const FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

interface ResetPasswordEmailInput {
  token: string;
  expiresInMinutes: number;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildHtml(link: string, expiresInMinutes: number) {
  const href = escapeHtml(link);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>Reset your Life Tracker password</title>
<style>
  @media (prefers-color-scheme: dark) {
    .page { background-color: #11131f !important; }
    .card { background-color: #1b1f3b !important; border-color: #2b3057 !important; }
    .ink { color: #f1f2f9 !important; }
    .muted { color: #a9aed0 !important; }
  }
  @media only screen and (max-width: 620px) {
    .container { width: 100% !important; }
    .pad { padding: 28px 20px !important; }
    .button a { display: block !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Choose a new password. The link works for ${expiresInMinutes} minutes.</div>
<table role="presentation" class="page" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.page};">
  <tr>
    <td align="center" style="padding:32px 12px;">
      <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;">
        <tr>
          <td style="padding:0 4px 16px;font-family:${FONT_STACK};font-size:18px;font-weight:700;color:${COLORS.accent};">Life Tracker</td>
        </tr>
        <tr>
          <td class="card pad" style="background-color:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:12px;padding:36px 40px;font-family:${FONT_STACK};">
            <h1 class="ink" style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:700;color:${COLORS.ink};">Reset your password</h1>
            <p class="ink" style="margin:0 0 24px;font-size:16px;line-height:1.6;color:${COLORS.ink};">We got a request to reset your Life Tracker password. Choose a new one with the button below.</p>
            <table role="presentation" class="button" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
              <tr>
                <td align="center" bgcolor="${COLORS.accent}" style="border-radius:8px;background-color:${COLORS.accent};">
                  <a href="${href}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${FONT_STACK};font-size:16px;font-weight:600;line-height:1.2;color:${COLORS.onAccent};text-decoration:none;border-radius:8px;">Choose a new password</a>
                </td>
              </tr>
            </table>
            <p class="muted" style="margin:0 0 24px;font-size:14px;line-height:1.6;color:${COLORS.inkMuted};">This link works for ${expiresInMinutes} minutes and only once.</p>
            <hr style="border:0;border-top:1px solid ${COLORS.border};margin:0 0 20px;">
            <p class="muted" style="margin:0 0 8px;font-size:13px;line-height:1.6;color:${COLORS.inkMuted};">Button not working? Copy this link into your browser:</p>
            <p class="muted" style="margin:0 0 20px;font-size:13px;line-height:1.5;color:${COLORS.inkMuted};word-break:break-all;"><a href="${href}" style="color:${COLORS.accent};">${href}</a></p>
            <p class="muted" style="margin:0;font-size:13px;line-height:1.6;color:${COLORS.inkMuted};">If you did not ask for this, you can ignore this email. Your password stays as it is.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export function buildResetPasswordEmail({
  token,
  expiresInMinutes,
}: ResetPasswordEmailInput) {
  const url = new URL(RESET_PATH, env.CORS_ORIGIN);
  url.searchParams.set("token", token);
  const link = url.toString();

  const subject = "Reset your Life Tracker password";
  const text = [
    "We got a request to reset your Life Tracker password.",
    "",
    `Open this link to choose a new one (it works for ${expiresInMinutes} minutes and only once):`,
    link,
    "",
    "If you did not ask for this, you can ignore this email. Your password stays as it is.",
  ].join("\n");
  const html = buildHtml(link, expiresInMinutes);

  return { subject, text, html };
}
