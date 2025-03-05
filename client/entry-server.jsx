import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import ChatPage from "./pages/ChatPage";

export function render() {
  const html = renderToString(
    <StrictMode>
      <ChatPage />
    </StrictMode>,
  );
  return { html };
}