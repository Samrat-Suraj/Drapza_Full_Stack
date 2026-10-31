"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Move,
  Check,
  RefreshCw,
  Crop,
} from "lucide-react";
import { audioSystem } from "@/components/drapza/AudioSystem";

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropComplete: (croppedFile: File, previewUrl: string) => void;
  isSaving?: boolean;
}

const CROP_BOX_SIZE = 280; // Size in CSS pixels of the interactive crop box
const EXPORT_SIZE = 512; // High-res avatar export size

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  isSaving = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  // Load image when imageSrc changes
  useEffect(() => {
    if (!imageSrc || !isOpen) {
      setImageLoaded(false);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      // Reset state for new image
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc, isOpen]);

  // Render to Interactive Canvas
  const drawCropView = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = CROP_BOX_SIZE;
    canvas.height = CROP_BOX_SIZE;

    // Clear background
    ctx.clearRect(0, 0, CROP_BOX_SIZE, CROP_BOX_SIZE);
    ctx.fillStyle = "#121316";
    ctx.fillRect(0, 0, CROP_BOX_SIZE, CROP_BOX_SIZE);

    // Calculate base cover scale
    const baseScale = Math.max(
      CROP_BOX_SIZE / img.naturalWidth,
      CROP_BOX_SIZE / img.naturalHeight
    );
    const currentScale = baseScale * zoom;

    // Draw user image transformed
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.translate(CROP_BOX_SIZE / 2 + pan.x, CROP_BOX_SIZE / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(currentScale, currentScale);
    ctx.drawImage(
      img,
      -img.naturalWidth / 2,
      -img.naturalHeight / 2,
      img.naturalWidth,
      img.naturalHeight
    );
    ctx.restore();

    // Draw circular vignette overlay
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, CROP_BOX_SIZE, CROP_BOX_SIZE);
    // Cutout circle
    ctx.arc(
      CROP_BOX_SIZE / 2,
      CROP_BOX_SIZE / 2,
      CROP_BOX_SIZE / 2 - 4,
      0,
      Math.PI * 2,
      true
    );
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fill();

    // Circular crop border guide
    ctx.beginPath();
    ctx.arc(
      CROP_BOX_SIZE / 2,
      CROP_BOX_SIZE / 2,
      CROP_BOX_SIZE / 2 - 4,
      0,
      Math.PI * 2
    );
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Subtle rule-of-thirds grid inside the circle
    ctx.beginPath();
    const oneThird = CROP_BOX_SIZE / 3;
    const twoThird = (CROP_BOX_SIZE / 3) * 2;
    // Horizontal guides
    ctx.moveTo(oneThird * 0.5, oneThird);
    ctx.lineTo(CROP_BOX_SIZE - oneThird * 0.5, oneThird);
    ctx.moveTo(oneThird * 0.5, twoThird);
    ctx.lineTo(CROP_BOX_SIZE - oneThird * 0.5, twoThird);
    // Vertical guides
    ctx.moveTo(oneThird, oneThird * 0.5);
    ctx.lineTo(oneThird, CROP_BOX_SIZE - oneThird * 0.5);
    ctx.moveTo(twoThird, oneThird * 0.5);
    ctx.lineTo(twoThird, CROP_BOX_SIZE - oneThird * 0.5);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Center crosshair
    ctx.beginPath();
    ctx.arc(CROP_BOX_SIZE / 2, CROP_BOX_SIZE / 2, 4, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }, [zoom, rotation, pan, imageLoaded]);

  useEffect(() => {
    drawCropView();
  }, [drawCropView]);

  // Mouse & Touch Drag Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.min(3.5, Math.max(0.8, Number((prev + delta).toFixed(2)))));
  };

  // Rotate 90 degrees clockwise
  const handleRotate = () => {
    audioSystem.playClick(600);
    setRotation((prev) => (prev + 90) % 360);
  };

  // Reset View
  const handleReset = () => {
    audioSystem.playClick(500);
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  // Crop & Export
  const handleApplyCrop = () => {
    const img = imageRef.current;
    if (!img || !imageLoaded) return;

    audioSystem.playClick(800);

    // Create offscreen export canvas
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = EXPORT_SIZE;
    exportCanvas.height = EXPORT_SIZE;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const baseScale = Math.max(
      CROP_BOX_SIZE / img.naturalWidth,
      CROP_BOX_SIZE / img.naturalHeight
    );
    const currentScale = baseScale * zoom;
    const outRatio = EXPORT_SIZE / CROP_BOX_SIZE;

    // Apply exact same transformation scaled to export resolution
    ctx.save();
    ctx.translate((CROP_BOX_SIZE / 2 + pan.x) * outRatio, (CROP_BOX_SIZE / 2 + pan.y) * outRatio);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(currentScale * outRatio, currentScale * outRatio);
    ctx.drawImage(
      img,
      -img.naturalWidth / 2,
      -img.naturalHeight / 2,
      img.naturalWidth,
      img.naturalHeight
    );
    ctx.restore();

    // Convert to Blob and File
    exportCanvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
        const previewUrl = URL.createObjectURL(blob);
        onCropComplete(file, previewUrl);
      },
      "image/jpeg",
      0.95
    );
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-[#0d0e12] border border-white/20 rounded-3xl p-5 sm:p-6 shadow-2xl text-white flex flex-col space-y-5 select-none">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-white/10 border border-white/15">
              <Crop className="w-3.5 h-3.5 text-white" />
            </span>
            <div>
              <h3 id="crop-modal-title" className="font-mono-technical text-sm font-bold uppercase tracking-wider text-white">
                POSITION & CROP FACE
              </h3>
              <p className="font-mono-technical text-[10px] text-neutral-400">
                Drag to align face inside circular frame
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close image crop dialog"
            className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Interactive Canvas Viewport */}
        <div className="flex flex-col items-center justify-center">
          <div
            className="relative rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl bg-black"
            style={{ width: CROP_BOX_SIZE, height: CROP_BOX_SIZE }}
          >
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
              className={`w-full h-full block ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
              title="Click and drag to position image. Use scroll wheel to zoom."
            />

            {/* Gesture Hint Badge */}
            <div className="absolute top-2 left-2 pointer-events-none px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm border border-white/20 text-[9px] font-mono-technical text-neutral-300 flex items-center gap-1">
              <Move className="w-2.5 h-2.5 text-white" />
              <span>DRAG TO PAN</span>
            </div>
          </div>
        </div>

        {/* Interactive Controls (Zoom & Rotate) */}
        <div className="space-y-3 bg-white/5 p-3.5 rounded-2xl border border-white/10">
          
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(0.8, Number((prev - 0.1).toFixed(2))))}
              aria-label="Zoom out image"
              className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <div className="flex-1 flex flex-col gap-1">
              <div className="flex justify-between items-center text-[10px] font-mono-technical text-neutral-400">
                <span>SCALE</span>
                <span className="text-white font-bold">{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="3.0"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                aria-label="Image zoom scale slider"
                className="w-full accent-white cursor-pointer h-1.5 bg-neutral-700 rounded-lg appearance-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(3.0, Number((prev + 0.1).toFixed(2))))}
              aria-label="Zoom in image"
              className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Utility Buttons (Rotate & Reset) */}
          <div className="flex items-center justify-between pt-1 border-t border-white/10">
            <button
              type="button"
              onClick={handleRotate}
              aria-label="Rotate image 90 degrees"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white font-mono-technical text-[10px] uppercase font-semibold transition-colors cursor-pointer"
            >
              <RotateCw className="w-3 h-3" />
              <span>ROTATE 90°</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              aria-label="Reset crop positioning"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white font-mono-technical text-[10px] uppercase font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>RESET</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Cancel image crop"
            className="flex-1 py-2.5 rounded-xl border border-white/20 hover:bg-white/10 text-neutral-300 hover:text-white font-mono-technical text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer text-center"
          >
            CANCEL
          </button>

          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={isSaving}
            aria-label="Apply crop and set profile picture"
            className="flex-1 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-mono-technical text-xs uppercase tracking-wider font-bold transition-all shadow-lg active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
          >
            {isSaving ? (
              <span>SAVING...</span>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>CROP & APPLY</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

