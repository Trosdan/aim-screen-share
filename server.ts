import express from "express";
import http from "http";
import path from "path";
import { Server as SocketIOServer, Socket } from "socket.io";
import { createServer as createViteServer } from "vite";

interface Participant {
  socketId: string;
  userName: string;
  avatarColor: string;
  isStreaming: boolean;
  isMicMuted: boolean;
  joinedAt: number;
}

interface Room {
  id: string;
  name: string;
  isPrivate: boolean;
  password?: string;
  createdAt: number;
  hostId: string;
  participants: Map<string, Participant>;
  activeStreamers: Set<string>; // socketIds
}

interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  text: string;
  timestamp: number;
  type: "user" | "system";
}

const app = express();
const PORT = 3000;
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

app.use(express.json());

// In-memory room store
const rooms = new Map<string, Room>();

// Helper to get public room summary
function getPublicRoomsSummary() {
  const list: any[] = [];
  for (const [id, room] of rooms.entries()) {
    list.push({
      id: room.id,
      name: room.name,
      isPrivate: room.isPrivate,
      createdAt: room.createdAt,
      participantCount: room.participants.size,
      streamerCount: room.activeStreamers.size,
      hostName: room.participants.get(room.hostId)?.userName || "Anfitrião",
    });
  }
  return list;
}

// API Endpoints
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

app.get("/api/rooms", (_req, res) => {
  res.json(getPublicRoomsSummary());
});

app.get("/api/rooms/:id/check", (req, res) => {
  const room = rooms.get(req.params.id);
  if (!room) {
    return res.status(404).json({ exists: false, error: "Sala não encontrada" });
  }
  return res.json({
    exists: true,
    id: room.id,
    name: room.name,
    isPrivate: room.isPrivate,
    participantCount: room.participants.size,
    streamerCount: room.activeStreamers.size,
  });
});

// Socket.io Signaling & Real-time Management
io.on("connection", (socket: Socket) => {
  let currentRoomId: string | null = null;
  let currentUser: Participant | null = null;

  // Send public rooms list on request
  socket.on("get-rooms", () => {
    socket.emit("rooms-list", getPublicRoomsSummary());
  });

  // Create Room
  socket.on("create-room", (data: { roomId?: string; name: string; isPrivate: boolean; password?: string; userName: string; avatarColor?: string }, callback) => {
    try {
      const roomId = (data.roomId || Math.random().toString(36).substring(2, 8)).toUpperCase();
      const roomName = data.name?.trim() || `Sala de ${data.userName || "Transmissão"}`;
      
      if (rooms.has(roomId)) {
        if (typeof callback === "function") callback({ success: false, error: "Já existe uma sala com este ID" });
        return;
      }

      const newRoom: Room = {
        id: roomId,
        name: roomName,
        isPrivate: !!data.isPrivate && !!data.password,
        password: data.password || undefined,
        createdAt: Date.now(),
        hostId: socket.id,
        participants: new Map(),
        activeStreamers: new Set(),
      };

      rooms.set(roomId, newRoom);
      io.emit("rooms-list", getPublicRoomsSummary());

      if (typeof callback === "function") {
        callback({
          success: true,
          roomId,
          name: roomName,
          isPrivate: newRoom.isPrivate,
        });
      }
    } catch (err: any) {
      if (typeof callback === "function") callback({ success: false, error: err.message });
    }
  });

  // Join Room
  socket.on("join-room", (data: { roomId: string; password?: string; userName: string; avatarColor?: string }, callback) => {
    try {
      const roomId = data.roomId?.toUpperCase();
      const room = rooms.get(roomId);

      if (!room) {
        if (typeof callback === "function") callback({ success: false, error: "Sala não encontrada" });
        return;
      }

      if (room.isPrivate) {
        if (!data.password || data.password !== room.password) {
          if (typeof callback === "function") callback({ success: false, error: "Senha incorreta para esta sala", requirePassword: true });
          return;
        }
      }

      // Cleanup old room if socket was in one
      if (currentRoomId && currentRoomId !== roomId) {
        handleLeaveRoom(socket, currentRoomId);
      }

      currentRoomId = roomId;
      const participant: Participant = {
        socketId: socket.id,
        userName: data.userName?.trim() || `Usuário-${socket.id.substring(0, 4)}`,
        avatarColor: data.avatarColor || "#5865F2",
        isStreaming: false,
        isMicMuted: true,
        joinedAt: Date.now(),
      };

      currentUser = participant;
      room.participants.set(socket.id, participant);
      socket.join(roomId);

      // List of existing participants and active streamers
      const existingParticipants = Array.from(room.participants.values()).filter(p => p.socketId !== socket.id);
      const activeStreamers = Array.from(room.activeStreamers);

      if (typeof callback === "function") {
        callback({
          success: true,
          room: {
            id: room.id,
            name: room.name,
            isPrivate: room.isPrivate,
            hostId: room.hostId,
          },
          self: participant,
          existingParticipants,
          activeStreamers,
        });
      }

      // Notify other members
      socket.to(roomId).emit("user-joined", {
        participant,
      });

      // System chat message
      const sysMsg: ChatMessage = {
        id: "sys-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        roomId,
        senderId: "system",
        senderName: "Sistema",
        senderColor: "#949ba4",
        text: `${participant.userName} entrou na sala.`,
        timestamp: Date.now(),
        type: "system",
      };
      io.to(roomId).emit("chat-message", sysMsg);

      // Broadcast updated room list to lobby
      io.emit("rooms-list", getPublicRoomsSummary());
    } catch (err: any) {
      if (typeof callback === "function") callback({ success: false, error: err.message });
    }
  });

  // Screen Share Started
  socket.on("start-screen-share", (data: { streamMeta?: { resolution?: string; fps?: number; hasAudio?: boolean } }, callback) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room || !currentUser) return;

    currentUser.isStreaming = true;
    room.activeStreamers.add(socket.id);

    // Notify room that this user is now streaming
    socket.to(currentRoomId).emit("user-started-streaming", {
      socketId: socket.id,
      userName: currentUser.userName,
      avatarColor: currentUser.avatarColor,
      streamMeta: data?.streamMeta || {},
    });

    const sysMsg: ChatMessage = {
      id: "sys-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      roomId: currentRoomId,
      senderId: "system",
      senderName: "Sistema",
      senderColor: "#5865F2",
      text: `🔴 ${currentUser.userName} começou a transmitir a tela!`,
      timestamp: Date.now(),
      type: "system",
    };
    io.to(currentRoomId).emit("chat-message", sysMsg);

    io.emit("rooms-list", getPublicRoomsSummary());

    if (typeof callback === "function") {
      callback({ success: true, activeStreamers: Array.from(room.activeStreamers) });
    }
  });

  // Screen Share Stopped
  socket.on("stop-screen-share", () => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room || !currentUser) return;

    currentUser.isStreaming = false;
    room.activeStreamers.delete(socket.id);

    socket.to(currentRoomId).emit("user-stopped-streaming", {
      socketId: socket.id,
      userName: currentUser.userName,
    });

    const sysMsg: ChatMessage = {
      id: "sys-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      roomId: currentRoomId,
      senderId: "system",
      senderName: "Sistema",
      senderColor: "#949ba4",
      text: `${currentUser.userName} encerrou a transmissão de tela.`,
      timestamp: Date.now(),
      type: "system",
    };
    io.to(currentRoomId).emit("chat-message", sysMsg);

    io.emit("rooms-list", getPublicRoomsSummary());
  });

  // WebRTC Signaling: Offer
  socket.on("signal-offer", (data: { targetSocketId: string; offer: any; streamType?: string }) => {
    io.to(data.targetSocketId).emit("signal-offer", {
      senderSocketId: socket.id,
      offer: data.offer,
      streamType: data.streamType,
      senderName: currentUser?.userName,
    });
  });

  // WebRTC Signaling: Answer
  socket.on("signal-answer", (data: { targetSocketId: string; answer: any }) => {
    io.to(data.targetSocketId).emit("signal-answer", {
      senderSocketId: socket.id,
      answer: data.answer,
    });
  });

  // WebRTC Signaling: ICE Candidate
  socket.on("signal-ice-candidate", (data: { targetSocketId: string; candidate: any }) => {
    io.to(data.targetSocketId).emit("signal-ice-candidate", {
      senderSocketId: socket.id,
      candidate: data.candidate,
    });
  });

  // Chat message
  socket.on("send-chat-message", (data: { text: string }) => {
    if (!currentRoomId || !currentUser) return;
    const text = data.text?.trim();
    if (!text) return;

    const msg: ChatMessage = {
      id: "msg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      roomId: currentRoomId,
      senderId: socket.id,
      senderName: currentUser.userName,
      senderColor: currentUser.avatarColor,
      text,
      timestamp: Date.now(),
      type: "user",
    };

    io.to(currentRoomId).emit("chat-message", msg);
  });

  // Stream reaction (floating emojis for all viewers)
  socket.on("send-reaction", (data: { emoji: string }) => {
    if (!currentRoomId || !currentUser) return;
    io.to(currentRoomId).emit("stream-reaction", {
      id: "rx-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      emoji: data.emoji,
      senderName: currentUser.userName,
      senderColor: currentUser.avatarColor,
      timestamp: Date.now(),
    });
  });

  // Participant Mic status toggle
  socket.on("toggle-mic", (data: { isMicMuted: boolean }) => {
    if (!currentRoomId || !currentUser) return;
    currentUser.isMicMuted = data.isMicMuted;
    socket.to(currentRoomId).emit("user-mic-changed", {
      socketId: socket.id,
      isMicMuted: data.isMicMuted,
    });
  });

  // Leave room explicitly
  socket.on("leave-room", () => {
    if (currentRoomId) {
      handleLeaveRoom(socket, currentRoomId);
      currentRoomId = null;
      currentUser = null;
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    if (currentRoomId) {
      handleLeaveRoom(socket, currentRoomId);
    }
  });
});

function handleLeaveRoom(socket: Socket, roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  const participant = room.participants.get(socket.id);
  const userName = participant?.userName || "Um usuário";

  // Remove streaming status if streaming
  if (room.activeStreamers.has(socket.id)) {
    room.activeStreamers.delete(socket.id);
    socket.to(roomId).emit("user-stopped-streaming", {
      socketId: socket.id,
      userName,
    });
  }

  // Remove participant
  room.participants.delete(socket.id);
  socket.leave(roomId);

  // Notify room
  socket.to(roomId).emit("user-left", {
    socketId: socket.id,
    userName,
  });

  const sysMsg: ChatMessage = {
    id: "sys-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    roomId,
    senderId: "system",
    senderName: "Sistema",
    senderColor: "#949ba4",
    text: `${userName} saiu da sala.`,
    timestamp: Date.now(),
    type: "system",
  };
  io.to(roomId).emit("chat-message", sysMsg);

  // If room is empty, delete it
  if (room.participants.size === 0) {
    rooms.delete(roomId);
  } else if (room.hostId === socket.id) {
    // Assign new host
    const nextHost = room.participants.keys().next().value;
    if (nextHost) {
      room.hostId = nextHost;
      io.to(roomId).emit("host-changed", { newHostId: nextHost });
    }
  }

  io.emit("rooms-list", getPublicRoomsSummary());
}

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 ScreenShare Live Server running on port ${PORT}`);
  });
}

startServer();
