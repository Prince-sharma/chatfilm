import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DaySeparatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (text: string) => void;
}

export default function DaySeparatorDialog({ 
  open, 
  onOpenChange, 
  onConfirm 
}: DaySeparatorDialogProps) {
  const [separatorText, setSeparatorText] = useState("");
  
  const handleConfirm = () => {
    if (separatorText.trim()) {
      onConfirm(separatorText.trim());
      setSeparatorText("");
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && separatorText.trim()) {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Date Separator</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="e.g. Yesterday, April 29, 2024, etc."
            value={separatorText}
            onChange={(e) => setSeparatorText(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-full"
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="mr-2">Cancel</Button>
          </DialogClose>
          <Button 
            onClick={handleConfirm}
            disabled={!separatorText.trim()}
          >
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 