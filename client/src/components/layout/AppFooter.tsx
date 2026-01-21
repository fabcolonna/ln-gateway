import { DotFilledIcon } from "@radix-ui/react-icons";
import { Badge, Flex, Link, Text } from "@radix-ui/themes";
import { useHealth } from "../../lib/providers/HealthProvider";

type ConnectionBadgeProps = {
  state: "connecting" | "online" | "offline";
  detail?: string;
  isOperational?: boolean;
};

const ConnectionBadge = ({ state, detail, isOperational }: ConnectionBadgeProps) => {
  const label =
    state === "online"
      ? isOperational
        ? "All systems operational"
        : "Degraded"
      : state === "offline"
        ? "Offline"
        : "Connecting";

  const color =
    state === "online"
      ? isOperational
        ? "green"
        : "amber"
      : state === "offline"
        ? "red"
        : "gray";
  const dotColor =
    state === "online"
      ? isOperational
        ? "var(--green-9)"
        : "var(--amber-9)"
      : state === "offline"
        ? "var(--red-9)"
        : "var(--gray-9)";

  return (
    <Badge variant="soft" color={color} size="1" title={detail}>
      <Flex align="center" gap="2">
        <DotFilledIcon style={{ color: dotColor }} />
        <Text size="1">{label}</Text>
      </Flex>
    </Badge>
  );
};

type AppFooterProps = {
  appName: string;
  author: string;
  swaggerUrl: string;
};

export default function AppFooter({
  appName,
  author,
  swaggerUrl,
}: AppFooterProps) {
  const { connection, isRefreshing, statusLabel, isOperational } = useHealth();

  const connectionDetail =
    isRefreshing && statusLabel !== "loading"
      ? `${connection.detail ?? ""} (refreshing…)`.trim()
      : connection.detail;

  return (
    <Flex align="center" justify="between" gap="2" wrap="wrap">
      <Text size="1" color="gray">
        {appName} · {author}
      </Text>
      <Flex align="center" gap="4" wrap="wrap">
        {connection.state === "online" ? (
          <ConnectionBadge
            state={connection.state}
            detail={connectionDetail}
            isOperational={isOperational}
          />
        ) : null}
        <Link href={swaggerUrl} target="_blank" rel="noreferrer" size="1">
          Swagger
        </Link>
      </Flex>
    </Flex>
  );
}
