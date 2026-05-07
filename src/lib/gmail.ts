import { google } from "googleapis";

const CC_ADDRESSES = "ata@noahlabs.ai, murat@noahlabs.ai";

export function buildMimeMessage({
  to,
  from,
  subject,
  body,
}: {
  to: string;
  from: string;
  subject: string;
  body: string;
}): string {
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, "utf-8").toString("base64")}?=`;

  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Cc: ${CC_ADDRESSES}`,
    `Subject: ${encodedSubject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ].join("\r\n");

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendEmail({
  accessToken,
  to,
  from,
  subject,
  body,
}: {
  accessToken: string;
  to: string;
  from: string;
  subject: string;
  body: string;
}) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: "v1", auth });
  const raw = buildMimeMessage({ to, from, subject, body });

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });
}
