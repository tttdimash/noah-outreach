import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

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
    record["__rowIndex"] = String(i + 2); // +1 for header, +1 for 1-based
    return record;
  });
}

async function main() {
  const csvPath = path.join(
    __dirname,
    "..",
    "Noah Labs \u2013 Week of May 5 Outreach Tracker (UPDATED \u2013 All Contacts) - Noah Labs \u2013 Week of May 5 Outreach Tracker (UPDATED \u2013 All Contacts).csv"
  );

  const content = fs.readFileSync(csvPath, "utf-8");
  const rows = parseCSV(content);

  await prisma.contact.deleteMany();

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

  await prisma.contact.createMany({ data: contacts });
  console.log(`Seeded ${contacts.length} contacts.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
