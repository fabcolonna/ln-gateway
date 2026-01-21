import {
  CheckIcon,
  CopyIcon,
  ExclamationTriangleIcon,
  UpdateIcon,
} from "@radix-ui/react-icons";
import {
  Badge,
  Button,
  Callout,
  Card,
  Code,
  Flex,
  Grid,
  Text,
} from "@radix-ui/themes";
import { useState } from "react";
import getEnv from "../lib/env";
import { useHealth } from "../lib/providers/HealthProvider";

const formatMaybeNumber = (value: number | null | undefined) => {
  if (value === undefined || value === null) return "—";
  return new Intl.NumberFormat().format(value);
};

const formatMaybePercent = (value: number | null | undefined) => {
  if (value === undefined || value === null) return "—";
  return `${(value * 100).toFixed(0)}%`;
};

const splitForMiddleEllipsis = (text: string, tailChars = 16) => {
  if (tailChars <= 0) return { head: text, tail: "" };

  // If it is already short, keep it as-is.
  if (text.length <= tailChars * 2 + 3) return { head: text, tail: "" };

  return {
    head: text.slice(0, Math.max(0, text.length - tailChars)),
    tail: text.slice(Math.max(0, text.length - tailChars)),
  };
};

const formatMsat = (msat: number | undefined) => {
  if (msat === undefined) return "—";
  const nfMsat = new Intl.NumberFormat();
  const nfSat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 });
  return `${nfMsat.format(msat)} msat (${nfSat.format(msat / 1000)} sat)`;
};

const InfoRow = ({
  label,
  value,
  title,
}: {
  label: string;
  value: string;
  title?: string;
}) => (
  <Flex
    align="center"
    justify="between"
    gap="2"
    wrap="wrap"
    style={{ minWidth: 0 }}
  >
    <Text size="2" color="gray">
      {label}
    </Text>
    <Code className="truncate" style={{ maxWidth: "100%" }} title={title}>
      {value}
    </Code>
  </Flex>
);

const SubcardTitle = ({ title }: { title: string }) => (
  <Text
    size="1"
    weight="bold"
    color="gray"
    style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
  >
    {title}
  </Text>
);

// Private components

const PubkeyCopy = ({ pubkey }: { pubkey?: string }) => {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  const isCopyEnabled = Boolean(pubkey);
  const { head, tail } = pubkey
    ? splitForMiddleEllipsis(pubkey, 16)
    : { head: "—", tail: "" };

  return (
    <Flex align="center" gap="2" style={{ minWidth: 0, width: "100%" }}>
      <Code
        className="middleEllipsis"
        style={{ maxWidth: "100%", flex: 1, minWidth: 0 }}
        title={pubkey ?? ""}
      >
        {tail ? (
          <>
            <span className="middleEllipsisHead">{head}</span>
            <span className="middleEllipsisTail">{tail}</span>
          </>
        ) : (
          head
        )}
      </Code>

      <Button
        type="button"
        variant="ghost"
        size="1"
        disabled={!isCopyEnabled}
        onClick={async () => {
          if (!pubkey) return;
          try {
            await navigator.clipboard.writeText(pubkey);
            setState("copied");
            window.setTimeout(() => setState("idle"), 900);
          } catch {
            setState("error");
            window.setTimeout(() => setState("idle"), 1200);
          }
        }}
        aria-label="Copy pubkey to clipboard"
        style={{ minWidth: 0 }}
      >
        {state === "copied" ? <CheckIcon /> : <CopyIcon />}
      </Button>

      {state === "error" ? (
        <Text size="1" color="red">
          Copy failed
        </Text>
      ) : state === "copied" ? (
        <Text size="1" color="green">
          Copied
        </Text>
      ) : null}
    </Flex>
  );
};

const BlockchainCard = () => {
  const { health } = useHealth();
  const bitcoin = health?.bitcoin;
  const bitcoinOk = bitcoin?.status === "ok";

  const statusColor =
    bitcoin?.status === "ok"
      ? "green"
      : bitcoin?.status === "unreachable"
        ? "red"
        : "gray";

  const bitcoinLabel =
    bitcoin?.status === "ok"
      ? "OK"
      : bitcoin?.status === "unreachable"
        ? "Unreachable"
        : bitcoin?.status === "notconfigured"
          ? "Not configured"
          : "—";

  const bitcoinVersion =
    bitcoinOk && bitcoin
      ? bitcoin.subversion || String(bitcoin.version)
      : undefined;

  const bitcoinBlocks = bitcoinOk && bitcoin ? bitcoin.blocks : undefined;
  const bitcoinHeaders = bitcoinOk && bitcoin ? bitcoin.headers : undefined;
  const bitcoinHeaderLag =
    bitcoinOk && bitcoinBlocks !== undefined && bitcoinHeaders !== undefined
      ? bitcoinHeaders - bitcoinBlocks
      : undefined;
  const bitcoinIbd =
    bitcoinOk && bitcoin ? bitcoin.initial_block_download : undefined;
  const bitcoinWarnings = bitcoin
    ? (health?.warning_bitcoind_sync ?? bitcoin.warnings ?? undefined)
    : undefined;

  const syncLabel = bitcoinOk
    ? formatMaybePercent(bitcoin?.verification_progress)
    : "—";
  const connectionsLabel = bitcoinOk
    ? formatMaybeNumber(bitcoin?.connections)
    : "—";
  const ibdLabel = bitcoinOk ? (bitcoinIbd ? "Yes" : "No") : "—";

  return (
    <Card className="statusSubcard">
      <Flex direction="column" gap="3" style={{ height: "100%" }}>
        <Flex align="center" justify="between" gap="2" wrap="wrap">
          <SubcardTitle title="BLOCKCHAIN" />
          <Flex align="center" gap="2" wrap="wrap">
            <Badge variant="soft">{bitcoin?.chain || "—"}</Badge>
            <Badge variant="soft" color={statusColor}>
              {bitcoinLabel}
            </Badge>
          </Flex>
        </Flex>

        <Grid columns="4" gap="2" className="kpiMetrics" style={{ flex: 1 }}>
          <Flex
            direction="column"
            gap="1"
            align="center"
            justify="center"
            className="kpiMetric"
          >
            <Text size="7" weight="bold" style={{ lineHeight: 1 }}>
              {bitcoinOk ? formatMaybeNumber(bitcoinBlocks) : "—"}
            </Text>
            <Text size="2" color="gray">
              Blocks
            </Text>
          </Flex>

          <Flex
            direction="column"
            gap="1"
            align="center"
            justify="center"
            className="kpiMetric"
          >
            <Text size="6" weight="bold" style={{ lineHeight: 1 }}>
              {syncLabel}
            </Text>
            <Text size="2" color="gray">
              Sync
            </Text>
          </Flex>

          <Flex
            direction="column"
            gap="1"
            align="center"
            justify="center"
            className="kpiMetric"
          >
            <Text size="6" weight="bold" style={{ lineHeight: 1 }}>
              {connectionsLabel}
            </Text>
            <Text size="2" color="gray">
              Connections
            </Text>
          </Flex>

          <Flex
            direction="column"
            gap="1"
            align="center"
            justify="center"
            className="kpiMetric"
          >
            <Text
              size="6"
              weight="bold"
              style={{ lineHeight: 1 }}
              color={bitcoinOk ? (bitcoinIbd ? "amber" : "green") : undefined}
            >
              {ibdLabel}
            </Text>
            <Text size="2" color="gray">
              IBD
            </Text>
          </Flex>
        </Grid>

        <Flex direction="column" gap="1" style={{ minWidth: 0 }}>
          <InfoRow
            label="Headers"
            value={bitcoinOk ? formatMaybeNumber(bitcoinHeaders) : "—"}
          />
          <InfoRow
            label="Header lag"
            value={bitcoinOk ? formatMaybeNumber(bitcoinHeaderLag) : "—"}
          />
          <InfoRow label="Version" value={bitcoinVersion ?? "—"} />
        </Flex>

        {bitcoinWarnings ? (
          <Callout.Root color="amber" variant="surface" size="1">
            <Callout.Icon>
              <ExclamationTriangleIcon />
            </Callout.Icon>
            <Callout.Text>{bitcoinWarnings}</Callout.Text>
          </Callout.Root>
        ) : null}
      </Flex>
    </Card>
  );
};

const GatewayCard = () => {
  const { health, isOperational } = useHealth();
  const backendEndpoint = getEnv().VITE_API_BASE_URL;
  const gatewayState = !health
    ? "unknown"
    : isOperational
      ? "operational"
      : "degraded";

  return (
    <Card className="statusSubcard">
      <Flex direction="column" gap="3" style={{ height: "100%" }}>
        <Flex align="center" justify="between" gap="2" wrap="wrap">
          <SubcardTitle title="GATEWAY" />
          <Badge
            variant="soft"
            color={
              gatewayState === "operational"
                ? "green"
                : gatewayState === "degraded"
                  ? "amber"
                  : "gray"
            }
          >
            {gatewayState === "operational"
              ? "Operational"
              : gatewayState === "degraded"
                ? "Degraded"
                : "—"}
          </Badge>
        </Flex>

        <Flex
          direction="column"
          gap="2"
          style={{ flex: 1, justifyContent: "center" }}
        >
          <Flex direction="column" gap="1" style={{ minWidth: 0 }}>
            <Text size="2" color="gray">
              Backend endpoint
            </Text>
            <Code className="truncate" style={{ maxWidth: "100%" }}>
              {backendEndpoint}
            </Code>
          </Flex>

          <Flex direction="column" gap="1" style={{ minWidth: 0 }}>
            <Text size="2" color="gray">
              LNURL withdraw limits
            </Text>
            <Text size="2" style={{ minWidth: 0 }}>
              {health ? (
                <>
                  <Code>{formatMsat(health.min_withdrawable_msat)}</Code> –{" "}
                  <Code>{formatMsat(health.max_withdrawable_msat)}</Code>
                </>
              ) : (
                "—"
              )}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Card>
  );
};

const NodeCard = () => {
  const { health } = useHealth();
  const lightning = health?.lightning;

  return (
    <Card className="statusSubcard">
      <Flex direction="column" gap="3" style={{ height: "100%" }}>
        <Flex align="center" justify="between" gap="2" wrap="wrap">
          <SubcardTitle title="NODE" />
          <Badge variant="soft">{lightning?.alias ?? "—"}</Badge>
        </Flex>

        <Flex
          direction="column"
          gap="2"
          style={{ flex: 1, justifyContent: "center" }}
        >
          <Flex direction="column" gap="1" style={{ minWidth: 0 }}>
            <Text size="2" color="gray">
              Pubkey
            </Text>
            <div style={{ minWidth: 0 }}>
              <PubkeyCopy pubkey={lightning?.pubkey} />
            </div>
          </Flex>

          <Flex direction="column" gap="1" style={{ minWidth: 0 }}>
            <Text size="2" color="gray">
              CLN version
            </Text>
            <Code className="truncate" style={{ maxWidth: "100%" }}>
              {lightning?.cln_version ?? "—"}
            </Code>
          </Flex>
        </Flex>
      </Flex>
    </Card>
  );
};

const ChannelsCard = () => {
  const { health } = useHealth();
  const lightning = health?.lightning;

  return (
    <Card className="statusSubcard">
      <Flex direction="column" gap="3" style={{ height: "100%" }}>
        <Flex align="center" justify="between" gap="2" wrap="wrap">
          <SubcardTitle title="CHANNELS" />
        </Flex>

        <Grid columns="3" gap="2" className="kpiMetrics" style={{ flex: 1 }}>
          <Flex
            direction="column"
            gap="1"
            align="center"
            justify="center"
            className="kpiMetric"
          >
            <Text size="6" weight="bold" style={{ lineHeight: 1 }}>
              {formatMaybeNumber(lightning?.num_peers)}
            </Text>
            <Text size="2" color="gray">
              Peers
            </Text>
          </Flex>

          <Flex
            direction="column"
            gap="1"
            align="center"
            justify="center"
            className="kpiMetric"
          >
            <Text
              size="6"
              weight="bold"
              style={{ lineHeight: 1 }}
              color="green"
            >
              {formatMaybeNumber(lightning?.num_active_channels)}
            </Text>
            <Text size="2" color="gray">
              Active
            </Text>
          </Flex>

          <Flex
            direction="column"
            gap="1"
            align="center"
            justify="center"
            className="kpiMetric"
          >
            <Text
              size="6"
              weight="bold"
              style={{ lineHeight: 1 }}
              color="amber"
            >
              {formatMaybeNumber(lightning?.num_pending_channels)}
            </Text>
            <Text size="2" color="gray">
              Pending
            </Text>
          </Flex>
        </Grid>
      </Flex>
    </Card>
  );
};

export default function StatusCard() {
  const {
    latencyMs,
    lastUpdated,
    errorMessage,
    isRefreshing,
    refetch,
    connection,
  } = useHealth();

  const showMetrics = errorMessage ? false : connection.state === "online";

  return (
    <Card>
      <Flex align="center" justify="between" gap="2" wrap="wrap" mb="2">
        <Text
          size="1"
          weight="medium"
          color="gray"
          style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
        >
          STATUS
        </Text>
        <Flex align="center" gap="2" wrap="wrap">
          <Badge variant="soft" color="gray" size="2">
            {showMetrics && latencyMs !== undefined
              ? `Latency: ${latencyMs}ms`
              : "Latency: —"}
          </Badge>

          <Badge variant="soft" color="gray" size="2">
            {`Updated: ${showMetrics ? lastUpdated : "—"}`}
          </Badge>

          <Button
            type="button"
            variant="ghost"
            size="1"
            onClick={refetch}
            disabled={isRefreshing}
          >
            <UpdateIcon />
          </Button>
        </Flex>
      </Flex>

      <Grid
        rows="2"
        columns="2"
        gap="2"
        mt="3"
        className="statusGrid"
        style={{ alignItems: "stretch" }}
      >
        <BlockchainCard />
        <NodeCard />
        <ChannelsCard />
        <GatewayCard />
      </Grid>
    </Card>
  );
}
