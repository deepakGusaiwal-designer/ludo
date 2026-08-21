import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

// Default Socket Server URL (local or deployed environment)
const SERVER_URL =
  import.meta.env?.VITE_SOCKET_URL || "http://localhost:3001";

const SESSION_KEY = "ludo_session_token";
const ROOM_CODE_KEY = "ludo_saved_room_code";

function getSessionToken() {
  let token = sessionStorage.getItem(SESSION_KEY);
  if (!token) {
    token = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, token);
  }
  return token;
}

export function useOnlineLudo() {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState(null);
  const [myColor, setMyColor] = useState(null);
  const [error, setError] = useState(null);
  const [reconnectedGameState, setReconnectedGameState] = useState(null);
  const [notification, setNotification] = useState(null);

  const sessionToken = useRef(getSessionToken()).current;

  useEffect(() => {
    const socket = io(SERVER_URL, {
      autoConnect: true,
      transports: ["polling", "websocket"],
      reconnectionAttempts: 8,
      reconnectionDelay: 1500,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      setError(null);

      // Auto-reconnect if browser was refreshed during an active match
      const savedCode = sessionStorage.getItem(ROOM_CODE_KEY);
      if (savedCode) {
        socket.emit(
          "reconnect_room",
          { roomCode: savedCode, sessionToken },
          ({ success, room: reconnectedRoom, myColor: restoredColor, gameState }) => {
            const isEnded = gameState && (gameState.status === "over" || gameState.state?.winner);
            if (success && !isEnded) {
              setRoom({ ...reconnectedRoom });
              if (restoredColor) setMyColor(restoredColor);
              if (gameState) setReconnectedGameState(gameState);
              setNotification("Reconnected to match!");
              setTimeout(() => setNotification(null), 3500);
            } else {
              sessionStorage.removeItem(ROOM_CODE_KEY);
            }
          }
        );
      }
    });

    socket.on("connect_error", () => {
      setIsConnected(false);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("room_updated", (updatedRoom) => {
      setRoom({ ...updatedRoom });
      const me = updatedRoom.players.find(
        (p) => p.sessionToken === sessionToken || p.socketId === socket.id
      );
      if (me) setMyColor(me.color);
    });

    socket.on("match_started", (updatedRoom) => {
      setRoom({ ...updatedRoom });
      const me = updatedRoom.players.find(
        (p) => p.sessionToken === sessionToken || p.socketId === socket.id
      );
      if (me) setMyColor(me.color);
    });

    socket.on("player_reconnected", ({ name, color }) => {
      setNotification(`${name} (${color}) reconnected!`);
      setTimeout(() => setNotification(null), 3500);
    });

    socket.on("player_disconnected_temporarily", ({ name, color }) => {
      setNotification(`${name} disconnected. Holding slot...`);
      setTimeout(() => setNotification(null), 3500);
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionToken]);

  const createRoom = useCallback(
    (playerName, mode = "1v1") => {
      return new Promise((resolve) => {
        if (!socketRef.current) return resolve(false);
        socketRef.current.emit(
          "create_room",
          { playerName, mode, sessionToken },
          ({ success, room: createdRoom, error: err }) => {
            if (success) {
              setRoom(createdRoom);
              setMyColor("red");
              sessionStorage.setItem(ROOM_CODE_KEY, createdRoom.code);
              setError(null);
              resolve(true);
            } else {
              setError(err || "Failed to create room.");
              resolve(false);
            }
          },
        );
      });
    },
    [sessionToken],
  );

  const joinRoom = useCallback(
    (roomCode, playerName) => {
      return new Promise((resolve) => {
        if (!socketRef.current) return resolve(false);
        socketRef.current.emit(
          "join_room",
          { roomCode, playerName, sessionToken },
          ({ success, room: joinedRoom, myColor: assignedColor, gameState, error: err }) => {
            if (success) {
              setRoom(joinedRoom);
              sessionStorage.setItem(ROOM_CODE_KEY, joinedRoom.code);
              const me = joinedRoom.players.find(
                (p) => p.sessionToken === sessionToken || p.socketId === socketRef.current.id,
              );
              if (me) setMyColor(me.color);
              else if (assignedColor) setMyColor(assignedColor);

              if (gameState) setReconnectedGameState(gameState);
              setError(null);
              resolve(true);
            } else {
              setError(err || "Failed to join room.");
              resolve(false);
            }
          },
        );
      });
    },
    [sessionToken],
  );

  const updateRoomConfig = useCallback(
    (controllers, difficulty) => {
      if (!socketRef.current || !room) return;
      socketRef.current.emit("update_room_config", {
        roomCode: room.code,
        controllers,
        difficulty,
      });
    },
    [room],
  );

  const startOnlineMatch = useCallback(() => {
    if (!socketRef.current || !room) return;
    socketRef.current.emit("start_online_match", { roomCode: room.code });
  }, [room]);

  const syncGameState = useCallback(
    (gameState) => {
      if (!socketRef.current || !room) return;
      socketRef.current.emit("sync_game_state", {
        roomCode: room.code,
        gameState,
      });
    },
    [room],
  );

  const sendRollDice = useCallback(
    (color, value) => {
      if (!socketRef.current || !room) return;
      socketRef.current.emit("action_roll_dice", {
        roomCode: room.code,
        color,
        value,
      });
    },
    [room],
  );

  const sendMoveToken = useCallback(
    (tokenId, color) => {
      if (!socketRef.current || !room) return;
      socketRef.current.emit("action_move_token", {
        roomCode: room.code,
        tokenId,
        color,
      });
    },
    [room],
  );

  const leaveRoom = useCallback(() => {
    sessionStorage.removeItem(ROOM_CODE_KEY);
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.connect();
    }
    setRoom(null);
    setMyColor(null);
    setError(null);
    setReconnectedGameState(null);
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    room,
    myColor,
    error,
    notification,
    reconnectedGameState,
    createRoom,
    joinRoom,
    updateRoomConfig,
    startOnlineMatch,
    syncGameState,
    sendRollDice,
    sendMoveToken,
    leaveRoom,
  };
}
