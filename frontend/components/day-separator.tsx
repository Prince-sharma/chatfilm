import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";

interface DaySeparatorProps {
  text: string;
  onDelete?: () => void;
  onDragEnd?: (clientY: number) => void;
}

export default function DaySeparator({ text, onDelete, onDragEnd }: DaySeparatorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragCurrentY, setDragCurrentY] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteIndicator, setShowDeleteIndicator] = useState(false);
  const separatorRef = useRef<HTMLDivElement>(null);
  const lastClickTime = useRef<number>(0);
  
  // Handle double-click for deletion
  const handleClick = (e: React.MouseEvent) => {
    // Prevent click propagation to parent elements
    e.stopPropagation();
    
    // Only handle if not dragging
    if (isDragging) return;
    
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - lastClickTime.current;
    
    // Check if this is a double-click (less than 300ms between clicks)
    if (timeDiff < 300 && timeDiff > 0) {
      // Double-click detected
      setShowDeleteIndicator(true);
      setTimeout(() => {
        handleDelete();
      }, 100);
    }
    
    lastClickTime.current = currentTime;
  };
  
  // For mobile - handle double tap
  const handleTap = (e: React.TouchEvent) => {
    // Only handle if not dragging
    if (isDragging) return;
    
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - lastClickTime.current;
    
    // Check if this is a double-tap (less than 300ms between taps)
    if (timeDiff < 300 && timeDiff > 0) {
      // Double-tap detected
      setShowDeleteIndicator(true);
      setTimeout(() => {
        handleDelete();
      }, 100);
    }
    
    lastClickTime.current = currentTime;
  };

  // Dragging handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Start drag if left mouse button and not double-clicking
    if (e.button === 0) {
      e.preventDefault();
      setIsDragging(true);
      setDragStartY(e.clientY);
      setDragCurrentY(e.clientY);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // Start drag
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStartY(touch.clientY);
    setDragCurrentY(touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      const touch = e.touches[0];
      setDragCurrentY(touch.clientY);
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setDragCurrentY(e.clientY);
    }
  };

  const handleTouchEnd = () => {
    if (isDragging && onDragEnd) {
      onDragEnd(dragCurrentY);
    }
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    if (isDragging && onDragEnd) {
      onDragEnd(dragCurrentY);
    }
    setIsDragging(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      setIsDeleting(true);
      setTimeout(() => {
        onDelete();
      }, 300);
    }
  };

  // Add global event listeners for mouse movements
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        setDragCurrentY(e.clientY);
      };
      
      const handleGlobalMouseUp = () => {
        if (onDragEnd) {
          onDragEnd(dragCurrentY);
        }
        setIsDragging(false);
      };
      
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
    
    return undefined;
  }, [isDragging, dragCurrentY, onDragEnd]);

  // Calculate transform for dragging
  const getTransformStyle = () => {
    if (isDragging) {
      const deltaY = dragCurrentY - dragStartY;
      return { transform: `translateY(${deltaY}px)` };
    }
    return {};
  };

  return (
    <div 
      ref={separatorRef}
      className={cn(
        "flex items-center justify-center my-1 py-0 transition-all duration-300 ease-in-out",
        isDragging ? "opacity-70 cursor-grabbing z-10" : "cursor-grab",
        isDeleting ? "scale-90 opacity-0" : "scale-100 opacity-100"
      )}
      style={getTransformStyle()}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className={cn(
        "bg-muted text-muted-foreground text-sm font-medium rounded-full px-4 py-1.5 relative",
        showDeleteIndicator ? "ring-2 ring-destructive ring-offset-2 ring-offset-background" : ""
      )}>
        {text}
        {showDeleteIndicator && (
          <div className="absolute -top-2 -left-2 bg-destructive text-destructive-foreground rounded-full p-1.5 shadow-lg">
            <Trash2 size={14} />
          </div>
        )}
      </div>
    </div>
  );
} 