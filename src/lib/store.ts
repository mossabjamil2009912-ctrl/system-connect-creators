import { useEffect, useState } from "react";
import type { PlatformId, PostRecord } from "./platforms";

const HISTORY = "arsh-history";
const SETTINGS = "arsh-settings";

export type Settings = Partial<Record<PlatformId, { target: string; enabled: boolean }>>;

function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function useStored<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  useEffect(() => setValue(read(key, fallback)), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = (v: T) => {
    setValue(v);
    try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage full */ }
  };
  return [value, save] as const;
}

export const useHistory = () => useStored<PostRecord[]>(HISTORY, []);
export const DEFAULT_TELEGRAM = "@ThroneEngineering";

export function useSettings() {
  const [value, save] = useStored<Settings>(SETTINGS, {});
  const withDefault: Settings = value.telegram?.target?.trim()
    ? value
    : { ...value, telegram: { enabled: value.telegram?.enabled ?? true, target: DEFAULT_TELEGRAM } };
  return [withDefault, save] as const;
}
