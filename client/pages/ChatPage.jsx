import React from "react";
import Layout from "../components/Layout";
import ChatHeader from "../components/chat/ChatHeader";
import ChatContainer from "../components/chat/ChatContainer";
import SessionController from "../components/chat/SessionController";
import useRealtime from "../hooks/useRealtime";

/**
 * チャットページコンポーネント
 */
export default function ChatPage() {
  const {
    isSessionActive,
    messages,
    status,
    startSession,
    stopSession,
    sendTextMessage
  } = useRealtime();

  return (
    <Layout
      header={<ChatHeader />}
    >
      {/* チャットコンテナ */}
      <ChatContainer 
        messages={messages} 
        status={status} 
      />
      
      {/* 入力コントロールエリア */}
      <div className="fixed-container bottom-0 py-4 px-5 mb-2 mx-2 border border-slate-200 rounded-xl bg-white shadow-sm safe-bottom">
        <SessionController
          isSessionActive={isSessionActive}
          status={status}
          startSession={startSession}
          stopSession={stopSession}
          sendTextMessage={sendTextMessage}
        />
      </div>
    </Layout>
  );
}