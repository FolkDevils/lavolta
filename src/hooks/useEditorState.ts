"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  applyBackLayoutDefaults,
  applyFrontLayoutDefaults,
  backLayoutForOrientation,
  buildBackByPersonIdFromSaved,
  buildFrontByPersonIdFromSaved,
  DEFAULT_PEOPLE,
  defaultBackForPerson,
  defaultFrontForPerson,
  frontLayoutForOrientation,
  getCardDims,
  migrateRawBack,
  migrateRawFront,
  normalizeFrontFontScalesForLayout,
  normalizePerson,
  STORAGE_KEY,
} from "@/lib/constants";
import {
  buildPersonSettingsPayload,
  parsePersonSettingsFile,
  personSettingsDownloadBasename,
} from "@/lib/personSettingsFile";
import type { BackState, FrontState, Orientation, Person } from "@/lib/types";
import { useExport } from "./useExport";

/* ── Saved shape in localStorage ─────────────────────────────────── */
type Saved = {
  people: Person[];
  front?: FrontState;
  frontByPersonId?: Record<number, FrontState>;
  back?: BackState;
  backByPersonId?: Record<number, BackState>;
  selectedId: number | undefined;
};

function initialFrontMap(): Record<number, FrontState> {
  const m: Record<number, FrontState> = {};
  for (const p of DEFAULT_PEOPLE) {
    m[p.id] = JSON.parse(JSON.stringify(defaultFrontForPerson(p.id))) as FrontState;
  }
  return m;
}

function initialBackMap(): Record<number, BackState> {
  const m: Record<number, BackState> = {};
  for (const p of DEFAULT_PEOPLE) {
    m[p.id] = JSON.parse(JSON.stringify(defaultBackForPerson(p.id))) as BackState;
  }
  return m;
}

/* ── Hook ─────────────────────────────────────────────────────────── */
export function useEditorState() {
  const [people, setPeople] = useState<Person[]>(DEFAULT_PEOPLE);
  const [frontByPersonId, setFrontByPersonId] = useState<Record<number, FrontState>>(initialFrontMap);
  const [backByPersonId, setBackByPersonId] = useState<Record<number, BackState>>(initialBackMap);
  const [selectedId, setSelectedId] = useState<number | undefined>(DEFAULT_PEOPLE[0]?.id);
  const [hydrated, setHydrated] = useState(false);
  const [peopleListKey, setPeopleListKey] = useState(0);

  /* ── Derived ──────────────────────────────────────────────────── */
  const selectedPersonId = useMemo(
    () => selectedId ?? people[0]?.id ?? 1,
    [selectedId, people],
  );

  const person = useMemo(
    () => people.find((p) => p.id === selectedId) ?? people[0],
    [people, selectedId],
  );

  const factoryFront = useMemo(
    () => defaultFrontForPerson(selectedPersonId),
    [selectedPersonId],
  );

  const front = useMemo(
    () => frontByPersonId[selectedPersonId] ?? factoryFront,
    [frontByPersonId, selectedPersonId, factoryFront],
  );

  const orientation: Orientation = person?.orientation ?? "landscape";
  const cardDims = useMemo(() => getCardDims(orientation), [orientation]);

  const exportState = useExport(
    person,
    {
      serif: front.fontFamilySerif,
      sans: front.fontFamilySans,
    },
    cardDims,
  );

  const factoryBack = useMemo(
    () => defaultBackForPerson(selectedPersonId),
    [selectedPersonId],
  );

  const back = useMemo(
    () => backByPersonId[selectedPersonId] ?? factoryBack,
    [backByPersonId, selectedPersonId, factoryBack],
  );

  /* ── Patching helpers ─────────────────────────────────────────── */
  const patchSelectedFront = useCallback(
    (fn: (f: FrontState) => FrontState) => {
      const id = selectedId ?? people[0]?.id ?? 1;
      setFrontByPersonId((prev) => ({
        ...prev,
        [id]: fn(prev[id] ?? defaultFrontForPerson(id)),
      }));
    },
    [selectedId, people],
  );

  const updateFront = useCallback(
    (patch: Partial<FrontState>) => {
      const id = selectedId ?? people[0]?.id ?? 1;
      setFrontByPersonId((prev) => ({
        ...prev,
        [id]: { ...(prev[id] ?? defaultFrontForPerson(id)), ...patch },
      }));
    },
    [selectedId, people],
  );

  const patchSelectedBack = useCallback(
    (fn: (b: BackState) => BackState) => {
      const id = selectedId ?? people[0]?.id ?? 1;
      setBackByPersonId((prev) => ({
        ...prev,
        [id]: fn(prev[id] ?? defaultBackForPerson(id)),
      }));
    },
    [selectedId, people],
  );

  const updateBack = useCallback(
    (patch: Partial<BackState>) => {
      const id = selectedId ?? people[0]?.id ?? 1;
      setBackByPersonId((prev) => ({
        ...prev,
        [id]: { ...(prev[id] ?? defaultBackForPerson(id)), ...patch },
      }));
    },
    [selectedId, people],
  );

  /* ── Orientation ──────────────────────────────────────────────── */
  /** Flip the selected person's card orientation and remap front/back layouts
   *  to their portrait/landscape counterparts (geometry resets to that
   *  layout's effective defaults so every layout is self-centered). */
  const setOrientation = useCallback(
    (next: Orientation) => {
      const id = selectedId ?? people[0]?.id ?? 1;
      setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, orientation: next } : p)));
      setFrontByPersonId((prev) => {
        const cur = prev[id] ?? defaultFrontForPerson(id);
        const targetLayout = frontLayoutForOrientation(cur.layout, next);
        if (targetLayout === cur.layout) return prev;
        const remapped = applyFrontLayoutDefaults(cur, targetLayout, id);
        return { ...prev, [id]: normalizeFrontFontScalesForLayout(remapped) };
      });
      setBackByPersonId((prev) => {
        const cur = prev[id] ?? defaultBackForPerson(id);
        const targetLayout = backLayoutForOrientation(cur.layout, next);
        if (targetLayout === cur.layout) return prev;
        return { ...prev, [id]: applyBackLayoutDefaults(cur, targetLayout, id) };
      });
    },
    [selectedId, people],
  );

  /* ── People helpers ───────────────────────────────────────────── */
  const addPerson = useCallback((p: Omit<Person, "id">) => {
    const id = Date.now();
    setPeople((v) => [...v, { ...p, id }]);
    setFrontByPersonId((prev) => ({
      ...prev,
      [id]: JSON.parse(JSON.stringify(defaultFrontForPerson(id))) as FrontState,
    }));
    setBackByPersonId((prev) => ({
      ...prev,
      [id]: JSON.parse(JSON.stringify(defaultBackForPerson(id))) as BackState,
    }));
    setSelectedId(id);
  }, []);

  const updatePerson = useCallback((id: number, patch: Partial<Omit<Person, "id">>) => {
    setPeople((v) => v.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const deletePerson = useCallback(
    (id: number) => {
      setPeople((v) => {
        const next = v.filter((p) => p.id !== id);
        if (selectedId === id) setSelectedId(next[0]?.id);
        return next;
      });
      setFrontByPersonId((prev) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [id]: _omit, ...rest } = prev;
        return rest;
      });
      setBackByPersonId((prev) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [id]: _omit2, ...rest } = prev;
        return rest;
      });
    },
    [selectedId],
  );

  /* ── Persistence — load once ──────────────────────────────────── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<Saved>;
        const peopleList = saved.people?.length
          ? saved.people.map((p) => normalizePerson(p))
          : DEFAULT_PEOPLE;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (saved.people?.length) setPeople(peopleList);
        setFrontByPersonId(buildFrontByPersonIdFromSaved(saved, peopleList));
        setBackByPersonId(buildBackByPersonIdFromSaved(saved, peopleList));
        if (saved.selectedId != null) setSelectedId(saved.selectedId);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  /* ── Persistence — save on change ────────────────────────────── */
  useEffect(() => {
    if (!hydrated) return;
    try {
      const data: Saved = { people, frontByPersonId, backByPersonId, selectedId };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [hydrated, people, frontByPersonId, backByPersonId, selectedId]);

  /* ── Sync font scales to effective px range after layout change ── */
  useEffect(() => {
    if (!hydrated) return;
    const id = selectedPersonId;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFrontByPersonId((prev) => {
      const cur = prev[id] ?? defaultFrontForPerson(id);
      const n = normalizeFrontFontScalesForLayout(cur);
      if (
        n.fontScaleName === cur.fontScaleName &&
        n.fontScaleTitle === cur.fontScaleTitle &&
        n.fontScaleContactLabel === cur.fontScaleContactLabel &&
        n.fontScaleContactValue === cur.fontScaleContactValue
      ) {
        return prev;
      }
      return { ...prev, [id]: n };
    });
  }, [
    hydrated,
    selectedPersonId,
    front.layout,
    front.fontScaleName,
    front.fontScaleTitle,
    front.fontScaleContactLabel,
    front.fontScaleContactValue,
  ]);

  /* ── Per-person settings file (JSON download / import) ─────────── */
  const exportSelectedPersonSettings = useCallback(() => {
    const id = selectedId ?? people[0]?.id;
    if (id == null) return;
    const p = people.find((x) => x.id === id);
    if (!p) return;
    const f = frontByPersonId[id] ?? defaultFrontForPerson(id);
    const b = backByPersonId[id] ?? defaultBackForPerson(id);
    const payload = buildPersonSettingsPayload(p, f, b);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${personSettingsDownloadBasename(p.name)}-lavolta-card-settings.json`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [selectedId, people, frontByPersonId, backByPersonId]);

  const importPersonSettingsFromJson = useCallback(
    (jsonText: string): { ok: true } | { ok: false; error: string } => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonText) as unknown;
      } catch {
        return { ok: false, error: "Invalid JSON — could not parse." };
      }
      const file = parsePersonSettingsFile(parsed);
      if (!file.ok) return file;
      const id = selectedId ?? people[0]?.id ?? 1;
      if (!people.some((p) => p.id === id)) {
        return { ok: false, error: "No person selected to apply settings to." };
      }
      const targetName = people.find((p) => p.id === id)?.name ?? "this person";
      if (
        !window.confirm(
          `Replace all settings for “${targetName}” (contact info, front card, back card) with this file?`,
        )
      ) {
        return { ok: false, error: "Import cancelled." };
      }
      const front = migrateRawFront(
        file.front as Partial<FrontState> & { nameOffsetY?: number; titleOffsetY?: number },
      );
      const back = migrateRawBack(
        file.back as Partial<BackState> & { qrStyle?: unknown },
        defaultBackForPerson(id),
      );
      setPeople((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...file.person, id: p.id } : p)),
      );
      setFrontByPersonId((prev) => ({ ...prev, [id]: front }));
      setBackByPersonId((prev) => ({ ...prev, [id]: back }));
      return { ok: true };
    },
    [selectedId, people],
  );

  /* ── Clear all saved data ─────────────────────────────────────── */
  const clearSavedData = () => {
    if (
      !window.confirm(
        "Clear all saved settings, people, and card designs stored in this browser? This cannot be undone.",
      )
    )
      return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setPeople(JSON.parse(JSON.stringify(DEFAULT_PEOPLE)) as Person[]);
    setFrontByPersonId(initialFrontMap());
    setBackByPersonId(initialBackMap());
    setSelectedId(DEFAULT_PEOPLE[0]?.id);
    setPeopleListKey((k) => k + 1);
    exportState.setExportError(null);
  };

  return {
    /* state */
    people,
    front,
    back,
    person,
    orientation,
    cardDims,
    selectedId,
    selectedPersonId,
    factoryFront,
    factoryBack,
    hydrated,
    peopleListKey,
    /* export state (from useExport) */
    ...exportState,
    /* setters */
    setSelectedId,
    /* front mutations */
    updateFront,
    patchSelectedFront,
    /* back mutations */
    updateBack,
    patchSelectedBack,
    /* orientation */
    setOrientation,
    /* people mutations */
    addPerson,
    updatePerson,
    deletePerson,
    /* actions */
    clearSavedData,
    exportSelectedPersonSettings,
    importPersonSettingsFromJson,
  };
}

