import React, { useEffect, useRef } from "react";

// ステータスメッセージのマッピング
const statusMessages = {
  idle: null,
  connecting: "接続中...",
  connected: "接続しました",
  listening: "聞き取り中...",
  sending: "送信中...",
  responding: "返答中...",
  error: "エラーが発生しました"
};

export default function ConversationDisplay({ messages, status }) {
  const containerRef = useRef(null);

  // 新しいメッセージが来たら自動スクロール
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, status]);

  // ステータスインジケーターの表示
  const statusIndicator = statusMessages[status] ? (
    <div className="status-indicator">
      {statusMessages[status]}
    </div>
  ) : null;

  return (
    <div 
      ref={containerRef}
      className="conversation-container h-full"
    >
      {messages.length === 0 && !statusIndicator ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <p>会話を開始してください</p>
        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <div 
              key={index}
              className={`message-bubble ${
                message.role === "user" ? "user-message" : "ai-message"
              }`}
            >
              {message.content}
            </div>
          ))}
          {statusIndicator}
        </>
      )}
    </div>
  );
} 