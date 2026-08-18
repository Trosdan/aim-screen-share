/**
 * ScreenShare Live - Standalone Signaling & Room Server
 * Node.js + Express + Socket.IO WebRTC mesh server
 */
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory Room State
const rooms = new Map();

function getPublicRooms() {
  const list = [];
  for (const [id, r] of rooms.entries()) {
    list.push({
      id: r.id,
      name: r.name,
      isPrivate: r.isPrivate,
      participantCount: r.participants.size,
      streamerCount: r.activeStreamers.size
    });
  }
  return list;
}

io.on('connection', (socket) => {
  let currentRoomId = null;
  let currentUser = null;

  socket.on('get-rooms', (cb) => {
    const list = getPublicRooms();
    socket.emit('rooms-list', list);
    if (typeof cb === 'function') cb(list);
  });

  // Create Room
  socket.on('create-room', (data, callback) => {
    const roomId = (data.roomId || Math.random().toString(36).substring(2, 8)).toUpperCase();
    if (rooms.has(roomId)) {
      if (typeof callback === 'function') callback({ success: false, error: 'ID já em uso' });
      return;
    }

    const room = {
      id: roomId,
      name: data.name || `Sala-${roomId}`,
      isPrivate: !!data.isPrivate && !!data.password,
      password: data.password || null,
      hostId: socket.id,
      participants: new Map(),
      activeStreamers: new Set()
    };

    rooms.set(roomId, room);
    io.emit('rooms-list', getPublicRooms());
    if (typeof callback === 'function') callback({ success: true, roomId, name: room.name });
  });

  // Join Room
  socket.on('join-room', (data, callback) => {
    const roomId = data.roomId?.toUpperCase();
    const room = rooms.get(roomId);

    if (!room) {
      if (typeof callback === 'function') callback({ success: false, error: 'Sala não encontrada' });
      return;
    }

    if (room.isPrivate && room.password !== data.password) {
      if (typeof callback === 'function') callback({ success: false, error: 'Senha incorreta', requirePassword: true });
      return;
    }

    currentRoomId = roomId;
    const user = {
      socketId: socket.id,
      userName: data.userName || `Usuário-${socket.id.substring(0, 4)}`,
      avatarColor: data.avatarColor || '#5865F2',
      isStreaming: false
    };

    currentUser = user;
    room.participants.set(socket.id, user);
    socket.join(roomId);

    const existingParticipants = Array.from(room.participants.values()).filter(p => p.socketId !== socket.id);

    if (typeof callback === 'function') {
      callback({
        success: true,
        room: { id: room.id, name: room.name, isPrivate: room.isPrivate },
        self: user,
        existingParticipants,
        activeStreamers: Array.from(room.activeStreamers)
      });
    }

    socket.to(roomId).emit('user-joined', { participant: user });
    io.emit('rooms-list', getPublicRooms());
  });

  // Screen Share Started
  socket.on('start-screen-share', (data) => {
    if (!currentRoomId || !currentUser) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    currentUser.isStreaming = true;
    room.activeStreamers.add(socket.id);
    socket.to(currentRoomId).emit('user-started-streaming', {
      socketId: socket.id,
      userName: currentUser.userName,
      avatarColor: currentUser.avatarColor
    });
    io.emit('rooms-list', getPublicRooms());
  });

  // Screen Share Stopped
  socket.on('stop-screen-share', () => {
    if (!currentRoomId || !currentUser) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    currentUser.isStreaming = false;
    room.activeStreamers.delete(socket.id);
    socket.to(currentRoomId).emit('user-stopped-streaming', { socketId: socket.id });
    io.emit('rooms-list', getPublicRooms());
  });

  // WebRTC Signaling Relay
  socket.on('signal-offer', (data) => {
    io.to(data.targetSocketId).emit('signal-offer', {
      senderSocketId: socket.id,
      offer: data.offer,
      senderName: currentUser?.userName
    });
  });

  socket.on('signal-answer', (data) => {
    io.to(data.targetSocketId).emit('signal-answer', {
      senderSocketId: socket.id,
      answer: data.answer
    });
  });

  socket.on('signal-ice-candidate', (data) => {
    io.to(data.targetSocketId).emit('signal-ice-candidate', {
      senderSocketId: socket.id,
      candidate: data.candidate
    });
  });

  // Chat & Reactions
  socket.on('send-chat-message', (data) => {
    if (!currentRoomId || !currentUser) return;
    io.to(currentRoomId).emit('chat-message', {
      id: Date.now(),
      senderName: currentUser.userName,
      senderColor: currentUser.avatarColor,
      text: data.text,
      timestamp: Date.now()
    });
  });

  socket.on('send-reaction', (data) => {
    if (!currentRoomId || !currentUser) return;
    io.to(currentRoomId).emit('stream-reaction', {
      emoji: data.emoji,
      senderName: currentUser.userName
    });
  });

  // Disconnect / Leave
  const leave = () => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (room) {
      room.participants.delete(socket.id);
      room.activeStreamers.delete(socket.id);
      socket.to(currentRoomId).emit('user-left', { socketId: socket.id });
      if (room.participants.size === 0) rooms.delete(currentRoomId);
    }
    io.emit('rooms-list', getPublicRooms());
  };

  socket.on('leave-room', leave);
  socket.on('disconnect', leave);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`ScreenShare Standalone Server on http://localhost:${PORT}`);
});
