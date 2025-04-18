"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { X, Download } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default browser prompt
      e.preventDefault()
      // Save the event for later use
      setInstallPrompt(e as BeforeInstallPromptEvent)
      // Check if we should show the prompt (e.g., not shown in last 30 days)
      const lastPromptTime = localStorage.getItem('pwaPromptLastShown')
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000
      
      if (!lastPromptTime || Date.now() - Number.parseInt(lastPromptTime) > thirtyDaysInMs) {
        setShowPrompt(true)
      }
    }

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!installPrompt) return
    
    // Show the installation prompt
    await installPrompt.prompt()
    
    // Wait for the user's choice
    const choiceResult = await installPrompt.userChoice
    
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the installation')
    } else {
      console.log('User dismissed the installation')
    }
    
    // Reset the installPrompt state
    setInstallPrompt(null)
    setShowPrompt(false)
    // Save the current time
    localStorage.setItem('pwaPromptLastShown', Date.now().toString())
  }

  const handleClose = () => {
    setShowPrompt(false)
    // Save the current time
    localStorage.setItem('pwaPromptLastShown', Date.now().toString())
  }

  if (!showPrompt) return null

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="fixed bottom-4 left-4 right-4 z-50 rounded-lg bg-card p-4 shadow-lg border border-border/30 backdrop-blur-md"
        >
          <button 
            onClick={handleClose}
            className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:bg-secondary/80 active:scale-95 transition-transform duration-200"
          >
            <X size={18} />
          </button>
          <div className="mb-2 text-lg font-semibold text-foreground">Install ChatFilm App</div>
          <p className="mb-3 text-sm text-muted-foreground">
            Add ChatFilm to your home screen for quick access anytime, even offline.
          </p>
          <div className="flex justify-end">
            <Button 
              onClick={handleInstallClick} 
              className="bg-primary hover:bg-primary/90 active:scale-95 transition-transform duration-200"
            >
              <Download size={16} className="mr-2" />
              Install
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
