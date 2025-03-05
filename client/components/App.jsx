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
    // Get an ephemeral key from the Fastify server
    const tokenResponse = await fetch("/token");
    const data = await tokenResponse.json();
    const EPHEMERAL_KEY = data.client_secret.value;

    // Create a peer connection
    const pc = new RTCPeerConnection();

    // Set up to play remote audio from the model
    audioElement.current = document.createElement("audio");
    audioElement.current.autoplay = true;
    pc.ontrack = (e) => (audioElement.current.srcObject = e.streams[0]);

    // Add local audio track for microphone input in the browser
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

    // Start the session using the Session Description Protocol (SDP)
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const baseUrl = "https://api.openai.com/v1/realtime";
    const model = "gpt-4o-realtime-preview-2024-12-17";
    try {
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
      });

      if (!sdpResponse.ok) {
        throw new Error(`Server response: ${sdpResponse.status}`);
      }

      const answer = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);

      peerConnection.current = pc;
    } catch (error) {
      console.error("Connection error:", error);
      setStatus("error");
      return;
    }
  }

  // Stop current session, clean up peer connection and data channel
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
      console.error(
        "Failed to send message - no data channel available",
        message,
      );
    }
  }

  // Send a text message to the model
  function sendTextMessage(message) {
    // Update local state to show user message immediately
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

  // Process events to extract messages and status
  useEffect(() => {
    if (events.length === 0) return;

    const latestEvent = events[0];
    console.log("Processing event:", latestEvent.type);

    // Update status based on event types
    if (latestEvent.type === "response.content_part.added") {
      setStatus("responding");
      
      // 個別のテキスト部分を抽出して追加
      if (latestEvent.content_part && latestEvent.content_part.type === "text") {
        const newText = latestEvent.content_part.text;
        
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          
          // 最後のメッセージがアシスタントのメッセージならそれを更新、なければ新規作成
          if (lastMessage && lastMessage.role === "assistant") {
            const updatedMessages = [...prev];
            updatedMessages[prev.length - 1] = {
              ...lastMessage,
              content: lastMessage.content + newText
            };
            return updatedMessages;
          } else {
            return [...prev, { role: "assistant", content: newText }];
          }
        });
      }
    } else if (latestEvent.type === "response.done") {
      setStatus("idle");
    } else if (latestEvent.type === "conversation.item.created") {
      // 会話アイテムが作成されたとき（ユーザーまたはアシスタント）
      if (latestEvent.item && latestEvent.item.role === "assistant") {
        // アシスタントの完全なメッセージの場合
        const assistantContent = latestEvent.item.content;
        if (Array.isArray(assistantContent)) {
          const textContent = assistantContent
            .filter(part => part.type === "text")
            .map(part => part.text)
            .join("");
          
          if (textContent) {
            // 既存のメッセージを置き換える（重複を避けるため）
            setMessages(prev => {
              const withoutLastAssistant = prev.filter(m => m.role !== "assistant");
              return [...withoutLastAssistant, { role: "assistant", content: textContent }];
            });
          }
        }
      }
    } else if (latestEvent.type === "audio_transcript.delta") {
      setStatus("listening");
      // 音声文字起こしデータの表示（オプション）
      if (latestEvent.delta && latestEvent.delta.text) {
        const transcribedText = latestEvent.delta.text;
        // 一時的な文字起こしとして表示することも可能
        console.log("Transcribed:", transcribedText);
      }
    }
  }, [events]);

  // Attach event listeners to the data channel when a new one is created
  useEffect(() => {
    if (dataChannel) {
      // Append new server events to the list
      dataChannel.addEventListener("message", (e) => {
        const eventData = JSON.parse(e.data);
        console.log("Received event:", eventData.type, eventData);
        setEvents((prev) => [eventData, ...prev]);
      });

      // Set session active when the data channel is opened
      dataChannel.addEventListener("open", () => {
        setIsSessionActive(true);
        setEvents([]);
        setStatus("connected");
      });

      dataChannel.addEventListener("close", () => {
        setIsSessionActive(false);
        setStatus("idle");
      });
    }
  }, [dataChannel]);

  return (
    <div className="flex flex-col h-full">
      <nav className="h-16 flex items-center border-b border-gray-200">
        <div className="flex items-center gap-4 w-full mx-4">
          <img className="w-6 h-6" src={logo} alt="OpenAI Logo" />
          <h1 className="text-lg">学校のシチュエーション さき</h1>
        </div>
      </nav>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden relative">
          <ConversationDisplay messages={messages} status={status} />
        </div>
        
        <div className="h-20 p-2 border-t border-gray-200">
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
