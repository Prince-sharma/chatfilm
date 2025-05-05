import React, { useRef, useState, useEffect } from 'react';
import { Camera, Image as ImageIcon, X, AlertCircle } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImageUploadMenuProps {
  onImageSelected: (dataUrl: string) => void;
}

export default function ImageUploadMenu({ onImageSelected }: ImageUploadMenuProps) {
  const [open, setOpen] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Check if camera permissions were previously denied
  useEffect(() => {
    const cameraPermissionDenied = localStorage.getItem("cameraPermissionDenied");
    if (cameraPermissionDenied === "true") {
      setPermissionDenied(true);
    }
  }, []);

  const handleCameraClick = () => {
    // Close the popover
    setOpen(false);
    
    // If permission was previously denied, show the dialog
    if (permissionDenied) {
      setPermissionDialogOpen(true);
      return;
    }
    
    // Otherwise attempt to access the camera
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onImageSelected(event.target.result.toString());
          // Reset the input value so the same file can be selected again
          if (e.target) {
            e.target.value = "";
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error reading file:", error);
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  // Handle permission errors
  const handlePermissionError = () => {
    setPermissionDenied(true);
    localStorage.setItem("cameraPermissionDenied", "true");
    setPermissionDialogOpen(true);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="mr-1 h-12 w-12 flex-shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-transform"
            aria-label="Attach media"
          >
            <Camera size={24} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" side="top" align="center">
          <div className="flex flex-col space-y-1">
            <Button
              variant="ghost"
              className="justify-start"
              onClick={handleCameraClick}
            >
              <Camera className="mr-2 h-4 w-4" />
              Take photo
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => {
                setOpen(false);
                galleryInputRef.current?.click();
              }}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Gallery
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Hidden file inputs */}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        ref={cameraInputRef}
        onChange={handleFileChange}
        onError={handlePermissionError}
      />
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        ref={galleryInputRef}
        onChange={handleFileChange}
      />
      
      {/* Permission dialog */}
      <Dialog open={permissionDialogOpen} onOpenChange={setPermissionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Camera Access Required</DialogTitle>
            <DialogDescription>
              Please enable camera access in your browser settings to take photos.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-4">
            <AlertCircle className="h-12 w-12 text-yellow-500" />
          </div>
          <DialogFooter>
            <Button onClick={() => setPermissionDialogOpen(false)}>
              OK, Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 