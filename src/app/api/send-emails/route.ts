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

  const { day } = await req.json();
  if (!day) {
    return NextResponse.json({ error: "Missing day" }, { status: 400 });
  }

  const senderName = session.user.name;
  const senderEmail = session.user.email!;

  // Find the CSV assignedTo name that matches this user
  const assignedToName = await resolveAssignedTo(senderName);
  if (!assignedToName) {
    return NextResponse.json(
      { error: `No contacts found matching your name: ${senderName}` },
      { status: 404 }
    );
  }

  const contacts = await prisma.contact.findMany({
    where: {
      day,
      assignedTo: assignedToName,
      status: "Not Started",
    },
  });

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

      await prisma.contact.update({
        where: { id: contact.id },
        data: { status: "DONE" },
      });

      sent.push(contact.email);
    } catch (err) {
      console.error(`Failed to send to ${contact.email}:`, err);
      failed.push(contact.email);
    }
  }

  return NextResponse.json({ sent: sent.length, failed });
}

async function resolveAssignedTo(userName: string): Promise<string | null> {
  // Get all unique assignedTo values from DB
  const rows = await prisma.contact.findMany({
    distinct: ["assignedTo"],
    select: { assignedTo: true },
  });

  const allNames = rows.map((r) => r.assignedTo);

  // Find best match: user's display name contains or matches CSV name
  const userLower = userName.toLowerCase();
  const match = allNames.find(
    (n) =>
      userLower.includes(n.toLowerCase()) ||
      n.toLowerCase().includes(userLower) ||
      userLower.split(" ")[0] === n.toLowerCase().split(" ")[0]
  );

  return match ?? null;
}
