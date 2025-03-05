import React from "react";
import ChatHeader from "./chat/ChatHeader";

/**
 * 全体レイアウトコンポーネント
 */
export default function Layout({ children, header }) {
  return (
    <div className="h-full flex flex-col bg-slate-50 relative">
      {header}
      <main className="h-full pt-14">
        {children}
      </main>
    </div>
  );
}