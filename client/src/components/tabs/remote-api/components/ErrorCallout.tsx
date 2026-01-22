import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Badge, Callout, Flex, Text } from "@radix-ui/themes";
import { HttpError } from "@/lib/utils/http";

function compactDetails(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.length > 1600 ? `${trimmed.slice(0, 1600)}…` : trimmed;
}

function stringifyError(error: unknown) {
  if (error instanceof HttpError) {
    const body = (() => {
      if (
        typeof error.body === "object" &&
        error.body !== null &&
        "error" in error.body
      ) {
        return String((error.body as { error?: unknown }).error ?? "");
      }
      if (typeof error.body === "string") return error.body;
      try {
        return JSON.stringify(error.body);
      } catch {
        return String(error.body);
      }
    })();

    return {
      status: error.status,
      details: compactDetails(body || error.message),
    };
  }

  if (error instanceof Error) return { details: compactDetails(error.message) };
  return { details: compactDetails(String(error)) };
}

// PUBLIC

type ErrorCalloutProps = {
  title: string;
  error: unknown;
};

export default function ErrorCallout({ title, error }: ErrorCalloutProps) {
  const { status, details } = stringifyError(error);

  return (
    <Callout.Root
      color="red"
      variant="soft"
      size="1"
      style={{ width: "100%", alignSelf: "stretch", minWidth: 0 }}
    >
      <Callout.Icon>
        <ExclamationTriangleIcon />
      </Callout.Icon>
      <Flex direction="column" gap="1" style={{ minWidth: 0 }}>
        <Flex align="center" justify="between" gap="2" wrap="wrap">
          <Text size="2" weight="bold">
            {title}
          </Text>
          {status ? (
            <Badge variant="soft" color="red" size="1">
              HTTP {status}
            </Badge>
          ) : null}
        </Flex>
        <Text
          size="1"
          color="gray"
          style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
        >
          {details}
        </Text>
      </Flex>
    </Callout.Root>
  );
}
