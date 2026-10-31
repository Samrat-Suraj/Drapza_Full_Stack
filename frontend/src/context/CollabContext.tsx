"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { audioSystem } from "@/components/drapza/AudioSystem";
import { useCart } from "./CartContext";

export interface ICollabVote {
  memberName: string;
  socketId: string;
  vote: "love" | "pass";
  votedAt: string;
}

export interface ICollabComment {
  id: string;
  memberName: string;
  text: string;
  timestamp: string;
}

export interface ICollabItem {
  id: string;
  productId: string;
  name: string;
  price: string;
  numericPrice: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
  addedBy: {
    name: string;
    socketId: string;
  };
  votes: ICollabVote[];
  comments: ICollabComment[];
}

export interface ICollabMember {
  name: string;
  socketId: string;
  avatarColor: string;
  joinedAt: string;
  lastActive: string;
}

export interface ICollabMessage {
  id: string;
  memberName: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
}

interface CollabContextType {
  roomCode: string | null;
  isHost: boolean;
  memberName: string;
  members: ICollabMember[];
  items: ICollabItem[];
  messages: ICollabMessage[];
  isConnected: boolean;
  isDrawerOpen: boolean;
  isStartModalOpen: boolean;
  pendingInviteCode: string | null;
  unreadCount: number;
  createRoom: (hostName: string) => Promise<{ success: boolean; roomCode?: string; message?: string }>;
  joinRoom: (roomCode: string, memberName: string) => Promise<{ success: boolean; message?: string }>;
  leaveRoom: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  openStartModal: (prefillCode?: string) => void;
  closeStartModal: () => void;
  addToCoCart: (product: any, size?: string, color?: string, quantity?: number) => void;
  removeFromCoCart: (itemId: string) => void;
  voteOnItem: (itemId: string, vote: "love" | "pass") => void;
  commentOnItem: (itemId: string, text: string) => void;
  sendChatMessage: (text: string) => void;
  transferAllToPersonalCart: () => void;
}

const CollabContext = createContext<CollabContextType | undefined>(undefined);

const LOCAL_STORAGE_SESSION_KEY = "drapza_collab_session";

export const CollabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToCart, setCartOpen } = useCart();

  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [members, setMembers] = useState<ICollabMember[]>([]);
  const [items, setItems] = useState<ICollabItem[]>([]);
  const [messages, setMessages] = useState<ICollabMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const socketRef = useRef<Socket | null>(null);

  // Initialize Socket.io Connection
  useEffect(() => {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");

    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      // Auto-rejoin if session saved in memory/storage
      const saved = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.roomCode && parsed.memberName) {
            socket.emit("collab:join-room", {
              roomCode: parsed.roomCode,
              memberName: parsed.memberName,
            });
          }
        } catch {
          // ignore corrupted local storage
        }
      }
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    // Real-time Event Listeners
    socket.on("collab:member-joined", (data: { members: ICollabMember[]; messages: ICollabMessage[]; newMember: string }) => {
      setMembers(data.members || []);
      if (data.messages) setMessages(data.messages);
      audioSystem.playClick(600);
    });

    socket.on("collab:member-left", (data: { members: ICollabMember[]; messages: ICollabMessage[]; departedMember: string }) => {
      setMembers(data.members || []);
      if (data.messages) setMessages(data.messages);
    });

    socket.on("collab:items-updated", (data: { items: ICollabItem[]; messages?: ICollabMessage[] }) => {
      setItems(data.items || []);
      if (data.messages) setMessages(data.messages);
      audioSystem.playClick(750);
    });

    socket.on("collab:new-message", (data: { message: ICollabMessage; messages: ICollabMessage[] }) => {
      setMessages(data.messages || []);
      audioSystem.playClick(850);
      setUnreadCount((prev) => (isDrawerOpen ? 0 : prev + 1));
    });

    return () => {
      socket.disconnect();
    };
  }, [isDrawerOpen]);

  // Check URL parameters for collaborative invite links (e.g. ?collab=DRP-849)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const inviteCode = urlParams.get("collab");
      if (inviteCode && inviteCode.trim()) {
        setPendingInviteCode(inviteCode.trim().toUpperCase());
        setIsStartModalOpen(true);
      }
    }
  }, []);

  // Save session state to localStorage
  const persistSession = (code: string, name: string, isHostUser: boolean) => {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_SESSION_KEY,
        JSON.stringify({ roomCode: code, memberName: name, isHost: isHostUser })
      );
    } catch {
      // storage quota or incognito
    }
  };

  const clearSession = () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    } catch {
      // ignore
    }
  };

  // Create Room
  const createRoom = useCallback(
    async (hostName: string) => {
      return new Promise<{ success: boolean; roomCode?: string; message?: string }>((resolve) => {
        const socket = socketRef.current;
        if (!socket || !socket.connected) {
          // Fallback optimistic mode if backend server is booting
          const mockCode = `DRP-${Math.floor(100 + Math.random() * 900)}`;
          setRoomCode(mockCode);
          setIsHost(true);
          setMemberName(hostName);
          setMembers([
            {
              name: hostName,
              socketId: "local-host",
              avatarColor: "#000000",
              joinedAt: new Date().toISOString(),
              lastActive: new Date().toISOString(),
            },
          ]);
          setMessages([
            {
              id: `sys-${Date.now()}`,
              memberName: "ATELIER CONCIERGE",
              text: `Co-Shopping session initiated by ${hostName}. Share Room Code ${mockCode} with friends.`,
              timestamp: new Date().toISOString(),
              isSystem: true,
            },
          ]);
          persistSession(mockCode, hostName, true);
          setIsDrawerOpen(true);
          resolve({ success: true, roomCode: mockCode });
          return;
        }

        socket.emit("collab:create-room", { hostName }, (res: any) => {
          if (res && res.success) {
            setRoomCode(res.roomCode);
            setIsHost(true);
            setMemberName(res.memberName);
            setMembers(res.session?.members || []);
            setItems(res.session?.items || []);
            setMessages(res.session?.messages || []);
            persistSession(res.roomCode, res.memberName, true);
            setIsDrawerOpen(true);
            resolve({ success: true, roomCode: res.roomCode });
          } else {
            resolve({ success: false, message: res?.message || "Failed to create room" });
          }
        });
      });
    },
    []
  );

  // Join Room
  const joinRoom = useCallback(
    async (code: string, name: string) => {
      return new Promise<{ success: boolean; message?: string }>((resolve) => {
        const socket = socketRef.current;
        const formattedCode = code.trim().toUpperCase();
        const trimmedName = name.trim();

        if (!socket || !socket.connected) {
          // Fallback demo join
          setRoomCode(formattedCode);
          setIsHost(false);
          setMemberName(trimmedName);
          setMembers([
            {
              name: "Host",
              socketId: "mock-host",
              avatarColor: "#171717",
              joinedAt: new Date().toISOString(),
              lastActive: new Date().toISOString(),
            },
            {
              name: trimmedName,
              socketId: "local-client",
              avatarColor: "#333333",
              joinedAt: new Date().toISOString(),
              lastActive: new Date().toISOString(),
            },
          ]);
          setMessages([
            {
              id: `sys-${Date.now()}`,
              memberName: "ATELIER CONCIERGE",
              text: `${trimmedName} joined room ${formattedCode}.`,
              timestamp: new Date().toISOString(),
              isSystem: true,
            },
          ]);
          persistSession(formattedCode, trimmedName, false);
          setIsDrawerOpen(true);
          resolve({ success: true });
          return;
        }

        socket.emit("collab:join-room", { roomCode: formattedCode, memberName: trimmedName }, (res: any) => {
          if (res && res.success) {
            setRoomCode(res.roomCode);
            setIsHost(res.session?.host?.name === trimmedName);
            setMemberName(trimmedName);
            setMembers(res.session?.members || []);
            setItems(res.session?.items || []);
            setMessages(res.session?.messages || []);
            persistSession(res.roomCode, trimmedName, false);
            setIsDrawerOpen(true);
            resolve({ success: true });
          } else {
            resolve({ success: false, message: res?.message || "Could not join room" });
          }
        });
      });
    },
    []
  );

  // Leave Room
  const leaveRoom = useCallback(() => {
    const socket = socketRef.current;
    if (socket && roomCode) {
      socket.emit("collab:leave-room");
    }
    audioSystem.playClick(400);
    setRoomCode(null);
    setIsHost(false);
    setMemberName("");
    setMembers([]);
    setItems([]);
    setMessages([]);
    setIsDrawerOpen(false);
    clearSession();
  }, [roomCode]);

  // Add Item to Co-Cart
  const addToCoCart = useCallback(
    (product: any, size: string = "M", color: string = "Obsidian Noir", quantity: number = 1) => {
      if (!roomCode) {
        setIsStartModalOpen(true);
        return;
      }

      const socket = socketRef.current;
      const numPrice =
        typeof product.numericPrice === "number"
          ? product.numericPrice
          : typeof product.price === "number"
          ? product.price
          : parseFloat(String(product.price).replace(/[^0-9.]/g, "")) || 990;

      const payload = {
        roomCode,
        memberName: memberName || "Guest Member",
        item: {
          productId: product.id || product._id,
          name: product.name,
          price: product.price || `₹${numPrice}`,
          numericPrice: numPrice,
          image: product.image || product.images?.[0] || "/images/drapza/products/product_1.png",
          size,
          color,
          quantity,
        },
      };

      if (socket && socket.connected) {
        socket.emit("collab:add-item", payload);
      } else {
        // Fallback local update
        setItems((prev) => {
          const existingIdx = prev.findIndex(
            (i) => i.productId === String(payload.item.productId) && i.size === size
          );
          if (existingIdx > -1) {
            const next = [...prev];
            const target = next[existingIdx];
            if (target) {
              target.quantity += quantity;
            }
            return next;
          }
          const newItem: ICollabItem = {
            id: `item-${Date.now()}`,
            ...payload.item,
            addedBy: { name: memberName || "You", socketId: "local" },
            votes: [],
            comments: [],
          };
          return [newItem, ...prev];
        });
      }

      audioSystem.playClick(750);
      setIsDrawerOpen(true);
    },
    [roomCode, memberName]
  );

  // Remove Item from Co-Cart
  const removeFromCoCart = useCallback(
    (itemId: string) => {
      const socket = socketRef.current;
      if (socket && socket.connected && roomCode) {
        socket.emit("collab:remove-item", { roomCode, itemId, memberName });
      } else {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
      }
      audioSystem.playClick(500);
    },
    [roomCode, memberName]
  );

  // Vote on Item (Love or Pass)
  const voteOnItem = useCallback(
    (itemId: string, vote: "love" | "pass") => {
      const socket = socketRef.current;
      if (socket && socket.connected && roomCode) {
        socket.emit("collab:vote-item", { roomCode, itemId, memberName, vote });
      } else {
        setItems((prev) =>
          prev.map((item) => {
            if (item.id !== itemId) return item;
            const existingIdx = item.votes.findIndex((v) => v.memberName === memberName);
            const nextVotes = [...item.votes];
            if (existingIdx > -1) {
              if (nextVotes[existingIdx]?.vote === vote) {
                nextVotes.splice(existingIdx, 1);
              } else {
                nextVotes[existingIdx] = {
                  memberName,
                  socketId: "local",
                  vote,
                  votedAt: new Date().toISOString(),
                };
              }
            } else {
              nextVotes.push({
                memberName: memberName || "You",
                socketId: "local",
                vote,
                votedAt: new Date().toISOString(),
              });
            }
            return { ...item, votes: nextVotes };
          })
        );
      }
      audioSystem.playClick(600);
    },
    [roomCode, memberName]
  );

  // Comment on an Item
  const commentOnItem = useCallback(
    (itemId: string, text: string) => {
      if (!text.trim()) return;
      const socket = socketRef.current;
      if (socket && socket.connected && roomCode) {
        socket.emit("collab:comment-item", { roomCode, itemId, memberName, text });
      } else {
        setItems((prev) =>
          prev.map((item) => {
            if (item.id !== itemId) return item;
            const newComment: ICollabComment = {
              id: `com-${Date.now()}`,
              memberName: memberName || "You",
              text: text.trim(),
              timestamp: new Date().toISOString(),
            };
            return { ...item, comments: [...item.comments, newComment] };
          })
        );
      }
      audioSystem.playClick(800);
    },
    [roomCode, memberName]
  );

  // Send Group Chat Message
  const sendChatMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      const socket = socketRef.current;
      if (socket && socket.connected && roomCode) {
        socket.emit("collab:send-message", { roomCode, memberName, text });
      } else {
        const newMsg: ICollabMessage = {
          id: `msg-${Date.now()}`,
          memberName: memberName || "You",
          text: text.trim(),
          timestamp: new Date().toISOString(),
          isSystem: false,
        };
        setMessages((prev) => [...prev, newMsg]);
      }
      audioSystem.playClick(850);
    },
    [roomCode, memberName]
  );

  // Transfer all items to user's personal cart
  const transferAllToPersonalCart = useCallback(() => {
    if (items.length === 0) return;
    audioSystem.playClick(900);

    items.forEach((item) => {
      addToCart({
        id: item.productId,
        name: item.name,
        price: item.numericPrice,
        image: item.image,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
      });
    });

    setIsDrawerOpen(false);
    setCartOpen(true);
  }, [items, addToCart, setCartOpen]);

  const openDrawer = () => {
    audioSystem.playClick(650);
    setIsDrawerOpen(true);
    setUnreadCount(0);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const toggleDrawer = () => {
    audioSystem.playClick(650);
    setIsDrawerOpen((prev) => !prev);
    if (!isDrawerOpen) setUnreadCount(0);
  };

  const openStartModal = (prefillCode?: string) => {
    if (prefillCode) setPendingInviteCode(prefillCode);
    setIsStartModalOpen(true);
  };

  const closeStartModal = () => {
    setIsStartModalOpen(false);
  };

  return (
    <CollabContext.Provider
      value={{
        roomCode,
        isHost,
        memberName,
        members,
        items,
        messages,
        isConnected,
        isDrawerOpen,
        isStartModalOpen,
        pendingInviteCode,
        unreadCount,
        createRoom,
        joinRoom,
        leaveRoom,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        openStartModal,
        closeStartModal,
        addToCoCart,
        removeFromCoCart,
        voteOnItem,
        commentOnItem,
        sendChatMessage,
        transferAllToPersonalCart,
      }}
    >
      {children}
    </CollabContext.Provider>
  );
};

export const useCollab = () => {
  const context = useContext(CollabContext);
  if (!context) {
    throw new Error("useCollab must be used within a CollabProvider");
  }
  return context;
};
