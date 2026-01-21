import type {
  ClientPathsWithMethod,
  MaybeOptionalInit,
  MethodResponse,
} from "openapi-fetch";
import createClient from "openapi-fetch";
import getEnv from "../env";
import type { paths } from "./types";

export const apiClient = createClient<paths>({
  baseUrl: getEnv().VITE_API_BASE_URL,
});

type GetPath = ClientPathsWithMethod<typeof apiClient, "get">;
type GetInit<Path extends GetPath> = MaybeOptionalInit<paths[Path], "get">;
type GetArgs<Path extends GetPath> =
  undefined extends GetInit<Path>
    ? [init?: Exclude<GetInit<Path>, undefined> & Record<string, unknown>]
    : [init: GetInit<Path> & Record<string, unknown>];

function stringifyError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export async function apiGet<Path extends GetPath>(
  path: Path,
  ...init: GetArgs<Path>
): Promise<MethodResponse<typeof apiClient, "get", Path, GetInit<Path>>> {
  const { data, error, response } = await apiClient.GET(
    path,
    ...(init as never)
  );
  if (!response.ok) {
    throw new Error(
      `GET ${String(path)} failed (${response.status}): ${stringifyError(error)}`
    );
  }
  return data as MethodResponse<typeof apiClient, "get", Path, GetInit<Path>>;
}

export default apiGet;
