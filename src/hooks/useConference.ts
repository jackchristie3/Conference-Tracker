import { useCallback, useEffect, useRef, useState } from "react";
import type { Company, Conference, SuggestedAdd, Tier } from "../types";
import { newCompany } from "../types";
import {
  getActiveConferenceId,
  loadAllConferences,
  saveConference,
  setActiveConferenceId,
  deleteConference as deleteConferenceFromDb,
} from "../storage";

function createConference(name: string): Conference {
  const now = Date.now();
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `conf_${now}`,
    name,
    createdAt: now,
    updatedAt: now,
    companies: [],
  };
}

export function useConference() {
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const all = await loadAllConferences();
      let active = await getActiveConferenceId();
      let list = all;
      if (list.length === 0) {
        const fresh = createConference("My Conference");
        list = [fresh];
        await saveConference(fresh);
        active = fresh.id;
        await setActiveConferenceId(active);
      } else if (!active || !list.some((c) => c.id === active)) {
        active = list[0].id;
        await setActiveConferenceId(active);
      }
      setConferences(list);
      setActiveId(active);
      setLoaded(true);
    })();
  }, []);

  const active = conferences.find((c) => c.id === activeId);

  const scheduleSave = useCallback((conference: Conference) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveConference(conference);
    }, 150);
  }, []);

  // Always derives the next conference from the latest state (via the setState
  // updater), not from a possibly-stale `active` closed over earlier in the same
  // tick — multiple updates fired back-to-back (e.g. import + suggested-adds)
  // would otherwise clobber each other.
  const updateActive = useCallback(
    (fn: (conf: Conference) => Conference) => {
      setConferences((prev) => {
        const current = prev.find((c) => c.id === activeId);
        if (!current) return prev;
        const next = fn(current);
        next.updatedAt = Date.now();
        scheduleSave(next);
        return prev.map((c) => (c.id === next.id ? next : c));
      });
    },
    [activeId, scheduleSave],
  );

  const addCompany = useCallback(
    (partial: Partial<Company> & { name: string }) => {
      updateActive((conf) => {
        const tierCompanies = conf.companies.filter((c) => c.tier === (partial.tier ?? "quick-apply"));
        const company = newCompany({ ...partial, rank: tierCompanies.length });
        return { ...conf, companies: [...conf.companies, company] };
      });
    },
    [updateActive],
  );

  const addCompanies = useCallback(
    (companies: Company[]) => {
      updateActive((conf) => {
        const rankOffsets: Record<string, number> = {};
        for (const c of conf.companies) {
          rankOffsets[c.tier] = Math.max(rankOffsets[c.tier] ?? -1, c.rank) + 1;
        }
        const withRanks = companies.map((c) => {
          const offset = rankOffsets[c.tier] ?? 0;
          rankOffsets[c.tier] = offset + 1;
          return { ...c, rank: offset };
        });
        return { ...conf, companies: [...conf.companies, ...withRanks] };
      });
    },
    [updateActive],
  );

  const updateCompany = useCallback(
    (id: string, patch: Partial<Company>) => {
      updateActive((conf) => ({
        ...conf,
        companies: conf.companies.map((c) =>
          c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c,
        ),
      }));
    },
    [updateActive],
  );

  const removeCompany = useCallback(
    (id: string) => {
      updateActive((conf) => ({
        ...conf,
        companies: conf.companies.filter((c) => c.id !== id),
      }));
    },
    [updateActive],
  );

  const reorderTier = useCallback(
    (tier: Tier, orderedIds: string[]) => {
      updateActive((conf) => {
        const rankById = new Map(orderedIds.map((id, i) => [id, i]));
        return {
          ...conf,
          companies: conf.companies.map((c) =>
            c.tier === tier && rankById.has(c.id)
              ? { ...c, rank: rankById.get(c.id)! }
              : c,
          ),
        };
      });
    },
    [updateActive],
  );

  const moveTier = useCallback(
    (id: string, tier: Tier) => {
      updateActive((conf) => {
        const tierCompanies = conf.companies.filter((c) => c.tier === tier && c.id !== id);
        return {
          ...conf,
          companies: conf.companies.map((c) =>
            c.id === id ? { ...c, tier, rank: tierCompanies.length, updatedAt: Date.now() } : c,
          ),
        };
      });
    },
    [updateActive],
  );

  const setSuggestedAdds = useCallback(
    (adds: SuggestedAdd[]) => {
      updateActive((conf) => ({ ...conf, suggestedAdds: adds }));
    },
    [updateActive],
  );

  const dismissSuggestedAdd = useCallback(
    (name: string) => {
      updateActive((conf) => ({
        ...conf,
        suggestedAdds: (conf.suggestedAdds ?? []).filter((s) => s.name !== name),
      }));
    },
    [updateActive],
  );

  const renameConference = useCallback(
    (name: string) => {
      updateActive((conf) => ({ ...conf, name }));
    },
    [updateActive],
  );

  const switchConference = useCallback(async (id: string) => {
    setActiveId(id);
    await setActiveConferenceId(id);
  }, []);

  const createNewConference = useCallback(async (name: string) => {
    const fresh = createConference(name);
    await saveConference(fresh);
    setConferences((prev) => [fresh, ...prev]);
    setActiveId(fresh.id);
    await setActiveConferenceId(fresh.id);
  }, []);

  const deleteConference = useCallback(
    async (id: string) => {
      await deleteConferenceFromDb(id);
      setConferences((prev) => {
        const next = prev.filter((c) => c.id !== id);
        if (activeId === id && next.length > 0) {
          setActiveId(next[0].id);
          void setActiveConferenceId(next[0].id);
        }
        return next;
      });
    },
    [activeId],
  );

  return {
    loaded,
    conferences,
    active,
    addCompany,
    addCompanies,
    updateCompany,
    removeCompany,
    reorderTier,
    moveTier,
    setSuggestedAdds,
    dismissSuggestedAdd,
    renameConference,
    switchConference,
    createNewConference,
    deleteConference,
  };
}

export type UseConference = ReturnType<typeof useConference>;
