import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSheetStatuses } from "@/lib/sheets";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sheetStatuses = await getSheetStatuses(session.accessToken);
  if (sheetStatuses.size === 0) {
    return NextResponse.json({ error: "Could not read sheet or sheet is empty" }, { status: 500 });
  }

  // Update all contacts whose sheet status differs from DB status
  let updated = 0;
  for (const [rowIndex, status] of sheetStatuses.entries()) {
    const normalizedStatus = status.toUpperCase() === "DONE" ? "DONE" : status;
    const result = await prisma.contact.updateMany({
      where: { rowIndex, status: { not: normalizedStatus } },
      data: { status: normalizedStatus },
    });
    updated += result.count;
  }

  return NextResponse.json({ updated });
}
