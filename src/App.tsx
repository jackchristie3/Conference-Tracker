import { useMemo, useState } from "react";
import { useConference } from "./hooks/useConference";
import { useGistSync } from "./hooks/useGistSync";
import { TieredBoard } from "./components/TieredBoard";
import { CompanyFormModal, type CompanyFormValue } from "./components/CompanyFormModal";
import { ImportWizard } from "./components/ImportWizard";
import { SuggestedAddsPanel } from "./components/SuggestedAddsPanel";
import { FlaggedPanel } from "./components/FlaggedPanel";
import { ExportPanel } from "./components/ExportPanel";
import { SyncPanel } from "./components/SyncPanel";
import { ConferenceSwitcher } from "./components/ConferenceSwitcher";
import type { Company } from "./types";

type Tab = "priority" | "quick-apply" | "flagged" | "suggested";

const EMPTY_COMPANIES: Company[] = [];

export default function App() {
  const conf = useConference();
  const sync = useGistSync(conf);
  const [tab, setTab] = useState<Tab>("priority");
  const [formTarget, setFormTarget] = useState<Company | "new" | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showSync, setShowSync] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [search, setSearch] = useState("");

  const companies = conf.active?.companies ?? EMPTY_COMPANIES;
  const suggestedAdds = conf.active?.suggestedAdds ?? [];
  const query = search.trim().toLowerCase();
  const visibleCompanies = query
    ? companies.filter(
        (c) => c.name.toLowerCase().includes(query) || c.industry.toLowerCase().includes(query),
      )
    : companies;

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
      preBoothNotes: value.preBoothNotes,
      postBoothNotes: value.postBoothNotes,
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

  const isFirstRun = counts.total === 0;

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col pb-24 lg:max-w-6xl">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSwitcher(true)}
            className="min-w-0 flex-1 truncate text-left text-lg font-bold text-slate-100"
            title="Switch conference"
          >
            {conf.active?.name ?? ""} <span className="text-sm font-normal text-slate-500">▾</span>
          </button>
        </div>
        <div className="mt-2 flex gap-2 overflow-x-auto">
          <HeaderButton onClick={() => setShowSync(true)} icon="⇅" label="Sync" />
          <HeaderButton onClick={() => setShowExport(true)} icon="⇩" label="Export" />
          <HeaderButton onClick={() => setShowImport(true)} icon="⇧" label="Import" />
        </div>
        {!isFirstRun && (
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies…"
            className="input mt-2"
            aria-label="Search companies"
          />
        )}
        <p className="mt-1 text-xs text-slate-500">
          {counts.total} companies · {counts.applied} applied · {counts.flagged} unconfirmed
        </p>
      </header>

      <main className="flex-1 px-4 py-4">
        {isFirstRun ? (
          <FirstRunEmptyState onImport={() => setShowImport(true)} onAdd={() => setFormTarget("new")} />
        ) : (
          <>
            {(tab === "priority" || tab === "quick-apply") && (
              <TieredBoard
                companies={visibleCompanies}
                activeTab={tab}
                draggable={!query}
                onToggleStatus={handleToggleStatus}
                onEdit={(c) => setFormTarget(c)}
                onReorderTier={(tierKey, ids) => conf.reorderTier(tierKey, ids)}
                onMoveToPosition={(id, tierKey, index) => conf.moveTierToPosition(id, tierKey, index)}
                emptyState={query ? <NoMatches /> : undefined}
              />
            )}
            {tab === "flagged" && (
              <FlaggedPanel companies={visibleCompanies} onEdit={(c) => setFormTarget(c)} />
            )}
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
          </>
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
          onRestore={(backup) => {
            conf.replaceActiveData({
              name: backup.name,
              companies: backup.companies,
              suggestedAdds: backup.suggestedAdds,
            });
            setShowImport(false);
            setTab("priority");
          }}
          onClose={() => setShowImport(false)}
        />
      )}

      {showExport && conf.active && (
        <ExportPanel conference={conf.active} onClose={() => setShowExport(false)} />
      )}

      {showSync && <SyncPanel sync={sync} onClose={() => setShowSync(false)} />}

      {showSwitcher && (
        <ConferenceSwitcher
          conferences={conf.conferences}
          activeId={conf.active?.id}
          onSwitch={(id) => void conf.switchConference(id)}
          onCreate={(name) => void conf.createNewConference(name)}
          onDelete={(id) => void conf.deleteConference(id)}
          onRename={(name) => conf.renameConference(name)}
          onClose={() => setShowSwitcher(false)}
        />
      )}
    </div>
  );
}

function HeaderButton({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full bg-slate-800 px-3 text-sm font-medium text-slate-200"
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </button>
  );
}

function FirstRunEmptyState({ onImport, onAdd }: { onImport: () => void; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-700 px-6 py-16 text-center">
      <p className="text-lg font-semibold text-slate-100">Let's get your list in</p>
      <p className="max-w-xs text-sm text-slate-400">
        Import your target list and the conference's exhibitor list to get started, or add
        companies one at a time.
      </p>
      <button
        type="button"
        onClick={onImport}
        className="min-h-[44px] rounded-xl bg-emerald-600 px-6 font-semibold text-white"
      >
        Import your lists
      </button>
      <button type="button" onClick={onAdd} className="text-sm text-slate-400 underline-offset-2 hover:underline">
        or add a company manually
      </button>
    </div>
  );
}

function NoMatches() {
  return (
    <p className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-500">
      No companies match your search.
    </p>
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
