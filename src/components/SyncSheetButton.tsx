"use client";

import { useState } from "react";

export default function SyncSheetButton() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSync() {
    setState("loading");
    try {
      const res = await fetch("/api/sync-sheet", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Failed to sync");
        setState("error");
      } else {
        setMessage(`Synced — ${data.updated} contacts updated`);
        setState("done");
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch {
      setMessage("Network error");
      setState("error");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleSync}
        disabled={state === "loading"}
        className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
      >
        {state === "loading" ? "Syncing…" : "Sync from Sheet"}
      </button>
      {message && (
        <span className={`text-xs ${state === "error" ? "text-red-500" : "text-green-600"}`}>
          {message}
        </span>
      )}
    </div>
  );
}
