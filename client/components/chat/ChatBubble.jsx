import React from "react";

/**
 * チャットメッセージの吹き出しコンポーネント
 */
export default function ChatBubble({ message }) {
  const isUser = message.role === "user";
  
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`
          max-w-[85%] px-4 py-3 
          ${isUser 
            ? "bg-blue-50 text-slate-800 rounded-2xl rounded-br-sm" 
            : "bg-white text-slate-800 rounded-2xl rounded-bl-sm border border-slate-200"
          }
        `}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>
        
        {!isUser && (
          <div className="mt-1 text-xs text-slate-400 italic">
            文字起こし完了
          </div>
        )}
      </div>
    </div>
  );
}