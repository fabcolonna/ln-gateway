import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { Button, Flex, Text, useThemeContext } from "@radix-ui/themes";

type AppHeaderProps = {
  title: string;
  subtitle: string;
};

export default function AppHeader({ title, subtitle }: AppHeaderProps) {
  const { appearance, onAppearanceChange } = useThemeContext();
  const isDark = appearance === "dark";

  return (
    <Flex align="center" justify="between" gap="2" wrap="wrap">
      <Flex direction="column" gap="0">
        <Text size="4" weight="bold">
          {title}
        </Text>
        <Text size="2" color="gray">
          {subtitle}
        </Text>
      </Flex>

      <Flex align="center" gap="2" wrap="wrap">
        <Button
          type="button"
          variant="soft"
          size="1"
          onClick={() => onAppearanceChange(isDark ? "light" : "dark")}
          aria-label="Toggle dark mode"
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </Button>
      </Flex>
    </Flex>
  );
}
