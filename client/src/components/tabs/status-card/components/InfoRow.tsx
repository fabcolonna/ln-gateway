import { Code, Flex, Text } from "@radix-ui/themes";

type InfoRowProps = {
  label: string;
  value: React.ReactNode;
  title?: string;
};

export default function InfoRow({ label, value, title }: InfoRowProps) {
  const isInlineCode = typeof value === "string" || typeof value === "number";

  return (
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
      {isInlineCode ? (
        <Code className="truncate" style={{ maxWidth: "100%" }} title={title}>
          {value}
        </Code>
      ) : (
        <div style={{ minWidth: 0, maxWidth: "100%" }}>{value}</div>
      )}
    </Flex>
  );
}
