import { useState } from "react";
import { parseSpreadsheet, type ParsedSheet } from "../import/fileParser";
import { guessColumnMapping, type FieldKey } from "../import/columnMapping";
import { reconcile, rowsToExhibitors, rowsToTargets } from "../import/reconcile";
import { applyHeuristicRanks } from "../utils/ranking";
import type { Company, SuggestedAdd } from "../types";

interface Props {
  onImport: (companies: Company[], suggestedAdds: SuggestedAdd[]) => void;
  onClose: () => void;
}

interface SheetState {
  file?: File;
  sheet?: ParsedSheet;
  mapping: Partial<Record<FieldKey, string>>;
  error?: string;
}

const EXHIBITOR_FIELDS: { key: FieldKey; label: string; required?: boolean }[] = [
  { key: "name", label: "Company name", required: true },
  { key: "booth", label: "Booth number" },
];

const TARGET_FIELDS: { key: FieldKey; label: string; required?: boolean }[] = [
  { key: "name", label: "Company name", required: true },
  { key: "industry", label: "Industry" },
  { key: "notes", label: "Notes / sector fit" },
  { key: "priority", label: "Priority flag" },
  { key: "interested", label: "Interested" },
  { key: "jobPosting", label: "Internship posting confirmed" },
  { key: "jobsCount", label: "Jobs on board (count)" },
  { key: "applyUrl", label: "Application / talent-pipeline link" },
  { key: "newsHeadline", label: "News headline" },
  { key: "newsUrl", label: "News link" },
];

async function loadSheet(file: File): Promise<{ sheet?: ParsedSheet; error?: string }> {
  try {
    const sheet = await parseSpreadsheet(file);
    if (sheet.rows.length === 0) return { error: "No rows found in that file." };
    return { sheet };
  } catch {
    return { error: "Couldn't read that file. Try exporting as .xlsx or .csv." };
  }
}

export function ImportWizard({ onImport, onClose }: Props) {
  const [exhibitors, setExhibitors] = useState<SheetState>({ mapping: {} });
  const [targets, setTargets] = useState<SheetState>({ mapping: {} });
  const [step, setStep] = useState<"upload" | "review">("upload");

  async function handleFile(kind: "exhibitors" | "targets", file: File) {
    const { sheet, error } = await loadSheet(file);
    const mapping = sheet ? guessColumnMapping(sheet.headers) : {};
    const next: SheetState = { file, sheet, mapping, error };
    if (kind === "exhibitors") setExhibitors(next);
    else setTargets(next);
  }

  const canReview = Boolean(targets.sheet && targets.mapping.name);

  function runReconcile() {
    const exhibitorRecords = exhibitors.sheet
      ? rowsToExhibitors(exhibitors.sheet.rows, exhibitors.mapping)
      : [];
    const targetRecords = targets.sheet ? rowsToTargets(targets.sheet.rows, targets.mapping) : [];
    const { companies, unmatchedExhibitors } = reconcile(exhibitorRecords, targetRecords);
    const ranked = applyHeuristicRanks(companies);
    onImport(
      ranked,
      unmatchedExhibitors.map((e) => ({ name: e.name, booth: e.booth })),
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-slate-900 p-4 shadow-xl sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100">Import lists</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-300"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {step === "upload" && (
          <div className="space-y-6">
            <SheetUpload
              title="Your target list"
              hint="Company, industry, notes, priority flag, application link, etc."
              state={targets}
              fields={TARGET_FIELDS}
              onFile={(f) => void handleFile("targets", f)}
              onMappingChange={(k, v) =>
                setTargets((prev) => ({ ...prev, mapping: { ...prev.mapping, [k]: v } }))
              }
            />
            <SheetUpload
              title="Official exhibitor list"
              hint="Company name + booth number, from the conference organizer."
              state={exhibitors}
              fields={EXHIBITOR_FIELDS}
              onFile={(f) => void handleFile("exhibitors", f)}
              onMappingChange={(k, v) =>
                setExhibitors((prev) => ({ ...prev, mapping: { ...prev.mapping, [k]: v } }))
              }
            />
            <p className="text-xs text-slate-500">
              Only the target list is required. Add the exhibitor list too so companies get their
              booth number and unconfirmed ones get flagged.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] flex-1 rounded-xl bg-slate-800 font-medium text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!canReview}
                onClick={() => setStep("review")}
                className="min-h-[44px] flex-1 rounded-xl bg-emerald-600 font-semibold text-white disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === "review" && (
          <ReviewStep
            exhibitorCount={
              exhibitors.sheet ? rowsToExhibitors(exhibitors.sheet.rows, exhibitors.mapping).length : 0
            }
            targetCount={targets.sheet ? rowsToTargets(targets.sheet.rows, targets.mapping).length : 0}
            onBack={() => setStep("upload")}
            onConfirm={runReconcile}
          />
        )}
      </div>
    </div>
  );
}

function SheetUpload({
  title,
  hint,
  state,
  fields,
  onFile,
  onMappingChange,
}: {
  title: string;
  hint: string;
  state: SheetState;
  fields: { key: FieldKey; label: string; required?: boolean }[];
  onFile: (file: File) => void;
  onMappingChange: (key: FieldKey, value: string) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-700 p-3">
      <h3 className="font-semibold text-slate-100">{title}</h3>
      <p className="mb-2 text-xs text-slate-400">{hint}</p>
      <input
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
        className="block w-full text-sm text-slate-300 file:mr-3 file:min-h-[40px] file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:text-sm file:font-medium file:text-slate-100"
      />
      {state.error && <p className="mt-2 text-sm text-red-400">{state.error}</p>}
      {state.sheet && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-slate-500">
            {state.sheet.rows.length} rows found. Confirm column mapping:
          </p>
          {fields.map((f) => (
            <div key={f.key} className="flex items-center gap-2 text-sm">
              <span className="w-40 shrink-0 text-slate-400">
                {f.label}
                {f.required && "*"}
              </span>
              <select
                className="input"
                value={state.mapping[f.key] ?? ""}
                onChange={(e) => onMappingChange(f.key, e.target.value)}
              >
                <option value="">— none —</option>
                {state.sheet!.headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewStep({
  exhibitorCount,
  targetCount,
  onBack,
  onConfirm,
}: {
  exhibitorCount: number;
  targetCount: number;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-800/60 p-4 text-sm text-slate-300">
        <p>
          Ready to import <span className="font-semibold text-slate-100">{targetCount}</span>{" "}
          target companies
          {exhibitorCount > 0 && (
            <>
              {" "}
              cross-referenced against{" "}
              <span className="font-semibold text-slate-100">{exhibitorCount}</span> exhibitors
            </>
          )}
          .
        </p>
        <p className="mt-2 text-slate-400">
          They'll be pre-sorted (sector fit &gt; priority flag &gt; confirmed posting &gt; jobs on
          board) and split into Priority / Quick Apply by your priority flag — fully reorderable
          afterward. Targets not found on the exhibitor list will be flagged "no confirmed booth."
          Exhibitors not on your target list will show up under Suggested Adds for you to review.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] flex-1 rounded-xl bg-slate-800 font-medium text-slate-200"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="min-h-[44px] flex-1 rounded-xl bg-emerald-600 font-semibold text-white"
        >
          Import
        </button>
      </div>
    </div>
  );
}
