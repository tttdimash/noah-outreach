import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSheetStatuses } from "@/lib/sheets";
import Link from "next/link";
import { buildEmailBody, EMAIL_SUBJECT } from "@/lib/emailTemplate";
import SendAllButton from "@/components/SendAllButton";
import SendOneButton from "@/components/SendOneButton";

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

export default async function DayPage({
  params,
}: {
  params: Promise<{ day: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { day } = await params;
  const decodedDay = decodeURIComponent(day);
  const assignedTo = await resolveAssignedTo(session.user.name ?? "");

  const dbContacts = assignedTo
    ? await prisma.contact.findMany({
        where: { day: decodedDay, assignedTo },
        orderBy: { lastName: "asc" },
      })
    : [];

  const sheetStatuses = await getSheetStatuses(session.accessToken ?? "");
  const contacts = dbContacts.map((c) => ({
    ...c,
    status: sheetStatuses.get(c.rowIndex) ?? c.status,
  }));
  const notStarted = contacts.filter((c) => c.status !== "DONE");
  const senderName = session.user.name ?? "Team Member";

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-gray-900">{decodedDay}</h1>
          <p className="text-sm text-gray-500">
            {contacts.length} contacts · {notStarted.length} pending ·{" "}
            {contacts.length - notStarted.length} sent
          </p>
        </div>
        {notStarted.length > 0 && (
          <SendAllButton day={decodedDay} pendingCount={notStarted.length} />
        )}
        {notStarted.length === 0 && contacts.length > 0 && (
          <span className="text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-full px-3 py-1">
            All sent
          </span>
        )}
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-4">
        {contacts.length === 0 && (
          <p className="text-gray-500 text-sm">No contacts for this day.</p>
        )}

        {contacts.map((contact) => {
          const emailBody = buildEmailBody({ firstName: contact.firstName, senderName });
          const isDone = contact.status === "DONE";

          return (
            <details
              key={contact.id}
              className={`bg-white rounded-xl border transition-all ${
                isDone ? "border-green-200 opacity-75" : "border-gray-200"
              }`}
            >
              <summary className="px-5 py-4 cursor-pointer list-none flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isDone ? (
                    <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full border-2 border-orange-300 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {contact.firstName} {contact.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{contact.organization}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{contact.email}</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </summary>

              <div className="px-5 pb-5 border-t border-gray-100 mt-2 pt-4">
                <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Subject</p>
                <p className="text-sm text-gray-700 mb-4">{EMAIL_SUBJECT}</p>

                <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Email Preview</p>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans bg-gray-50 rounded-lg p-4 border border-gray-100">
                  {emailBody}
                </pre>
                {!isDone && <SendOneButton contactId={contact.id} />}
              </div>
            </details>
          );
        })}
      </main>
    </div>
  );
}
