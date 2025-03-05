import { useState, useRef, useEffect } from "react";

/**
 * OpenAI Realtime API との WebRTC 接続を管理するカスタムフック
 */
export default function useRealtime() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("idle");
  const [dataChannel, setDataChannel] = useState(null);
  const peerConnection = useRef(null);
  const audioElement = useRef(null);

  // セッション開始
  async function startSession() {
    setStatus("connecting");
    try {
      // サーバーからの一時的なトークンを取得
      const tokenResponse = await fetch("/token");
      const data = await tokenResponse.json();
      const EPHEMERAL_KEY = data.client_secret.value;

      // WebRTC ピア接続の作成
      const pc = new RTCPeerConnection();

      // AIからの音声を再生するためのオーディオ要素を設定
      audioElement.current = document.createElement("audio");
      audioElement.current.autoplay = true;
      pc.ontrack = (e) => (audioElement.current.srcObject = e.streams[0]);

      // マイク入力用のローカルオーディオトラックを追加
      try {
        const ms = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        pc.addTrack(ms.getTracks()[0]);
      } catch (error) {
        console.error("マイクへのアクセスエラー:", error);
        setStatus("error");
        return;
      }

      // イベント送受信用のデータチャネルを設定
      const dc = pc.createDataChannel("oai-events");
      setDataChannel(dc);

      // SDP を使用してセッションを開始
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

  // セッションの停止とクリーンアップ
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

  // モデルにイベントを送信
  function sendClientEvent(message) {
    if (dataChannel) {
      message.event_id = message.event_id || crypto.randomUUID();
      dataChannel.send(JSON.stringify(message));
      setEvents((prev) => [message, ...prev]);
    } else {
      console.error("データチャネルがありません", message);
    }
  }

  // テキストメッセージを送信
  function sendTextMessage(message) {
    // ローカル状態をすぐに更新
    setMessages(prev => [...prev, { role: "user", content: message, timestamp: Date.now() }]);
    
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

  // データチャネルのイベントリスナーを設定
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
        console.error("イベントデータの解析エラー:", error);
      }
    };
    
    const handleOpen = () => {
      console.log("データチャネルが開かれました");
      setIsSessionActive(true);
      setEvents([]);
      setStatus("connected");
    };
    
    const handleClose = () => {
      console.log("データチャネルが閉じられました");
      setIsSessionActive(false);
      setStatus("idle");
    };
    
    const handleError = (error) => {
      console.error("データチャネルエラー:", error);
      setStatus("error");
    };
    
    // イベントリスナーの追加
    dataChannel.addEventListener("message", handleMessage);
    dataChannel.addEventListener("open", handleOpen);
    dataChannel.addEventListener("close", handleClose);
    dataChannel.addEventListener("error", handleError);
    
    // アンマウント時のイベントリスナーのクリーンアップ
    return () => {
      dataChannel.removeEventListener("message", handleMessage);
      dataChannel.removeEventListener("open", handleOpen);
      dataChannel.removeEventListener("close", handleClose);
      dataChannel.removeEventListener("error", handleError);
    };
  }, [dataChannel]);

  return {
    isSessionActive,
    messages,
    status,
    events,
    startSession,
    stopSession,
    sendTextMessage
  };
}