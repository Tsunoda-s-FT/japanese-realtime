import React, { useEffect, useRef } from "react";
import { MessageCircle, Mic, Send, AlertCircle } from "react-feather";

// ステータスメッセージとアイコンのマッピング
const statusConfig = {
  idle: { 
    message: null, 
    icon: null 
  },
  connecting: { 
    message: "接続しています...", 
    icon: <MessageCircle className="animate-pulse" size={16} />, 
    color: "text-blue-500" 
  },
  connected: { 
    message: "接続しました", 
    icon: <MessageCircle size={16} />, 
    color: "text-green-500" 
  },
  listening: { 
    message: "聞き取り中... 🎤", 
    icon: <Mic className="animate-pulse" size={16} />, 
    color: "text-purple-500" 
  },
  sending: { 
    message: "送信中... ⏳", 
    icon: <Send className="animate-pulse" size={16} />, 
    color: "text-blue-500" 
  },
  responding: { 
    message: "返答中... 💬", 
    icon: <MessageCircle className="animate-pulse" size={16} />, 
    color: "text-green-500" 
  },
  error: { 
    message: "エラーが発生しました ❌", 
    icon: <AlertCircle size={16} />, 
    color: "text-red-500" 
  }
};

export default function ConversationDisplay({ messages, status }) {
  const containerRef = useRef(null);

  // 新しいメッセージが来たら自動スクロール
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, status]);

  // デバッグ用：メッセージの内容を確認
  useEffect(() => {
    console.log("Current messages:", messages);
  }, [messages]);

  // 現在のステータス情報
  const currentStatus = statusConfig[status] || statusConfig.idle;
  
  // ステータスインジケーター
  const StatusIndicator = () => {
    if (!currentStatus.message) return null;
    
    return (
      <div className={`flex items-center justify-center gap-2 py-2 px-3 rounded-full bg-slate-100 text-sm mx-auto my-3 ${currentStatus.color || ""}`}>
        {currentStatus.icon}
        <span>{currentStatus.message}</span>
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      className="h-full px-4 py-4 overflow-y-auto"
    >
      {messages.length === 0 ? (
        // メッセージがない場合のプレースホルダー
        <div className="flex flex-col items-center justify-center h-full text-slate-500">
          <MessageCircle size={36} className="mb-3 text-slate-300" />
          <p className="text-center">会話を開始してください</p>
          {currentStatus.message && <StatusIndicator />}
        </div>
      ) : (
        // メッセージリスト
        <div className="flex flex-col gap-3">
          {messages.map((message, index) => (
            <div 
              key={`${message.item_id || index}-${message.timestamp || Date.now()}`}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`
                  max-w-[85%] px-4 py-3 rounded-2xl 
                  ${message.role === "user" 
                    ? "bg-blue-50 text-slate-800 rounded-br-sm" 
                    : "bg-white text-slate-800 rounded-bl-sm border border-slate-200"
                  }
                `}
              >
                <div>{message.content}</div>
                {message.role === "assistant" && 
                  <div className="mt-1 text-xs text-slate-400 italic">
                    文字起こし完了
                  </div>
                }
              </div>
            </div>
          ))}
          
          {/* 現在のステータス表示 */}
          {currentStatus.message && <StatusIndicator />}
        </div>
      )}
    </div>
  );
}