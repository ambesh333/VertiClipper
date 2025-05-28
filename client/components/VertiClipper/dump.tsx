"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import OverlayCanvasComponent from "@/components/overlay-canvas"

export default function VertiClipper() {
  const [currentStep, setCurrentStep] = useState(1)
  const [overlays, setOverlays] = useState<
    {
      id: number
      file?: File
      url?: string
      x: number
      y: number
      width: number
      height: number
      opacity: number
    }[]
  >([])
  const [clipStart, setClipStart] = useState(0)
  const [clipEnd, setClipEnd] = useState(10)

  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string>("")
  const [videoDuration, setVideoDuration] = useState(30)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)

  const addOverlay = () => {
    if (overlays.length < 2) {
      setOverlays([
        ...overlays,
        {
          id: Date.now(),
          x: 50,
          y: 50,
          width: 100,
          height: 100,
          opacity: 100,
        },
      ])
    }
  }

  const updateOverlay = (id: number, updates: Partial<(typeof overlays)[0]>) => {
    setOverlays(overlays.map((overlay) => (overlay.id === id ? { ...overlay, ...updates } : overlay)))
  }

  const handleOverlayFileChange = (id: number, file: File) => {
    const url = URL.createObjectURL(file)
    updateOverlay(id, { file, url })
  }

  const removeOverlay = (id: number) => {
    setOverlays(overlays.filter((overlay) => overlay.id !== id))
  }

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Navbar */}
      <div className="fixed top-0 left-0 right-0 bg-zinc-900 border-b border-zinc-800 shadow-lg z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Logo />
          </div>
          <div className="text-zinc-400 font-medium">Step {currentStep} of 4</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-24 mb-8">
        <Card className="border-zinc-800 shadow-xl bg-zinc-950">
          <CardContent className="p-0">
            <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
              {/* Panel 1: Upload Assets */}
              <PanelContainer isActive={currentStep === 1}>
                <h2 className="text-xl font-bold mb-6">Upload Assets</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="video" className="mb-2 block">
                      Video (landscape)
                    </Label>
                    <Input
                      id="video"
                      type="file"
                      accept="video/*"
                      className="bg-zinc-900 border-zinc-700 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setVideoFile(file)
                          const url = URL.createObjectURL(file)
                          setVideoUrl(url)
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="background" className="mb-2 block">
                      Background (portrait)
                    </Label>
                    <Input
                      id="background"
                      type="file"
                      accept="image/*"
                      className="bg-zinc-900 border-zinc-700 cursor-pointer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="overlays" className="mb-2 block">
                      Overlays
                    </Label>
                    <div className="space-y-2">
                      {overlays.map((overlay) => (
                        <div key={overlay.id} className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            className="bg-zinc-900 border-zinc-700 cursor-pointer flex-1"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleOverlayFileChange(overlay.id, file)
                              }
                            }}
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => removeOverlay(overlay.id)}
                            className="shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {overlays.length < 2 && (
                        <Button
                          variant="outline"
                          onClick={addOverlay}
                          className="w-full border-dashed border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
                        >
                          <Plus className="mr-2 h-4 w-4" /> Add Overlay
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </PanelContainer>

              {/* Panel 2: Timestamp Selector */}
              <PanelContainer isActive={currentStep === 2}>
                <h2 className="text-xl font-bold mb-6">Timestamp Selector</h2>
                <div className="space-y-8">
                  <VideoPreview
                    videoUrl={videoUrl}
                    clipStart={clipStart}
                    clipEnd={clipEnd}
                    videoDuration={videoDuration}
                    currentTime={currentTime}
                    isPlaying={isPlaying}
                    onTimeUpdate={setCurrentTime}
                    onDurationChange={setVideoDuration}
                    onPlayStateChange={setIsPlaying}
                    onSeek={(time) => setCurrentTime(time)}
                  />

                  <div className="px-4">
                    <div className="mb-4">
                      <Label className="text-sm text-zinc-400 mb-2 block">
                        Select clip range: {clipStart.toFixed(1)}s - {clipEnd.toFixed(1)}s
                      </Label>
                    </div>
                    <TimeRangeSlider
                      min={0}
                      max={videoDuration}
                      start={clipStart}
                      end={clipEnd}
                      currentTime={currentTime}
                      onChange={(start, end) => {
                        setClipStart(start)
                        setClipEnd(end)
                      }}
                    />
                    <div className="flex justify-between text-sm text-zinc-400 mt-2">
                      <span>0s</span>
                      <span>{videoDuration.toFixed(1)}s</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime" className="mb-2 block">
                        Start Time
                      </Label>
                      <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-md font-mono">
                        {clipStart.toFixed(1)}s
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="endTime" className="mb-2 block">
                        End Time
                      </Label>
                      <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-md font-mono">
                        {clipEnd.toFixed(1)}s
                      </div>
                    </div>
                  </div>
                </div>
              </PanelContainer>

              {/* Panel 3: Clip Details */}
              <PanelContainer isActive={currentStep === 3}>
                <h2 className="text-xl font-bold mb-6">Clip Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startSeconds" className="mb-2 block">
                      Start (s)
                    </Label>
                    <Input
                      id="startSeconds"
                      type="number"
                      value={clipStart}
                      onChange={(e) => setClipStart(Number.parseFloat(e.target.value))}
                      step={0.1}
                      min={0}
                      className="bg-zinc-900 border-zinc-700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endSeconds" className="mb-2 block">
                      End (s)
                    </Label>
                    <Input
                      id="endSeconds"
                      type="number"
                      value={clipEnd}
                      onChange={(e) => setClipEnd(Number.parseFloat(e.target.value))}
                      step={0.1}
                      min={0}
                      className="bg-zinc-900 border-zinc-700"
                    />
                  </div>
                </div>
              </PanelContainer>

              {/* Panel 4: Overlay Positioning */}
              <PanelContainer isActive={currentStep === 4}>
                <h2 className="text-xl font-bold mb-6">Overlay Positioning</h2>
                {overlays.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Visual Canvas */}
                    <div className="lg:col-span-2">
                      <Label className="mb-4 block text-sm font-medium">
                        Drag and position your overlays on the canvas
                      </Label>
                      <OverlayCanvasComponent overlays={overlays} onUpdateOverlay={updateOverlay} videoUrl={videoUrl} />
                    </div>

                    {/* Overlay Controls */}
                    <div className="space-y-4">
                      <Label className="block text-sm font-medium">Overlay Controls</Label>
                      {overlays.map((overlay, index) => (
                        <div key={overlay.id} className="p-4 border border-zinc-700 rounded-lg bg-zinc-900">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium">Overlay {index + 1}</h3>
                            {overlay.url && (
                              <img
                                src={overlay.url || "/placeholder.svg"}
                                alt={`Overlay ${index + 1}`}
                                className="w-8 h-8 object-cover rounded border border-zinc-600"
                              />
                            )}
                          </div>

                          <div className="space-y-3">
                            <div>
                              <Label htmlFor={`opacity-${overlay.id}`} className="mb-2 block text-sm">
                                Opacity: {overlay.opacity}%
                              </Label>
                              <Slider
                                id={`opacity-${overlay.id}`}
                                value={[overlay.opacity]}
                                max={100}
                                step={1}
                                onValueChange={(value) => updateOverlay(overlay.id, { opacity: value[0] })}
                                className="my-2"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
                              <div>X: {overlay.x.toFixed(0)}px</div>
                              <div>Y: {overlay.y.toFixed(0)}px</div>
                              <div>W: {overlay.width.toFixed(0)}px</div>
                              <div>H: {overlay.height.toFixed(0)}px</div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {overlays.length === 0 && (
                        <div className="text-center p-6 text-zinc-500 border border-dashed border-zinc-700 rounded-lg">
                          No overlays added. Go back to step 1 to add overlay images.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 text-zinc-500">
                    No overlays added. Go back to step 1 to add overlays.
                  </div>
                )}
              </PanelContainer>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="mt-6 flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
          >
            Back
          </Button>

          {currentStep < 4 ? (
            <Button onClick={nextStep} className="bg-purple-600 hover:bg-purple-700 shadow-lg">
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button className="bg-purple-600 hover:bg-purple-700 shadow-lg w-full md:w-auto mt-4 md:mt-0">
              Generate Video
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function PanelContainer({
  children,
  isActive,
}: {
  children: React.ReactNode
  isActive: boolean
}) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="p-6"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Logo() {
  return (
    <div className="font-bold text-xl tracking-tight text-white">
      VERTI<span className="text-purple-500">CLIPPER</span>
    </div>
  )
}

function VideoPreview({
  videoUrl,
  clipStart,
  clipEnd,
  videoDuration,
  currentTime,
  isPlaying,
  onTimeUpdate,
  onDurationChange,
  onPlayStateChange,
  onSeek,
}: {
  videoUrl: string
  clipStart: number
  clipEnd: number
  videoDuration: number
  currentTime: number
  isPlaying: boolean
  onTimeUpdate: (time: number) => void
  onDurationChange: (duration: number) => void
  onPlayStateChange: (playing: boolean) => void
  onSeek: (time: number) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      onTimeUpdate(video.currentTime)
      // Auto-pause when reaching clip end
      if (video.currentTime >= clipEnd) {
        video.pause()
        onPlayStateChange(false)
      }
    }

    const handleLoadedMetadata = () => {
      onDurationChange(video.duration)
    }

    const handlePlay = () => onPlayStateChange(true)
    const handlePause = () => onPlayStateChange(false)

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
    }
  }, [clipEnd, onTimeUpdate, onDurationChange, onPlayStateChange])

  const togglePlayPause = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      // Start from clip start if not within range
      if (currentTime < clipStart || currentTime >= clipEnd) {
        video.currentTime = clipStart
      }
      video.play()
    }
  }

  const seekToStart = () => {
    const video = videoRef.current
    if (video) {
      video.currentTime = clipStart
      onSeek(clipStart)
    }
  }

  const seekToEnd = () => {
    const video = videoRef.current
    if (video) {
      video.currentTime = clipEnd
      onSeek(clipEnd)
    }
  }

  if (!videoUrl) {
    return (
      <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
        <div className="h-48 bg-zinc-800 rounded flex items-center justify-center">
          <p className="text-zinc-400">Upload a video to see preview</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
      <div className="relative">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-48 bg-black rounded object-contain"
          preload="metadata"
        />

        {/* Clip range overlay */}
        <div className="absolute bottom-2 left-2 right-2">
          <div className="bg-black/70 rounded px-2 py-1 text-xs text-white">
            Clip: {clipStart.toFixed(1)}s - {clipEnd.toFixed(1)}s
            {currentTime >= clipStart && currentTime <= clipEnd && (
              <span className="ml-2 text-green-400">● ACTIVE</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={seekToStart}
          className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
        >
          ⏮ Start
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={togglePlayPause}
          className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800 min-w-[80px]"
        >
          {isPlaying ? "⏸ Pause" : "▶ Play"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={seekToEnd}
          className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
        >
          End ⏭
        </Button>
      </div>

      <div className="mt-4 text-center text-sm text-zinc-400">
        Current: {currentTime.toFixed(1)}s / {videoDuration.toFixed(1)}s
      </div>
    </div>
  )
}

function TimeRangeSlider({
  min,
  max,
  start,
  end,
  currentTime,
  onChange,
}: {
  min: number
  max: number
  start: number
  end: number
  currentTime: number
  onChange: (start: number, end: number) => void
}) {
  const [isDragging, setIsDragging] = useState<"start" | "end" | null>(null)
  const sliderRef = useRef<HTMLDivElement>(null)

  const getPositionFromValue = (value: number) => {
    return ((value - min) / (max - min)) * 100
  }

  const getValueFromPosition = (clientX: number) => {
    if (!sliderRef.current) return min

    const rect = sliderRef.current.getBoundingClientRect()
    const position = (clientX - rect.left) / rect.width
    const value = min + position * (max - min)
    return Math.max(min, Math.min(max, value))
  }

  const handleMouseDown = (type: "start" | "end") => (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(type)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const value = getValueFromPosition(e.clientX)

      if (isDragging === "start") {
        onChange(Math.min(value, end - 0.1), end)
      } else {
        onChange(start, Math.max(value, start + 0.1))
      }
    }

    const handleMouseUp = () => {
      setIsDragging(null)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, start, end, onChange])

  return (
    <div className="relative">
      <div ref={sliderRef} className="relative h-6 bg-zinc-800 rounded-full cursor-pointer">
        {/* Track */}
        <div className="absolute inset-0 bg-zinc-700 rounded-full" />

        {/* Selected range */}
        <div
          className="absolute top-0 bottom-0 bg-purple-600 rounded-full"
          style={{
            left: `${getPositionFromValue(start)}%`,
            width: `${getPositionFromValue(end) - getPositionFromValue(start)}%`,
          }}
        />

        {/* Current time indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
          style={{
            left: `${getPositionFromValue(currentTime)}%`,
          }}
        />

        {/* Start handle */}
        <div
          className="absolute top-1/2 w-4 h-4 bg-white border-2 border-purple-600 rounded-full cursor-grab active:cursor-grabbing transform -translate-y-1/2 -translate-x-1/2 shadow-lg"
          style={{ left: `${getPositionFromValue(start)}%` }}
          onMouseDown={handleMouseDown("start")}
        />

        {/* End handle */}
        <div
          className="absolute top-1/2 w-4 h-4 bg-white border-2 border-purple-600 rounded-full cursor-grab active:cursor-grabbing transform -translate-y-1/2 -translate-x-1/2 shadow-lg"
          style={{ left: `${getPositionFromValue(end)}%` }}
          onMouseDown={handleMouseDown("end")}
        />
      </div>
    </div>
  )
}
