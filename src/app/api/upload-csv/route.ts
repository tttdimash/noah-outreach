import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function parseCSV(content: string) {
  const lines = content.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());

  return lines.slice(1).map((line, i) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const record: Record<string, string> = {};
    headers.forEach((h, j) => {
      record[h] = values[j] ?? "";
    });
    record["__rowIndex"] = String(i + 2);
    return record;
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const content = await file.text();
  const rows = parseCSV(content);

  const contacts = rows
    .filter((r) => r["Email Address"]?.includes("@"))
    .map((r) => ({
      day: r["Day"] ?? "",
      assignedTo: r["Assigned To"] ?? "",
      firstName: r["First Name"] ?? "",
      lastName: r["Last Name"] ?? "",
      organization: r["Organization"] ?? "",
      email: r["Email Address"] ?? "",
      linkedinUrl: r["LinkedIn URL"] || null,
      status: r["Status"] ?? "Not Started",
      rowIndex: parseInt(r["__rowIndex"] ?? "0"),
    }))
    .filter((c) => c.day && c.assignedTo && c.email);

  if (contacts.length === 0) {
    return NextResponse.json(
      { error: "No valid contacts found. Check that your CSV has the correct column headers." },
      { status: 400 }
    );
  }

  await prisma.contact.deleteMany();
  await prisma.contact.createMany({ data: contacts });

  return NextResponse.json({ count: contacts.length });
}
