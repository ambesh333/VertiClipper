"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { ChevronRight, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import OverlayCanvasComponent from "@/components/overlay-canvas"
import { useToast } from "@/hooks/use-toast"


import Logo from "./VertiClipper/Logo"
import PanelContainer from "./VertiClipper/PanelContainer"
import VideoPreview from "./VertiClipper/VideoPreview"
import TimeRangeSlider from "./VertiClipper/VideoSlider"
import UploadAssetsPanel from "./panels/UploadAssetsPanel"

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

  const [backgroundFile, setBackgroundFile] = useState<File | null>(null)
  const [backgroundUrl, setBackgroundUrl] = useState<string>("")

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

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

  const removeVideo = () => {
    setVideoFile(null)
    setVideoUrl("")
  }

  const nextStep = async () => {
    if (currentStep === 1) {
      if (!videoFile || !backgroundFile) {
        toast({
          title: "Missing required assets",
          description: "Please upload both a Video and a Background image to proceed.",
          variant: "destructive",
        })
        return
      }

      setIsUploading(true)

      const formData = new FormData()
      if (videoFile) formData.append("video", videoFile)
      if (backgroundFile) formData.append("background", backgroundFile)
      overlays.forEach(overlay => {
        if (overlay.file) formData.append("overlays", overlay.file)
      })

      try {
        const response = await fetch('http://localhost:8000/api/upload', {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()
        if (result.success === false && result.error) {
          console.error("Backend error:", result.error)
          toast({
            title: "Upload failed",
            description: result.error,
            variant: "destructive",
          })
        } else if (result.success && result.data?.sessionId) {
          setSessionId(result.data.sessionId)
          setCurrentStep(currentStep + 1)
          toast({
            title: "Upload successful!",
            description: "Assets uploaded successfully.",
          })
        } else {
          console.error("Upload response did not contain expected data:", result)
          toast({
            title: "Upload failed",
            description: "Invalid response from server or missing session ID.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error uploading assets:", error)
        toast({
          title: "Upload failed",
          description: `Error: ${error instanceof Error ? error.message : String(error)}`,
          variant: "destructive",
        })
      } finally {
        setIsUploading(false)
      }
    } else if (currentStep < 3) {
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
          <div className="text-zinc-400 font-medium">
            {isUploading ? "Uploading..." : `Step ${currentStep} of 3`}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-24 mb-8">
        <Card className="border-zinc-800 shadow-xl bg-zinc-950">
          <CardContent className="p-0">
            <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
              {/* Panel 1: Upload Assets */}
              <PanelContainer isActive={currentStep === 1}>
                <UploadAssetsPanel
                  overlays={overlays}
                  setOverlays={setOverlays}
                  handleOverlayFileChange={handleOverlayFileChange}
                  removeOverlay={removeOverlay}
                  setVideoFile={setVideoFile}
                  setVideoUrl={setVideoUrl}
                  videoUrl={videoUrl}
                  videoFile={videoFile}
                  backgroundFile={backgroundFile}
                  setBackgroundFile={setBackgroundFile}
                  backgroundUrl={backgroundUrl}
                  setBackgroundUrl={setBackgroundUrl}
                  removeVideo={removeVideo}
                  className="mb-6"
                />
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


              {/* Panel 3: Overlay Positioning */}
              <PanelContainer isActive={currentStep === 3}>
                <h2 className="text-xl font-bold mb-6">Overlay Positioning</h2>
                {overlays.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Visual Canvas */}
                    <div className="lg:col-span-2">
                      <Label className="mb-4 block text-sm font-medium">
                        Drag and position your overlays on the canvas
                      </Label>
                      <OverlayCanvasComponent
                        overlays={overlays}
                        onUpdateOverlay={updateOverlay}
                        videoUrl={videoUrl}
                        backgroundUrl={backgroundUrl}
                        clipStart={clipStart}
                        clipEnd={clipEnd}
                      />
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
            disabled={currentStep === 1 || isUploading}
            className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
          >
            Back
          </Button>

          {currentStep < 3 ? (
            <Button onClick={nextStep} className="bg-purple-600 hover:bg-purple-700 shadow-lg" disabled={isUploading}>
              {isUploading ? "Uploading..." : "Next"} <ChevronRight className={`ml-2 h-4 w-4 ${isUploading ? 'opacity-0' : ''}`} />
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


