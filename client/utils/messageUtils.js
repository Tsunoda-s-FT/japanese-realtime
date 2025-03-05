/**
 * メッセージデータを処理するためのユーティリティ関数
 */

/**
 * ユーザーとアシスタントのメッセージを別のグループに分ける
 * @param {Array} messages - メッセージの配列
 * @returns {Object} - ユーザーとアシスタントのメッセージグループ
 */
export function groupMessagesByRole(messages) {
  return messages.reduce((acc, message) => {
    if (message.role === "user") {
      acc.userMessages.push(message);
    } else if (message.role === "assistant") {
      acc.assistantMessages.push(message);
    }
    return acc;
  }, { userMessages: [], assistantMessages: [] });
}

/**
 * タイムスタンプでメッセージをソートする
 * @param {Array} messages - メッセージの配列
 * @param {boolean} ascending - 昇順にソートするかどうか
 * @returns {Array} - ソートされたメッセージの配列
 */
export function sortMessagesByTimestamp(messages, ascending = true) {
  return [...messages].sort((a, b) => {
    const timeA = a.timestamp || 0;
    const timeB = b.timestamp || 0;
    return ascending ? timeA - timeB : timeB - timeA;
  });
}

/**
 * メッセージを読みやすい時間形式でフォーマットする
 * @param {Object} message - メッセージオブジェクト
 * @returns {string} - フォーマットされた時間
 */
export function formatMessageTime(message) {
  if (!message.timestamp) return "";
  
  const date = new Date(message.timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}