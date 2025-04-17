"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export default function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
      return
    }

    // Store the install prompt event for later use
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!installPrompt) return

    // Show the install prompt
    await installPrompt.prompt()

    // Wait for the user to respond to the prompt
    const choiceResult = await installPrompt.userChoice

    if (choiceResult.outcome === "accepted") {
      console.log("User accepted the install prompt")
      setIsInstalled(true)
    } else {
      console.log("User dismissed the install prompt")
    }

    // Clear the saved prompt as it can't be used again
    setInstallPrompt(null)
  }

  if (isInstalled || !installPrompt) return null

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 mx-auto w-11/12 max-w-md rounded-lg bg-purple-900 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="mr-4">
          <h3 className="font-medium text-white">Install this app</h3>
          <p className="text-sm text-purple-200">Add to home screen for better experience</p>
        </div>
        <Button onClick={handleInstallClick} className="bg-white text-purple-900 hover:bg-gray-100">
          <Download size={16} className="mr-2" /> Install
        </Button>
      </div>
    </div>
  )
}
