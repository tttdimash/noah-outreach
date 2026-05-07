-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Contact" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "day" TEXT NOT NULL,
    "assignedTo" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "linkedinUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Not Started',
    "rowIndex" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_Contact" ("assignedTo", "day", "email", "firstName", "id", "lastName", "linkedinUrl", "organization", "status") SELECT "assignedTo", "day", "email", "firstName", "id", "lastName", "linkedinUrl", "organization", "status" FROM "Contact";
DROP TABLE "Contact";
ALTER TABLE "new_Contact" RENAME TO "Contact";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
