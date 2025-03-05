import { useEffect, useRef, useState } from "react";
import logo from "/assets/openai-logomark.svg";
import SessionControls from "./SessionControls";
import ConversationDisplay from "./ConversationDisplay";

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("idle");
  const [dataChannel, setDataChannel] = useState(null);
  const peerConnection = useRef(null);
  const audioElement = useRef(null);

  async function startSession() {
    setStatus("connecting");
    try {
      // Get an ephemeral key from the server
      const tokenResponse = await fetch("/token");
      const data = await tokenResponse.json();
      const EPHEMERAL_KEY = data.client_secret.value;

      // Create a peer connection
      const pc = new RTCPeerConnection();

      // Set up to play remote audio from the model
      audioElement.current = document.createElement("audio");
      audioElement.current.autoplay = true;
      pc.ontrack = (e) => (audioElement.current.srcObject = e.streams[0]);

      // Add local audio track for microphone input
      try {
        const ms = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        pc.addTrack(ms.getTracks()[0]);
      } catch (error) {
        console.error("Error accessing microphone:", error);
        setStatus("error");
        return;
      }

      // Set up data channel for sending and receiving events
      const dc = pc.createDataChannel("oai-events");
      setDataChannel(dc);

      // Start the session using SDP
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
      });

      if (!sdpResponse.ok) {
        throw new Error(`サーバーエラー: ${sdpResponse.status}`);
      }

      const answer = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);

      peerConnection.current = pc;
    } catch (error) {
      console.error("接続エラー:", error);
      setStatus("error");
    }
  }

  // Stop current session and clean up
  function stopSession() {
    if (dataChannel) {
      dataChannel.close();
    }

    if (peerConnection.current) {
      peerConnection.current.getSenders().forEach((sender) => {
        if (sender.track) {
          sender.track.stop();
        }
      });
      peerConnection.current.close();
    }

    setIsSessionActive(false);
    setDataChannel(null);
    peerConnection.current = null;
    setStatus("idle");
    setMessages([]);
  }

  // Send a message to the model
  function sendClientEvent(message) {
    if (dataChannel) {
      message.event_id = message.event_id || crypto.randomUUID();
      dataChannel.send(JSON.stringify(message));
      setEvents((prev) => [message, ...prev]);
    } else {
      console.error("データチャネルがありません", message);
    }
  }

  // Send a text message to the model
  function sendTextMessage(message) {
    // Update local state immediately
    setMessages(prev => [...prev, { role: "user", content: message }]);
    
    const event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: message,
          },
        ],
      },
    };

    setStatus("sending");
    sendClientEvent(event);
    sendClientEvent({ type: "response.create" });
  }

  // Attach event listeners to the data channel
  useEffect(() => {
    if (!dataChannel) return;
    
    const handleMessage = (e) => {
      try {
        const eventData = JSON.parse(e.data);
        console.log("RECEIVED EVENT:", eventData.type, eventData);
        
        // 特定のイベントを直接処理
        if (eventData.type === "response.audio_transcript.done") {
          console.log("***** 文字起こし完了イベント受信 *****", eventData.transcript);
          
          if (eventData.transcript && eventData.item_id) {
            setMessages(prev => {
              // 新しいメッセージを作成
              const newMessage = {
                role: "assistant",
                content: eventData.transcript,
                item_id: eventData.item_id,
                timestamp: Date.now()
              };
              
              // 既存のメッセージを探索
              const existingIndex = prev.findIndex(m => m.item_id === eventData.item_id);
              
              if (existingIndex >= 0) {
                // 既存のメッセージを更新
                const updatedMessages = [...prev];
                updatedMessages[existingIndex] = newMessage;
                return updatedMessages;
              } else {
                // 新しいメッセージとして追加
                return [...prev, newMessage];
              }
            });
          }
        }
        
        // バックアップとして content_part.done も処理
        else if (eventData.type === "response.content_part.done" && 
                 eventData.part?.type === "audio" && 
                 eventData.part?.transcript) {
          console.log("***** コンテンツパート完了イベント受信 *****", eventData.part.transcript);
          
          if (eventData.part.transcript && eventData.item_id) {
            setMessages(prev => {
              // 既存のメッセージを探索
              const existingIndex = prev.findIndex(m => m.item_id === eventData.item_id);
              
              // 新しいメッセージを作成
              const newMessage = {
                role: "assistant",
                content: eventData.part.transcript,
                item_id: eventData.item_id,
                timestamp: Date.now()
              };
              
              if (existingIndex >= 0) {
                // 既存のメッセージを更新
                const updatedMessages = [...prev];
                updatedMessages[existingIndex] = newMessage;
                return updatedMessages;
              } else {
                // 新しいメッセージとして追加
                return [...prev, newMessage];
              }
            });
          }
        }
        
        // ユーザーメッセージの処理
        else if (eventData.type === "conversation.item.created" && 
                 eventData.item?.role === "user" && 
                 eventData.item?.content) {
          
          const userContent = eventData.item.content;
          let userText = "";
          
          if (Array.isArray(userContent)) {
            userText = userContent
              .filter(part => part.type === "text" || part.type === "user_message" || part.type === "input_text")
              .map(part => part.text || "")
              .join("");
          }
          
          if (userText) {
            setMessages(prev => {
              // 直近のユーザーメッセージと重複しないようにチェック
              if (prev.length > 0 && 
                  prev[prev.length - 1].role === "user" && 
                  prev[prev.length - 1].content === userText) {
                return prev;
              }
              
              return [...prev, { 
                role: "user", 
                content: userText,
                item_id: eventData.item.id,
                timestamp: Date.now()
              }];
            });
          }
        }
        
        // 状態の更新
        if (eventData.type === "input_audio_buffer.speech_started") {
          setStatus("listening");
        } else if (eventData.type === "response.content_part.added") {
          setStatus("responding");
        } else if (eventData.type === "response.done") {
          setStatus("idle");
        }
        
        // イベントリストに追加
        setEvents((prev) => [eventData, ...prev]);
      } catch (error) {
        console.error("Error parsing event data:", error);
      }
    };
    
    const handleOpen = () => {
      console.log("Data channel opened");
      setIsSessionActive(true);
      setEvents([]);
      setStatus("connected");
    };
    
    const handleClose = () => {
      console.log("Data channel closed");
      setIsSessionActive(false);
      setStatus("idle");
    };
    
    const handleError = (error) => {
      console.error("Data channel error:", error);
      setStatus("error");
    };
    
    // Add event listeners
    dataChannel.addEventListener("message", handleMessage);
    dataChannel.addEventListener("open", handleOpen);
    dataChannel.addEventListener("close", handleClose);
    dataChannel.addEventListener("error", handleError);
    
    // Clean up event listeners on unmount
    return () => {
      dataChannel.removeEventListener("message", handleMessage);
      dataChannel.removeEventListener("open", handleOpen);
      dataChannel.removeEventListener("close", handleClose);
      dataChannel.removeEventListener("error", handleError);
    };
  }, [dataChannel]);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* ヘッダー */}
      <header className="h-14 flex items-center border-b border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-4 w-full">
          <img className="w-6 h-6" src={logo} alt="OpenAI Logo" />
          <h1 className="text-lg font-medium text-slate-800">学校のシチュエーション さき</h1>
        </div>
      </header>
      
      {/* メインコンテンツ */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 会話表示エリア */}
        <div className="flex-1 overflow-hidden relative">
          <ConversationDisplay 
            messages={messages} 
            status={status} 
          />
        </div>
        
        {/* 入力コントロールエリア */}
        <div className="py-3 px-4 border-t border-slate-200 bg-white">
          <SessionControls
            startSession={startSession}
            stopSession={stopSession}
            sendTextMessage={sendTextMessage}
            isSessionActive={isSessionActive}
            status={status}
          />
        </div>
      </main>
    </div>
  );
}