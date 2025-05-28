import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

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
  videoUrl: string;
  clipStart: number;
  clipEnd: number;
  videoDuration: number;
  currentTime: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onPlayStateChange: (playing: boolean) => void;
  onSeek: (time: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      onTimeUpdate(video.currentTime);
      if (video.currentTime >= clipEnd) {
        video.pause();
        onPlayStateChange(false);
      }
    };

    const handleLoadedMetadata = () => {
      onDurationChange(video.duration);
    };

    const handlePlay = () => onPlayStateChange(true);
    const handlePause = () => onPlayStateChange(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, [clipEnd, onTimeUpdate, onDurationChange, onPlayStateChange]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      if (currentTime < clipStart || currentTime >= clipEnd) {
        video.currentTime = clipStart;
      }
      video.play();
    }
  };

  const seekToStart = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = clipStart;
      onSeek(clipStart);
    }
  };

  const seekToEnd = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = clipEnd;
      onSeek(clipEnd);
    }
  };

  if (!videoUrl) {
    return (
      <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
        <div className="h-48 bg-zinc-800 rounded flex items-center justify-center">
          <p className="text-zinc-400">Upload a video to see preview</p>
        </div>
      </div>
    );
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
  );
}

export default VideoPreview;
