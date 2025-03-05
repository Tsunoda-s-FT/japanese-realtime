import React from "react";
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

/**
 * 現在のステータスを表示するコンポーネント
 */
export default function StatusIndicator({ status }) {
  const currentStatus = statusConfig[status] || statusConfig.idle;
  
  if (!currentStatus.message) return null;
  
  return (
    <div className={`
      flex items-center justify-center gap-2 
      py-2 px-3 my-3 mx-auto
      rounded-full bg-slate-100 text-sm
      ${currentStatus.color || ""}
    `}>
      {currentStatus.icon}
      <span>{currentStatus.message}</span>
    </div>
  );
}