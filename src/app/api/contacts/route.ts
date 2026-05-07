import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.name) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const day = searchParams.get("day");

  const senderName = session.user.name;

  // Get all unique assignedTo values
  const rows = await prisma.contact.findMany({
    distinct: ["assignedTo"],
    select: { assignedTo: true },
  });
  const allNames = rows.map((r) => r.assignedTo);
  const userLower = senderName.toLowerCase();
  const assignedTo = allNames.find(
    (n) =>
      userLower.includes(n.toLowerCase()) ||
      n.toLowerCase().includes(userLower) ||
      userLower.split(" ")[0] === n.toLowerCase().split(" ")[0]
  );

  if (!assignedTo) {
    return NextResponse.json({ contacts: [], days: [] });
  }

  if (day) {
    const contacts = await prisma.contact.findMany({
      where: { day, assignedTo },
      orderBy: { lastName: "asc" },
    });
    return NextResponse.json({ contacts });
  }

  // Return summary by day
  const allContacts = await prisma.contact.findMany({
    where: { assignedTo },
    select: { day: true, status: true },
  });

  const dayMap: Record<string, { total: number; notStarted: number }> = {};
  for (const c of allContacts) {
    if (!dayMap[c.day]) dayMap[c.day] = { total: 0, notStarted: 0 };
    dayMap[c.day].total++;
    if (c.status === "Not Started") dayMap[c.day].notStarted++;
  }

  // Sort by date order
  const dayOrder = ["Tue May 5", "Wed May 6", "Thu May 7", "Fri May 8"];
  const days = dayOrder
    .filter((d) => dayMap[d])
    .map((d) => ({ day: d, ...dayMap[d] }));

  return NextResponse.json({ days, assignedTo });
}
