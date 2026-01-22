import { Code, ScrollArea } from "@radix-ui/themes";

type JsonViewerProps = {
  value: unknown;
  maxHeight?: number;
};

export default function JsonViewer({
  value,
  maxHeight = 240,
}: JsonViewerProps) {
  const text = (() => {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  })();

  return (
    <ScrollArea type="auto" style={{ maxHeight }}>
      <Code style={{ display: "block", whiteSpace: "pre", width: "100%" }}>
        {text}
      </Code>
    </ScrollArea>
  );
}
