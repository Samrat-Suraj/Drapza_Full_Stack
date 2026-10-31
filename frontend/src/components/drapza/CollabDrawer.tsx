"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  X,
  Users,
  ShoppingBag,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Send,
  Trash2,
  Share2,
  Copy,
  Check,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useCollab, ICollabItem } from "@/context/CollabContext";
import { audioSystem } from "./AudioSystem";

export const CollabDrawer: React.FC = () => {
  const {
    roomCode,
    memberName,
    members,
    items,
    messages,
    isDrawerOpen,
    closeDrawer,
    removeFromCoCart,
    voteOnItem,
    commentOnItem,
    sendChatMessage,
    transferAllToPersonalCart,
  } = useCollab();

  const [activeTab, setActiveTab] = useState<"cart" | "chat" | "members">("cart");
  const [chatInput, setChatInput] = useState("");
  const [activeCommentItemId, setActiveCommentItemId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  if (!isDrawerOpen || !roomCode) return null;

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      const shareUrl = `${window.location.origin}/?collab=${roomCode}`;
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      audioSystem.playClick(900);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput.trim());
    setChatInput("");
  };

  const handleSendComment = (itemId: string) => {
    const text = commentInputs[itemId];
    if (!text || !text.trim()) return;
    commentOnItem(itemId, text.trim());
    setCommentInputs((prev) => ({ ...prev, [itemId]: "" }));
  };

  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="collab-drawer-title"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        onClick={closeDrawer}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md md:max-w-lg bg-[#0e0e0e] text-white border-l border-white/20 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-200 font-bold block">
                  LIVE ATELIER CO-SHOPPING
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px] font-bold">
                  {roomCode}
                </span>
              </div>
              <h2 id="collab-drawer-title" className="font-mono text-base font-bold uppercase tracking-wider text-white mt-0.5">
                Friends & Family Suite
              </h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopyLink}
                title="Copy invite link"
                aria-label="Copy session invite link"
                className="p-2 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-white" /> : <Share2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Close collaborative drawer"
                className="p-2 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-white/10 bg-white/5 p-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                audioSystem.playClick(500);
                setActiveTab("cart");
              }}
              className={`flex-1 py-2 flex items-center justify-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                activeTab === "cart" ? "bg-white text-black shadow-md" : "text-neutral-400 hover:text-white"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Co-Cart ({totalItemCount})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                audioSystem.playClick(500);
                setActiveTab("chat");
              }}
              className={`flex-1 py-2 flex items-center justify-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                activeTab === "chat" ? "bg-white text-black shadow-md" : "text-neutral-400 hover:text-white"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Live Chat ({messages.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                audioSystem.playClick(500);
                setActiveTab("members");
              }}
              className={`flex-1 py-2 flex items-center justify-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                activeTab === "members" ? "bg-white text-black shadow-md" : "text-neutral-400 hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Members ({members.length})</span>
            </button>
          </div>

          {/* TAB 1: CO-CART */}
          {activeTab === "cart" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400">
                    <ShoppingBag className="w-7 h-7" />
                  </div>
                  <h3 className="font-mono text-sm font-bold uppercase text-white">
                    Co-Cart Is Currently Empty
                  </h3>
                  <p className="text-xs text-neutral-400 max-w-xs font-sans leading-relaxed">
                    Browse garments anywhere on the store and click &ldquo;ADD TO CO-CART&rdquo; to curate together in real-time.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => {
                    const loveVotes = item.votes.filter((v) => v.vote === "love");
                    const passVotes = item.votes.filter((v) => v.vote === "pass");
                    const hasLoved = item.votes.some(
                      (v) => v.memberName.toLowerCase() === memberName.toLowerCase() && v.vote === "love"
                    );
                    const hasPassed = item.votes.some(
                      (v) => v.memberName.toLowerCase() === memberName.toLowerCase() && v.vote === "pass"
                    );
                    const isCommentsOpen = activeCommentItemId === item.id;

                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 shadow-lg"
                      >
                        {/* Garment Basic Row */}
                        <div className="flex items-start gap-3">
                          <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-neutral-900 border border-white/10 shrink-0">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-mono text-xs font-bold uppercase text-white truncate">
                                {item.name}
                              </h4>
                              <button
                                type="button"
                                onClick={() => removeFromCoCart(item.id)}
                                aria-label={`Remove ${item.name} from co-cart`}
                                className="p-1 text-neutral-500 hover:text-white transition-colors cursor-pointer shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-400">
                              <span className="text-white font-bold">{item.price}</span>
                              <span>•</span>
                              <span>Size: {item.size}</span>
                              <span>•</span>
                              <span>Qty: {item.quantity}</span>
                            </div>

                            {/* Added by chip */}
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-[9.5px] font-mono text-neutral-300">
                              <span>Added by:</span>
                              <span className="text-white font-bold">{item.addedBy.name}</span>
                            </div>
                          </div>
                        </div>

                        {/* LIVE VOTING BAR */}
                        <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {/* Love Vote Button */}
                            <button
                              type="button"
                              onClick={() => voteOnItem(item.id, "love")}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                                hasLoved
                                  ? "bg-white text-black shadow-md scale-105"
                                  : "bg-white/10 text-neutral-300 hover:bg-white/20 hover:text-white"
                              }`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>{loveVotes.length} LOVE</span>
                            </button>

                            {/* Pass Vote Button */}
                            <button
                              type="button"
                              onClick={() => voteOnItem(item.id, "pass")}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                                hasPassed
                                  ? "bg-neutral-800 text-white border border-white/40 shadow-md scale-105"
                                  : "bg-white/10 text-neutral-400 hover:bg-white/20 hover:text-white"
                              }`}
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                              <span>{passVotes.length} PASS</span>
                            </button>
                          </div>

                          {/* Toggle Comments Trigger */}
                          <button
                            type="button"
                            onClick={() =>
                              setActiveCommentItemId(isCommentsOpen ? null : item.id)
                            }
                            className="flex items-center gap-1 text-[11px] font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>{item.comments.length}</span>
                            {isCommentsOpen ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        </div>

                        {/* Voter Names Rollcall */}
                        {(loveVotes.length > 0 || passVotes.length > 0) && (
                          <div className="text-[10px] font-mono text-neutral-400 space-y-0.5 bg-black/40 p-2 rounded-xl border border-white/5">
                            {loveVotes.length > 0 && (
                              <p className="truncate">
                                <span className="text-white font-bold">Loved by: </span>
                                <span>{loveVotes.map((v) => v.memberName).join(", ")}</span>
                              </p>
                            )}
                            {passVotes.length > 0 && (
                              <p className="truncate">
                                <span className="text-neutral-400 font-bold">Passed by: </span>
                                <span>{passVotes.map((v) => v.memberName).join(", ")}</span>
                              </p>
                            )}
                          </div>
                        )}

                        {/* PRODUCT COMMENTS THREAD (Expandable) */}
                        {isCommentsOpen && (
                          <div className="pt-2 border-t border-white/10 space-y-2 animate-in fade-in duration-150">
                            <span className="font-mono text-[9.5px] uppercase tracking-widest text-neutral-400 font-bold block">
                              GARMENT DISCUSSION ({item.comments.length})
                            </span>

                            {item.comments.length > 0 ? (
                              <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                                {item.comments.map((c) => (
                                  <div
                                    key={c.id}
                                    className="p-2 rounded-xl bg-white/5 border border-white/5 text-xs font-sans"
                                  >
                                    <div className="flex items-center justify-between font-mono text-[10px] text-neutral-400">
                                      <span className="text-white font-bold">{c.memberName}</span>
                                      <span>
                                        {new Date(c.timestamp).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </div>
                                    <p className="text-neutral-200 mt-0.5 text-xs">{c.text}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-neutral-500 italic font-mono">
                                No comments on this piece yet. Be the first to share thoughts!
                              </p>
                            )}

                            {/* Add Comment Input */}
                            <div className="flex items-center gap-1.5 pt-1">
                              <input
                                type="text"
                                value={commentInputs[item.id] || ""}
                                onChange={(e) =>
                                  setCommentInputs((prev) => ({
                                    ...prev,
                                    [item.id]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleSendComment(item.id);
                                  }
                                }}
                                placeholder={`Remark for ${item.name}...`}
                                className="flex-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white font-sans text-xs focus:outline-none focus:border-white placeholder:text-neutral-600"
                              />
                              <button
                                type="button"
                                onClick={() => handleSendComment(item.id)}
                                disabled={!commentInputs[item.id]?.trim()}
                                className="px-3 py-1.5 rounded-xl bg-white text-black font-mono text-xs font-bold uppercase hover:bg-neutral-200 disabled:opacity-40 cursor-pointer"
                              >
                                Post
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ROOM LIVE CHAT */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400 font-mono text-xs">
                    Start the conversation with your friends & family!
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.memberName.toLowerCase() === memberName.toLowerCase();
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${
                          m.isSystem
                            ? "items-center"
                            : isMe
                            ? "items-end"
                            : "items-start"
                        }`}
                      >
                        {m.isSystem ? (
                          <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 font-mono text-[10px] text-neutral-400 text-center my-1">
                            {m.text}
                          </div>
                        ) : (
                          <div className={`max-w-[80%] space-y-0.5`}>
                            <span className="font-mono text-[10px] text-neutral-400 px-1">
                              {m.memberName}
                            </span>
                            <div
                              className={`p-3 rounded-2xl text-xs font-sans leading-relaxed ${
                                isMe
                                  ? "bg-white text-black rounded-tr-none font-medium"
                                  : "bg-white/10 text-white rounded-tl-none border border-white/10"
                              }`}
                            >
                              {m.text}
                            </div>
                            <span className="font-mono text-[9px] text-neutral-500 px-1 block">
                              {new Date(m.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendChat} className="p-3 border-t border-white/10 bg-white/5 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Message friends in room..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white font-sans text-xs focus:outline-none focus:border-white placeholder:text-neutral-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-2.5 rounded-xl bg-white text-black hover:bg-neutral-200 disabled:opacity-40 transition-all cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: MEMBERS & PRESENCE */}
          {activeTab === "members" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <span className="font-mono text-[9.5px] uppercase tracking-widest text-neutral-400 font-bold block">
                  ACTIVE PARTICIPANTS ({members.length})
                </span>
                <div className="space-y-2">
                  {members.map((m, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-white text-black font-mono text-xs font-bold flex items-center justify-center uppercase">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{m.name}</span>
                            {m.name.toLowerCase() === memberName.toLowerCase() && (
                              <span className="text-[9px] text-neutral-400 font-normal">(You)</span>
                            )}
                          </p>
                          <span className="font-mono text-[9.5px] text-neutral-500 block">
                            Active in Room
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-white">
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                        <span className="font-mono text-[10px] text-neutral-300">ONLINE</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Share Room Code Card */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <span className="font-mono text-[9.5px] uppercase tracking-widest text-neutral-400 font-bold block">
                  INVITE FRIENDS & FAMILY
                </span>
                <p className="text-xs text-neutral-300 font-sans">
                  Share this 6-character room code or send the direct link. Anyone with the code can join the live session.
                </p>

                <div className="flex items-center justify-between p-3 rounded-xl bg-black border border-white/15">
                  <span className="font-mono text-sm font-bold tracking-widest text-white">
                    {roomCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-black hover:bg-neutral-200 font-mono text-xs font-bold uppercase transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "COPIED" : "COPY LINK"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions (Co-Cart Checkout Trigger) */}
          {activeTab === "cart" && items.length > 0 && (
            <div className="p-4 border-t border-white/10 bg-white/5 space-y-2 shrink-0">
              <button
                type="button"
                onClick={transferAllToPersonalCart}
                className="w-full py-3.5 rounded-2xl bg-white text-black hover:bg-neutral-200 font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>TRANSFER ALL TO MY BAG & CHECKOUT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[10px] font-mono text-neutral-400 text-center">
                Syncs all agreed pieces into your personal cart for unified checkout.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

