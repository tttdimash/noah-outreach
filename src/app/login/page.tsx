import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginButton from "./LoginButton";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 w-full max-w-sm flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Noah Labs</h1>
          <p className="text-gray-500 text-sm mt-1">Outreach Platform</p>
        </div>
        <p className="text-gray-600 text-sm text-center">
          Sign in with your Google Workspace account to access your assigned
          outreach contacts.
        </p>
        <LoginButton />
      </div>
    </div>
  );
}
