import {
  Code,
  Container,
  Flex,
  ScrollArea,
  Tabs,
  Text,
} from "@radix-ui/themes";
import { useLayoutEffect, useRef, useState } from "react";
import AppError from "./components/AppError";
import AppFooter from "./components/layout/AppFooter";
import AppHeader from "./components/layout/AppHeader";
import RemoteApiWorkbench from "./components/tabs/remote-api/RemoteApi";
import StatusCard from "./components/tabs/status-card/StatusCard";
import getEnv from "./env";

export default function App() {
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [chromeTop, setChromeTop] = useState(64);
  const [chromeBottom, setChromeBottom] = useState(56);

  useLayoutEffect(() => {
    function update() {
      const topH = topRef.current?.offsetHeight ?? 64;
      const bottomH = bottomRef.current?.offsetHeight ?? 56;
      setChromeTop(topH);
      setChromeBottom(bottomH);
    }

    update();
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
    };
  }, []);

  const shellStyle = {
    // Used by CSS to pad scroll content so it isn't hidden under the overlays.
    "--chromeTop": `${chromeTop}px`,
    "--chromeBottom": `${chromeBottom}px`,
  } as React.CSSProperties;

  const header = (
    <div ref={topRef} className="chromeBar chromeBarTop">
      <Container size="3" style={{ padding: "10px 12px" }}>
        <AppHeader title="LN Gateway" subtitle="Bitcoin + CLN Playground" />
      </Container>
    </div>
  );

  const footer = (swaggerUrl: string) => (
    <div ref={bottomRef} className="chromeBar chromeBarBottom">
      <Container size="3" style={{ padding: "8px 12px" }}>
        <AppFooter
          appName="LN Gateway"
          author="Fabio Colonna"
          swaggerUrl={swaggerUrl}
        />
      </Container>
    </div>
  );

  try {
    const env = getEnv();
    const swaggerUrl = `${env.VITE_API_BASE_URL.replace(/\/$/, "")}/swagger-ui`;

    return (
      <div className="appShell" style={shellStyle}>
        {header}
        <ScrollArea className="appScrollArea" type="auto">
          <Container size="3" className="appContent">
            <Tabs.Root defaultValue="local">
              <Tabs.List>
                <Tabs.Trigger value="local">Local status</Tabs.Trigger>
                <Tabs.Trigger value="remote">Remote API</Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="local">
                <Flex direction="column" gap="2" mt="3">
                  <StatusCard />
                </Flex>
              </Tabs.Content>

              <Tabs.Content value="remote">
                <Flex direction="column" gap="2" mt="3">
                  <RemoteApiWorkbench />
                </Flex>
              </Tabs.Content>
            </Tabs.Root>
          </Container>
        </ScrollArea>
        {footer(swaggerUrl)}
      </div>
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);

    return (
      <div className="appShell" style={shellStyle}>
        {header}
        <ScrollArea className="appScrollArea" type="auto">
          <Container size="3" className="appContent">
            <AppError
              fullScreen
              title="Environment misconfigured"
              subtitle="Fix your `.env` (or Vite env vars) and reload."
              description={
                <Text size="2" color="gray">
                  Required: <Code>VITE_API_BASE_URL</Code>
                </Text>
              }
              details={message}
            />
          </Container>
        </ScrollArea>
      </div>
    );
  }
}
