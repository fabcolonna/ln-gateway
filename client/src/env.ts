import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

function createClientEnv() {
  const runtimeEnv = {
    ...import.meta.env,
    CLIENT_API_BASE_URL:
      import.meta.env.CLIENT_API_BASE_URL ?? import.meta.env.VITE_API_BASE_URL,
    CLIENT_APP_AUTHOR:
      import.meta.env.CLIENT_APP_AUTHOR ?? import.meta.env.VITE_APP_AUTHOR,
  };

  return createEnv({
    clientPrefix: "CLIENT_",
    client: {
      CLIENT_API_BASE_URL: z
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
      CLIENT_APP_AUTHOR: z.string().min(1).optional(),
    },
    runtimeEnv,
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
