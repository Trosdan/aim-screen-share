import React, { useState, useEffect, useRef, useCallback } from "react";
import { getSocket } from "./services/socket";
import { WebRTCManager } from "./services/webrtc";
import { Navbar } from "./components/Navbar";
import { Lobby } from "./components/Lobby";
import { StreamGrid } from "./components/StreamGrid";
import { StreamControls } from "./components/StreamControls";
import { ChatPanel } from "./components/ChatPanel";
import { ParticipantsSidebar } from "./components/ParticipantsSidebar";
import { ShareModal } from "./components/ShareModal";
import { ScreenShareSetupModal } from "./components/ScreenShareSetupModal";
import { SettingsModal } from "./components/SettingsModal";
import { FloatingReactions } from "./components/FloatingReactions";
import { 
  Participant, 
  RoomMeta, 
  PublicRoomSummary, 
  ChatMessage, 
  RemoteStreamData, 
  LayoutMode, 
  StreamConfig, 
  StreamReaction 
} from "./types";
import { 
  playJoinSound, 
  playLeaveSound, 
  playStreamStartSound, 
  playMessageSound 
} from "./utils/soundEffects";

export default function App() {
  // User Profile
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem("screenshare_username") || `Jogador-${Math.floor(1000 + Math.random() * 9000)}`;
  });
  const [avatarColor, setAvatarColor] = useState<string>(() => {
    return localStorage.getItem("screenshare_avatar_color") || "#5865F2";
  });

  // Room & Participants
  const [room, setRoom] = useState<RoomMeta | null>(null);
  const [self, setSelf] = useState<Participant | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [publicRooms, setPublicRooms] = useState<PublicRoomSummary[]>([]);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Streams
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStreamData[]>([]);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(true);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);

  // Stream Configuration
  const [streamConfig, setStreamConfig] = useState<StreamConfig>({
    resolution: "1080p",
    frameRate: 60,
    captureAudio: true,
  });

  // Chat & Reactions
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<StreamReaction[]>([]);

  // UI Panels & Layout
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("grid");
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isScreenShareSetupOpen, setIsScreenShareSetupOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState<boolean>(true);
  const [pingMs, setPingMs] = useState<number>(24);

  // Refs
  const webrtcRef = useRef<WebRTCManager | null>(null);
  const participantsRef = useRef<Participant[]>([]);
  participantsRef.current = participants;

  // Persist user details
  useEffect(() => {
    localStorage.setItem("screenshare_username", userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem("screenshare_avatar_color", avatarColor);
  }, [avatarColor]);

  // Initialize WebRTC Manager
  useEffect(() => {
    const rtc = new WebRTCManager({
      onRemoteStream: (socketId, stream) => {
        setRemoteStreams((prev) => {
          const participant = participantsRef.current.find((p) => p.socketId === socketId);
          const name = participant?.userName || `Usuário-${socketId.substring(0, 4)}`;
          const color = participant?.avatarColor || "#5865F2";

          const existingIndex = prev.findIndex((s) => s.socketId === socketId);
          const hasAudio = stream.getAudioTracks().length > 0;

          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              stream,
              userName: name,
              avatarColor: color,
              hasAudio,
            };
            return updated;
          } else {
            return [
              ...prev,
              {
                socketId,
                userName: name,
                avatarColor: color,
                stream,
                hasAudio,
                volume: 1,
                isMuted: false,
                isPinned: false,
              },
            ];
          }
        });
      },
      onRemoteStreamRemoved: (socketId) => {
        setRemoteStreams((prev) => prev.filter((s) => s.socketId !== socketId));
      },
    });

    webrtcRef.current = rtc;

    return () => {
      rtc.cleanupAll();
    };
  }, []);

  // Initialize Socket listeners
  useEffect(() => {
    const socket = getSocket();

    // Initial public room list request
    socket.emit("get-rooms");

    socket.on("rooms-list", (rooms: PublicRoomSummary[]) => {
      setPublicRooms(rooms);
    });

    // Remote participant joined
    socket.on("user-joined", (data: { participant: Participant }) => {
      setParticipants((prev) => {
        if (prev.find((p) => p.socketId === data.participant.socketId)) return prev;
        return [...prev, data.participant];
      });
      if (soundEffectsEnabled) playJoinSound();
    });

    // Remote participant left
    socket.on("user-left", (data: { socketId: string; userName: string }) => {
      setParticipants((prev) => prev.filter((p) => p.socketId !== data.socketId));
      setRemoteStreams((prev) => prev.filter((s) => s.socketId !== data.socketId));
      webrtcRef.current?.cleanupPeer(data.socketId);
      if (soundEffectsEnabled) playLeaveSound();
    });

    // Remote user started streaming
    socket.on("user-started-streaming", (data: { socketId: string; userName: string; avatarColor: string }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.socketId === data.socketId ? { ...p, isStreaming: true } : p))
      );
      if (soundEffectsEnabled) playStreamStartSound();
      // Caller initiates or receiver responds via WebRTC negotiation
    });

    // Remote user stopped streaming
    socket.on("user-stopped-streaming", (data: { socketId: string; userName: string }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.socketId === data.socketId ? { ...p, isStreaming: false } : p))
      );
      setRemoteStreams((prev) => prev.filter((s) => s.socketId !== data.socketId));
    });

    // Remote user toggled microphone
    socket.on("user-mic-changed", (data: { socketId: string; isMicMuted: boolean }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.socketId === data.socketId ? { ...p, isMicMuted: data.isMicMuted } : p))
      );
    });

    // Chat Message
    socket.on("chat-message", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
      if (soundEffectsEnabled && msg.type === "user") {
        playMessageSound();
      }
    });

    // Floating Stream Reaction
    socket.on("stream-reaction", (rx: StreamReaction) => {
      setReactions((prev) => [...prev, rx]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== rx.id));
      }, 3000);
    });

    // Ping check
    const pingInterval = setInterval(() => {
      const start = Date.now();
      socket.emit("get-rooms", () => {
        setPingMs(Math.max(8, Math.min(180, Date.now() - start)));
      });
    }, 8000);

    return () => {
      clearInterval(pingInterval);
      socket.off("rooms-list");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("user-started-streaming");
      socket.off("user-stopped-streaming");
      socket.off("user-mic-changed");
      socket.off("chat-message");
      socket.off("stream-reaction");
    };
  }, [soundEffectsEnabled]);

  // Check URL query parameters for auto room join (?room=ROOMID)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlRoomId = params.get("room");
      if (urlRoomId && !room) {
        handleJoinRoom(urlRoomId.toUpperCase());
      }
    }
  }, []);

  // Create Room
  const handleCreateRoom = (data: { name: string; isPrivate: boolean; password?: string; roomId?: string }) => {
    setIsJoining(true);
    setErrorMessage(null);
    const socket = getSocket();

    socket.emit(
      "create-room",
      {
        roomId: data.roomId,
        name: data.name,
        isPrivate: data.isPrivate,
        password: data.password,
        userName: userName.trim() || "Usuário",
        avatarColor,
      },
      (res: any) => {
        if (!res || !res.success) {
          setIsJoining(false);
          setErrorMessage(res?.error || "Falha ao criar sala.");
          return;
        }

        // Auto join created room
        handleJoinRoom(res.roomId, data.password);
      }
    );
  };

  // Join Room
  const handleJoinRoom = (roomId: string, password?: string) => {
    setIsJoining(true);
    setErrorMessage(null);
    const socket = getSocket();

    socket.emit(
      "join-room",
      {
        roomId,
        password,
        userName: userName.trim() || "Usuário",
        avatarColor,
      },
      (res: any) => {
        setIsJoining(false);
        if (!res || !res.success) {
          setErrorMessage(res?.error || "Não foi possível ingressar na sala.");
          return;
        }

        setRoom(res.room);
        setSelf(res.self);
        setParticipants(res.existingParticipants || []);
        if (soundEffectsEnabled) playJoinSound();

        // Update URL query string without reloading
        if (typeof window !== "undefined") {
          const newUrl = `${window.location.pathname}?room=${res.room.id}`;
          window.history.replaceState({ path: newUrl }, "", newUrl);
        }
      }
    );
  };

  // Leave Room
  const handleLeaveRoom = () => {
    // Stop local screen sharing
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
    }

    // Stop mic
    if (micStream) {
      micStream.getTracks().forEach((t) => t.stop());
      setMicStream(null);
    }

    // Cleanup WebRTC
    webrtcRef.current?.cleanupAll();

    const socket = getSocket();
    socket.emit("leave-room");

    if (soundEffectsEnabled) playLeaveSound();

    setRoom(null);
    setSelf(null);
    setParticipants([]);
    setRemoteStreams([]);
    setMessages([]);

    // Clear URL query
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", window.location.pathname);
    }

    // Refresh lobby list
    socket.emit("get-rooms");
  };

  // Start Screen Share
  const handleStartScreenShare = async () => {
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        setErrorMessage("Seu navegador não suporta compartilhamento de tela nativo (getDisplayMedia).");
        return;
      }

      // Compute resolution constraints
      let widthConstraint: any = undefined;
      let heightConstraint: any = undefined;

      if (streamConfig.resolution === "720p") {
        widthConstraint = { ideal: 1280, max: 1280 };
        heightConstraint = { ideal: 720, max: 720 };
      } else if (streamConfig.resolution === "1080p") {
        widthConstraint = { ideal: 1920, max: 1920 };
        heightConstraint = { ideal: 1080, max: 1080 };
      }

      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
          frameRate: { ideal: streamConfig.frameRate, max: streamConfig.frameRate },
          width: widthConstraint,
          height: heightConstraint,
        } as any,
        audio: streamConfig.captureAudio,
      });

      // Handle user stopping stream via browser native bar ("Stop sharing")
      displayStream.getVideoTracks()[0].onended = () => {
        handleStopScreenShare();
      };

      setLocalStream(displayStream);
      webrtcRef.current?.setLocalStream(displayStream);

      if (self) {
        setSelf({ ...self, isStreaming: true });
      }

      const socket = getSocket();
      socket.emit("start-screen-share", {
        streamMeta: {
          resolution: streamConfig.resolution,
          fps: streamConfig.frameRate,
          hasAudio: streamConfig.captureAudio,
        },
      });

      // Broadcast to existing participants
      const participantIds = participants.map((p) => p.socketId);
      webrtcRef.current?.broadcastLocalStreamToParticipants(participantIds);

      if (soundEffectsEnabled) playStreamStartSound();
      setIsScreenShareSetupOpen(false);
    } catch (err: any) {
      if (err.name !== "NotAllowedError") {
        console.error("Screen share error:", err);
        setErrorMessage("Erro ao iniciar captura de tela: " + (err.message || err.name));
      }
    }
  };

  // Stop Screen Share
  const handleStopScreenShare = () => {
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
    }

    webrtcRef.current?.setLocalStream(null);

    if (self) {
      setSelf({ ...self, isStreaming: false });
    }

    const socket = getSocket();
    socket.emit("stop-screen-share");
  };

  // Toggle Screen Share
  const handleToggleScreenShare = () => {
    if (localStream) {
      handleStopScreenShare();
    } else {
      handleStartScreenShare();
    }
  };

  // Toggle Microphone
  const handleToggleMic = async () => {
    try {
      if (isMicMuted) {
        // Unmute: capture mic stream
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        setMicStream(audioStream);
        setIsMicMuted(false);

        if (self) setSelf({ ...self, isMicMuted: false });
        getSocket().emit("toggle-mic", { isMicMuted: false });
      } else {
        // Mute: stop tracks
        if (micStream) {
          micStream.getTracks().forEach((t) => t.stop());
          setMicStream(null);
        }
        setIsMicMuted(true);

        if (self) setSelf({ ...self, isMicMuted: true });
        getSocket().emit("toggle-mic", { isMicMuted: true });
      }
    } catch (err: any) {
      console.warn("Microphone access error:", err);
      setErrorMessage("Permissão de microfone negada.");
    }
  };

  // Send Chat Message
  const handleSendMessage = (text: string) => {
    getSocket().emit("send-chat-message", { text });
  };

  // Send Reaction
  const handleSendReaction = (emoji: string) => {
    getSocket().emit("send-reaction", { emoji });
  };

  // Streamers count
  const streamersCount =
    (localStream ? 1 : 0) + remoteStreams.length;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#313338] text-white font-sans">
      {/* Top Discord Navbar */}
      <Navbar
        room={room}
        self={self}
        participants={participants}
        streamersCount={streamersCount}
        layoutMode={layoutMode}
        setLayoutMode={setLayoutMode}
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
        isParticipantsOpen={isParticipantsOpen}
        setIsParticipantsOpen={setIsParticipantsOpen}
        onOpenShare={() => setIsShareModalOpen(true)}
        onLeaveRoom={handleLeaveRoom}
        pingMs={pingMs}
      />

      {/* Main View Area */}
      {!room ? (
        <Lobby
          userName={userName}
          setUserName={setUserName}
          avatarColor={avatarColor}
          setAvatarColor={setAvatarColor}
          publicRooms={publicRooms}
          onRefreshRooms={() => getSocket().emit("get-rooms")}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          isJoining={isJoining}
          errorMessage={errorMessage}
          clearError={() => setErrorMessage(null)}
        />
      ) : (
        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          {/* Main Stage / Video Grid */}
          <StreamGrid
            localStream={localStream}
            self={self}
            remoteStreams={remoteStreams}
            layoutMode={layoutMode}
            onStartShare={handleStartScreenShare}
            onOpenShare={() => setIsShareModalOpen(true)}
          />

          {/* Right Drawers */}
          {isChatOpen && (
            <ChatPanel
              messages={messages}
              onSendMessage={handleSendMessage}
              onClose={() => setIsChatOpen(false)}
              self={self}
            />
          )}

          {isParticipantsOpen && (
            <ParticipantsSidebar
              room={room}
              self={self}
              participants={participants}
              streamersCount={streamersCount}
              onClose={() => setIsParticipantsOpen(false)}
            />
          )}
        </div>
      )}

      {/* Bottom Control Dock (Only in Room) */}
      {room && (
        <StreamControls
          isStreaming={!!localStream}
          isMicMuted={isMicMuted}
          onToggleScreenShare={handleToggleScreenShare}
          onToggleMic={handleToggleMic}
          onLeaveRoom={handleLeaveRoom}
          onSendReaction={handleSendReaction}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenScreenShareConfig={() => setIsScreenShareSetupOpen(true)}
        />
      )}

      {/* Floating Emoji Reactions Layer */}
      <FloatingReactions reactions={reactions} />

      {/* Modals */}
      {isShareModalOpen && room && (
        <ShareModal room={room} onClose={() => setIsShareModalOpen(false)} />
      )}

      {isScreenShareSetupOpen && (
        <ScreenShareSetupModal
          config={streamConfig}
          onChangeConfig={setStreamConfig}
          onConfirm={handleStartScreenShare}
          onClose={() => setIsScreenShareSetupOpen(false)}
        />
      )}

      {isSettingsModalOpen && (
        <SettingsModal
          soundEffectsEnabled={soundEffectsEnabled}
          setSoundEffectsEnabled={setSoundEffectsEnabled}
          onClose={() => setIsSettingsModalOpen(false)}
        />
      )}
    </div>
  );
}
