import { cn } from "@/lib/utils";

interface ChatBackgroundProps {
  role: 'akash' | 'divyangini';
}

export default function ChatBackground({ role }: ChatBackgroundProps) {
  // Determine gradient based on role
  const gradient = role === 'akash' 
    ? 'linear-gradient(to bottom right, #0c1220, #000000)' // Dark blue to black for Akash
    : 'linear-gradient(to bottom right, #1e1b4b, #1e293b)'; // Purple gradient for Divyangini

  return (
    <div
      className={cn(
        "fixed inset-0 z-0 pointer-events-none bg-fixed",
        role === 'akash' ? "opacity-70 dark:opacity-60" : "opacity-40 dark:opacity-30"
      )}
      style={{
        background: gradient,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
      }}
    />
  )
}
