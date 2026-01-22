import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

function createClientEnv() {
  return createEnv({
    clientPrefix: "VITE_",
    client: {
      VITE_API_BASE_URL: z
        .string()
        .min(1)
        .transform((raw) => {
          if (/^https?:\/\//i.test(raw)) return raw;
          const proto =
            typeof window !== "undefined" ? window.location.protocol : "http:";
          if (raw.startsWith("//")) return `${proto}${raw}`;
          return `${proto}//${raw}`;
        })
        .pipe(z.url()),
      VITE_APP_AUTHOR: z.string().min(1).optional(),
    },
    runtimeEnv: import.meta.env,
    emptyStringAsUndefined: true,
  });
}

export type ClientEnv = ReturnType<typeof createClientEnv>;

let cachedEnv: ClientEnv | null = null;

export default function getEnv(): ClientEnv {
  if (cachedEnv) return cachedEnv;
  cachedEnv = createClientEnv();
  return cachedEnv;
}
