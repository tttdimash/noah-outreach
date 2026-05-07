import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

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
      const rowIndex = i + 2; // H2 = row 2
      map.set(rowIndex, row[0] ?? "Not Started");
    });
  } catch (err) {
    console.error("Failed to read sheet statuses:", err);
  }

  return map;
}
