import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./Components/App/App.jsx";
import { ToastProvider } from "./context/ToastContext.js";
import ToastRoot from "./Components/Toast/ToastRoot.jsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <App />
        <ToastRoot />
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>
);
