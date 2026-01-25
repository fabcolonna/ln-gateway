import { Badge, Card, Code, Flex, Text } from "@radix-ui/themes";
import SubcardTitle from "@/components/tabs/status-card/components/SubcardTitle";
import getEnv from "@/env";
import { useHealth } from "@/lib/providers/HealthProvider";
import { formatMsat } from "@/lib/utils/formatters";

export default function GatewayCard() {
  const { health, isOperational } = useHealth();
  const backendEndpoint = getEnv().CLIENT_API_BASE_URL;
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
}
