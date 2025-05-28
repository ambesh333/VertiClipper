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
  const canvasHeight = 533 

  const backendWidth = 1080
  const backendHeight = 1920

  const scaleX = canvasWidth / backendWidth
  const scaleY = canvasHeight / backendHeight

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
        const newX = Math.max(0, Math.min(backendWidth - dragState.startWidth, dragState.startOverlayX + deltaX / scaleX))
        const newY = Math.max(0, Math.min(backendHeight - dragState.startHeight, dragState.startOverlayY + deltaY / scaleY))
        onUpdateOverlay(dragState.overlayId, { x: newX, y: newY })
      } else if (dragState.isResizing) {
        const newWidth = Math.max(20, Math.min(backendWidth - dragState.startOverlayX, dragState.startWidth + deltaX / scaleX))
        const newHeight = Math.max(20, Math.min(backendHeight - dragState.startOverlayY, dragState.startHeight + deltaY / scaleY))
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
  }, [dragState, onUpdateOverlay, canvasWidth, canvasHeight, backendWidth, backendHeight, scaleX, scaleY])

  useEffect(() => {
    const video = canvasRef.current?.querySelector('video');
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.currentTime >= clipEnd) {
        video.pause();
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);

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

    if (videoUrl) {
      video.muted = true;
      video.loop = true;
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
        {backgroundUrl && (
          <img
            src={backgroundUrl}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
        )}
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
        <div className="absolute inset-0 pointer-events-none z-20">
          <div className="absolute" style={{ left: `${1080/3 * scaleX}px`, top: 0, bottom: 0, width: `1px`, backgroundColor: 'rgba(244, 244, 245, 0.3)' }} />
          <div className="absolute" style={{ left: `${1080*2/3 * scaleX}px`, top: 0, bottom: 0, width: `1px`, backgroundColor: 'rgba(244, 244, 245, 0.3)' }} />
          <div className="absolute" style={{ top: `${1920/3 * scaleY}px`, left: 0, right: 0, height: `1px`, backgroundColor: 'rgba(244, 244, 245, 0.3)' }} />
          <div className="absolute" style={{ top: `${1920*2/3 * scaleY}px`, left: 0, right: 0, height: `1px`, backgroundColor: 'rgba(244, 244, 245, 0.3)' }} />
        </div>

        {overlays.map(
          (overlay) =>
            overlay.url && (
              <div
                key={overlay.id}
                className={`absolute border-2 cursor-move group ${
                  dragState.overlayId === overlay.id
                    ? "border-purple-500 shadow-lg shadow-purple-500/50"
                    : "border-white/50 hover:border-purple-400"
                } z-30`}
                style={{
                  left: `${overlay.x * scaleX}px`,
                  top: `${overlay.y * scaleY}px`,
                  width: `${overlay.width * scaleX}px`,
                  height: `${overlay.height * scaleY}px`,
                  opacity: overlay.opacity / 100,
                }}
                onMouseDown={(e) => handleMouseDown(e, overlay.id)}
              >
                <img
                  src={overlay.url || "/placeholder.svg"}
                  alt={`Overlay ${overlay.id}`}
                  className="w-full h-full object-contain pointer-events-none"
                  draggable={false}
                />

                <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity z-40">
                  <Grip className="w-4 h-4 text-white drop-shadow-lg" />
                </div>
                <div
                  className="absolute bottom-0 right-0 w-3 h-3 bg-purple-500 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity z-40"
                  onMouseDown={(e) => handleMouseDown(e, overlay.id, true)}
                />

                <div className="absolute -top-6 left-0 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-40">
                  {overlay.width.toFixed(0)} × {overlay.height.toFixed(0)}
                </div>
              </div>
            ),
        )}

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

      <div className="mt-4 text-center text-sm text-zinc-400">
        <div>
          Canvas: {canvasWidth} × {canvasHeight}px (9:16 Portrait)
        </div>
        <div className="text-xs mt-1">Drag overlays to move • Drag bottom-right corner to resize</div>
      </div>
    </div>
  )
}
