import {
  Badge,
  Box,
  Button,
  Callout,
  Card,
  Flex,
  Text,
  TextField,
} from "@radix-ui/themes";
import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { createRemoteApi, useRemoteBaseUrl } from "@/lib/api/remote";
import ChannelCard from "./cards/Channel";
import LnUrlAuthCard from "./cards/LnUrlAuth";
import WithdrawCard from "./cards/Withdraw";

function normalizeDraftBaseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/+$/, "");

  const proto =
    typeof window !== "undefined" ? window.location.protocol : "http:";
  if (trimmed.startsWith("//")) return `${proto}${trimmed}`.replace(/\/+$/, "");
  return `${proto}//${trimmed}`.replace(/\/+$/, "");
}

export default function RemoteApiWorkbench() {
  const remote = useRemoteBaseUrl();
  const [draftUrl, setDraftUrl] = useState<string>("");
  const [isEditingUrl, setIsEditingUrl] = useState<boolean>(!remote.isSet);

  useEffect(() => {
    setDraftUrl(remote.raw);
  }, [remote.raw]);

  useEffect(() => {
    if (remote.isSet) setIsEditingUrl(false);
  }, [remote.isSet]);

  function onDraftUrlChange(e: ChangeEvent<HTMLInputElement>) {
    setDraftUrl(e.target.value);
  }

  function onSetUrl() {
    remote.setRaw(draftUrl);
    setIsEditingUrl(false);
  }

  function onChangeUrl() {
    setDraftUrl(remote.raw);
    setIsEditingUrl(true);
  }

  const draftBaseUrl = useMemo(
    () => normalizeDraftBaseUrl(draftUrl),
    [draftUrl]
  );
  const isReady = remote.isSet && !isEditingUrl;
  const api = useMemo(
    () => (isReady ? createRemoteApi(remote.baseUrl) : null),
    [isReady, remote.baseUrl]
  );

  return (
    <Card>
      <Flex direction="column" gap="3">
        <Flex align="center" justify="between" gap="2" wrap="wrap">
          <Text
            size="1"
            weight="bold"
            color="gray"
            style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
          >
            Remote API
          </Text>

          {remote.isSet ? (
            <Flex align="center" gap="1" wrap="wrap">
              <Badge variant="soft" color="green" size="1">
                {remote.baseUrl}
              </Badge>
              <Button
                onClick={onChangeUrl}
                variant="ghost"
                size="1"
                title="Change the remote endpoint"
                style={{ paddingRight: 12 }}
              >
                Change
              </Button>
            </Flex>
          ) : null}
        </Flex>

        <Text size="1" color="gray">
          Interact with a different LN Gateway instance from your browser.
        </Text>

        {isEditingUrl ? (
          <Flex align="center" gap="2" wrap="wrap">
            <Button
              onClick={onSetUrl}
              disabled={!draftBaseUrl}
              size="2"
              variant="soft"
              title="Set the remote endpoint"
              style={{ paddingRight: 12 }}
            >
              Set
            </Button>
            <Box style={{ flex: 1, minWidth: 240 }}>
              <TextField.Root
                value={draftUrl}
                onChange={onDraftUrlChange}
                placeholder="http://remote-host:3000"
              />
            </Box>
          </Flex>
        ) : null}

        {!isReady || !api ? (
          <Callout.Root color="gray" style={{ width: "100%" }}>
            <Callout.Text>Set a base URL to enable the endpoints.</Callout.Text>
          </Callout.Root>
        ) : (
          <Flex direction="column" gap="2" style={{ width: "100%" }}>
            <WithdrawCard api={api} />
            <ChannelCard api={api} />
            <LnUrlAuthCard api={api} />
          </Flex>
        )}
      </Flex>
    </Card>
  );
}
