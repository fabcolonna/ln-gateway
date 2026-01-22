import { Card, Flex, Grid, Text } from "@radix-ui/themes";
import SubcardTitle from "@/components/tabs/status-card/components/SubcardTitle";
import { useHealth } from "@/lib/providers/HealthProvider";
import { formatMaybeNumber } from "@/lib/utils/formatters";

export default function ChannelsCard() {
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
}
