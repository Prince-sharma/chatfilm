"use client"

import type React from "react"

import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Camera, Edit, Info, MailsIcon as Notifications, Lock, Key } from "lucide-react"
import { useState } from "react"
import ImageViewer from "@/components/image-viewer"

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const user = params.user as string
  const [viewingImage, setViewingImage] = useState(false)

  const profileImage = `/placeholder.svg?height=200&width=200&text=${user.charAt(0).toUpperCase()}`
  const status = user === "akash" ? "Living life one frame at a time 🎬" : "Dreamer, believer, achiever ✨"

  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      {/* Header */}
      <header className="flex items-center justify-between bg-purple-900 p-4">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-2 text-white" onClick={() => router.back()}>
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-xl font-semibold text-white">Profile</h1>
        </div>
      </header>

      {/* Profile Image */}
      <div className="flex flex-col items-center bg-purple-900 pb-6 pt-4">
        <div className="relative mb-4 h-32 w-32" onClick={() => setViewingImage(true)}>
          <Image
            src={profileImage || "/placeholder.svg"}
            alt={user}
            width={128}
            height={128}
            className="rounded-full object-cover"
          />
          <div className="absolute bottom-0 right-0 rounded-full bg-purple-700 p-2">
            <Camera size={20} className="text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold capitalize text-white">{user}</h2>
        <p className="text-sm text-gray-300">+91 98765 43210</p>
      </div>

      {/* Profile Info */}
      <div className="flex-1 bg-gray-950 px-4 py-6">
        <div className="mb-6 rounded-lg bg-gray-900 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">About</h3>
            <Edit size={18} className="text-purple-400" />
          </div>
          <p className="text-gray-300">{status}</p>
        </div>

        <div className="space-y-1">
          <ProfileItem icon={<Info size={20} />} text="App info" />
          <ProfileItem icon={<Notifications size={20} />} text="Notifications" />
          <ProfileItem icon={<Lock size={20} />} text="Privacy" />
          <ProfileItem icon={<Key size={20} />} text="Security" />
        </div>
      </div>

      {viewingImage && <ImageViewer src={profileImage || "/placeholder.svg"} onClose={() => setViewingImage(false)} />}
    </div>
  )
}

function ProfileItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex cursor-pointer items-center rounded-lg p-4 hover:bg-gray-900">
      <div className="mr-4 text-purple-400">{icon}</div>
      <span className="text-lg text-gray-200">{text}</span>
    </div>
  )
}
