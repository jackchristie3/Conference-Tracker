import { useState } from "react";
import type { Conference } from "../types";

interface Props {
  conferences: Conference[];
  activeId: string | undefined;
  onSwitch: (id: string) => void;
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
  onRename: (name: string) => void;
  onReset: () => void;
  onClose: () => void;
}

export function ConferenceSwitcher({
  conferences,
  activeId,
  onSwitch,
  onCreate,
  onDelete,
  onRename,
  onReset,
  onClose,
}: Props) {
  const [newName, setNewName] = useState("");
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | undefined>(undefined);
  const [resetting, setResetting] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-slate-900 p-4 shadow-xl sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100">Conferences</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-300"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {conferences.map((c) => (
            <div
              key={c.id}
              className={`flex items-center gap-2 rounded-xl border p-3 ${
                c.id === activeId
                  ? "border-emerald-600 bg-emerald-500/10"
                  : "border-slate-700 bg-slate-800/60"
              }`}
            >
              {c.id === activeId ? (
                <div className="min-w-0 flex-1">
                  <input
                    className="w-full truncate bg-transparent font-medium text-slate-100 focus:outline-none"
                    value={c.name}
                    onChange={(e) => onRename(e.target.value)}
                    aria-label="Rename this conference"
                  />
                  <p className="text-xs text-slate-400">
                    {c.companies.length} companies · this one — updated{" "}
                    {new Date(c.updatedAt).toLocaleDateString()}
                  </p>
                  {c.companies.length > 0 &&
                    (resetting ? (
                      <div className="mt-3 rounded-lg border border-red-800 bg-red-950/30 p-2">
                        <p className="text-xs text-red-300">
                          Permanently deletes all {c.companies.length} companies in "{c.name}" (the
                          conference itself stays). Type <span className="font-mono">RESET</span>{" "}
                          to confirm.
                        </p>
                        <input
                          className="input mt-2"
                          value={resetConfirmText}
                          onChange={(e) => setResetConfirmText(e.target.value)}
                          placeholder="RESET"
                          autoFocus
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setResetting(false);
                              setResetConfirmText("");
                            }}
                            className="min-h-[36px] flex-1 rounded-lg bg-slate-700 text-xs text-slate-200"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={resetConfirmText.trim().toUpperCase() !== "RESET"}
                            onClick={() => {
                              onReset();
                              setResetting(false);
                              setResetConfirmText("");
                            }}
                            className="min-h-[36px] flex-1 rounded-lg bg-red-600 text-xs font-semibold text-white disabled:opacity-40"
                          >
                            Permanently reset
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setResetting(true)}
                        className="mt-1 text-xs text-red-400 underline-offset-2 hover:underline"
                      >
                        Reset company data…
                      </button>
                    ))}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onSwitch(c.id);
                    onClose();
                  }}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate font-medium text-slate-100">{c.name}</p>
                  <p className="text-xs text-slate-400">
                    {c.companies.length} companies · updated{" "}
                    {new Date(c.updatedAt).toLocaleDateString()}
                  </p>
                </button>
              )}
              {conferences.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirmingDeleteId === c.id) {
                      onDelete(c.id);
                      setConfirmingDeleteId(undefined);
                    } else {
                      setConfirmingDeleteId(c.id);
                    }
                  }}
                  onBlur={() => setConfirmingDeleteId(undefined)}
                  className={`min-h-[36px] shrink-0 rounded-lg px-3 text-xs ${
                    confirmingDeleteId === c.id
                      ? "bg-red-600 font-semibold text-white"
                      : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {confirmingDeleteId === c.id ? "Confirm?" : "Delete"}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2 border-t border-slate-800 pt-4">
          <input
            className="input"
            placeholder="New conference name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button
            type="button"
            disabled={!newName.trim()}
            onClick={() => {
              onCreate(newName.trim());
              setNewName("");
              onClose();
            }}
            className="min-h-[44px] shrink-0 rounded-xl bg-emerald-600 px-4 font-semibold text-white disabled:opacity-40"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
