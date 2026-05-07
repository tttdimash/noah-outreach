import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as fs from "fs";
import * as path from "path";

const CSV_FILENAME =
  "Noah Labs \u2013 Week of May 5 Outreach Tracker (UPDATED \u2013 All Contacts) - Noah Labs \u2013 Week of May 5 Outreach Tracker (UPDATED \u2013 All Contacts).csv";

function parseCSV(content: string) {
  const lines = content.split("\n").filter((l) => l.trim());
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

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const csvPath = path.join(process.cwd(), CSV_FILENAME);
  if (!fs.existsSync(csvPath)) {
    return NextResponse.json(
      { error: "Original CSV file not found on server." },
      { status: 404 }
    );
  }

  const content = fs.readFileSync(csvPath, "utf-8");
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
    }));

  await prisma.contact.deleteMany();
  await prisma.contact.createMany({ data: contacts });

  return NextResponse.json({ count: contacts.length });
}
