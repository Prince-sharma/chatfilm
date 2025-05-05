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
  const [isLongPress, setIsLongPress] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const separatorRef = useRef<HTMLDivElement>(null);

  // Long press handlers for deletion
  const handleTouchStart = (e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
    longPressTimer.current = setTimeout(() => {
      setIsLongPress(true);
      e.preventDefault();
    }, 5000); // 5 seconds for long press
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Start drag if left mouse button
    if (e.button === 0) {
      e.preventDefault();
      setIsDragging(true);
      setDragStartY(e.clientY);
      setDragCurrentY(e.clientY);
      
      // Also start long press timer
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
      
      longPressTimer.current = setTimeout(() => {
        setIsLongPress(true);
      }, 5000); // 5 seconds for long press
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      const touch = e.touches[0];
      setDragCurrentY(touch.clientY);
      e.preventDefault();
    }
    
    // Cancel long press if moving
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setDragCurrentY(e.clientY);
    }
    
    // Cancel long press if moving
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchEnd = () => {
    if (isDragging && onDragEnd) {
      onDragEnd(dragCurrentY);
    }
    setIsDragging(false);
    
    if (isLongPress && onDelete) {
      handleDelete();
    }
    setIsLongPress(false);
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleMouseUp = () => {
    if (isDragging && onDragEnd) {
      onDragEnd(dragCurrentY);
    }
    setIsDragging(false);
    
    if (isLongPress && onDelete) {
      handleDelete();
    }
    setIsLongPress(false);
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
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

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

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
        "flex items-center justify-center my-4 py-1 transition-all duration-300 ease-in-out",
        isDragging ? "opacity-70 cursor-grabbing z-10" : "cursor-grab",
        isDeleting ? "scale-90 opacity-0" : "scale-100 opacity-100"
      )}
      style={getTransformStyle()}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className={cn(
        "bg-muted text-muted-foreground text-xs font-medium rounded-full px-3 py-1 relative",
        isLongPress ? "ring-2 ring-destructive ring-offset-2 ring-offset-background" : ""
      )}>
        {text}
        {isLongPress && (
          <div className="absolute -top-2 -left-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-lg">
            <Trash2 size={12} />
          </div>
        )}
      </div>
    </div>
  );
} 