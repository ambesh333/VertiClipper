"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Grip } from "lucide-react"

interface Overlay {
  id: number
  file?: File
  url?: string
  x: number
  y: number
  width: number
  height: number
  opacity: number
}

interface OverlayCanvasProps {
  overlays: Overlay[]
  onUpdateOverlay: (id: number, updates: Partial<Overlay>) => void
  videoUrl?: string
  backgroundUrl?: string
  clipStart: number
  clipEnd: number
}

export default function OverlayCanvas({ overlays, onUpdateOverlay, videoUrl, backgroundUrl, clipStart, clipEnd }: OverlayCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState<{
    overlayId: number | null
    isDragging: boolean
    isResizing: boolean
    startX: number
    startY: number
    startWidth: number
    startHeight: number
    startOverlayX: number
    startOverlayY: number
  }>({
    overlayId: null,
    isDragging: false,
    isResizing: false,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startOverlayX: 0,
    startOverlayY: 0,
  })

  const canvasWidth = 300
  const canvasHeight = 533 // 9:16 aspect ratio

  const handleMouseDown = (e: React.MouseEvent, overlayId: number, isResize = false) => {
    e.preventDefault()
    e.stopPropagation()

    const overlay = overlays.find((o) => o.id === overlayId)
    if (!overlay) return

    setDragState({
      overlayId,
      isDragging: !isResize,
      isResizing: isResize,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: overlay.width,
      startHeight: overlay.height,
      startOverlayX: overlay.x,
      startOverlayY: overlay.y,
    })
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.overlayId || (!dragState.isDragging && !dragState.isResizing)) return

      const deltaX = e.clientX - dragState.startX
      const deltaY = e.clientY - dragState.startY

      if (dragState.isDragging) {
        // Dragging - update position
        const newX = Math.max(0, Math.min(canvasWidth - dragState.startWidth, dragState.startOverlayX + deltaX))
        const newY = Math.max(0, Math.min(canvasHeight - dragState.startHeight, dragState.startOverlayY + deltaY))

        onUpdateOverlay(dragState.overlayId, { x: newX, y: newY })
      } else if (dragState.isResizing) {
        // Resizing - update dimensions
        const newWidth = Math.max(20, Math.min(canvasWidth - dragState.startOverlayX, dragState.startWidth + deltaX))
        const newHeight = Math.max(20, Math.min(canvasHeight - dragState.startOverlayY, dragState.startHeight + deltaY))

        onUpdateOverlay(dragState.overlayId, { width: newWidth, height: newHeight })
      }
    }

    const handleMouseUp = () => {
      setDragState({
        overlayId: null,
        isDragging: false,
        isResizing: false,
        startX: 0,
        startY: 0,
        startWidth: 0,
        startHeight: 0,
        startOverlayX: 0,
        startOverlayY: 0,
      })
    }

    if (dragState.isDragging || dragState.isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [dragState, onUpdateOverlay, canvasWidth, canvasHeight])

  useEffect(() => {
    const video = canvasRef.current?.querySelector('video');
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.currentTime >= clipEnd) {
        video.pause();
        // Optional: seek back to clipStart after pausing
        // video.currentTime = clipStart;
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);

    // Seek to clipStart when videoUrl or clipStart changes
    if (videoUrl) {
      video.currentTime = clipStart;
    }

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [videoUrl, clipStart, clipEnd]);

  useEffect(() => {
    const video = canvasRef.current?.querySelector('video');
    if (!video) return;

    // Ensure video is muted and plays automatically when videoUrl is present
    if (videoUrl) {
      video.muted = true;
      video.loop = true; // Keep looping the clipped section
      video.play().catch(error => console.error('Autoplay failed:', error));
    } else if (!videoUrl && !video.paused) {
        video.pause();
    }

  }, [videoUrl]);

  return (
    <div className="flex flex-col items-center">
      <div
        ref={canvasRef}
        className="relative bg-zinc-800 border-2 border-zinc-700 rounded-lg overflow-hidden shadow-xl flex items-center justify-center"
        style={{ width: canvasWidth, height: canvasHeight }}
      >
        {/* Background Image */}
        {backgroundUrl && (
          <img
            src={backgroundUrl}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
        )}

        {/* Background Video Preview */}
        {videoUrl ? (
          <video
            src={videoUrl}
            className="relative w-auto h-auto max-w-full max-h-full z-10"
          />
        ) : (
          <div className="relative z-10 text-center text-zinc-500">
            <div className="text-4xl mb-2">📱</div>
            <div className="text-sm">9:16 Portrait</div>
            <div className="text-xs">Upload video to preview</div>
          </div>
        )}

        {/* Grid Lines */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Vertical lines */}
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-zinc-600 opacity-30" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-zinc-600 opacity-30" />
          {/* Horizontal lines */}
          <div className="absolute top-1/3 left-0 right-0 h-px bg-zinc-600 opacity-30" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-zinc-600 opacity-30" />
        </div>

        {/* Overlays */}
        {overlays.map(
          (overlay) =>
            overlay.url && (
              <div
                key={overlay.id}
                className={`absolute border-2 cursor-move group ${
                  dragState.overlayId === overlay.id
                    ? "border-purple-500 shadow-lg shadow-purple-500/50"
                    : "border-white/50 hover:border-purple-400"
                }`}
                style={{
                  left: overlay.x,
                  top: overlay.y,
                  width: overlay.width,
                  height: overlay.height,
                  opacity: overlay.opacity / 100,
                }}
                onMouseDown={(e) => handleMouseDown(e, overlay.id)}
              >
                {/* Overlay Image */}
                <img
                  src={overlay.url || "/placeholder.svg"}
                  alt={`Overlay ${overlay.id}`}
                  className="w-full h-full object-cover pointer-events-none"
                  draggable={false}
                />

                {/* Drag Handle */}
                <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Grip className="w-4 h-4 text-white drop-shadow-lg" />
                </div>

                {/* Resize Handle */}
                <div
                  className="absolute bottom-0 right-0 w-3 h-3 bg-purple-500 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => handleMouseDown(e, overlay.id, true)}
                />

                {/* Overlay Info */}
                <div className="absolute -top-6 left-0 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {overlay.width.toFixed(0)} × {overlay.height.toFixed(0)}
                </div>
              </div>
            ),
        )}

        {/* Drop Zone Hint */}
        {overlays.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-zinc-400 pointer-events-none">
              <div className="text-2xl mb-2">🖼️</div>
              <div className="text-sm">Add overlays in Step 1</div>
              <div className="text-xs">to position them here</div>
            </div>
          </div>
        )}
      </div>

      {/* Canvas Info */}
      <div className="mt-4 text-center text-sm text-zinc-400">
        <div>
          Canvas: {canvasWidth} × {canvasHeight}px (9:16 Portrait)
        </div>
        <div className="text-xs mt-1">Drag overlays to move • Drag bottom-right corner to resize</div>
      </div>
    </div>
  )
}
