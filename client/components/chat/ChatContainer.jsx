import React, { useRef, useEffect } from "react";
import { MessageCircle } from "react-feather";
import ChatBubble from "./ChatBubble";
import StatusIndicator from "../ui/StatusIndicator";

/**
 * チャットメッセージと状態を表示するコンテナ
 */
export default function ChatContainer({ messages, status }) {
  const containerRef = useRef(null);

  // 新しいメッセージが来たら自動スクロール
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, status]);

  return (
    <div 
      ref={containerRef}
      className="chat-area-container px-4 py-4"
    >
      {messages.length === 0 ? (
        // メッセージがない場合のプレースホルダー
        <div className="flex flex-col items-center justify-center h-full text-slate-500">
          <MessageCircle size={36} className="mb-3 text-slate-300" />
          <p className="text-center">会話を開始してください</p>
          <StatusIndicator status={status} />
        </div>
      ) : (
        // メッセージリスト
        <div className="flex flex-col">
          {messages.map((message, index) => (
            <ChatBubble 
              key={`${message.item_id || index}-${message.timestamp || Date.now()}`}
              message={message} 
            />
          ))}
          
          {/* 現在のステータス表示 */}
          <StatusIndicator status={status} />
        </div>
      )}
    </div>
  );
}