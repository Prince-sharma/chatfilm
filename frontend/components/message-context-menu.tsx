import React from "react";
import { Calendar, Trash2 } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";

interface MessageContextMenuProps {
  children: React.ReactNode;
  onAddSeparator: () => void;
  onDelete?: () => void;
  isOwnMessage: boolean;
  role?: 'akash' | 'divyangini';
}

export default function MessageContextMenu({
  children,
  onAddSeparator,
  onDelete,
  isOwnMessage,
  role = 'divyangini'
}: MessageContextMenuProps) {
  // Prevent text selection and keyboard popup
  const preventSelectionAndKeyboard = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Remove any existing selection
    window.getSelection()?.removeAllRanges();
    
    // Ensure any focused elements are blurred
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger 
        asChild
        // Prevent default touch behavior
        onTouchStart={preventSelectionAndKeyboard}
        onContextMenu={preventSelectionAndKeyboard}
      >
        <div className="select-none touch-none">
          {children}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent 
        className={cn(
          "w-48",
          role === 'akash' ? "bg-gray-800 border-gray-700" : ""
        )}
      >
        <ContextMenuItem 
          className={cn(
            "flex items-center gap-2 cursor-pointer",
            role === 'akash' ? "hover:bg-gray-700 focus:bg-gray-700" : ""
          )}
          onClick={onAddSeparator}
        >
          <Calendar size={16} />
          <span>Add Date Separator</span>
        </ContextMenuItem>
        {isOwnMessage && onDelete && (
          <ContextMenuItem 
            className={cn(
              "flex items-center gap-2 cursor-pointer text-red-500",
              role === 'akash' ? "hover:bg-gray-700 focus:bg-gray-700" : ""
            )}
            onClick={onDelete}
          >
            <Trash2 size={16} />
            <span>Delete Message</span>
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
} 