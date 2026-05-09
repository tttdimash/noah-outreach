import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

export interface SheetContact {
  rowIndex: number;
  day: string;
  assignedTo: string;
  firstName: string;
  lastName: string;
  organization: string;
  email: string;
  linkedinUrl: string | null;
  status: string;
}

// Reads all columns (A:H) from the sheet and returns full contact list
export async function getSheetContacts(accessToken: string): Promise<SheetContact[]> {
  if (!SHEET_ID) return [];
  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const sheets = google.sheets({ version: "v4", auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "A2:H700",
    });
    const values = response.data.values ?? [];
    return values
      .map((row, i) => ({
        rowIndex: i + 2,
        day: (row[0] ?? "").trim(),
        assignedTo: (row[1] ?? "").trim(),
        firstName: (row[2] ?? "").trim(),
        lastName: (row[3] ?? "").trim(),
        organization: (row[4] ?? "").trim(),
        email: (row[5] ?? "").trim(),
        linkedinUrl: (row[6] ?? "").trim() || null,
        status: (row[7] ?? "").trim().toUpperCase() === "DONE" ? "DONE" : "Not Started",
      }))
      .filter((c) => c.email.includes("@") && c.day && c.assignedTo);
  } catch (err) {
    console.error("Failed to read sheet contacts:", err);
    return [];
  }
}

// Writes DONE to column H for the given row
export async function updateSheetStatus(accessToken: string, rowIndex: number): Promise<void> {
  if (!SHEET_ID) return;
  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const sheets = google.sheets({ version: "v4", auth });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `H${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: { values: [["DONE"]] },
    });
  } catch (err) {
    console.error(`Failed to update sheet row ${rowIndex}:`, err);
  }
}

// Reads the Status column (H) from the sheet and returns a map of rowIndex → status
export async function getSheetStatuses(
  accessToken: string
): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  if (!SHEET_ID) return map;

  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const sheets = google.sheets({ version: "v4", auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "H2:H700",
    });

    const values = response.data.values ?? [];
    values.forEach((row, i) => {
      const rowIndex = i + 2;
      const val = (row[0] ?? "").trim();
      if (val) {
        map.set(rowIndex, val.toUpperCase() === "DONE" ? "DONE" : val);
      }
    });
  } catch (err) {
    console.error("Failed to read sheet statuses:", err);
  }

  return map;
}
