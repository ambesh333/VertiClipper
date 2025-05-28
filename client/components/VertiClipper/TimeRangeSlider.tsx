import type React from "react";
import { useState, useRef, useEffect } from "react";

function TimeRangeSlider({
  min,
  max,
  start,
  end,
  currentTime,
  onChange,
}: {
  min: number;
  max: number;
  start: number;
  end: number;
  currentTime: number;
  onChange: (start: number, end: number) => void;
}) {
  const [isDragging, setIsDragging] = useState<"start" | "end" | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const getPositionFromValue = (value: number) => {
    return ((value - min) / (max - min)) * 100;
  };

  const getValueFromPosition = (clientX: number) => {
    if (!sliderRef.current) return min;

    const rect = sliderRef.current.getBoundingClientRect();
    const position = (clientX - rect.left) / rect.width;
    const value = min + position * (max - min);
    return Math.max(min, Math.min(max, value));
  };

  const handleMouseDown = (type: "start" | "end") => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(type);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const value = getValueFromPosition(e.clientX);

      if (isDragging === "start") {
        onChange(Math.min(value, end - 0.1), end);
      } else {
        onChange(start, Math.max(value, start + 0.1));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, start, end, onChange]);

  return (
    <div className="relative">
      <div
        ref={sliderRef}
        className="relative h-6 bg-zinc-800 rounded-full cursor-pointer"
      >
        <div className="absolute inset-0 bg-zinc-700 rounded-full" />
        <div
          className="absolute top-0 bottom-0 bg-purple-600 rounded-full"
          style={{
            left: `${getPositionFromValue(start)}%`,
            width: `${getPositionFromValue(end) - getPositionFromValue(start)}%`,
          }}
        />

        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
          style={{
            left: `${getPositionFromValue(currentTime)}%`,
          }}
        />

        <div
          className="absolute top-1/2 w-4 h-4 bg-white border-2 border-purple-600 rounded-full cursor-grab active:cursor-grabbing transform -translate-y-1/2 -translate-x-1/2 shadow-lg"
          style={{ left: `${getPositionFromValue(start)}%` }}
          onMouseDown={handleMouseDown("start")}
        />

        <div
          className="absolute top-1/2 w-4 h-4 bg-white border-2 border-purple-600 rounded-full cursor-grab active:cursor-grabbing transform -translate-y-1/2 -translate-x-1/2 shadow-lg"
          style={{ left: `${getPositionFromValue(end)}%` }}
          onMouseDown={handleMouseDown("end")}
        />
      </div>
    </div>
  );
}

export default TimeRangeSlider; 