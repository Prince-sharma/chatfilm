"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import PWAInstallPrompt from "@/components/pwa-install-prompt"

export default function RoleSelection() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border bg-card text-foreground">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Choose Your Role</CardTitle>
          <CardDescription className="text-muted-foreground">Select a character to begin the scene</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <Link href="/chat/akash" className="block">
            <Button
              variant="outline"
              className="w-full border-border bg-secondary py-6 text-lg text-primary hover:bg-secondary/80 hover:text-primary/90"
            >
              Akash
            </Button>
          </Link>
          <Link href="/chat/divyangini" className="block">
            <Button
              variant="outline"
              className="w-full border-border bg-secondary py-6 text-lg text-primary hover:bg-secondary/80 hover:text-primary/90"
            >
              Divyangini
            </Button>
          </Link>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-border px-6 py-4">
          <p className="text-sm text-muted-foreground">Film Set Chat App</p>
        </CardFooter>
      </Card>
      <PWAInstallPrompt />
    </div>
  )
}
