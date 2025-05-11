import React from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface MuteAnimationProps {
  show: boolean;
  role?: 'akash' | 'divyangini';
  isMuting: boolean; // true when muting, false when unmuting
}

export default function MuteAnimation({ show, role = 'divyangini', isMuting }: MuteAnimationProps) {
  return (
    <div className={cn(
      "fixed inset-0 flex items-center justify-center z-30 pointer-events-none",
      "transition-opacity duration-300",
      show ? "opacity-100" : "opacity-0"
    )}>
      <div className={cn(
        "rounded-full p-6 relative transition-all duration-300",
        isMuting 
          ? role === 'akash' ? "bg-red-800" : "bg-red-600"
          : "bg-transparent",
        show ? "scale-100" : "scale-0",
        "animate-in zoom-in-50 duration-300"
      )}>
        <Bell 
          size={32} 
          className={cn(
            "transition-colors duration-300",
            isMuting ? "text-white" : "text-foreground"
          )}
        />
        <div className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-300",
          isMuting 
            ? "opacity-100 scale-100" 
            : "opacity-0 scale-0"
        )}>
          <div className={cn(
            "w-[2px] h-12 rotate-45 transform origin-center transition-all duration-300",
            role === 'akash' ? "bg-white" : "bg-white",
            isMuting 
              ? "scale-y-100" 
              : "scale-y-0",
            "animate-in slide-in-from-left duration-300"
          )} />
        </div>
      </div>
    </div>
  );
} 