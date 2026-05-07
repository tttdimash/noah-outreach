"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SendOneButton({ contactId }: { contactId: number }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const router = useRouter();

  async function handleSend() {
    setState("sending");
    try {
      const res = await fetch("/api/send-one", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
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
        onClick={handleSend}
        className="mt-4 rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700 transition-colors"
      >
        Send this email
      </button>
    );
  }

  if (state === "sending") {
    return (
      <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Sending…
      </div>
    );
  }

  if (state === "done") {
    return (
      <p className="mt-4 text-sm text-green-600 font-medium">Sent!</p>
    );
  }

  return (
    <div className="mt-4 flex items-center gap-2">
      <p className="text-sm text-red-600">Failed to send.</p>
      <button
        onClick={() => setState("idle")}
        className="text-sm text-gray-500 underline"
      >
        Retry
      </button>
    </div>
  );
}
