"use client";

import React, { useState, useRef, useEffect, useCallback, MouseEvent as ReactMouseEvent } from "react";
import {
  Crop,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  ZoomIn,
  ZoomOut,
  Check,
  X,
  RefreshCw,
  Move,
  Wand2,
  Eraser,
  Sun,
  Moon,
  Layers,
} from "lucide-react";
import { useLockBodyScroll } from "./useLockBodyScroll";
import { audioSystem } from "./AudioSystem";

export type AspectRatioPreset = "3:4" | "1:1" | "4:5" | "9:16" | "free";
export type BgReplacementMode = "transparent" | "white" | "offwhite" | "black";

export interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  title?: string;
  defaultAspect?: AspectRatioPreset;
  initialBgRemovalActive?: boolean;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
  onSkipCrop?: () => void;
}

export function ImageCropperModal({
  isOpen,
  imageSrc,
  title = "CROP & FIT PRODUCT IMAGE",
  defaultAspect = "3:4",
  initialBgRemovalActive = false,
  onClose,
  onCropComplete,
  onSkipCrop,
}: ImageCropperModalProps) {
  useLockBodyScroll(isOpen);

  const [aspect, setAspect] = useState<AspectRatioPreset>(defaultAspect);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isFlippedH, setIsFlippedH] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Background Removal Engine States
  const [isBgRemovalActive, setIsBgRemovalActive] = useState<boolean>(false);
  const [bgMode, setBgMode] = useState<BgReplacementMode>("transparent");
  const [bgTolerance, setBgTolerance] = useState<number>(38);
  const [bgFeather, setBgFeather] = useState<number>(4);
  const [processedBgImageSrc, setProcessedBgImageSrc] = useState<string | null>(null);
  const [isComputingBg, setIsComputingBg] = useState<boolean>(false);

  // Active view image source (original vs background removed)
  const activeDisplaySrc = isBgRemovalActive && processedBgImageSrc ? processedBgImageSrc : imageSrc;

  // Container & Image metrics
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Crop Box state relative to the displayed image (in percentages [0..100])
  const [crop, setCrop] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 10,
    y: 10,
    width: 80,
    height: 80,
  });

  // Dragging / Resizing interaction states
  const [isDraggingBox, setIsDraggingBox] = useState<boolean>(false);
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; crop: typeof crop }>({
    mouseX: 0,
    mouseY: 0,
    crop: { x: 10, y: 10, width: 80, height: 80 },
  });

  // Calculate aspect ratio decimal
  const getAspectNumeric = useCallback((preset: AspectRatioPreset): number | null => {
    switch (preset) {
      case "3:4":
        return 3 / 4;
      case "1:1":
        return 1 / 1;
      case "4:5":
        return 4 / 5;
      case "9:16":
        return 9 / 16;
      case "free":
      default:
        return null;
    }
  }, []);

  // Initialize crop box whenever image loads or aspect changes
  const resetCropToAspect = useCallback(
    (targetAspect: AspectRatioPreset) => {
      const numAspect = getAspectNumeric(targetAspect);
      if (!numAspect) {
        setCrop({ x: 5, y: 5, width: 90, height: 90 });
        return;
      }

      let w = 80;
      let h = 80;

      if (numAspect < 1) {
        // Tall portrait (e.g. 3:4)
        h = 85;
        w = h * numAspect;
        if (w > 90) {
          w = 90;
          h = w / numAspect;
        }
      } else {
        // Square or wide
        w = 80;
        h = w / numAspect;
        if (h > 90) {
          h = 90;
          w = h * numAspect;
        }
      }

      const x = Math.max(0, (100 - w) / 2);
      const y = Math.max(0, (100 - h) / 2);
      setCrop({ x, y, width: w, height: h });
    },
    [getAspectNumeric]
  );

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setIsFlippedH(false);
      setIsBgRemovalActive(initialBgRemovalActive);
      setProcessedBgImageSrc(null);
      setBgMode("transparent");
      setBgTolerance(38);
      setBgFeather(4);
      setAspect(defaultAspect);
      resetCropToAspect(defaultAspect);
    }
  }, [isOpen, defaultAspect, imageSrc, initialBgRemovalActive, resetCropToAspect]);

  const handleAspectChange = (newAspect: AspectRatioPreset) => {
    setAspect(newAspect);
    resetCropToAspect(newAspect);
  };

  // ── INTELLIGENT CLIENT-SIDE BACKGROUND REMOVAL / CUTOUT ENGINE ───────────
  const computeBackgroundRemoval = useCallback(
    async (sourceUrl: string, tolerance: number, feather: number, mode: BgReplacementMode) => {
      if (!sourceUrl) return null;
      setIsComputingBg(true);

      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = sourceUrl;

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("Canvas 2D context unavailable");

        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // Sample corner & perimeter pixels to determine background chroma
        const samplePixels = [
          0, // Top-Left
          (w - 1) * 4, // Top-Right
          ((h - 1) * w) * 4, // Bottom-Left
          ((h - 1) * w + (w - 1)) * 4, // Bottom-Right
          Math.floor(w / 2) * 4, // Top-Center
          ((h - 1) * w + Math.floor(w / 2)) * 4, // Bottom-Center
          Math.floor(h / 2) * w * 4, // Mid-Left
          (Math.floor(h / 2) * w + (w - 1)) * 4, // Mid-Right
        ];

        let totalR = 0;
        let totalG = 0;
        let totalB = 0;
        let validSamples = 0;

        for (const idx of samplePixels) {
          if (idx >= 0 && idx < data.length - 4) {
            totalR += data[idx];
            totalG += data[idx + 1];
            totalB += data[idx + 2];
            validSamples++;
          }
        }

        const bgR = validSamples > 0 ? totalR / validSamples : 255;
        const bgG = validSamples > 0 ? totalG / validSamples : 255;
        const bgB = validSamples > 0 ? totalB / validSamples : 255;

        // Scaled threshold: tolerance (15..100) -> max delta (20..220)
        const maxThreshold = (tolerance / 100) * 220;
        const featherRange = Math.max(1, (feather / 10) * 35);

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a === 0) continue;

          // Euclidean color distance in RGB space
          const dr = r - bgR;
          const dg = g - bgG;
          const db = b - bgB;
          const dist = Math.sqrt(dr * dr + dg * dg + db * db);

          if (dist < maxThreshold) {
            // Background candidate
            if (dist < maxThreshold - featherRange) {
              // Full background removal
              if (mode === "transparent") {
                data[i + 3] = 0;
              } else if (mode === "white") {
                data[i] = 255;
                data[i + 1] = 255;
                data[i + 2] = 255;
                data[i + 3] = 255;
              } else if (mode === "offwhite") {
                data[i] = 248;
                data[i + 1] = 248;
                data[i + 2] = 248;
                data[i + 3] = 255;
              } else if (mode === "black") {
                data[i] = 12;
                data[i + 1] = 12;
                data[i + 2] = 12;
                data[i + 3] = 255;
              }
            } else {
              // Feathered edge transition
              const alphaFactor = (dist - (maxThreshold - featherRange)) / featherRange;
              if (mode === "transparent") {
                data[i + 3] = Math.round(a * Math.min(1, Math.max(0, alphaFactor)));
              } else if (mode === "white") {
                const mix = 1 - alphaFactor;
                data[i] = Math.round(r * (1 - mix) + 255 * mix);
                data[i + 1] = Math.round(g * (1 - mix) + 255 * mix);
                data[i + 2] = Math.round(b * (1 - mix) + 255 * mix);
              } else if (mode === "offwhite") {
                const mix = 1 - alphaFactor;
                data[i] = Math.round(r * (1 - mix) + 248 * mix);
                data[i + 1] = Math.round(g * (1 - mix) + 248 * mix);
                data[i + 2] = Math.round(b * (1 - mix) + 248 * mix);
              } else if (mode === "black") {
                const mix = 1 - alphaFactor;
                data[i] = Math.round(r * (1 - mix) + 12 * mix);
                data[i + 1] = Math.round(g * (1 - mix) + 12 * mix);
                data[i + 2] = Math.round(b * (1 - mix) + 12 * mix);
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        return canvas.toDataURL("image/png");
      } catch (err) {
        console.error("BG Removal failed:", err);
        return null;
      } finally {
        setIsComputingBg(false);
      }
    },
    []
  );

  // Trigger real-time background re-computation when parameters change
  useEffect(() => {
    if (!isBgRemovalActive || !imageSrc) return;

    let isMounted = true;
    const timeout = setTimeout(async () => {
      const res = await computeBackgroundRemoval(imageSrc, bgTolerance, bgFeather, bgMode);
      if (isMounted && res) {
        setProcessedBgImageSrc(res);
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [isBgRemovalActive, imageSrc, bgTolerance, bgFeather, bgMode, computeBackgroundRemoval]);

  const handleToggleBgRemoval = async () => {
    if (!isBgRemovalActive) {
      setIsBgRemovalActive(true);
      if (!processedBgImageSrc && imageSrc) {
        const res = await computeBackgroundRemoval(imageSrc, bgTolerance, bgFeather, bgMode);
        if (res) setProcessedBgImageSrc(res);
      }
    } else {
      setIsBgRemovalActive(false);
    }
  };

  // ── MOUSE DRAG & RESIZE HANDLERS ──────────────────────────────────────────
  const handleMouseDownBox = (e: ReactMouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingBox(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      crop: { ...crop },
    };
  };

  const handleMouseDownHandle = (handle: string, e: ReactMouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveHandle(handle);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      crop: { ...crop },
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (!isDraggingBox && !activeHandle) return;
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const deltaXPercent = ((e.clientX - dragStartRef.current.mouseX) / rect.width) * 100;
      const deltaYPercent = ((e.clientY - dragStartRef.current.mouseY) / rect.height) * 100;
      const initial = dragStartRef.current.crop;
      const numAspect = getAspectNumeric(aspect);

      if (isDraggingBox) {
        let nextX = initial.x + deltaXPercent;
        let nextY = initial.y + deltaYPercent;

        // Clamp inside container [0..100]
        nextX = Math.max(0, Math.min(100 - initial.width, nextX));
        nextY = Math.max(0, Math.min(100 - initial.height, nextY));

        setCrop((prev) => ({ ...prev, x: nextX, y: nextY }));
      } else if (activeHandle) {
        let newX = initial.x;
        let newY = initial.y;
        let newW = initial.width;
        let newH = initial.height;

        if (activeHandle.includes("e")) {
          newW = Math.max(15, Math.min(100 - initial.x, initial.width + deltaXPercent));
          if (numAspect) newH = newW / numAspect;
        }
        if (activeHandle.includes("s")) {
          newH = Math.max(15, Math.min(100 - initial.y, initial.height + deltaYPercent));
          if (numAspect) newW = newH * numAspect;
        }
        if (activeHandle.includes("w")) {
          const maxDelta = initial.width - 15;
          const clampedDelta = Math.max(-initial.x, Math.min(maxDelta, deltaXPercent));
          newX = initial.x + clampedDelta;
          newW = initial.width - clampedDelta;
          if (numAspect) newH = newW / numAspect;
        }
        if (activeHandle.includes("n")) {
          const maxDelta = initial.height - 15;
          const clampedDelta = Math.max(-initial.y, Math.min(maxDelta, deltaYPercent));
          newY = initial.y + clampedDelta;
          newH = initial.height - clampedDelta;
          if (numAspect) newW = newH * numAspect;
        }

        // Final boundary checks
        if (newX + newW <= 100 && newY + newH <= 100 && newX >= 0 && newY >= 0) {
          setCrop({ x: newX, y: newY, width: newW, height: newH });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingBox(false);
      setActiveHandle(null);
    };

    if (isDraggingBox || activeHandle) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingBox, activeHandle, aspect, getAspectNumeric]);

  // ── APPLY CROP EXPORT VIA CANVAS ──────────────────────────────────────────
  const handleApplyCrop = async () => {
    const finalSource = isBgRemovalActive && processedBgImageSrc ? processedBgImageSrc : imageSrc;
    if (!finalSource) return;
    setIsProcessing(true);

    try {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.src = finalSource;

      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });

      // Natural Dimensions
      const nw = image.naturalWidth;
      const nh = image.naturalHeight;

      // Create high-res canvas
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create canvas context");

      // Calculate source pixel coordinates of crop box
      const sx = (crop.x / 100) * nw;
      const sy = (crop.y / 100) * nh;
      const sw = (crop.width / 100) * nw;
      const sh = (crop.height / 100) * nh;

      // Target canvas output size (High-res, max 2000px on longest side)
      let outW = sw;
      let outH = sh;
      const maxDimension = 2000;
      if (outW > maxDimension || outH > maxDimension) {
        if (outW > outH) {
          outH = Math.round((outH * maxDimension) / outW);
          outW = maxDimension;
        } else {
          outW = Math.round((outW * maxDimension) / outH);
          outH = maxDimension;
        }
      }

      canvas.width = outW;
      canvas.height = outH;

      ctx.save();

      // Handle Flip & Rotation
      ctx.translate(outW / 2, outH / 2);
      if (rotation !== 0) {
        ctx.rotate((rotation * Math.PI) / 180);
      }
      if (isFlippedH) {
        ctx.scale(-1, 1);
      }
      ctx.translate(-outW / 2, -outH / 2);

      // Draw cropped slice
      ctx.drawImage(image, sx, sy, sw, sh, 0, 0, outW, outH);
      ctx.restore();

      // Export format (PNG for transparent cutout, JPEG for solid backdrop)
      const mimeType = isBgRemovalActive && bgMode === "transparent" ? "image/png" : "image/jpeg";
      const quality = 0.94;
      const croppedDataUrl = canvas.toDataURL(mimeType, quality);
      onCropComplete(croppedDataUrl);
      onClose();
    } catch (err: any) {
      console.error("Cropping failed:", err);
      audioSystem.playClick(300, 0.08);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-5xl bg-neutral-950 border border-neutral-800 rounded-none shadow-2xl overflow-hidden flex flex-col max-h-[95vh] text-white">
        {/* TOP HEADER */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-white text-black flex items-center justify-center shadow-sm font-bold">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-white flex items-center gap-2">
                <span>{title}</span>
                <span className="px-2 py-0.5 rounded-none bg-neutral-800 text-[9px] font-mono font-bold text-neutral-300">
                  ATELIER PHOTO STUDIO
                </span>
                {isBgRemovalActive && (
                  <span className="px-2 py-0.5 rounded-none bg-white text-black text-[9px] font-mono font-bold uppercase tracking-wider animate-pulse">
                    ✂ BG REMOVED ({bgMode})
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-neutral-400">
                Crop, rotate, scale, and automatically remove background with transparent PNG cutout or clean studio white backdrop.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-none bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MAIN BODY: WORKSPACE CANVAS & PREVIEW */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col lg:flex-row items-center justify-center gap-6 select-none bg-neutral-950">
          {/* CROP WORKSPACE CANVAS */}
          <div
            ref={containerRef}
            className={`relative w-full max-w-lg aspect-[3/4] sm:aspect-square max-h-[55vh] rounded-none border border-neutral-800 overflow-hidden flex items-center justify-center shadow-inner ${
              isBgRemovalActive && bgMode === "transparent"
                ? "bg-[linear-gradient(45deg,#1c1c1c_25%,transparent_25%),linear-gradient(-45deg,#1c1c1c_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1c1c1c_75%)] bg-[size:16px_16px] bg-neutral-900"
                : isBgRemovalActive && bgMode === "white"
                ? "bg-white"
                : isBgRemovalActive && bgMode === "offwhite"
                ? "bg-[#F8F8F8]"
                : isBgRemovalActive && bgMode === "black"
                ? "bg-[#0A0A0A]"
                : "bg-neutral-900"
            }`}
          >
            {/* Background Image Underneath */}
            <div
              className="relative w-full h-full flex items-center justify-center transition-transform duration-100 ease-out"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg) scaleX(${isFlippedH ? -1 : 1})`,
              }}
            >
              <img
                ref={imageRef}
                src={activeDisplaySrc || imageSrc}
                alt="Source preview"
                className="max-h-full max-w-full object-contain pointer-events-none"
              />
            </div>

            {/* Dark Vignette Overlay on Unselected Area */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Top Mask */}
              <div
                className="absolute top-0 left-0 right-0 bg-black/60 backdrop-blur-[1px]"
                style={{ height: `${crop.y}%` }}
              />
              {/* Bottom Mask */}
              <div
                className="absolute left-0 right-0 bottom-0 bg-black/60 backdrop-blur-[1px]"
                style={{ height: `${100 - (crop.y + crop.height)}%` }}
              />
              {/* Left Mask */}
              <div
                className="absolute left-0 bg-black/60 backdrop-blur-[1px]"
                style={{
                  top: `${crop.y}%`,
                  height: `${crop.height}%`,
                  width: `${crop.x}%`,
                }}
              />
              {/* Right Mask */}
              <div
                className="absolute right-0 bg-black/60 backdrop-blur-[1px]"
                style={{
                  top: `${crop.y}%`,
                  height: `${crop.height}%`,
                  width: `${100 - (crop.x + crop.width)}%`,
                }}
              />
            </div>

            {/* ACTIVE CROP BOX OVERLAY */}
            <div
              onMouseDown={handleMouseDownBox}
              className="absolute border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.8)] cursor-move transition-shadow"
              style={{
                left: `${crop.x}%`,
                top: `${crop.y}%`,
                width: `${crop.width}%`,
                height: `${crop.height}%`,
              }}
            >
              {/* Rule of Thirds 3x3 Grid Lines */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-40">
                <div className="border-r border-b border-white/60" />
                <div className="border-r border-b border-white/60" />
                <div className="border-b border-white/60" />
                <div className="border-r border-b border-white/60" />
                <div className="border-r border-b border-white/60" />
                <div className="border-b border-white/60" />
                <div className="border-r border-b border-white/60" />
                <div className="border-r border-b border-white/60" />
                <div />
              </div>

              {/* Center Move Hint */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                <span className="px-2 py-1 rounded-none bg-black/70 text-[9px] font-mono text-white uppercase font-bold tracking-widest flex items-center gap-1">
                  <Move className="w-2.5 h-2.5" /> DRAG TO POSITION
                </span>
              </div>

              {/* Corner Handles */}
              {/* NW */}
              <div
                onMouseDown={(e) => handleMouseDownHandle("nw", e)}
                className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-white border border-black shadow-md cursor-nwse-resize rounded-none"
              />
              {/* NE */}
              <div
                onMouseDown={(e) => handleMouseDownHandle("ne", e)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white border border-black shadow-md cursor-nesw-resize rounded-none"
              />
              {/* SW */}
              <div
                onMouseDown={(e) => handleMouseDownHandle("sw", e)}
                className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-white border border-black shadow-md cursor-nesw-resize rounded-none"
              />
              {/* SE */}
              <div
                onMouseDown={(e) => handleMouseDownHandle("se", e)}
                className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border border-black shadow-md cursor-nwse-resize rounded-none"
              />
            </div>
          </div>

          {/* SIDEBAR TOOLKIT & CONTROLS */}
          <div className="w-full lg:w-80 flex flex-col gap-4">
            {/* 1. BACKGROUND REMOVAL & CUTOUT ACCELERATOR */}
            <div className="p-3.5 rounded-none bg-neutral-900 border border-neutral-800 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Wand2 className="w-4 h-4 text-white" />
                  <span className="text-xs font-bold font-mono uppercase text-white tracking-wider">
                    BACKGROUND REMOVAL
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleToggleBgRemoval}
                  className={`px-3 py-1 rounded-none text-[10px] font-mono uppercase font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isBgRemovalActive
                      ? "bg-white text-black shadow-sm"
                      : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700"
                  }`}
                >
                  {isComputingBg ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : isBgRemovalActive ? (
                    <Check className="w-3 h-3 stroke-[3]" />
                  ) : (
                    <Eraser className="w-3 h-3" />
                  )}
                  <span>{isBgRemovalActive ? "ACTIVE" : "REMOVE BG"}</span>
                </button>
              </div>

              {isBgRemovalActive && (
                <div className="space-y-3 pt-1 animate-fadeIn border-t border-neutral-800">
                  {/* Backdrop Replacement Options */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-mono uppercase font-bold text-neutral-400">
                      REPLACE BACKDROP WITH:
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: "transparent" as BgReplacementMode, label: "Transparent PNG", icon: Eraser },
                        { id: "white" as BgReplacementMode, label: "Studio Pure White", icon: Sun },
                        { id: "offwhite" as BgReplacementMode, label: "Atelier Off-White", icon: Layers },
                        { id: "black" as BgReplacementMode, label: "Obsidian Noir", icon: Moon },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setBgMode(opt.id)}
                          className={`py-1.5 px-2 rounded-none text-[10px] font-mono uppercase font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            bgMode === opt.id
                              ? "bg-white text-black border-white shadow-xs font-bold"
                              : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:bg-neutral-800"
                          }`}
                        >
                          <opt.icon className="w-3 h-3 shrink-0" />
                          <span className="truncate">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cutout Tolerance Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-neutral-300 font-semibold">
                      <span>CUTOUT SENSITIVITY:</span>
                      <span>{bgTolerance}%</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="85"
                      step="1"
                      value={bgTolerance}
                      onChange={(e) => setBgTolerance(Number(e.target.value))}
                      className="w-full accent-white cursor-pointer h-1.5 bg-neutral-800 rounded-none appearance-none"
                    />
                  </div>

                  {/* Edge Feather Smoothing */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-neutral-300 font-semibold">
                      <span>EDGE FEATHER SMOOTHING:</span>
                      <span>{bgFeather}px</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      step="1"
                      value={bgFeather}
                      onChange={(e) => setBgFeather(Number(e.target.value))}
                      className="w-full accent-white cursor-pointer h-1.5 bg-neutral-800 rounded-none appearance-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. ASPECT RATIO PRESETS */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 font-mono">
                ASPECT RATIO PRESET:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "3:4" as AspectRatioPreset, label: "3:4", desc: "LUXURY FIT" },
                  { id: "1:1" as AspectRatioPreset, label: "1:1", desc: "SQUARE" },
                  { id: "4:5" as AspectRatioPreset, label: "4:5", desc: "EDITORIAL" },
                  { id: "9:16" as AspectRatioPreset, label: "9:16", desc: "STORY" },
                  { id: "free" as AspectRatioPreset, label: "FREE", desc: "CUSTOM" },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleAspectChange(preset.id)}
                    className={`py-1.5 px-2 rounded-none text-center border transition-all cursor-pointer ${
                      aspect === preset.id
                        ? "bg-white text-black border-white shadow-md font-bold"
                        : "bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-800 font-medium"
                    }`}
                  >
                    <div className="text-xs font-mono">{preset.label}</div>
                    <div className="text-[8px] uppercase tracking-tight opacity-75">{preset.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. ROTATION & FLIP CONTROLS */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 font-mono">
                ROTATION &amp; FLIP:
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRotation((prev) => (prev - 90 + 360) % 360)}
                  className="flex-1 py-2 px-3 rounded-none bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  title="Rotate 90° Left"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>-90°</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="flex-1 py-2 px-3 rounded-none bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  title="Rotate 90° Right"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>+90°</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsFlippedH((prev) => !prev)}
                  className={`py-2 px-3 rounded-none border text-xs font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    isFlippedH
                      ? "bg-white text-black border-white"
                      : "bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-200"
                  }`}
                  title="Flip Horizontally"
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 4. ZOOM SLIDER */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-300 font-bold uppercase">
                <span>SCALE &amp; ZOOM:</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.6, Number((z - 0.1).toFixed(2))))}
                  className="p-2 rounded-none bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                <input
                  type="range"
                  min="0.6"
                  max="2.5"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-white cursor-pointer h-1.5 bg-neutral-800 rounded-none appearance-none"
                />

                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.1).toFixed(2))))}
                  className="p-2 rounded-none bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Reset Button */}
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setRotation(0);
                setIsFlippedH(false);
                setIsBgRemovalActive(false);
                setProcessedBgImageSrc(null);
                resetCropToAspect(aspect);
              }}
              className="py-1.5 px-3 rounded-none bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-850 text-[10px] font-mono uppercase font-bold tracking-wider cursor-pointer transition-colors text-center"
            >
              RESET TRANSFORMATIONS &amp; BG
            </button>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="px-6 py-4 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 bg-neutral-900/80">
          <div className="text-[11px] text-neutral-400 font-mono flex items-center gap-2">
            <span>{aspect !== "free" ? `Fixed ${aspect} Studio Ratio` : "Freeform Custom Bounding"}</span>
            {isBgRemovalActive && (
              <span className="text-white font-bold">• BG Cutout: {bgMode.toUpperCase()}</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {onSkipCrop && (
              <button
                type="button"
                onClick={() => {
                  onSkipCrop();
                  onClose();
                }}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-none bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-neutral-300 hover:text-white text-xs font-bold uppercase cursor-pointer transition-colors"
              >
                SKIP &amp; USE ORIGINAL
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-none bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs font-bold uppercase cursor-pointer transition-colors"
            >
              CANCEL
            </button>

            <button
              type="button"
              onClick={handleApplyCrop}
              disabled={isProcessing || isComputingBg}
              className="px-5 py-2.5 rounded-none bg-white hover:bg-neutral-200 text-black font-bold text-xs uppercase flex items-center gap-2 shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>PROCESSING CROP &amp; CUTOUT...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>APPLY &amp; UPLOAD</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

