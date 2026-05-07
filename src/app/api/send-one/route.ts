import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/gmail";
import { buildEmailBody, buildEmailHtml, EMAIL_SUBJECT } from "@/lib/emailTemplate";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.name || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { contactId } = await req.json();
  if (!contactId) {
    return NextResponse.json({ error: "Missing contactId" }, { status: 400 });
  }

  const contact = await prisma.contact.findUnique({ where: { id: contactId } });
  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  const senderName = session.user.name;
  const senderEmail = session.user.email!;

  try {
    const body = buildEmailBody({ firstName: contact.firstName, senderName });
    const html = buildEmailHtml({ firstName: contact.firstName, senderName });
    await sendEmail({
      accessToken: session.accessToken,
      to: contact.email,
      from: `${senderName} <${senderEmail}>`,
      subject: EMAIL_SUBJECT,
      body,
      html,
    });

    await prisma.contact.update({
      where: { id: contact.id },
      data: { status: "DONE" },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`Failed to send to ${contact.email}:`, err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
