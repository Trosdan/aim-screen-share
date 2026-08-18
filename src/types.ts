export interface Participant {
  socketId: string;
  userName: string;
  avatarColor: string;
  isStreaming: boolean;
  isMicMuted: boolean;
  joinedAt: number;
}

export interface RoomMeta {
  id: string;
  name: string;
  isPrivate: boolean;
  hostId: string;
}

export interface PublicRoomSummary {
  id: string;
  name: string;
  isPrivate: boolean;
  createdAt: number;
  participantCount: number;
  streamerCount: number;
  hostName: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  text: string;
  timestamp: number;
  type: "user" | "system";
}

export interface StreamReaction {
  id: string;
  emoji: string;
  senderName: string;
  senderColor: string;
  timestamp: number;
}

export interface RemoteStreamData {
  socketId: string;
  userName: string;
  avatarColor: string;
  stream: MediaStream;
  hasAudio: boolean;
  resolution?: string;
  fps?: number;
  bitrate?: number;
  volume: number; // 0 to 1
  isMuted: boolean;
  isPinned: boolean;
}

export type LayoutMode = "grid" | "spotlight" | "cinema";

export interface StreamConfig {
  resolution: "720p" | "1080p" | "1440p" | "source";
  frameRate: 30 | 60;
  captureAudio: boolean;
}
