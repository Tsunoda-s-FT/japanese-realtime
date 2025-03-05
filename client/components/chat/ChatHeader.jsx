import React from "react";
import logo from "/assets/openai-logomark.svg";

/**
 * チャットヘッダーコンポーネント
 */
export default function ChatHeader({ title = "カフェのシチュエーション" }) {
  return (
    <header className="fixed-container top-0 h-14 flex items-center border-b border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 px-4 w-full">
        <img className="w-6 h-6" src={logo} alt="OpenAI Logo" />
        <h1 className="text-lg font-medium text-slate-800 truncate">
          {title}
        </h1>
      </div>
    </header>
  );
}