import { getSocket } from "./socket";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
  iceCandidatePoolSize: 10,
};

export interface WebRTCCallbacks {
  onRemoteStream: (socketId: string, stream: MediaStream) => void;
  onRemoteStreamRemoved: (socketId: string) => void;
  onConnectionStateChange?: (socketId: string, state: RTCPeerConnectionState) => void;
}

export class WebRTCManager {
  private peerConnections = new Map<string, RTCPeerConnection>();
  private pendingIceCandidates = new Map<string, RTCIceCandidateInit[]>();
  private localStream: MediaStream | null = null;
  private callbacks: WebRTCCallbacks;

  constructor(callbacks: WebRTCCallbacks) {
    this.callbacks = callbacks;
    this.setupSocketListeners();
  }

  public setLocalStream(stream: MediaStream | null) {
    this.localStream = stream;
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  private setupSocketListeners() {
    const socket = getSocket();

    socket.on("signal-offer", async (data: { senderSocketId: string; offer: RTCSessionDescriptionInit }) => {
      await this.handleOffer(data.senderSocketId, data.offer);
    });

    socket.on("signal-answer", async (data: { senderSocketId: string; answer: RTCSessionDescriptionInit }) => {
      await this.handleAnswer(data.senderSocketId, data.answer);
    });

    socket.on("signal-ice-candidate", async (data: { senderSocketId: string; candidate: RTCIceCandidateInit }) => {
      await this.handleIceCandidate(data.senderSocketId, data.candidate);
    });
  }

  private getOrCreatePeerConnection(targetSocketId: string): RTCPeerConnection {
    let pc = this.peerConnections.get(targetSocketId);
    if (pc && pc.signalingState !== "closed") {
      return pc;
    }

    pc = new RTCPeerConnection(RTC_CONFIG);
    const socket = getSocket();

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("signal-ice-candidate", {
          targetSocketId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Connection state
    pc.onconnectionstatechange = () => {
      if (this.callbacks.onConnectionStateChange) {
        this.callbacks.onConnectionStateChange(targetSocketId, pc.connectionState);
      }
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        this.cleanupPeer(targetSocketId);
      }
    };

    // Remote Track handler
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        this.callbacks.onRemoteStream(targetSocketId, remoteStream);
      } else {
        const stream = new MediaStream([event.track]);
        this.callbacks.onRemoteStream(targetSocketId, stream);
      }
    };

    this.peerConnections.set(targetSocketId, pc);
    return pc;
  }

  // Caller: Create offer and send to remote peer
  public async callPeer(targetSocketId: string) {
    try {
      const pc = this.getOrCreatePeerConnection(targetSocketId);

      // Add local stream tracks if any
      if (this.localStream) {
        // Remove existing senders to avoid duplicate tracks
        const senders = pc.getSenders();
        senders.forEach((s) => pc.removeTrack(s));

        this.localStream.getTracks().forEach((track) => {
          pc.addTrack(track, this.localStream!);
        });
      }

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await pc.setLocalDescription(offer);

      const socket = getSocket();
      socket.emit("signal-offer", {
        targetSocketId,
        offer: pc.localDescription,
      });
    } catch (err) {
      console.error(`Error creating offer for peer ${targetSocketId}:`, err);
    }
  }

  // Receiver: Handle incoming offer
  private async handleOffer(senderSocketId: string, offer: RTCSessionDescriptionInit) {
    try {
      const pc = this.getOrCreatePeerConnection(senderSocketId);

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Process buffered ICE candidates
      const pending = this.pendingIceCandidates.get(senderSocketId) || [];
      for (const candidate of pending) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn("Error adding queued ICE candidate:", e);
        }
      }
      this.pendingIceCandidates.delete(senderSocketId);

      // Add local tracks if we are also streaming
      if (this.localStream) {
        const senders = pc.getSenders();
        senders.forEach((s) => pc.removeTrack(s));
        this.localStream.getTracks().forEach((track) => {
          pc.addTrack(track, this.localStream!);
        });
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const socket = getSocket();
      socket.emit("signal-answer", {
        targetSocketId: senderSocketId,
        answer: pc.localDescription,
      });
    } catch (err) {
      console.error(`Error handling offer from ${senderSocketId}:`, err);
    }
  }

  // Caller: Handle incoming answer
  private async handleAnswer(senderSocketId: string, answer: RTCSessionDescriptionInit) {
    try {
      const pc = this.peerConnections.get(senderSocketId);
      if (!pc) return;

      await pc.setRemoteDescription(new RTCSessionDescription(answer));

      // Process buffered ICE candidates
      const pending = this.pendingIceCandidates.get(senderSocketId) || [];
      for (const candidate of pending) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn("Error adding queued ICE candidate:", e);
        }
      }
      this.pendingIceCandidates.delete(senderSocketId);
    } catch (err) {
      console.error(`Error handling answer from ${senderSocketId}:`, err);
    }
  }

  // Handle incoming ICE Candidate
  private async handleIceCandidate(senderSocketId: string, candidate: RTCIceCandidateInit) {
    try {
      const pc = this.peerConnections.get(senderSocketId);
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        // Buffer candidate until remote description is set
        const list = this.pendingIceCandidates.get(senderSocketId) || [];
        list.push(candidate);
        this.pendingIceCandidates.set(senderSocketId, list);
      }
    } catch (err) {
      console.error(`Error handling ICE candidate from ${senderSocketId}:`, err);
    }
  }

  // Broadcast local stream to all participants
  public broadcastLocalStreamToParticipants(participantSocketIds: string[]) {
    participantSocketIds.forEach((targetId) => {
      this.callPeer(targetId);
    });
  }

  // Cleanup a single peer
  public cleanupPeer(socketId: string) {
    const pc = this.peerConnections.get(socketId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(socketId);
    }
    this.pendingIceCandidates.delete(socketId);
    this.callbacks.onRemoteStreamRemoved(socketId);
  }

  // Cleanup all peers
  public cleanupAll() {
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    this.pendingIceCandidates.clear();
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
  }
}
