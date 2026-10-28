import { env } from "../../config/env";

// The only file that knows which email provider is used. Switching provider
// means rewriting this one file.
const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendMail(message: MailMessage): Promise<void> {
  if (!env.BREVO_API_KEY) {
    if (env.NODE_ENV === "production") {
      throw new Error("BREVO_API_KEY is not set");
    }
    console.info(
      `[mail] To: ${message.to}\n[mail] Subject: ${message.subject}\n${message.text}`,
    );
    return;
  }

  if (!env.MAIL_FROM_EMAIL) {
    throw new Error("MAIL_FROM_EMAIL is not set");
  }

  const response = await fetch(BREVO_URL, {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: env.MAIL_FROM_NAME, email: env.MAIL_FROM_EMAIL },
      to: [{ email: message.to }],
      subject: message.subject,
      textContent: message.text,
      htmlContent: message.html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Brevo rejected the email with status ${response.status}`);
  }
}
