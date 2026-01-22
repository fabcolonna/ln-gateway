import { Badge, Card, Code, Flex, Text } from "@radix-ui/themes";
import SubcardTitle from "@/components/tabs/status-card/components/SubcardTitle";
import { useHealth } from "@/lib/providers/HealthProvider";
import PubkeyCopy from "../components/PubkeyCopy";

export default function NodeCard() {
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
}
