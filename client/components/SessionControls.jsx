import { useState, useRef } from "react";
import { MessageCircle, CloudOff, Mic, Play, Send } from "react-feather";
import Button from "./Button";

function SessionStopped({ startSession, status }) {
  const isConnecting = status === "connecting";

  return (
    <div className="flex justify-center w-full">
      <Button
        onClick={startSession}
        variant={isConnecting ? "secondary" : "primary"}
        disabled={isConnecting}
        icon={isConnecting ? <MessageCircle className="animate-pulse" /> : <Play />}
      >
        {isConnecting ? "接続中..." : "会話を開始"}
      </Button>
    </div>
  );
}

function SessionActive({ stopSession, sendTextMessage, status }) {
  const [message, setMessage] = useState("");
  const inputRef = useRef(null);
  const isBusy = status === "sending" || status === "listening";

  function handleSendMessage() {
    if (message.trim() && !isBusy) {
      sendTextMessage(message);
      setMessage("");
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }

  return (
    <div className="flex items-center w-full gap-2">
      <input
        ref={inputRef}
        type="text"
        placeholder="メッセージを入力..."
        className="flex-1 px-4 py-3 border border-slate-300 rounded-full text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && message.trim() && !isBusy) {
            handleSendMessage();
          }
        }}
        disabled={isBusy}
      />
      
      <Button
        onClick={handleSendMessage}
        variant="primary"
        size="icon"
        disabled={!message.trim() || isBusy}
        icon={<Send />}
        aria-label="送信"
      />
      
      <Button 
        onClick={stopSession} 
        variant="secondary"
        size="icon"
        icon={<CloudOff />}
        aria-label="切断"
      />
    </div>
  );
}

export default function SessionControls({
  startSession,
  stopSession,
  sendTextMessage,
  isSessionActive,
  status
}) {
  return (
    isSessionActive ? (
      <SessionActive
        stopSession={stopSession}
        sendTextMessage={sendTextMessage}
        status={status}
      />
    ) : (
      <SessionStopped 
        startSession={startSession} 
        status={status}
      />
    )
  );
}