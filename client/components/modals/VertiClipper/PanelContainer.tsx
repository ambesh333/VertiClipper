import type React from "react";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function PanelContainer({
  children,
  isActive,
}: {
  children: React.ReactNode;
  isActive: boolean;
}) {
  const [showContent, setShowContent] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isActive) {
      if (mounted) {
        setShowContent(false);
        const timer = setTimeout(() => {
          setShowContent(true);
        }, 70);
        return () => clearTimeout(timer);
      } else {
        setShowContent(false);
      }
    } else {
      setShowContent(false);
    }
  }, [isActive, mounted]);

  return (
    <>
      {isActive && mounted && (
        <div
          className="p-6 min-h-[70vh] w-full"
        >
          {!showContent ? (
            <Skeleton className="h-full w-full" />
          ) : (
            children
          )}
        </div>
      )}
    </>
  );
}

export default PanelContainer; 