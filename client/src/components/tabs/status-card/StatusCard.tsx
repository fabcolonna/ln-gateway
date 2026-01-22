import { UpdateIcon } from "@radix-ui/react-icons";
import { Badge, Button, Card, Flex, Grid, Text } from "@radix-ui/themes";
import { useHealth } from "@/lib/providers/HealthProvider";
import BlockchainCard from "./cards/Blockchain";
import ChannelsCard from "./cards/Channels";
import GatewayCard from "./cards/Gateway";
import NodeCard from "./cards/Node";

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
          weight="bold"
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
