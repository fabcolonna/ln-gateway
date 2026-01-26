import type {
  ClientPathsWithMethod,
  MaybeOptionalInit,
  MethodResponse,
} from "openapi-fetch";
import createClient from "openapi-fetch";
import getEnv from "@/env";
import { HttpError } from "../utils/http";
import type { paths } from "./types";

const apiClient = createClient<paths>({
  baseUrl: getEnv().CLIENT_API_BASE_URL,
});

type GetPath = ClientPathsWithMethod<typeof apiClient, "get">;
type GetInit<Path extends GetPath> = MaybeOptionalInit<paths[Path], "get">;
type GetArgs<Path extends GetPath> =
  undefined extends GetInit<Path>
    ? [init?: Exclude<GetInit<Path>, undefined> & Record<string, unknown>]
    : [init: GetInit<Path> & Record<string, unknown>];

export async function apiGet<Path extends GetPath>(
  path: Path,
  ...init: GetArgs<Path>
): Promise<MethodResponse<typeof apiClient, "get", Path, GetInit<Path>>> {
  const { data, error, response } = await apiClient.GET(
    path,
    ...(init as never)
  );
  if (!response.ok) {
    throw new HttpError({
      method: "GET",
      status: response.status,
      url: String(path),
      body: error,
    });
  }

  return data as MethodResponse<typeof apiClient, "get", Path, GetInit<Path>>;
}

type DeletePath = ClientPathsWithMethod<typeof apiClient, "delete">;
type DeleteInit<Path extends DeletePath> = MaybeOptionalInit<
  paths[Path],
  "delete"
>;
type DeleteArgs<Path extends DeletePath> =
  undefined extends DeleteInit<Path>
    ? [init?: Exclude<DeleteInit<Path>, undefined> & Record<string, unknown>]
    : [init: DeleteInit<Path> & Record<string, unknown>];

export async function apiDelete<Path extends DeletePath>(
  path: Path,
  ...init: DeleteArgs<Path>
): Promise<MethodResponse<typeof apiClient, "delete", Path, DeleteInit<Path>>> {
  const { data, error, response } = await apiClient.DELETE(
    path,
    ...(init as never)
  );

  if (!response.ok) {
    throw new HttpError({
      method: "DELETE",
      status: response.status,
      url: String(path),
      body: error,
    });
  }

  return data as MethodResponse<
    typeof apiClient,
    "delete",
    Path,
    DeleteInit<Path>
  >;
}
