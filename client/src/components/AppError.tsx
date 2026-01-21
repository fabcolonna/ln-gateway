import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import {
  Box,
  Callout,
  Code,
  Container,
  Flex,
  Heading,
  Text,
} from "@radix-ui/themes";
import type { ReactNode } from "react";

type AppErrorProps = {
  title: string;
  subtitle?: string;
  description?: ReactNode;
  details?: ReactNode;
  fullScreen?: boolean;
};

export default function AppError({
  title,
  subtitle,
  description,
  details,
  fullScreen = false,
}: AppErrorProps) {
  const content = (
    <Callout.Root color="red" variant="surface" size="3">
      <Callout.Icon>
        <ExclamationTriangleIcon />
      </Callout.Icon>
      <Flex direction="column" gap="1" style={{ minWidth: 0 }}>
        <Heading size="4">{title}</Heading>
        {subtitle ? (
          <Text size="2" color="gray">
            {subtitle}
          </Text>
        ) : null}
        {description ? <Box>{description}</Box> : null}
        {details ? (
          <Box>
            {typeof details === "string" ? <Code>{details}</Code> : details}
          </Box>
        ) : null}
      </Flex>
    </Callout.Root>
  );

  if (!fullScreen) return content;

  return (
    <Flex align="center" justify="center" style={{ minHeight: "80vh" }}>
      <Container size="2" px="4" style={{ maxWidth: 600 }}>
        {content}
      </Container>
    </Flex>
  );
}
