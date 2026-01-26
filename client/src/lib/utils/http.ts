export type QueryValue = string | number | boolean | null | undefined;

export class HttpError extends Error {
  method: string;
  status: number;
  url: string;
  body: unknown;

  constructor(args: {
    method: string;
    status: number;
    url: string;
    body: unknown;
  }) {
    const details = (() => {
      const body = args.body;
      if (body === null || body === undefined) {
        return "";
      }
      if (
        typeof body === "object" &&
        body !== null &&
        "error" in body &&
        (body as { error?: unknown }).error !== undefined
      ) {
        return String((body as { error?: unknown }).error);
      }
      if (typeof body === "string") {
        const trimmed = body.trim();
        if (!trimmed) return "";
        return trimmed.length > 1200 ? `${trimmed.slice(0, 1200)}…` : trimmed;
      }
      try {
        return JSON.stringify(body);
      } catch {
        return String(body);
      }
    })();

    const defaultDetails = (() => {
      if (details) return "";
      if (args.status === 404) return "Not Found";
      return "";
    })();

    super(
      details || defaultDetails
        ? `${args.method.toUpperCase()} ${args.url} failed (${args.status}): ${
            details || defaultDetails
          }`
        : `${args.method.toUpperCase()} ${args.url} failed (${args.status})`
    );

    this.name = "HttpError";
    this.method = args.method.toUpperCase();
    this.status = args.status;
    this.url = args.url;
    this.body = args.body;
  }
}

function parseMaybeJson(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return trimmed;
  }
}

export async function getJsonFromUrl<T>(
  url: string,
  signal?: AbortSignal
): Promise<T> {
  const res = await fetch(url, { method: "GET", signal });
  const text = await res.text();
  const body = parseMaybeJson(text);

  if (!res.ok) {
    throw new HttpError({
      method: "GET",
      status: res.status,
      url: res.url,
      body,
    });
  }

  return body as T;
}

export function buildUrlWithQuery(
  baseUrl: string,
  query: Record<string, QueryValue>
) {
  const url = new URL(baseUrl);
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}
