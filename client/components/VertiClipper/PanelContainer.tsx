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

  useEffect(() => {
    if (isActive) {
      setShowContent(false);
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isActive]);

  return (
    <>
      {isActive && (
        <div
          className="p-6 min-h-[70vh] w-full"
        >
          {!showContent ? (
            <Skeleton className="h-full w-full bg-grey" />
          ) : (
            children
          )}
        </div>
      )}
    </>
  );
}

export default PanelContainer; 