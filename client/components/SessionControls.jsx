import { useState } from "react";
import { CloudLightning, CloudOff, MessageSquare, Mic } from "react-feather";
import Button from "./Button";

function SessionStopped({ startSession, status }) {
  const isConnecting = status === "connecting";

  return (
    <div className="flex items-center justify-center w-full h-full">
      <Button
        onClick={startSession}
        className={isConnecting ? "bg-gray-600" : "bg-blue-500"}
        disabled={isConnecting}
        icon={<CloudLightning height={20} />}
      >
        {isConnecting ? "接続中..." : "会話を開始"}
      </Button>
    </div>
  );
}

function SessionActive({ stopSession, sendTextMessage, status }) {
  const [message, setMessage] = useState("");
  const isBusy = status === "sending" || status === "listening";

  function handleSendClientEvent() {
    if (message.trim()) {
      sendTextMessage(message);
      setMessage("");
    }
  }

  return (
    <div className="flex items-center justify-center w-full h-full gap-2">
      <input
        onKeyDown={(e) => {
          if (e.key === "Enter" && message.trim() && !isBusy) {
            handleSendClientEvent();
          }
        }}
        type="text"
        placeholder="メッセージを入力..."
        className="border border-gray-300 rounded-full py-3 px-4 flex-1 text-base"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={isBusy}
      />
      <Button
        onClick={handleSendClientEvent}
        icon={<MessageSquare height={20} />}
        className="bg-blue-500 p-3"
        disabled={!message.trim() || isBusy}
      />
      <Button 
        onClick={stopSession} 
        icon={<CloudOff height={20} />}
        className="bg-gray-600 p-3" 
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
    <div className="flex gap-2 h-full">
      {isSessionActive ? (
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
      )}
    </div>
  );
}
