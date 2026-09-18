const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:5000/ws";

export function createBoardSocket(boardId, token, handlers = {}) {
  const socket = new WebSocket(`${WS_URL}?boardId=${encodeURIComponent(boardId)}&token=${encodeURIComponent(token)}`);

  socket.onopen = () => handlers.onOpen?.();
  socket.onmessage = (event) => {
    try { handlers.onMessage?.(JSON.parse(event.data)); }
    catch { handlers.onError?.(new Error("Invalid server message")); }
  };
  socket.onerror = () => handlers.onError?.(new Error("WebSocket connection error"));
  socket.onclose = (event) => handlers.onClose?.(event);

  return {
    send(payload) {
      if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload));
    },
    close() { socket.close(); },
    get readyState() { return socket.readyState; }
  };
}
