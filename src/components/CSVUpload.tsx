"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function CSVUpload() {
  const [state, setState] = useState<"idle" | "uploading" | "resetting" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [showFormat, setShowFormat] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      setMessage("Please upload a .csv file.");
      setState("error");
      return;
    }

    setState("uploading");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload-csv", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setMessage(`${data.count} contacts loaded successfully.`);
      setState("done");
      router.refresh();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Upload failed");
      setState("error");
    }
  }

  async function handleReset() {
    setState("resetting");
    try {
      const res = await fetch("/api/reset-contacts", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Reset failed");
      setMessage(`Restored ${data.count} original contacts.`);
      setState("done");
      router.refresh();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Reset failed");
      setState("error");
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  const isLoading = state === "uploading" || state === "resetting";

  return (
    <div className="space-y-3">
      {/* Upload area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !isLoading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
          isLoading
            ? "border-gray-100 bg-gray-50 cursor-default"
            : "border-gray-200 cursor-pointer hover:border-gray-300 hover:bg-gray-50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleChange}
        />

        {state === "idle" && (
          <>
            <p className="text-sm text-gray-500">Drop a CSV file here or click to browse</p>
            <button
              onClick={(e) => { e.stopPropagation(); setShowFormat(!showFormat); }}
              className="text-xs text-blue-500 hover:text-blue-700 mt-1 underline"
            >
              {showFormat ? "Hide" : "Show"} required format
            </button>
          </>
        )}

        {(state === "uploading" || state === "resetting") && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            {state === "resetting" ? "Restoring original…" : "Uploading…"}
          </div>
        )}

        {state === "done" && (
          <p className="text-sm text-green-600 font-medium">{message}</p>
        )}

        {state === "error" && (
          <p className="text-sm text-red-600">{message}</p>
        )}
      </div>

      {/* Required format info */}
      {showFormat && state === "idle" && (
        <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 text-xs text-blue-800 space-y-2">
          <p className="font-medium">Your CSV must have exactly these column headers (in any order):</p>
          <code className="block bg-white border border-blue-100 rounded p-2 text-xs leading-5">
            Day, Assigned To, First Name, Last Name, Organization, Email Address, LinkedIn URL, Status
          </code>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li><strong>Day</strong> — e.g. <code>Tue May 6</code></li>
            <li><strong>Assigned To</strong> — must match the sender&apos;s Google display name</li>
            <li><strong>Status</strong> — <code>Not Started</code> or <code>DONE</code></li>
            <li><strong>Email Address</strong> — must contain @</li>
          </ul>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        {(state === "done" || state === "error") && (
          <button
            onClick={() => { setState("idle"); setMessage(""); }}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Upload another
          </button>
        )}
        <button
          onClick={handleReset}
          disabled={isLoading}
          className="text-xs text-gray-400 hover:text-gray-600 underline disabled:opacity-40"
        >
          Reset to original Noah Labs list
        </button>
      </div>
    </div>
  );
}
