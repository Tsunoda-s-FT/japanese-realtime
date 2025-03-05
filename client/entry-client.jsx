import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import ChatPage from "./pages/ChatPage";
import "./styles/base.css";

ReactDOM.hydrateRoot(
  document.getElementById("root"),
  <StrictMode>
    <ChatPage />
  </StrictMode>,
);