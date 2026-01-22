import { Button, Card, Flex, Text, TextField } from "@radix-ui/themes";
import { useMutation } from "@tanstack/react-query";
import { type ChangeEvent, useState } from "react";
import JsonViewer from "@/components/tabs/remote-api/components/JsonViewer";
import type { RemoteApi } from "@/lib/api/remote";
import ErrorCallout from "../components/ErrorCallout";

export default function ChannelCard({ api }: { api: RemoteApi }) {
  const [remoteId, setRemoteId] = useState<string>("");
  const [amountSat, setAmountSat] = useState<string>("");
  const [announceRaw, setAnnounceRaw] = useState<string>("");

  const createReq = useMutation({
    mutationKey: ["remote", api.baseUrl, "channel-request"],
    mutationFn: async () => {
      return api.channelRequest();
    },
  });

  const request = createReq.data;

  const callback = useMutation({
    mutationKey: ["remote", api.baseUrl, "open-channel"],
    mutationFn: async () => {
      if (!request) throw new Error("Call /channel-request first");
      if (!remoteId.trim()) throw new Error("remote_id is required");

      const amount = amountSat.trim() ? Number(amountSat) : undefined;
      if (amount !== undefined && (!Number.isFinite(amount) || amount < 0)) {
        throw new Error("Amount must be a positive number");
      }

      const announce = (() => {
        const trimmed = announceRaw.trim().toLowerCase();
        if (!trimmed) return undefined;
        if (trimmed === "true") return true;
        if (trimmed === "false") return false;
        throw new Error("announce must be 'true' or 'false'");
      })();

      return api.callCallback(request.callback, {
        k1: request.k1,
        remote_id: remoteId.trim(),
        amount: amount === undefined ? undefined : Math.floor(amount),
        announce,
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
            Open channel
          </Text>

          <Button
            onClick={() => createReq.mutate()}
            disabled={createReq.isPending}
            variant="ghost"
            size="1"
            title="GET /channel-request"
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
            Click "Fetch request" to create a channel request.
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
              value={remoteId}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setRemoteId(e.target.value)
              }
              placeholder="remote_id - node pubkey of the remote peer"
            />

            <TextField.Root
              value={amountSat}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setAmountSat(e.target.value)
              }
              placeholder="amount (sat) — optional"
              inputMode="numeric"
            />

            <TextField.Root
              value={announceRaw}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setAnnounceRaw(e.target.value)
              }
              placeholder="announce: true | false (optional)"
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
