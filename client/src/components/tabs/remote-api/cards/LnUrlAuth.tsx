import { Button, Card, Flex, Text, TextField } from "@radix-ui/themes";
import { useMutation } from "@tanstack/react-query";
import { type ChangeEvent, useState } from "react";
import JsonViewer from "@/components/tabs/remote-api/components/JsonViewer";
import type { RemoteApi } from "@/lib/api/remote";
import ErrorCallout from "../components/ErrorCallout";

export default function LnUrlAuthCard({ api }: { api: RemoteApi }) {
  const [key, setKey] = useState<string>("");
  const [sig, setSig] = useState<string>("");
  const [tag, setTag] = useState<string>("");

  const createReq = useMutation({
    mutationKey: ["remote", api.baseUrl, "lnurl-auth-request"],
    mutationFn: async () => {
      return api.lnurlAuthRequest();
    },
  });

  const request = createReq.data;

  const callback = useMutation({
    mutationKey: ["remote", api.baseUrl, "lnurl-auth-callback"],
    mutationFn: async () => {
      if (!request) throw new Error("Call /lnurl-auth-request first");
      if (!key.trim()) throw new Error("key is required");
      if (!sig.trim()) throw new Error("sig is required");

      return api.callCallback(request.callback, {
        k1: request.k1,
        key: key.trim(),
        sig: sig.trim(),
        action: request.action ?? undefined,
        tag: tag.trim() ? tag.trim() : undefined,
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
            LNURL-auth
          </Text>

          <Button
            onClick={() => createReq.mutate()}
            disabled={createReq.isPending}
            variant="ghost"
            size="1"
            title="GET /lnurl-auth-request"
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
            Click "Fetch request" to fetch an LNURL-auth request.
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
              value={key}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setKey(e.target.value)
              }
              placeholder="key (compressed pubkey hex)"
            />

            <TextField.Root
              value={sig}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setSig(e.target.value)
              }
              placeholder="sig (signature hex)"
            />

            <TextField.Root
              value={tag}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setTag(e.target.value)
              }
              placeholder="tag (optional)"
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
