"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SendAllButton({
  day,
  pendingCount,
}: {
  day: string;
  pendingCount: number;
}) {
  const [state, setState] = useState<
    "idle" | "confirming" | "sending" | "done" | "error"
  >("idle");
  const [result, setResult] = useState<{ sent: number; failed: string[] } | null>(null);
  const router = useRouter();

  async function handleSend() {
    setState("sending");
    try {
      const res = await fetch("/api/send-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setResult(data);
      setState("done");
      router.refresh();
    } catch (err) {
      console.error(err);
      setState("error");
    }
  }

  if (state === "idle") {
    return (
      <button
        onClick={() => setState("confirming")}
        className="rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700 transition-colors"
      >
        Send {pendingCount} Email{pendingCount !== 1 ? "s" : ""}
      </button>
    );
  }

  if (state === "confirming") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">
          Send {pendingCount} emails?
        </span>
        <button
          onClick={() => setState("idle")}
          className="rounded-lg border border-gray-300 text-gray-600 text-sm px-3 py-1.5 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSend}
          className="rounded-lg bg-blue-600 text-white text-sm font-medium px-3 py-1.5 hover:bg-blue-700 transition-colors"
        >
          Confirm &amp; Send
        </button>
      </div>
    );
  }

  if (state === "sending") {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Sending…
      </div>
    );
  }

  if (state === "done" && result) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-green-600 font-medium">
          {result.sent} sent
          {result.failed.length > 0 && (
            <span className="text-red-500 ml-1">
              · {result.failed.length} failed
            </span>
          )}
        </span>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-red-600">Failed to send</span>
        <button
          onClick={() => setState("idle")}
          className="text-sm text-gray-500 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return null;
}
