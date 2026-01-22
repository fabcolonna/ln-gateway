import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "ln-gateway.remoteBaseUrl";

function normalizeRemoteBaseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/+$/, "");

  const proto =
    typeof window !== "undefined" ? window.location.protocol : "http:";
  if (trimmed.startsWith("//")) return `${proto}${trimmed}`.replace(/\/+$/, "");
  return `${proto}//${trimmed}`.replace(/\/+$/, "");
}

export function useRemoteBaseUrl() {
  const [raw, setRaw] = useState<string>("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setRaw(saved);
    } catch {
      // ignore
    }
  }, []);

  const normalized = useMemo(() => normalizeRemoteBaseUrl(raw), [raw]);

  useEffect(() => {
    try {
      if (raw.trim()) window.localStorage.setItem(STORAGE_KEY, raw);
    } catch {
      // ignore
    }
  }, [raw]);

  return {
    raw,
    setRaw,
    baseUrl: normalized,
    isSet: Boolean(normalized),
  };
}
