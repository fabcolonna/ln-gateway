import { Text } from "@radix-ui/themes";

export default function SubcardTitle({ title }: { title: string }) {
  return (
    <Text
      size="1"
      weight="bold"
      color="gray"
      style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
    >
      {title}
    </Text>
  );
}
