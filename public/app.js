/**
 * ScreenShare Live - Vanilla WebRTC & Socket.io Client
 */
const socket = io();

let currentRoom = null;
let currentUser = null;
let localStream = null;
const peerConnections = new Map(); // targetSocketId -> RTCPeerConnection

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

// DOM Elements
const lobbyView = document.getElementById('lobby-view');
const roomView = document.getElementById('room-view');
const roomStatusBadge = document.getElementById('room-status-badge');
const currentRoomName = document.getElementById('current-room-name');
const streamGrid = document.getElementById('stream-grid');
const inputUsername = document.getElementById('input-username');
const inputRoomName = document.getElementById('input-room-name');
const checkIsPrivate = document.getElementById('check-is-private');
const inputCreatePassword = document.getElementById('input-create-password');
const btnCreateRoom = document.getElementById('btn-create-room');
const inputJoinId = document.getElementById('input-join-id');
const inputJoinPassword = document.getElementById('input-join-password');
const btnJoinRoom = document.getElementById('btn-join-room');
const publicRoomsContainer = document.getElementById('public-rooms-container');
const btnScreenShare = document.getElementById('btn-screenshare');
const btnLeaveRoom = document.getElementById('btn-leave-room');
const btnCopyLink = document.getElementById('btn-copy-link');

// Auto set username
inputUsername.value = 'Jogador-' + Math.floor(1000 + Math.random() * 9000);

// Toggle password input visibility on create
checkIsPrivate.addEventListener('change', (e) => {
  if (e.target.checked) {
    inputCreatePassword.classList.remove('hidden');
  } else {
    inputCreatePassword.classList.add('hidden');
  }
});

// Load public rooms
socket.emit('get-rooms');
socket.on('rooms-list', (rooms) => {
  if (!publicRoomsContainer) return;
  if (rooms.length === 0) {
    publicRoomsContainer.innerHTML = '<p class="text-xs text-gray-500 italic">Nenhuma sala pública aberta no momento.</p>';
    return;
  }
  publicRoomsContainer.innerHTML = rooms.map(r => `
    <div class="bg-[#2b2d31] p-3 rounded-xl flex items-center justify-between">
      <div>
        <p class="text-xs font-bold text-white">${r.name}</p>
        <p class="text-[10px] text-gray-400 font-mono">ID: ${r.id} • ${r.participantCount} membro(s) • ${r.streamerCount} transmitindo</p>
      </div>
      <button onclick="joinRoomById('${r.id}')" class="bg-[#5865F2] hover:bg-[#4752C4] px-3 py-1 rounded-lg text-xs font-bold text-white">Entrar</button>
    </div>
  `).join('');
});

window.joinRoomById = (id) => {
  inputJoinId.value = id;
  btnJoinRoom.click();
};

// Create Room Action
btnCreateRoom.addEventListener('click', () => {
  const name = inputRoomName.value.trim() || 'Sala de Transmissão';
  const isPrivate = checkIsPrivate.checked;
  const password = inputCreatePassword.value;
  const userName = inputUsername.value.trim() || 'Usuário';

  socket.emit('create-room', { name, isPrivate, password, userName }, (res) => {
    if (!res || !res.success) {
      alert(res?.error || 'Erro ao criar sala');
      return;
    }
    joinRoom(res.roomId, password);
  });
});

// Join Room Action
btnJoinRoom.addEventListener('click', () => {
  const roomId = inputJoinId.value.trim().toUpperCase();
  const password = inputJoinPassword.value;
  if (!roomId) return alert('Digite o ID da sala');
  joinRoom(roomId, password);
});

function joinRoom(roomId, password) {
  const userName = inputUsername.value.trim() || 'Usuário';
  socket.emit('join-room', { roomId, password, userName }, (res) => {
    if (!res || !res.success) {
      alert(res?.error || 'Erro ao entrar na sala');
      return;
    }

    currentRoom = res.room;
    currentUser = res.self;

    lobbyView.classList.add('hidden');
    roomView.classList.remove('hidden');
    roomStatusBadge.classList.remove('hidden');
    roomStatusBadge.classList.add('flex');
    currentRoomName.innerText = `${currentRoom.name} (${currentRoom.id})`;

    // Check existing streams
    res.existingParticipants.forEach(p => {
      if (p.isStreaming) {
        initiatePeerCall(p.socketId);
      }
    });
  });
}

// Copy invite link
btnCopyLink.addEventListener('click', () => {
  if (!currentRoom) return;
  const url = `${window.location.origin}?room=${currentRoom.id}`;
  navigator.clipboard.writeText(url);
  alert('Link de convite copiado!');
});

// Leave Room Action
btnLeaveRoom.addEventListener('click', () => {
  if (localStream) {
    localStream.getTracks().forEach(t => t.stop());
    localStream = null;
  }
  peerConnections.forEach(pc => pc.close());
  peerConnections.clear();
  streamGrid.innerHTML = '';

  socket.emit('leave-room');
  currentRoom = null;
  currentUser = null;

  roomView.classList.add('hidden');
  roomStatusBadge.classList.add('hidden');
  lobbyView.classList.remove('hidden');
  socket.emit('get-rooms');
});

// Screen Share Toggle
btnScreenShare.addEventListener('click', async () => {
  if (localStream) {
    // Stop sharing
    localStream.getTracks().forEach(t => t.stop());
    localStream = null;
    btnScreenShare.innerText = '🖥️ Compartilhar Tela';
    btnScreenShare.className = 'bg-[#5865F2] hover:bg-[#4752C4] px-6 py-2.5 rounded-2xl font-bold text-xs flex items-center space-x-2 shadow-lg';
    socket.emit('stop-screen-share');
    removeStreamVideo(socket.id);
  } else {
    // Start sharing
    try {
      localStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: true
      });

      localStream.getVideoTracks()[0].onended = () => {
        btnScreenShare.click();
      };

      btnScreenShare.innerText = '🛑 Parar Transmissão';
      btnScreenShare.className = 'bg-rose-600 hover:bg-rose-500 px-6 py-2.5 rounded-2xl font-bold text-xs flex items-center space-x-2 shadow-lg animate-pulse';

      renderStreamVideo(socket.id, currentUser.userName, localStream, true);
      socket.emit('start-screen-share', {});

      // Send stream to all peers
      peerConnections.forEach((pc, targetId) => {
        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
        initiatePeerCall(targetId);
      });
    } catch (err) {
      console.warn('Screen share cancelled/error:', err);
    }
  }
});

// WebRTC Peer Connection Helper
function getOrCreatePeerConnection(targetSocketId) {
  if (peerConnections.has(targetSocketId)) {
    return peerConnections.get(targetSocketId);
  }

  const pc = new RTCPeerConnection(RTC_CONFIG);

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('signal-ice-candidate', {
        targetSocketId,
        candidate: event.candidate.toJSON()
      });
    }
  };

  pc.ontrack = (event) => {
    const stream = event.streams[0] || new MediaStream([event.track]);
    renderStreamVideo(targetSocketId, `Usuário-${targetSocketId.slice(0, 4)}`, stream, false);
  };

  peerConnections.set(targetSocketId, pc);
  return pc;
}

async function initiatePeerCall(targetSocketId) {
  const pc = getOrCreatePeerConnection(targetSocketId);
  if (localStream) {
    localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
  }
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  socket.emit('signal-offer', { targetSocketId, offer: pc.localDescription });
}

// Socket WebRTC Relay handlers
socket.on('signal-offer', async (data) => {
  const pc = getOrCreatePeerConnection(data.senderSocketId);
  await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
  if (localStream) {
    localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
  }
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  socket.emit('signal-answer', { targetSocketId: data.senderSocketId, answer: pc.localDescription });
});

socket.on('signal-answer', async (data) => {
  const pc = peerConnections.get(data.senderSocketId);
  if (pc) {
    await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
  }
});

socket.on('signal-ice-candidate', async (data) => {
  const pc = peerConnections.get(data.senderSocketId);
  if (pc) {
    await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
});

socket.on('user-started-streaming', (data) => {
  initiatePeerCall(data.socketId);
});

socket.on('user-stopped-streaming', (data) => {
  removeStreamVideo(data.socketId);
});

socket.on('user-left', (data) => {
  removeStreamVideo(data.socketId);
  if (peerConnections.has(data.socketId)) {
    peerConnections.get(data.socketId).close();
    peerConnections.delete(data.socketId);
  }
});

// Video Grid Renderers
function renderStreamVideo(id, name, stream, isSelf) {
  let existing = document.getElementById(`stream-card-${id}`);
  if (!existing) {
    existing = document.createElement('div');
    existing.id = `stream-card-${id}`;
    existing.className = 'relative bg-[#1e1f22] rounded-2xl overflow-hidden border border-[#2b2d31] aspect-video flex items-center justify-center';
    existing.innerHTML = `
      <video autoplay playsinline class="w-full h-full object-contain bg-black"></video>
      <div class="absolute top-3 left-3 flex items-center space-x-2">
        <span class="bg-rose-600 px-2 py-0.5 rounded text-[10px] font-extrabold text-white animate-live">AO VIVO</span>
        <span class="bg-black/60 px-2 py-0.5 rounded text-xs font-semibold text-white">${name} ${isSelf ? '(Você)' : ''}</span>
      </div>
      <button onclick="this.parentElement.querySelector('video').requestFullscreen()" class="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 p-2 rounded-xl text-white text-xs">⛶ Tela Cheia</button>
    `;
    streamGrid.appendChild(existing);
  }
  const video = existing.querySelector('video');
  video.srcObject = stream;
  if (isSelf) video.muted = true;
}

function removeStreamVideo(id) {
  const el = document.getElementById(`stream-card-${id}`);
  if (el) el.remove();
}
