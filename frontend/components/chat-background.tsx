import { cn } from "@/lib/utils";

interface ChatBackgroundProps {
  role: 'akash' | 'divyangini';
}

export default function ChatBackground({ role }: ChatBackgroundProps) {
  // Determine gradient based on role or use a generic dark gradient
  // Example: A dark purple/blue gradient
  const gradient = 'linear-gradient(to bottom right, #1e1b4b, #1e293b)'; // Dark Indigo to Dark Slate

  return (
    <div
      className="fixed inset-0 z-0 opacity-40 dark:opacity-30 pointer-events-none bg-fixed"
      style={{
        background: gradient,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
      }}
    />
  )
}
