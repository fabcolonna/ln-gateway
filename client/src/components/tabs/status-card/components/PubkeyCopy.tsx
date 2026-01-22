import { CheckIcon, CopyIcon } from "@radix-ui/react-icons";
import { Button, Code, Flex, Text } from "@radix-ui/themes";
import { useState } from "react";
import { splitForMiddleEllipsis } from "@/lib/utils/formatters";

export default function PubkeyCopy({ pubkey }: { pubkey?: string }) {
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
}
