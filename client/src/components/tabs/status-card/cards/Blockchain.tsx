import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Badge, Callout, Card, Flex, Grid, Text } from "@radix-ui/themes";
import InfoRow from "@/components/tabs/status-card/components/InfoRow";
import SubcardTitle from "@/components/tabs/status-card/components/SubcardTitle";
import { useHealth } from "@/lib/providers/HealthProvider";
import { formatMaybeNumber, formatMaybePercent } from "@/lib/utils/formatters";

export default function BlockchainCard() {
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
}
