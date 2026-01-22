import { Theme as RadixTheme } from "@radix-ui/themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@radix-ui/themes/styles.css";
import "./styles.css";
import { HealthProvider } from "./lib/providers/HealthProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <HealthProvider>
        <RadixTheme
          appearance="dark"
          accentColor="gray"
          grayColor="gray"
          radius="large"
          scaling="100%"
        >
          <App />
        </RadixTheme>
      </HealthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
