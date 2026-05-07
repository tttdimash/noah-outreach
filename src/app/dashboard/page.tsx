import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSheetStatuses } from "@/lib/sheets";
import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";
import CSVUpload from "@/components/CSVUpload";

async function resolveAssignedTo(userName: string): Promise<string | null> {
  const rows = await prisma.contact.findMany({
    distinct: ["assignedTo"],
    select: { assignedTo: true },
  });
  const allNames = rows.map((r) => r.assignedTo);
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

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const assignedTo = await resolveAssignedTo(session.user.name ?? "");

  let days: { day: string; total: number; done: number; notStarted: number }[] = [];

  if (assignedTo) {
    const [contacts, sheetStatuses] = await Promise.all([
      prisma.contact.findMany({
        where: { assignedTo },
        select: { day: true, rowIndex: true, status: true },
      }),
      getSheetStatuses(session.accessToken ?? ""),
    ]);

    const map: Record<string, { total: number; done: number; notStarted: number }> = {};
    for (const c of contacts) {
      const sheetStatus = sheetStatuses.get(c.rowIndex);
      const status = sheetStatus ?? c.status;
      if (!map[c.day]) map[c.day] = { total: 0, done: 0, notStarted: 0 };
      map[c.day].total++;
      if (status === "DONE") map[c.day].done++;
      else map[c.day].notStarted++;
    }

    days = Object.keys(map)
      .sort((a, b) => {
        const parse = (d: string) => new Date(d.replace(/^[A-Za-z]+ /, "") + " 2025");
        return parse(a).getTime() - parse(b).getTime();
      })
      .map((d) => ({ day: d, ...map[d] }));
  }

  const totalContacts = await prisma.contact.count();

  // Team stats from DB
  const allContacts = await prisma.contact.findMany({
    select: { assignedTo: true, status: true },
  });
  const teamMap: Record<string, { total: number; done: number }> = {};
  for (const c of allContacts) {
    if (!teamMap[c.assignedTo]) teamMap[c.assignedTo] = { total: 0, done: 0 };
    teamMap[c.assignedTo].total++;
    if (c.status === "DONE") teamMap[c.assignedTo].done++;
  }
  const teamStats = Object.entries(teamMap).sort((a, b) => b[1].done - a[1].done);

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Noah Labs Outreach</h1>
          <p className="text-sm text-gray-500">
            Signed in as{" "}
            <span className="font-medium text-gray-700">{session.user.name}</span>
            {assignedTo && assignedTo !== session.user.name && (
              <span className="text-gray-400"> · assigned as {assignedTo}</span>
            )}
          </p>
        </div>
        <SignOutButton />
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Your Outreach Schedule
        </h2>

        {!assignedTo && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-amber-800 text-sm">
            No contacts are assigned to your account ({session.user.name}). Make
            sure your Google display name matches one of the team member names in
            the spreadsheet.
          </div>
        )}

        <div className="space-y-3">
          {days.map(({ day, total, done, notStarted }) => (
            <Link
              key={day}
              href={`/dashboard/${encodeURIComponent(day)}`}
              className="block bg-white rounded-xl border border-gray-200 px-5 py-4 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{day}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{total} contacts total</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {done > 0 && (
                    <span className="flex items-center gap-1.5 text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                      {done} sent
                    </span>
                  )}
                  {notStarted > 0 && (
                    <span className="flex items-center gap-1.5 text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-3 py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
                      {notStarted} pending
                    </span>
                  )}
                  {notStarted === 0 && done > 0 && (
                    <span className="text-green-600 font-medium">Complete</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 pt-8 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Team Progress</h3>
          <div className="space-y-2">
            {teamStats.map(([name, { total, done }]) => {
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <div key={name} className="bg-white rounded-lg border border-gray-200 px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-800">{name}</span>
                    <span className="text-xs text-gray-500">{done} / {total} sent</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-green-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-gray-700">Contact List</h3>
            <span className="text-xs text-gray-400">{totalContacts} contacts loaded</span>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            The current contact list is already loaded. Upload a new CSV to replace it.
          </p>
          <CSVUpload />
        </div>
      </main>
    </div>
  );
}
