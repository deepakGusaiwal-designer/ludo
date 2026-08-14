import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

// Default Socket Server URL (local or deployed environment)
const SERVER_URL =
  import.meta.env?.VITE_SOCKET_URL || "http://localhost:3001";

export function useOnlineLudo() {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState(null);
  const [myColor, setMyColor] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const socket = io(SERVER_URL, {
      autoConnect: true,
      transports: ["polling", "websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      setError(null);
    });

    socket.on("connect_error", () => {
      setIsConnected(false);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("room_updated", (updatedRoom) => {
      setRoom({ ...updatedRoom });
      const me = updatedRoom.players.find((p) => p.socketId === socket.id);
      if (me) setMyColor(me.color);
    });

    socket.on("match_started", (updatedRoom) => {
      setRoom({ ...updatedRoom });
      const me = updatedRoom.players.find((p) => p.socketId === socket.id);
      if (me) setMyColor(me.color);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createRoom = useCallback((playerName, mode = "1v1") => {
    return new Promise((resolve) => {
      if (!socketRef.current) return resolve(false);
      socketRef.current.emit(
        "create_room",
        { playerName, mode },
        ({ success, room: createdRoom, error: err }) => {
          if (success) {
            setRoom(createdRoom);
            setMyColor("red");
            setError(null);
            resolve(true);
          } else {
            setError(err || "Failed to create room.");
            resolve(false);
          }
        },
      );
    });
  }, []);

  const joinRoom = useCallback((roomCode, playerName) => {
    return new Promise((resolve) => {
      if (!socketRef.current) return resolve(false);
      socketRef.current.emit(
        "join_room",
        { roomCode, playerName },
        ({ success, room: joinedRoom, error: err }) => {
          if (success) {
            setRoom(joinedRoom);
            const me = joinedRoom.players.find(
              (p) => p.socketId === socketRef.current.id,
            );
            if (me) setMyColor(me.color);
            setError(null);
            resolve(true);
          } else {
            setError(err || "Failed to join room.");
            resolve(false);
          }
        },
      );
    });
  }, []);

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
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.connect();
    }
    setRoom(null);
    setMyColor(null);
    setError(null);
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    room,
    myColor,
    error,
    createRoom,
    joinRoom,
    updateRoomConfig,
    startOnlineMatch,
    sendRollDice,
    sendMoveToken,
    leaveRoom,
  };
}
