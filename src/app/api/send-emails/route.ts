import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/gmail";
import { buildEmailBody, buildEmailHtml, EMAIL_SUBJECT } from "@/lib/emailTemplate";
import { getSheetContacts, updateSheetStatus } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.name || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { day } = await req.json();
  if (!day) {
    return NextResponse.json({ error: "Missing day" }, { status: 400 });
  }

  const senderName = session.user.name;
  const senderEmail = session.user.email!;

  const allContacts = await getSheetContacts(session.accessToken);
  const allNames = [...new Set(allContacts.map((c) => c.assignedTo))];
  const assignedTo = resolveAssignedTo(senderName, allNames);

  if (!assignedTo) {
    return NextResponse.json(
      { error: `No contacts found matching your name: ${senderName}` },
      { status: 404 }
    );
  }

  const contacts = allContacts.filter(
    (c) => c.day === day && c.assignedTo === assignedTo && c.status !== "DONE"
  );

  const sent: string[] = [];
  const failed: string[] = [];

  for (const contact of contacts) {
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
      await updateSheetStatus(session.accessToken, contact.rowIndex);
      sent.push(contact.email);
    } catch (err) {
      console.error(`Failed to send to ${contact.email}:`, err);
      failed.push(contact.email);
    }
  }

  return NextResponse.json({ sent: sent.length, failed });
}

function resolveAssignedTo(userName: string, allNames: string[]): string | null {
  const userLower = userName.toLowerCase();
  return (
    allNames.find(
      (n) =>
        userLower.includes(n.toLowerCase()) ||
        n.toLowerCase().includes(userLower) ||
        userLower.split(" ")[0] === n.toLowerCase().split(" ")[0]
    ) ?? null
  );
}
