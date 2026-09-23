import { useMemo, useState } from "react";
import { useConference } from "./hooks/useConference";
import { TierSection } from "./components/TierSection";
import { CompanyFormModal, type CompanyFormValue } from "./components/CompanyFormModal";
import { ImportWizard } from "./components/ImportWizard";
import { SuggestedAddsPanel } from "./components/SuggestedAddsPanel";
import { FlaggedPanel } from "./components/FlaggedPanel";
import { ExportPanel } from "./components/ExportPanel";
import type { Company } from "./types";

type Tab = "priority" | "quick-apply" | "flagged" | "suggested";

const EMPTY_COMPANIES: Company[] = [];

export default function App() {
  const conf = useConference();
  const [tab, setTab] = useState<Tab>("priority");
  const [formTarget, setFormTarget] = useState<Company | "new" | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const companies = conf.active?.companies ?? EMPTY_COMPANIES;
  const suggestedAdds = conf.active?.suggestedAdds ?? [];

  const counts = useMemo(() => {
    const priority = companies.filter((c) => c.tier === "priority").length;
    const quickApply = companies.filter((c) => c.tier === "quick-apply").length;
    const flagged = companies.filter((c) => c.flaggedNoBooth).length;
    const applied = companies.filter((c) => c.status.applied).length;
    return { priority, quickApply, flagged, applied, total: companies.length };
  }, [companies]);

  if (!conf.loaded) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-400">Loading…</div>
    );
  }

  function handleToggleStatus(id: string, key: keyof Company["status"]) {
    const company = companies.find((c) => c.id === id);
    if (!company) return;
    conf.updateCompany(id, { status: { ...company.status, [key]: !company.status[key] } });
  }

  function handleMoveTier(id: string) {
    const company = companies.find((c) => c.id === id);
    if (!company) return;
    conf.moveTier(id, company.tier === "priority" ? "quick-apply" : "priority");
  }

  function handleSaveForm(value: CompanyFormValue) {
    const patch = {
      name: value.name,
      booth: value.booth,
      tier: value.tier,
      industry: value.industry,
      sectorFitNote: value.sectorFitNote,
      applyUrl: value.applyUrl,
      news:
        value.newsHeadline || value.newsUrl
          ? { headline: value.newsHeadline, url: value.newsUrl }
          : undefined,
      notes: value.notes,
      priorityFlag: value.priorityFlag,
      flaggedNoBooth: value.flaggedNoBooth,
    };
    if (formTarget && formTarget !== "new") {
      conf.updateCompany(formTarget.id, patch);
    } else {
      conf.addCompany(patch);
    }
    setFormTarget(null);
    if (value.tier === "priority" || value.tier === "quick-apply") {
      setTab(value.tier);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col pb-24 lg:max-w-6xl">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <input
            className="min-w-0 flex-1 truncate bg-transparent text-lg font-bold text-slate-100 focus:outline-none"
            value={conf.active?.name ?? ""}
            onChange={(e) => conf.renameConference(e.target.value)}
            aria-label="Conference name"
          />
          <button
            type="button"
            onClick={() => setShowExport(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-300"
            aria-label="Export"
            title="Export"
          >
            ⇩
          </button>
          <button
            type="button"
            onClick={() => setShowImport(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-300"
            aria-label="Import"
            title="Import"
          >
            ⇧
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {counts.total} companies · {counts.applied} applied · {counts.flagged} unconfirmed
        </p>
      </header>

      <main className="flex-1 px-4 py-4">
        {(tab === "priority" || tab === "quick-apply") && (
          <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
            <div className={tab === "priority" ? "block" : "hidden lg:block"}>
              <TierSection
                title="Priority — deep focus"
                description="Researched and ranked. Drag to reorder."
                companies={companies.filter((c) => c.tier === "priority")}
                onReorder={(ids) => conf.reorderTier("priority", ids)}
                onToggleStatus={handleToggleStatus}
                onEdit={(c) => setFormTarget(c)}
              />
            </div>
            <div className={tab === "quick-apply" ? "block" : "hidden lg:block"}>
              <TierSection
                title="Quick apply"
                description="Grab the link, apply, move on."
                companies={companies.filter((c) => c.tier === "quick-apply")}
                onReorder={(ids) => conf.reorderTier("quick-apply", ids)}
                onToggleStatus={handleToggleStatus}
                onEdit={(c) => setFormTarget(c)}
              />
            </div>
          </div>
        )}
        {tab === "flagged" && <FlaggedPanel companies={companies} onEdit={(c) => setFormTarget(c)} />}
        {tab === "suggested" && (
          <SuggestedAddsPanel
            suggestions={suggestedAdds}
            onAdd={(s) => {
              conf.addCompany({ name: s.name, booth: s.booth, tier: "quick-apply" });
              conf.dismissSuggestedAdd(s.name);
            }}
            onDismiss={(name) => conf.dismissSuggestedAdd(name)}
          />
        )}
      </main>

      <button
        type="button"
        onClick={() => setFormTarget("new")}
        className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-2xl font-bold text-white shadow-lg"
        aria-label="Add company"
      >
        +
      </button>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-800 bg-slate-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-3xl">
          <TabButton active={tab === "priority"} onClick={() => setTab("priority")}>
            Priority
            <Badge count={counts.priority} />
          </TabButton>
          <TabButton active={tab === "quick-apply"} onClick={() => setTab("quick-apply")}>
            Quick apply
            <Badge count={counts.quickApply} />
          </TabButton>
          <TabButton active={tab === "flagged"} onClick={() => setTab("flagged")}>
            Flagged
            <Badge count={counts.flagged} />
          </TabButton>
          <TabButton active={tab === "suggested"} onClick={() => setTab("suggested")}>
            Suggested
            <Badge count={suggestedAdds.length} />
          </TabButton>
        </div>
      </nav>

      {formTarget && (
        <CompanyFormModal
          initial={formTarget === "new" ? undefined : formTarget}
          defaultTier={tab === "priority" || tab === "quick-apply" ? tab : undefined}
          onSave={handleSaveForm}
          onClose={() => setFormTarget(null)}
          onRemove={
            formTarget !== "new"
              ? () => {
                  conf.removeCompany(formTarget.id);
                  setFormTarget(null);
                }
              : undefined
          }
          onMoveTier={
            formTarget !== "new"
              ? () => {
                  handleMoveTier(formTarget.id);
                  setFormTarget(null);
                }
              : undefined
          }
        />
      )}

      {showImport && (
        <ImportWizard
          onImport={(imported, newSuggestions) => {
            conf.addCompanies(imported);
            conf.setSuggestedAdds([...suggestedAdds, ...newSuggestions]);
            setShowImport(false);
            setTab("priority");
          }}
          onClose={() => setShowImport(false)}
        />
      )}

      {showExport && conf.active && (
        <ExportPanel conference={conf.active} onClose={() => setShowExport(false)} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
        active ? "text-emerald-400" : "text-slate-400"
      }`}
    >
      {children}
    </button>
  );
}

function Badge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="rounded-full bg-slate-700 px-1.5 text-[10px] leading-4 text-slate-200">
      {count}
    </span>
  );
}
