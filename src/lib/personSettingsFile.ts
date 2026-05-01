import type { BackState, FrontState, Person } from "./types";

/** Bump when the export envelope shape changes. */
export const PERSON_SETTINGS_SCHEMA_VERSION = 1 as const;

export const PERSON_SETTINGS_FILE_APP_ID = "lavolta-bcb-person-settings" as const;

/** Legacy Folk Devils exports still import cleanly. */
export const LEGACY_PERSON_SETTINGS_FILE_APP_ID = "fd-bcb-person-settings" as const;

/** JSON file written by “Download settings” for one person. */
export type PersonSettingsFileV1 = {
  schemaVersion: typeof PERSON_SETTINGS_SCHEMA_VERSION;
  app: typeof PERSON_SETTINGS_FILE_APP_ID;
  exportedAt: string;
  /** Contact fields only — `id` is always the selected person on import. */
  person: Omit<Person, "id">;
  front: FrontState;
  back: BackState;
};

export function buildPersonSettingsPayload(
  person: Person,
  front: FrontState,
  back: BackState,
): PersonSettingsFileV1 {
  return {
    schemaVersion: PERSON_SETTINGS_SCHEMA_VERSION,
    app: PERSON_SETTINGS_FILE_APP_ID,
    exportedAt: new Date().toISOString(),
    person: {
      name: person.name,
      title: person.title,
      phone: person.phone,
      email: person.email,
    },
    front: JSON.parse(JSON.stringify(front)) as FrontState,
    back: JSON.parse(JSON.stringify(back)) as BackState,
  };
}

/** Safe basename for `download` attribute (no path chars). */
export function personSettingsDownloadBasename(personName: string): string {
  const s = personName
    .trim()
    .replace(/[/\\?%*:|"<>]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
  return s || "person";
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

export type ParsePersonSettingsResult =
  | { ok: true; person: Omit<Person, "id">; front: unknown; back: unknown }
  | { ok: false; error: string };

/** Validate the top-level envelope; front/back are passed through to migrate* helpers. */
export function parsePersonSettingsFile(data: unknown): ParsePersonSettingsResult {
  if (!isRecord(data)) {
    return { ok: false, error: "File must be a JSON object." };
  }
  const v = data.schemaVersion;
  if (v !== PERSON_SETTINGS_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `Unsupported schemaVersion (got ${String(v)}, need ${PERSON_SETTINGS_SCHEMA_VERSION}).`,
    };
  }
  if (
    data.app !== PERSON_SETTINGS_FILE_APP_ID &&
    data.app !== LEGACY_PERSON_SETTINGS_FILE_APP_ID
  ) {
    return { ok: false, error: "Not a La Volta person settings file (wrong app id)." };
  }
  const p = data.person;
  if (!isRecord(p)) {
    return { ok: false, error: "Missing or invalid person object." };
  }
  const name = p.name;
  if (typeof name !== "string" || !name.trim()) {
    return { ok: false, error: "Person name is required and must be a non-empty string." };
  }
  const title = p.title;
  const phone = p.phone;
  const email = p.email;
  if (typeof title !== "string" || typeof phone !== "string" || typeof email !== "string") {
    return { ok: false, error: "Person title, phone, and email must be strings." };
  }
  if (!isRecord(data.front)) {
    return { ok: false, error: "Missing or invalid front card object." };
  }
  if (!isRecord(data.back)) {
    return { ok: false, error: "Missing or invalid back card object." };
  }
  return {
    ok: true,
    person: { name: name.trim(), title, phone, email },
    front: data.front,
    back: data.back,
  };
}
