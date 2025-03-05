import React from "react";
import { CloudOff, Play, MessageCircle } from "react-feather";
import Button from "../ui/Button";
import ChatInput from "./ChatInput";

/**
 * セッションコントロールコンポーネント
 * セッションの開始・終了や入力コントロールを管理
 */
export default function SessionController({
  isSessionActive,
  status,
  startSession,
  stopSession,
  sendTextMessage
}) {
  const isBusy = status === "sending" || status === "listening" || status === "connecting";
  
  // セッション未開始時
  if (!isSessionActive) {
    return (
      <div className="flex justify-center w-full">
        <Button
          onClick={startSession}
          variant={status === "connecting" ? "secondary" : "primary"}
          disabled={status === "connecting"}
          icon={status === "connecting" ? <MessageCircle className="animate-pulse" /> : <Play />}
        >
          {status === "connecting" ? "接続中..." : "会話を開始"}
        </Button>
      </div>
    );
  }
  
  // セッション開始時
  return (
    <div className="flex items-center w-full gap-2">
      <div className="flex-1">
        <ChatInput 
          onSendMessage={sendTextMessage} 
          disabled={isBusy}
        />
      </div>
      
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