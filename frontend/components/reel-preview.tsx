import Image from "next/image"
import { Play } from "lucide-react"

interface ReelPreviewProps {
  src: string
}

export default function ReelPreview({ src }: ReelPreviewProps) {
  return (
    <div className="relative h-[225px] w-[125px] overflow-hidden rounded-lg">
      <Image
        src={src || "/placeholder.svg"}
        alt="Reel preview"
        width={125}
        height={225}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white">
          <Play size={24} fill="white" />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
        <p className="text-xs text-white">Reel</p>
      </div>
    </div>
  )
}
