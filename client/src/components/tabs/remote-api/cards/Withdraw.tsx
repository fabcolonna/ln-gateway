import { Button, Card, Flex, Text, TextField } from "@radix-ui/themes";
import { useMutation } from "@tanstack/react-query";
import { type ChangeEvent, useState } from "react";
import JsonViewer from "@/components/tabs/remote-api/components/JsonViewer";
import type { RemoteApi } from "@/lib/api/remote";
import ErrorCallout from "../components/ErrorCallout";

export default function WithdrawCard({ api }: { api: RemoteApi }) {
  const [destination, setDestination] = useState<string>("");
  const [amountSat, setAmountSat] = useState<string>("");

  const createReq = useMutation({
    mutationKey: ["remote", api.baseUrl, "withdraw-request"],
    mutationFn: async () => {
      return api.withdrawRequest();
    },
  });

  const request = createReq.data;

  const callback = useMutation({
    mutationKey: ["remote", api.baseUrl, "withdraw-callback"],
    mutationFn: async () => {
      if (!request) throw new Error("Call /withdraw-request first");
      if (!destination.trim()) throw new Error("Destination is required");

      const amount = amountSat.trim() ? Number(amountSat) : undefined;
      if (amount !== undefined && (!Number.isFinite(amount) || amount < 0)) {
        throw new Error("Amount must be a positive number");
      }

      return api.callCallback(request.callback, {
        k1: request.k1,
        destination: destination.trim(),
        amount: amount === undefined ? undefined : Math.floor(amount),
      });
    },
  });

  return (
    <Card>
      <Flex direction="column" gap="3">
        <Flex align="center" justify="between" gap="2">
          <Text
            size="1"
            weight="bold"
            color="gray"
            style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
          >
            Withdraw
          </Text>

          <Button
            onClick={() => createReq.mutate()}
            disabled={createReq.isPending}
            variant="ghost"
            size="1"
            title="GET /withdraw-request"
            style={{ paddingRight: 12 }}
          >
            {createReq.isPending ? "Fetching…" : "Fetch request"}
          </Button>
        </Flex>

        {createReq.isError ? (
          <ErrorCallout title="Request failed" error={createReq.error} />
        ) : null}

        {request ? (
          <JsonViewer value={request} maxHeight={240} />
        ) : (
          <Text size="1" color="gray">
            Click "Fetch" to fetch a withdraw request.
          </Text>
        )}

        {request ? (
          <Flex direction="column" gap="2">
            <Flex align="center" justify="between" gap="2">
              <Text
                size="1"
                weight="bold"
                color="gray"
                style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
              >
                Callback
              </Text>

              <Button
                onClick={() => callback.mutate()}
                disabled={!request || callback.isPending}
                variant="ghost"
                size="1"
                title="Call callback"
                style={{ paddingRight: 12 }}
              >
                {callback.isPending ? "Sending…" : "Send callback"}
              </Button>
            </Flex>

            <Text size="1" color="gray">
              Fill the callback parameters, then send.
            </Text>

            <TextField.Root
              value={destination}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setDestination(e.target.value)
              }
              placeholder="destination (btc address)"
            />

            <TextField.Root
              value={amountSat}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setAmountSat(e.target.value)
              }
              placeholder="amount (sat) — optional"
              inputMode="numeric"
            />

            {callback.isError ? (
              <ErrorCallout title="Callback failed" error={callback.error} />
            ) : null}

            {callback.data ? (
              <JsonViewer value={callback.data} maxHeight={240} />
            ) : null}
          </Flex>
        ) : null}
      </Flex>
    </Card>
  );
}
