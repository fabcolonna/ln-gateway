import { TrashIcon, UpdateIcon } from "@radix-ui/react-icons";
import { Badge, Button, Card, Code, Flex, Text } from "@radix-ui/themes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SubcardTitle from "@/components/tabs/status-card/components/SubcardTitle";
import { apiDelete, apiGet } from "@/lib/api/local";
import type { components } from "@/lib/api/types";

type RecentRequestEntry = components["schemas"]["RecentRequestEntry"];

function formatAge(tsMs: number): string {
  const ageMs = Math.max(0, Date.now() - tsMs);
  const ageSeconds = Math.floor(ageMs / 1000);
  if (ageSeconds < 60) return `${ageSeconds}s ago`;
  const ageMinutes = Math.floor(ageSeconds / 60);
  if (ageMinutes < 60) return `${ageMinutes}m ago`;
  const ageHours = Math.floor(ageMinutes / 60);
  return `${ageHours}h ago`;
}

export default function RecentRequestsCard() {
  const queryClient = useQueryClient();
  const queryKey = ["recent-requests"] as const;

  // This query fetches recent requests every 3 seconds and holds the state.
  const getQuery = useQuery<RecentRequestEntry[]>({
    queryKey,
    queryFn: async ({ signal }): Promise<RecentRequestEntry[]> => {
      return apiGet("/recent-requests", {
        signal,
        params: { query: { limit: 15 } },
      });
    },
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  const clearMut = useMutation({
    mutationKey: ["clear-recent-requests"],
    mutationFn: async (): Promise<void> => {
      return apiDelete("/recent-requests");
    },
    // Optimistic update to clear the recent requests immediately.
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<RecentRequestEntry[]>(queryKey);
      queryClient.setQueryData<RecentRequestEntry[]>(queryKey, []);
      return { previous };
    },
    // Rollback to the previous state if the mutation fails.
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData<RecentRequestEntry[]>(queryKey, ctx.previous);
      }
    },
    // If successful or failed, refetch the recent requests to ensure data consistency.
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
    retry: 1,
    retryDelay: 1000,
  });

  const items = getQuery.data ?? [];
  const isClearing = clearMut.isPending;

  return (
    <Card style={{ minWidth: 0 }}>
      <Flex direction="column" gap="3">
        <Flex align="center" justify="between" gap="2" wrap="wrap">
          <SubcardTitle title="RECENT REQUESTS" />

          <Flex
            align="center"
            gap="2"
            wrap="wrap"
            style={{ marginLeft: "auto" }}
          >
            <Badge variant="soft" color="gray">
              {getQuery.isPending ? "Loading…" : `${items.length} shown`}
            </Badge>

            <Button
              type="button"
              variant="ghost"
              size="1"
              onClick={() => {
                clearMut.mutate();
              }}
              disabled={isClearing || items.length === 0}
            >
              <TrashIcon />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="1"
              onClick={() => {
                void getQuery.refetch();
              }}
              disabled={getQuery.isFetching}
            >
              <UpdateIcon />
            </Button>
          </Flex>
        </Flex>

        {getQuery.isError ? (
          <Text size="2" color="red">
            Failed to load recent requests.
          </Text>
        ) : items.length === 0 ? (
          <Text size="2" color="gray">
            {isClearing ? "Cleared." : "No recent requests yet."}
          </Text>
        ) : (
          <Flex direction="column" gap="2" style={{ minWidth: 0 }}>
            {items.map((r, idx) => (
              <Flex
                key={`${r.ts_ms}-${idx}`}
                align="center"
                justify="between"
                gap="2"
                wrap="wrap"
              >
                <Flex direction="column" gap="1" style={{ minWidth: 0 }}>
                  <Flex align="center" gap="2" wrap="wrap">
                    <Badge
                      variant="soft"
                      color={r.ok ? "green" : "red"}
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {r.status}
                    </Badge>
                    <Code>
                      {r.method} {r.path}
                    </Code>
                    <Text size="1" color="gray">
                      {formatAge(r.ts_ms)}
                    </Text>
                  </Flex>
                  <Text size="1" color="gray">
                    From: <Code>{r.client_addr || "unknown"}</Code>
                  </Text>
                </Flex>
              </Flex>
            ))}
          </Flex>
        )}
      </Flex>
    </Card>
  );
}
