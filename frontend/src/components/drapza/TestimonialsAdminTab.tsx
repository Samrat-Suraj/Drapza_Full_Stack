"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageSquareQuote,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  Star,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Check,
  Sliders,
  HelpCircle,
  X,
  Clock,
  Quote,
} from "lucide-react";
import { audioSystem } from "./AudioSystem";
import {
  testimonialsConfigApi,
  TestimonialsConfigData,
  TestimonialStoryItem,
  DEFAULT_TESTIMONIALS_CONFIG,
} from "@/lib/api";
import { ConfirmModal } from "./ConfirmModal";
import { useLockBodyScroll } from "./useLockBodyScroll";
import { TestimonialsSection } from "./TestimonialsSection";

interface TestimonialsAdminTabProps {
  config: TestimonialsConfigData;
  setConfig: React.Dispatch<React.SetStateAction<TestimonialsConfigData>>;
  onSaveSuccess?: () => void;
}

export const TestimonialsAdminTab: React.FC<TestimonialsAdminTabProps> = ({
  config,
  setConfig,
  onSaveSuccess,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Story edit / create modal state
  const [editingStory, setEditingStory] = useState<TestimonialStoryItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | number | null>(null);
  const [showLivePreview, setShowLivePreview] = useState(true);

  const isStoryModalOpen = Boolean(editingStory || isCreatingNew);
  useLockBodyScroll(isStoryModalOpen);

  const modalCardRef = useRef<HTMLDivElement>(null);
  const modalScrollRef = useRef<HTMLDivElement>(null);

  // Close modal on Escape key
  useEffect(() => {
    if (!isStoryModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsCreatingNew(false);
        setEditingStory(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isStoryModalOpen]);

  // Guaranteed Mouse Wheel / Center Scroll Button Physics
  useEffect(() => {
    if (!isStoryModalOpen) return;
    const scrollEl = modalScrollRef.current;
    const cardEl = modalCardRef.current;
    if (!scrollEl || !cardEl) return;

    let targetScroll = scrollEl.scrollTop;
    let currentScroll = scrollEl.scrollTop;
    let isRunning = false;
    let animId: number | null = null;

    const smoothScrollLoop = () => {
      const diff = targetScroll - currentScroll;
      if (Math.abs(diff) > 0.5) {
        currentScroll += diff * 0.25;
        scrollEl.scrollTop = currentScroll;
        animId = requestAnimationFrame(smoothScrollLoop);
      } else {
        currentScroll = targetScroll;
        scrollEl.scrollTop = targetScroll;
        isRunning = false;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      // If user is inside a scrollable textarea and scrolling within its bounds, let textarea handle it
      const target = e.target as HTMLElement;
      if (target && target.tagName === "TEXTAREA") {
        const textarea = target as HTMLTextAreaElement;
        const canScrollUp = e.deltaY < 0 && textarea.scrollTop > 0;
        const canScrollDown =
          e.deltaY > 0 &&
          textarea.scrollTop < textarea.scrollHeight - textarea.clientHeight;
        if (canScrollUp || canScrollDown) {
          return;
        }
      }

      // Stop Lenis / Window capture
      e.stopPropagation();
      e.preventDefault();

      const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
      if (maxScroll <= 0) return;

      if (!isRunning) {
        targetScroll = scrollEl.scrollTop;
        currentScroll = scrollEl.scrollTop;
        isRunning = true;
        animId = requestAnimationFrame(smoothScrollLoop);
      }
      targetScroll = Math.max(0, Math.min(maxScroll, targetScroll + e.deltaY));
    };

    // Attach wheel listener to modal card element
    cardEl.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      cardEl.removeEventListener("wheel", handleWheel);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isStoryModalOpen]);

  // Default empty story template
  const emptyStory: TestimonialStoryItem = {
    id: `story_${Date.now()}`,
    name: "",
    role: "",
    city: "",
    rating: 5,
    quote: "",
    avatar: "",
    badge: "VERIFIED CLIENT",
    isActive: true,
  };

  const [storyForm, setStoryForm] = useState<TestimonialStoryItem>(emptyStory);

  // Save all config changes to backend
  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);
    audioSystem.playClick(850);

    try {
      const res = await testimonialsConfigApi.updateTestimonialsConfig(config);
      if (res && res.success && res.data) {
        setConfig(res.data);
      }
      setSaveStatus("SAVED & PUBLISHED SUCCESSFULLY");
      audioSystem.playSuccess();

      // Dispatch live update for open browser windows
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("drapza_testimonials_updated", { detail: config })
        );
      }

      if (onSaveSuccess) onSaveSuccess();
      setTimeout(() => setSaveStatus(null), 3500);
    } catch (err: any) {
      console.error("[TESTIMONIALS CMS] Save error:", err);
      setSaveStatus("FAILED TO SAVE CONFIGURATION");
      audioSystem.playClick(300, 0.08);
      setTimeout(() => setSaveStatus(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to factory defaults
  const handleResetConfig = async () => {
    setIsResetting(true);
    audioSystem.playClick(600);

    try {
      const res = await testimonialsConfigApi.resetTestimonialsConfig();
      if (res && res.success && res.data) {
        setConfig(res.data);
      } else {
        setConfig(DEFAULT_TESTIMONIALS_CONFIG);
      }
      setShowResetConfirm(false);
      setSaveStatus("RESET TO FACTORY DEFAULTS");
      audioSystem.playSuccess();

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("drapza_testimonials_updated", {
            detail: res?.data || DEFAULT_TESTIMONIALS_CONFIG,
          })
        );
      }
      setTimeout(() => setSaveStatus(null), 3500);
    } catch (err) {
      console.error("[TESTIMONIALS CMS] Reset error:", err);
      setConfig(DEFAULT_TESTIMONIALS_CONFIG);
      setShowResetConfirm(false);
    } finally {
      setIsResetting(false);
    }
  };

  // Toggle individual story visibility
  const handleToggleStoryActive = (id: string | number) => {
    audioSystem.playClick(700);
    setConfig((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, isActive: item.isActive === false } : item
      ),
    }));
  };

  // Move story Up in list
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    audioSystem.playClick(650);
    setConfig((prev) => {
      const newItems = [...prev.items];
      const temp = newItems[index - 1];
      newItems[index - 1] = newItems[index];
      newItems[index] = temp;
      return { ...prev, items: newItems };
    });
  };

  // Move story Down in list
  const handleMoveDown = (index: number) => {
    if (index === config.items.length - 1) return;
    audioSystem.playClick(650);
    setConfig((prev) => {
      const newItems = [...prev.items];
      const temp = newItems[index + 1];
      newItems[index + 1] = newItems[index];
      newItems[index] = temp;
      return { ...prev, items: newItems };
    });
  };

  // Open modal to create a new story
  const handleOpenCreateModal = () => {
    audioSystem.playClick(750);
    setStoryForm({
      ...emptyStory,
      id: `story_${Date.now()}`,
    });
    setIsCreatingNew(true);
    setEditingStory(null);
  };

  // Open modal to edit an existing story
  const handleOpenEditModal = (story: TestimonialStoryItem) => {
    audioSystem.playClick(750);
    setStoryForm({ ...story });
    setEditingStory(story);
    setIsCreatingNew(false);
  };

  // Save modal form (Create or Update)
  const handleSaveStoryForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyForm.name.trim() || !storyForm.quote.trim()) {
      alert("Please provide author name and testimonial quote.");
      return;
    }

    audioSystem.playSuccess();
    if (isCreatingNew) {
      setConfig((prev) => ({
        ...prev,
        items: [...prev.items, storyForm],
      }));
    } else if (editingStory) {
      setConfig((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === editingStory.id ? storyForm : item
        ),
      }));
    }

    setIsCreatingNew(false);
    setEditingStory(null);
  };

  // Delete story
  const handleConfirmDelete = () => {
    if (!deleteConfirmId) return;
    audioSystem.playClick(500);
    setConfig((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== deleteConfirmId),
    }));
    setDeleteConfirmId(null);
  };

  const activeCount = config.items.filter((i) => i.isActive !== false).length;

  return (
    <div className="space-y-8 animate-fadeIn text-neutral-200">
      {/* ─── 1. TOP HEADER & TELEMETRY STRIP ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-none bg-[#121316] border border-[#26272c] shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono text-[11px] text-white uppercase tracking-widest font-bold">
            <MessageSquareQuote className="w-4 h-4 text-white" />
            <span>STOREFRONT CMS • BOUTIQUE STORIES & REVIEWS</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse ml-1" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-mono uppercase text-white tracking-wider">
            TESTIMONIALS CAROUSEL STUDIO
          </h2>
          <p className="text-xs text-neutral-400 font-mono">
            Control quotes, atelier reviewers, 5-star ratings, rotation speed, and visibility on the storefront.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {saveStatus && (
            <span
              className={`font-mono text-xs px-3 py-1.5 rounded-none font-bold flex items-center gap-1.5 border ${
                saveStatus.includes("SUCCESS")
                  ? "bg-emerald-950/70 border-emerald-500/50 text-emerald-300"
                  : "bg-red-950/70 border-red-500/50 text-red-300"
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              {saveStatus}
            </span>
          )}

          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            disabled={isResetting || isSaving}
            className="px-4 py-2.5 rounded-none bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 font-mono text-xs uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            title="Reset to factory default reviews"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
            <span>RESET DEFAULTS</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveConfig()}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-none bg-white hover:bg-neutral-200 text-black font-mono text-xs uppercase font-black tracking-widest transition-all cursor-pointer shadow-lg hover:shadow-xl flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "SAVING..." : "SAVE & PUBLISH"}</span>
          </button>
        </div>
      </div>

      {/* ─── 2. SECTION SETTINGS & PARAMETERS GRID ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card A: Master Visibility & Heading */}
        <div className="lg:col-span-2 p-6 rounded-none bg-[#141518] border border-neutral-800 space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
            <h3 className="font-mono text-sm font-bold uppercase text-white flex items-center gap-2 tracking-wider">
              <Sliders className="w-4 h-4 text-white" />
              <span>CAROUSEL SECTION HEADERS & VISIBILITY</span>
            </h3>
            <span className="font-mono text-[10px] text-neutral-500 uppercase">
              [ GLOBAL CONTROLS ]
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 font-mono text-xs">
            {/* Master Visibility Switch */}
            <div className="sm:col-span-2 p-4 rounded-none bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white uppercase block text-sm">
                  Section Master Visibility
                </span>
                <span className="text-[11px] text-neutral-400 block mt-0.5">
                  Toggle whether the Boutique Stories section appears on the homepage and landing page.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  audioSystem.playClick(700);
                  setConfig((prev) => ({ ...prev, isEnabled: !prev.isEnabled }));
                }}
                className={`px-4 py-2 rounded-none font-mono text-xs uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                  config.isEnabled
                    ? "bg-emerald-500 text-black shadow-lg"
                    : "bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700"
                }`}
              >
                {config.isEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{config.isEnabled ? "SECTION ACTIVE" : "SECTION HIDDEN"}</span>
              </button>
            </div>

            {/* Section Heading */}
            <div className="space-y-1.5">
              <label className="block text-neutral-400 font-bold uppercase tracking-wider">
                Section Heading (Title)
              </label>
              <input
                type="text"
                value={config.heading}
                onChange={(e) => setConfig({ ...config, heading: e.target.value })}
                placeholder="BOUTIQUE STORIES"
                className="w-full bg-[#1c1d22] border border-neutral-700 focus:border-white p-2.5 text-white font-mono rounded-none focus:outline-none transition-colors"
              />
            </div>

            {/* Badge Text */}
            <div className="space-y-1.5">
              <label className="block text-neutral-400 font-bold uppercase tracking-wider">
                Luxury Sub-Badge Label
              </label>
              <input
                type="text"
                value={config.badgeText}
                onChange={(e) => setConfig({ ...config, badgeText: e.target.value })}
                placeholder="[ VERIFIED ATELIER CLIENTS ]"
                className="w-full bg-[#1c1d22] border border-neutral-700 focus:border-white p-2.5 text-white font-mono rounded-none focus:outline-none transition-colors"
              />
            </div>

            {/* Subtext */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-neutral-400 font-bold uppercase tracking-wider">
                Subtitle Description
              </label>
              <input
                type="text"
                value={config.subtext}
                onChange={(e) => setConfig({ ...config, subtext: e.target.value })}
                placeholder="What boutique owners say about drapza's luxury sewing standards"
                className="w-full bg-[#1c1d22] border border-neutral-700 focus:border-white p-2.5 text-white font-mono rounded-none focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Card B: Motion & Autoplay Settings */}
        <div className="p-6 rounded-none bg-[#141518] border border-neutral-800 space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
            <h3 className="font-mono text-sm font-bold uppercase text-white flex items-center gap-2 tracking-wider">
              <Clock className="w-4 h-4 text-white" />
              <span>ROTATION & SPEED</span>
            </h3>
            <span className="font-mono text-[10px] text-neutral-500 uppercase">
              [ MOTION TIMING ]
            </span>
          </div>

          <div className="space-y-5 font-mono text-xs">
            {/* Autoplay Toggle */}
            <div className="p-3.5 rounded-none bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white uppercase block">Auto Slide Transition</span>
                <span className="text-[10px] text-neutral-400">Automatically advance testimonials</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  audioSystem.playClick(650);
                  setConfig((prev) => ({ ...prev, autoplay: !prev.autoplay }));
                }}
                className={`px-3 py-1.5 rounded-none font-mono text-[11px] uppercase font-bold transition-all cursor-pointer ${
                  config.autoplay
                    ? "bg-white text-black"
                    : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                }`}
              >
                {config.autoplay ? "ENABLED" : "PAUSED"}
              </button>
            </div>

            {/* Speed Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 uppercase font-bold">Slide Interval Speed:</span>
                <span className="text-white font-bold">
                  {(config.autoplayInterval / 1000).toFixed(1)} seconds
                </span>
              </div>
              <input
                type="range"
                min="2000"
                max="12000"
                step="500"
                value={config.autoplayInterval || 6000}
                onChange={(e) =>
                  setConfig({ ...config, autoplayInterval: Number(e.target.value) })
                }
                className="w-full accent-white cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                <span>Fast (2s)</span>
                <span>Default (6s)</span>
                <span>Slow (12s)</span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="pt-2 border-t border-neutral-800/80 grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 rounded-none bg-neutral-900/40 border border-neutral-800">
                <span className="text-[10px] text-neutral-500 block uppercase font-bold">Total Reviews</span>
                <span className="text-base font-black text-white">{config.items.length}</span>
              </div>
              <div className="p-2.5 rounded-none bg-neutral-900/40 border border-neutral-800">
                <span className="text-[10px] text-neutral-500 block uppercase font-bold">Visible on Site</span>
                <span className="text-base font-black text-white">{activeCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. STORY CARDS MANAGER (LIST & CRUD) ─── */}
      <div className="p-6 rounded-none bg-[#141518] border border-neutral-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
          <div>
            <h3 className="font-mono text-base font-bold uppercase text-white flex items-center gap-2 tracking-wider">
              <Quote className="w-4 h-4 text-white" />
              <span>TESTIMONIAL STORIES VAULT ({config.items.length} CARDS)</span>
            </h3>
            <p className="text-xs text-neutral-400 font-mono mt-1">
              Add new reviews, modify client quotes, toggle visibility, and drag or reorder position in the 3D carousel.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-none bg-white hover:bg-neutral-200 text-black font-mono text-xs uppercase font-black tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>ADD NEW TESTIMONIAL</span>
          </button>
        </div>

        {/* Stories Grid / Cards */}
        {config.items.length === 0 ? (
          <div className="py-12 text-center text-neutral-500 font-mono text-xs border border-dashed border-neutral-800">
            No testimonials found. Click &quot;ADD NEW TESTIMONIAL&quot; or &quot;RESET DEFAULTS&quot; to populate.
          </div>
        ) : (
          <div className="space-y-3 font-mono text-xs">
            {config.items.map((story, idx) => {
              const isStoryActive = story.isActive !== false;
              return (
                <div
                  key={story.id}
                  className={`p-4 sm:p-5 rounded-none border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isStoryActive
                      ? "bg-[#18191d] border-neutral-800 hover:border-neutral-700"
                      : "bg-[#111214] border-neutral-900 opacity-60"
                  }`}
                >
                  {/* Left: Position & Stars & Author */}
                  <div className="flex items-start sm:items-center gap-4 flex-1">
                    <span className="text-neutral-500 font-black text-sm w-7 shrink-0">
                      #{idx + 1}
                    </span>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-serif text-sm uppercase tracking-wider text-white font-bold">
                          {story.name}
                        </span>
                        <span className="text-neutral-400 text-xs">
                          {story.role ? `• ${story.role}` : ""}
                          {story.city ? `, ${story.city}` : ""}
                        </span>
                        {story.badge && (
                          <span className="text-[9px] uppercase px-2 py-0.5 rounded-none bg-black border border-neutral-700 text-neutral-300 font-bold">
                            {story.badge}
                          </span>
                        )}
                        {!isStoryActive && (
                          <span className="text-[9px] uppercase px-2 py-0.5 rounded-none bg-red-950/80 text-red-300 border border-red-800/40">
                            HIDDEN
                          </span>
                        )}
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: story.rating || 5 }).map((_, starIdx) => (
                          <Star
                            key={starIdx}
                            className="w-3.5 h-3.5 fill-white text-white stroke-white"
                          />
                        ))}
                      </div>

                      {/* Quote preview */}
                      <p className="text-neutral-300 text-xs italic line-clamp-2 max-w-3xl">
                        &ldquo;{story.quote}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions (Move, Toggle, Edit, Delete) */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                    {/* Move Up */}
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveUp(idx)}
                      className="p-2 rounded-none bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 disabled:opacity-30 cursor-pointer"
                      title="Move up in carousel"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      disabled={idx === config.items.length - 1}
                      onClick={() => handleMoveDown(idx)}
                      className="p-2 rounded-none bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 disabled:opacity-30 cursor-pointer"
                      title="Move down in carousel"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Active / Hidden toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleStoryActive(story.id)}
                      className={`p-2 rounded-none border cursor-pointer transition-colors ${
                        isStoryActive
                          ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/50"
                          : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-white"
                      }`}
                      title={isStoryActive ? "Click to hide story" : "Click to show story"}
                    >
                      {isStoryActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(story)}
                      className="px-3 py-2 rounded-none bg-neutral-900 hover:bg-white text-neutral-300 hover:text-black border border-neutral-800 font-bold cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>EDIT</span>
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(story.id)}
                      className="p-2 rounded-none bg-neutral-900 hover:bg-red-950 text-neutral-400 hover:text-red-400 border border-neutral-800 hover:border-red-800 cursor-pointer transition-colors"
                      title="Delete story"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── 4. INTERACTIVE LIVE 3D PREVIEW CAROUSEL ─── */}
      <div className="p-6 rounded-none bg-[#141518] border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
          <div className="space-y-0.5">
            <h3 className="font-mono text-base font-bold uppercase text-white flex items-center gap-2 tracking-wider">
              <span>LIVE STOREFRONT 3D CAROUSEL PREVIEW</span>
            </h3>
            <p className="text-xs text-neutral-400 font-mono">
              Real-time interactive rendering of the boutique stories carousel with current edits.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowLivePreview(!showLivePreview)}
            className="px-3 py-1.5 rounded-none bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono text-xs uppercase cursor-pointer"
          >
            {showLivePreview ? "HIDE PREVIEW" : "SHOW PREVIEW"}
          </button>
        </div>

        {showLivePreview && (
          <div className="rounded-none border border-neutral-800 overflow-hidden bg-black/80">
            <TestimonialsSection config={config} />
          </div>
        )}
      </div>

      {/* ─── 5. STORY CREATE / EDIT MODAL ─── */}
      {(isCreatingNew || editingStory) && (
        <div
          data-lenis-prevent="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsCreatingNew(false);
              setEditingStory(null);
            }
          }}
        >
          <div
            ref={modalCardRef}
            data-lenis-prevent="true"
            className="relative w-full max-w-xl bg-[#141518] border border-neutral-700 shadow-2xl animate-scaleUp font-mono text-xs my-auto flex flex-col max-h-[90vh] overflow-hidden rounded-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              data-lenis-prevent="true"
              className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 sm:px-7 sm:py-5 shrink-0 bg-[#141518]"
            >
              <div className="space-y-1">
                <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold block">
                  {isCreatingNew ? "NEW ATELIER ENTRY" : "EDIT ATELIER REVIEW"}
                </span>
                <h3 className="text-base font-bold uppercase text-white truncate max-w-[340px] sm:max-w-md">
                  {isCreatingNew ? "ADD TESTIMONIAL STORY" : `EDIT: ${editingStory?.name}`}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsCreatingNew(false);
                  setEditingStory(null);
                }}
                className="p-1.5 rounded-none text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer transition-colors"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form with Scrollable Content & Pinned Footer */}
            <form onSubmit={handleSaveStoryForm} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Scrollable Form Body */}
              <div
                ref={modalScrollRef}
                data-lenis-prevent="true"
                style={{
                  WebkitOverflowScrolling: "touch",
                  overscrollBehavior: "contain",
                }}
                className="overflow-y-auto flex-1 p-6 sm:p-7 space-y-4 dark-scrollbar min-h-0"
              >
                {/* Author Name */}
                <div className="space-y-1">
                  <label className="text-neutral-300 uppercase font-bold block">
                    Client / Author Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={storyForm.name}
                    onChange={(e) => setStoryForm({ ...storyForm, name: e.target.value })}
                    placeholder="e.g. VIKRAM SINGHANIA"
                    className="w-full bg-[#1c1d22] border border-neutral-700 focus:border-white p-2.5 text-white font-mono rounded-none focus:outline-none"
                  />
                </div>

                {/* Role & City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-neutral-300 uppercase font-bold block">
                      Role / Business Title
                    </label>
                    <input
                      type="text"
                      value={storyForm.role}
                      onChange={(e) => setStoryForm({ ...storyForm, role: e.target.value })}
                      placeholder="e.g. Haute Couture Atelier"
                      className="w-full bg-[#1c1d22] border border-neutral-700 focus:border-white p-2.5 text-white font-mono rounded-none focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-neutral-300 uppercase font-bold block">
                      City / Location
                    </label>
                    <input
                      type="text"
                      value={storyForm.city}
                      onChange={(e) => setStoryForm({ ...storyForm, city: e.target.value })}
                      placeholder="e.g. Kolkata"
                      className="w-full bg-[#1c1d22] border border-neutral-700 focus:border-white p-2.5 text-white font-mono rounded-none focus:outline-none"
                    />
                  </div>
                </div>

                {/* Rating (Stars Selector) & Badge */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-neutral-300 uppercase font-bold block">
                      Star Rating (1 - 5)
                    </label>
                    <div className="flex items-center gap-2 pt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => {
                            audioSystem.playClick(600 + star * 50);
                            setStoryForm({ ...storyForm, rating: star });
                          }}
                          className="cursor-pointer p-1"
                          title={`${star} Star${star > 1 ? "s" : ""}`}
                        >
                          <Star
                            className={`w-5 h-5 transition-transform hover:scale-110 ${
                              star <= (storyForm.rating || 5)
                                ? "fill-white text-white stroke-white"
                                : "text-neutral-600 stroke-neutral-600"
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-white font-bold ml-1">
                        {storyForm.rating || 5} Stars
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-neutral-300 uppercase font-bold block">
                      Atelier Badge Label
                    </label>
                    <input
                      type="text"
                      value={storyForm.badge || ""}
                      onChange={(e) => setStoryForm({ ...storyForm, badge: e.target.value })}
                      placeholder="e.g. ATELIER CURATOR"
                      className="w-full bg-[#1c1d22] border border-neutral-700 focus:border-white p-2.5 text-white font-mono rounded-none focus:outline-none"
                    />
                  </div>
                </div>

                {/* Portrait Avatar URL */}
                <div className="space-y-1">
                  <label className="text-neutral-300 uppercase font-bold block">
                    Portrait Image URL / Avatar Path
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={storyForm.avatar || ""}
                      onChange={(e) => setStoryForm({ ...storyForm, avatar: e.target.value })}
                      placeholder="/testimonials/diana-tigelle.png or https://images.unsplash.com/..."
                      className="flex-1 bg-[#1c1d22] border border-neutral-700 focus:border-white p-2.5 text-white font-mono rounded-none focus:outline-none"
                    />
                    {storyForm.avatar && (
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-neutral-600 shrink-0 bg-neutral-800">
                        <img
                          src={storyForm.avatar}
                          alt="Avatar preview"
                          className="w-full h-full object-cover"
                          onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                        />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    Circular portrait image used in the editorial testimonial canvas.
                  </span>
                </div>

                {/* Testimonial Quote */}
                <div className="space-y-1">
                  <label className="text-neutral-300 uppercase font-bold block">
                    Testimonial Quote Text *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={storyForm.quote}
                    onChange={(e) => setStoryForm({ ...storyForm, quote: e.target.value })}
                    placeholder="The architectural drape and 480 GSM fabric weight set a new benchmark. Clients frequently compliment the bespoke silhouette precision."
                    className="w-full bg-[#1c1d22] border border-neutral-700 focus:border-white p-2.5 text-white font-mono rounded-none focus:outline-none leading-relaxed resize-y min-h-[90px]"
                  />
                </div>

                {/* Visibility checkbox */}
                <label className="flex items-center gap-2.5 cursor-pointer pt-1 select-none">
                  <input
                    type="checkbox"
                    checked={storyForm.isActive !== false}
                    onChange={(e) =>
                      setStoryForm({ ...storyForm, isActive: e.target.checked })
                    }
                    className="w-4 h-4 accent-white cursor-pointer"
                  />
                  <span className="text-white font-bold uppercase">
                    Active (Display this review in carousel)
                  </span>
                </label>
              </div>

              {/* Pinned Action Buttons */}
              <div
                data-lenis-prevent="true"
                className="p-4 sm:px-7 sm:py-4 border-t border-neutral-800 bg-[#101114] flex items-center justify-end gap-3 shrink-0"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setEditingStory(null);
                  }}
                  className="px-4 py-2.5 rounded-none bg-neutral-900 hover:bg-neutral-800 text-neutral-300 uppercase font-bold cursor-pointer transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-none bg-white text-black font-black uppercase tracking-wider hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  {isCreatingNew ? "ADD REVIEW" : "UPDATE REVIEW"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 6. DELETE CONFIRMATION MODAL ─── */}
      <ConfirmModal
        isOpen={Boolean(deleteConfirmId)}
        variant="danger"
        title="DELETE TESTIMONIAL STORY"
        subtitle="Permanent Action"
        message="Are you sure you want to delete this testimonial review from the boutique stories vault? This change will be saved when you publish."
        confirmLabel="YES, DELETE STORY"
        cancelLabel="CANCEL"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />

      {/* ─── 7. RESET FACTORY DEFAULTS CONFIRMATION MODAL ─── */}
      <ConfirmModal
        isOpen={showResetConfirm}
        variant="warning"
        title="RESET TO FACTORY DEFAULTS"
        subtitle="Default Boutique Stories"
        message="This will reset all testimonial reviews and settings back to Drapza's 5 default client boutique stories (Rohan Mehra, Priya Patel, Ananya Sharma, Vikram Singhania, Kavita Desai). Continue?"
        confirmLabel="YES, RESET DEFAULTS"
        cancelLabel="CANCEL"
        onConfirm={handleResetConfig}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};

