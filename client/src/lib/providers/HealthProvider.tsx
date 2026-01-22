import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";
import apiGet from "../api/local";
import type { components } from "../api/types";

type HealthResponse = components["schemas"]["HealthResponse"];

type HealthSample = {
  health: HealthResponse;
  latencyMs: number;
};

type HealthContextValue = {
  health?: HealthResponse;
  latencyMs?: number;
  ageSeconds?: number;
  lastUpdated: string;
  statusLabel: "loading" | "error" | "refreshing" | "ok";
  errorMessage?: string;
  isRefreshing: boolean;
  refetch: () => void;
  connection: {
    state: "connecting" | "online" | "offline";
    detail?: string;
  };
  isOperational: boolean;
};

const HealthContext = createContext<HealthContextValue | null>(null);

export function HealthProvider({ children }: { children: ReactNode }) {
  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: async ({ signal }): Promise<HealthSample> => {
      const t0 = performance.now();
      const health = await apiGet("/health", { signal });
      return { health, latencyMs: performance.now() - t0 };
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  const sample = healthQuery.data;
  const health = sample?.health;

  const lastUpdated =
    healthQuery.dataUpdatedAt > 0
      ? new Date(healthQuery.dataUpdatedAt).toLocaleTimeString()
      : "—";

  const latencyMs =
    sample !== undefined
      ? Math.max(0, Math.round(sample.latencyMs))
      : undefined;
  const ageSeconds =
    healthQuery.dataUpdatedAt > 0
      ? Math.max(0, Math.round((Date.now() - healthQuery.dataUpdatedAt) / 1000))
      : undefined;

  const errorMessage = healthQuery.isError
    ? healthQuery.error instanceof Error
      ? healthQuery.error.message
      : "Unknown error"
    : undefined;

  const statusLabel: HealthContextValue["statusLabel"] = healthQuery.isPending
    ? "loading"
    : healthQuery.isError
      ? "error"
      : healthQuery.isFetching
        ? "refreshing"
        : "ok";

  const connection = useMemo<HealthContextValue["connection"]>(() => {
    if (healthQuery.isError) return { state: "offline", detail: errorMessage };
    if (!health) return { state: "connecting", detail: "Checking…" };

    const detailParts = [
      `cln:${health.lightning.status}`,
      `btc:${health.bitcoin.status}`,
    ];
    if (health.bitcoin.chain) {
      detailParts.push(
        `${health.bitcoin.chain} @ height ${health.bitcoin.blocks}`
      );
    }

    return {
      state: "online",
      detail: detailParts.join(" · "),
    };
  }, [errorMessage, health, healthQuery.isError]);

  const isOperational = Boolean(
    healthQuery.isSuccess &&
      health &&
      health.lightning.status === "ok" &&
      health.bitcoin.status === "ok"
  );

  const value = useMemo<HealthContextValue>(
    () => ({
      health,
      latencyMs,
      ageSeconds,
      lastUpdated,
      statusLabel,
      errorMessage,
      isRefreshing: healthQuery.isFetching,
      refetch: () => {
        void healthQuery.refetch();
      },
      connection,
      isOperational,
    }),
    [
      ageSeconds,
      connection,
      errorMessage,
      health,
      healthQuery.isFetching,
      healthQuery.refetch,
      isOperational,
      lastUpdated,
      latencyMs,
      statusLabel,
    ]
  );

  return (
    <HealthContext.Provider value={value}>{children}</HealthContext.Provider>
  );
}

export function useHealth() {
  const value = useContext(HealthContext);
  if (!value) throw new Error("useHealth must be used within HealthProvider");
  return value;
}
