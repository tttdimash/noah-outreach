import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/gmail";
import { buildEmailBody, buildEmailHtml, EMAIL_SUBJECT } from "@/lib/emailTemplate";
import { updateSheetStatus } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.name || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rowIndex, firstName, email } = await req.json();
  if (!rowIndex || !firstName || !email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const senderName = session.user.name;
  const senderEmail = session.user.email!;

  try {
    const body = buildEmailBody({ firstName, senderName });
    const html = buildEmailHtml({ firstName, senderName });
    await sendEmail({
      accessToken: session.accessToken,
      to: email,
      from: `${senderName} <${senderEmail}>`,
      subject: EMAIL_SUBJECT,
      body,
      html,
    });

    await updateSheetStatus(session.accessToken, rowIndex);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`Failed to send to ${email}:`, err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
