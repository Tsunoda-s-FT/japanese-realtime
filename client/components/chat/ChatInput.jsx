import React, { useState, useRef } from "react";
import { Send } from "react-feather";
import TextInput from "../ui/TextInput";
import Button from "../ui/Button";

/**
 * チャットの入力フィールドコンポーネント
 */
export default function ChatInput({ onSendMessage, disabled = false }) {
  const [message, setMessage] = useState("");
  const inputRef = useRef(null);

  function handleSendMessage() {
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage("");
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <TextInput
        ref={inputRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="メッセージを入力..."
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && message.trim() && !disabled) {
            e.preventDefault();
            handleSendMessage();
          }
        }}
      />
      
      <Button
        onClick={handleSendMessage}
        variant="primary"
        size="icon"
        disabled={!message.trim() || disabled}
        icon={<Send />}
        aria-label="送信"
      />
    </div>
  );
}