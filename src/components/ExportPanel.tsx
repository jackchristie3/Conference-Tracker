import { useState } from "react";
import type { Conference } from "../types";

interface Props {
  conference: Conference;
  onClose: () => void;
}

function toPlainText(conference: Conference): string {
  const lines: string[] = [`${conference.name}`, ""];
  const tiers: { key: "priority" | "quick-apply"; label: string }[] = [
    { key: "priority", label: "PRIORITY" },
    { key: "quick-apply", label: "QUICK APPLY" },
  ];
  for (const tier of tiers) {
    const list = conference.companies
      .filter((c) => c.tier === tier.key)
      .sort((a, b) => a.rank - b.rank);
    if (list.length === 0) continue;
    lines.push(`## ${tier.label}`);
    for (const c of list) {
      const status = [
        c.status.applied ? "applied" : null,
        c.status.newsRead ? "news read" : null,
        c.status.talkedAtBooth ? "talked" : null,
      ]
        .filter(Boolean)
        .join(", ");
      const booth = c.flaggedNoBooth ? "no confirmed booth" : c.booth ? `booth ${c.booth}` : "";
      lines.push(`- ${c.name}${booth ? ` (${booth})` : ""}${status ? ` — ${status}` : ""}`);
      if (c.applyUrl) lines.push(`  apply: ${c.applyUrl}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportPanel({ conference, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(toPlainText(conference));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-slate-900 p-4 shadow-xl sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100">Export / share</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-300"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={copySummary}
            className="min-h-[44px] w-full rounded-xl bg-slate-800 font-medium text-slate-100"
          >
            {copied ? "Copied!" : "Copy read-only summary to clipboard"}
          </button>
          <button
            type="button"
            onClick={() =>
              downloadFile(
                `${conference.name.replace(/\s+/g, "-").toLowerCase()}.json`,
                JSON.stringify(conference, null, 2),
                "application/json",
              )
            }
            className="min-h-[44px] w-full rounded-xl bg-slate-800 font-medium text-slate-100"
          >
            Download backup (.json)
          </button>
          <button
            type="button"
            onClick={() =>
              downloadFile(
                `${conference.name.replace(/\s+/g, "-").toLowerCase()}.txt`,
                toPlainText(conference),
                "text/plain",
              )
            }
            className="min-h-[44px] w-full rounded-xl bg-slate-800 font-medium text-slate-100"
          >
            Download summary (.txt)
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          This tool stores everything on this device only — export is the way to back up or send
          your list to someone else.
        </p>
      </div>
    </div>
  );
}
