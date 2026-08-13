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
  socket.on("create_room", ({ playerName, mode = "1v1" }, callback) => {
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
          name: playerName || "Player 1",
          color: "red",
          isHost: true,
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
  socket.on("join_room", ({ roomCode, playerName }, callback) => {
    const formattedCode = (roomCode || "").toUpperCase().trim();
    const room = rooms.get(formattedCode);

    if (!room) {
      return callback({ success: false, error: "Room not found. Check room code." });
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
      name: playerName || `Player ${room.players.length + 1}`,
      color: freeColor,
      isHost: false,
    };

    room.players.push(newPlayer);
    room.controllers[freeColor] = "human";

    socket.join(formattedCode);

    io.to(formattedCode).emit("room_updated", room);
    console.log(`[Player Joined] ${socket.id} -> ${formattedCode} (${freeColor})`);

    callback({ success: true, room });
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

  // Sync Action: Roll Dice
  socket.on("action_roll_dice", ({ roomCode, color, value }) => {
    socket.to(roomCode).emit("remote_roll_dice", { color, value });
  });

  // Sync Action: Move Token
  socket.on("action_move_token", ({ roomCode, tokenId, color }) => {
    socket.to(roomCode).emit("remote_move_token", { tokenId, color });
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log(`[Socket Disconnected] ID: ${socket.id}`);
    for (const [code, room] of rooms.entries()) {
      const pIndex = room.players.findIndex((p) => p.socketId === socket.id);
      if (pIndex !== -1) {
        const removed = room.players.splice(pIndex, 1)[0];
        room.controllers[removed.color] = "off";

        if (room.players.length === 0) {
          rooms.delete(code);
          console.log(`[Room Deleted] ${code}`);
        } else {
          if (removed.isHost && room.players.length > 0) {
            room.players[0].isHost = true;
            room.hostId = room.players[0].socketId;
          }
          io.to(code).emit("room_updated", room);
          io.to(code).emit("player_left", { color: removed.color });
        }
        break;
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Forest Ludo Realtime Socket Server running on port ${PORT}`);
});
