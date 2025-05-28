"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

interface UploadAssetsPanelProps {
  overlays: { id: number; file?: File; url?: string; x: number; y: number; width: number; height: number; opacity: number }[];
  setOverlays: React.Dispatch<React.SetStateAction<{ id: number; file?: File; url?: string; x: number; y: number; width: number; height: number; opacity: number }[]>>; 
  handleOverlayFileChange: (id: number, file: File) => void;
  removeOverlay: (id: number) => void; 
  setVideoFile: React.Dispatch<React.SetStateAction<File | null>>; 
  setVideoUrl: React.Dispatch<React.SetStateAction<string>>; 
  videoUrl: string;
  videoFile: File | null;
  backgroundFile: File | null;
  setBackgroundFile: React.Dispatch<React.SetStateAction<File | null>>;
  backgroundUrl: string;
  setBackgroundUrl: React.Dispatch<React.SetStateAction<string>>;
  removeVideo: () => void;
  className?: string;
}

function UploadAssetsPanel({
  overlays,
  setOverlays,
  handleOverlayFileChange,
  removeOverlay,
  setVideoFile,
  setVideoUrl,
  videoUrl,
  videoFile,
  backgroundFile,
  setBackgroundFile,
  backgroundUrl,
  setBackgroundUrl,
  removeVideo,
  className
}: UploadAssetsPanelProps) {

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
      ]);
    }
  };

  const handleBackgroundFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackgroundFile(file);
      const url = URL.createObjectURL(file);
      setBackgroundUrl(url);
    }
  };

  const removeBackground = () => {
    setBackgroundFile(null);
    setBackgroundUrl("");
  };

  const AssetBlock: React.FC<{
    label: string;
    file: File | null | undefined;
    url: string | undefined;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove?: () => void;
    accept: string;
    disabled?: boolean;
    className?: string;
    previewClassName?: string;
  }> = ({ label, file, url, onFileChange, onRemove, accept, disabled, className, previewClassName }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePlusClick = () => {
      if (fileInputRef.current && !file) {
        fileInputRef.current.click();
      }
    };

    return (
      <div className={`flex flex-col items-center justify-center border border-zinc-700 rounded-lg p-4 relative group ${className || ''}`}>
        <Label className="absolute top-2 left-3 text-xs text-white z-10">{label}</Label>
        
        {!file ? (
          <div
            className="relative w-full h-full flex flex-col items-center justify-center cursor-pointer"
            onClick={!disabled ? handlePlusClick : undefined}
          >
            <Input
              ref={fileInputRef}
              id={`file-upload-${label}`}
              type="file"
              accept={accept}
              className="hidden"
              onChange={onFileChange}
              disabled={disabled}
            />
            <Skeleton className={`w-full h-full ${previewClassName || ''}`} />
            {!disabled && (
              <div className="absolute top-2 right-2 bg-zinc-800 rounded-full p-1 group-hover:bg-purple-600 transition-colors">
                <Plus className="h-5 w-5 text-zinc-400 group-hover:text-white" />
              </div>
            )}
            <p className="mt-2 text-zinc-400 text-sm">Click to Upload</p>
          </div>
        ) : (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {url && label === "Video" && (
              <video src={url} controls={false} className={`w-full h-full object-cover rounded ${previewClassName || ''}`} />
            )}
            {url && (label === "Background" || label.startsWith("Overlay")) && (
              <img src={url} alt={`Preview for ${label}`} className={`w-full h-full object-cover rounded ${previewClassName || ''}`} />
            )}
            
            {onRemove && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 rounded-full p-1 group-hover:opacity-100 transition-opacity z-10"
                onClick={onRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <p className="mt-2 text-zinc-300 text-sm truncate w-full text-center">{file.name}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className || ''}`}>
      <h2 className="text-xl font-bold mb-6">Upload Assets</h2>
      <div className="p-4 ">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AssetBlock
            label="Video"
            file={videoFile}
            url={videoUrl}
            onFileChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setVideoFile(file);
                const url = URL.createObjectURL(file);
                setVideoUrl(url);
              }
            }}
            onRemove={videoFile ? removeVideo : undefined}
            accept="video/*"
            className="h-48"
            previewClassName="min-h-0"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(2)].map((_, index) => {
              const overlay = overlays[index];
              return (
                <AssetBlock
                  key={index}
                  label={`Overlay ${index + 1}`}
                  file={overlay?.file}
                  url={overlay?.url}
                  onFileChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && overlay) {
                      handleOverlayFileChange(overlay.id, file);
                    } else if (file && !overlay) {
                      const newOverlayId = Date.now();
                      setOverlays(prev => [...prev, { id: newOverlayId, x: 50, y: 50, width: 100, height: 100, opacity: 100, file: file, url: URL.createObjectURL(file) }]);
                    }
                  }}
                  onRemove={overlay ? () => removeOverlay(overlay.id) : undefined}
                  accept="image/*"
                  disabled={overlays.length >= 2 && !overlay}
                  className="h-32"
                  previewClassName="min-h-0"
                />
              );
            })}
          </div>
          {overlays.length < 2 && (
            <Button
              variant="outline"
              onClick={addOverlay}
              className="w-full border-dashed border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Overlay Slot
            </Button>
          )}
        </div>

        <div className="lg:col-span-1">
          <AssetBlock
            label="Background"
            file={backgroundFile}
            url={backgroundUrl}
            onFileChange={handleBackgroundFileChange}
            onRemove={backgroundFile ? removeBackground : undefined}
            accept="image/*"
            className="h-96 lg:h-full"
            previewClassName="min-h-0"
          />
        </div>
      </div>
      </div>
    </div>
  );
}

export default UploadAssetsPanel; 