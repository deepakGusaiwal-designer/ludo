import { createServer } from "http";
import { Server } from "socket.io";

const PORT = process.env.PORT || 3001;

const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Forest Ludo Realtime Socket Server Running\n");
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

/**
 * In-memory room store.
 */
const rooms = new Map();
const disconnectTimeouts = new Map();

const COLORS = ["red", "green", "yellow", "blue"];

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `LUDO-${code}`;
}

io.on("connection", (socket) => {
  console.log(`[Socket Connected] ID: ${socket.id}`);

  // Create Room
  socket.on("create_room", ({ playerName, mode = "1v1", sessionToken }, callback) => {
    let roomCode = generateRoomCode();
    while (rooms.has(roomCode)) {
      roomCode = generateRoomCode();
    }

    const maxPlayers = mode === "1v1" ? 2 : 4;
    const initialControllers =
      mode === "1v1"
        ? { red: "human", green: "off", yellow: "computer", blue: "off" }
        : { red: "human", green: "computer", yellow: "computer", blue: "computer" };

    const newRoom = {
      code: roomCode,
      hostId: socket.id,
      mode: mode, // "1v1" | "4p"
      maxPlayers: maxPlayers,
      players: [
        {
          socketId: socket.id,
          sessionToken: sessionToken || socket.id,
          name: playerName || "Player 1",
          color: "red",
          isHost: true,
          connected: true,
        },
      ],
      controllers: initialControllers,
      difficulty: "smart",
      started: false,
      gameState: null,
    };

    rooms.set(roomCode, newRoom);
    socket.join(roomCode);

    console.log(`[Room Created] ${roomCode} (${mode} mode) by ${socket.id}`);
    callback({ success: true, room: newRoom });
  });

  // Join Room
  socket.on("join_room", ({ roomCode, playerName, sessionToken }, callback) => {
    const formattedCode = (roomCode || "").toUpperCase().trim();
    const room = rooms.get(formattedCode);

    if (!room) {
      return callback({ success: false, error: "Room not found. Check room code." });
    }

    // Check if player is reconnecting with sessionToken
    const existingPlayer = room.players.find(
      (p) => p.sessionToken && p.sessionToken === sessionToken
    );

    if (existingPlayer) {
      existingPlayer.socketId = socket.id;
      existingPlayer.connected = true;
      socket.join(formattedCode);

      const timeoutKey = `${formattedCode}-${existingPlayer.sessionToken}`;
      if (disconnectTimeouts.has(timeoutKey)) {
        clearTimeout(disconnectTimeouts.get(timeoutKey));
        disconnectTimeouts.delete(timeoutKey);
      }

      io.to(formattedCode).emit("room_updated", room);
      io.to(formattedCode).emit("player_reconnected", {
        color: existingPlayer.color,
        name: existingPlayer.name,
      });

      return callback({
        success: true,
        room,
        isReconnect: true,
        myColor: existingPlayer.color,
        gameState: room.gameState,
      });
    }

    if (room.started) {
      return callback({ success: false, error: "Match already in progress." });
    }

    if (room.players.length >= room.maxPlayers) {
      return callback({
        success: false,
        error: `Room is full (max ${room.maxPlayers} players).`,
      });
    }

    // Pick unused color (prefer yellow opposite corner for 1v1 duel)
    const availableColors = room.mode === "1v1" ? ["yellow", "green", "blue"] : COLORS;
    const usedColors = room.players.map((p) => p.color);
    const freeColor = availableColors.find((c) => !usedColors.includes(c)) || "yellow";

    const newPlayer = {
      socketId: socket.id,
      sessionToken: sessionToken || socket.id,
      name: playerName || `Player ${room.players.length + 1}`,
      color: freeColor,
      isHost: false,
      connected: true,
    };

    room.players.push(newPlayer);
    room.controllers[freeColor] = "human";

    socket.join(formattedCode);

    io.to(formattedCode).emit("room_updated", room);
    console.log(`[Player Joined] ${socket.id} -> ${formattedCode} (${freeColor})`);

    callback({ success: true, room, myColor: freeColor });
  });

  // Reconnect Room (e.g. Page Refresh)
  socket.on("reconnect_room", ({ roomCode, sessionToken }, callback) => {
    const formattedCode = (roomCode || "").toUpperCase().trim();
    const room = rooms.get(formattedCode);

    if (!room) {
      return callback({ success: false, error: "Room no longer active." });
    }

    const player = room.players.find((p) => p.sessionToken === sessionToken);
    if (!player) {
      return callback({ success: false, error: "Session not found in room." });
    }

    player.socketId = socket.id;
    player.connected = true;
    if (player.isHost) {
      room.hostId = socket.id;
    }

    socket.join(formattedCode);

    const timeoutKey = `${formattedCode}-${sessionToken}`;
    if (disconnectTimeouts.has(timeoutKey)) {
      clearTimeout(disconnectTimeouts.get(timeoutKey));
      disconnectTimeouts.delete(timeoutKey);
    }

    io.to(formattedCode).emit("room_updated", room);
    io.to(formattedCode).emit("player_reconnected", {
      color: player.color,
      name: player.name,
    });

    console.log(`[Player Reconnected] ${player.name} (${player.color}) -> ${formattedCode}`);

    callback({
      success: true,
      room,
      myColor: player.color,
      gameState: room.gameState,
    });
  });

  // Host Updates Controllers / Config
  socket.on("update_room_config", ({ roomCode, controllers, difficulty }) => {
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id) return;

    room.controllers = controllers;
    if (difficulty) room.difficulty = difficulty;

    io.to(roomCode).emit("room_updated", room);
  });

  // Start Match
  socket.on("start_online_match", ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id) return;

    room.started = true;
    io.to(roomCode).emit("match_started", room);
    console.log(`[Match Started] ${roomCode}`);
  });

  // Sync Live Game State Snapshot
  socket.on("sync_game_state", ({ roomCode, gameState }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    room.gameState = gameState;
    socket.to(roomCode).emit("remote_state_sync", gameState);
  });

  // Sync Action: Roll Dice
  socket.on("action_roll_dice", ({ roomCode, color, value }) => {
    socket.to(roomCode).emit("remote_roll_dice", { color, value });
  });

  // Sync Action: Move Token
  socket.on("action_move_token", ({ roomCode, tokenId, color }) => {
    socket.to(roomCode).emit("remote_move_token", { tokenId, color });
  });

  // Disconnect with 90s Grace Window for Refresh / Network Drop
  socket.on("disconnect", () => {
    console.log(`[Socket Disconnected] ID: ${socket.id}`);
    for (const [code, room] of rooms.entries()) {
      const player = room.players.find((p) => p.socketId === socket.id);
      if (player) {
        player.connected = false;
        const sessionToken = player.sessionToken;
        const timeoutKey = `${code}-${sessionToken}`;

        io.to(code).emit("player_disconnected_temporarily", {
          color: player.color,
          name: player.name,
        });

        // 90 seconds grace period before permanently removing
        const timeout = setTimeout(() => {
          disconnectTimeouts.delete(timeoutKey);
          const currentRoom = rooms.get(code);
          if (!currentRoom) return;

          const pIndex = currentRoom.players.findIndex(
            (p) => p.sessionToken === sessionToken
          );
          if (pIndex !== -1) {
            const removed = currentRoom.players.splice(pIndex, 1)[0];
            currentRoom.controllers[removed.color] = "off";

            if (currentRoom.players.length === 0) {
              rooms.delete(code);
              console.log(`[Room Deleted after timeout] ${code}`);
            } else {
              if (removed.isHost && currentRoom.players.length > 0) {
                currentRoom.players[0].isHost = true;
                currentRoom.hostId = currentRoom.players[0].socketId;
              }
              io.to(code).emit("room_updated", currentRoom);
              io.to(code).emit("player_left", { color: removed.color });
            }
          }
        }, 90000);

        disconnectTimeouts.set(timeoutKey, timeout);
        break;
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Forest Ludo Realtime Socket Server running on port ${PORT}`);
});
