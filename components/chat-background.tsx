export default function ChatBackground() {
  return (
    <div
      className="absolute inset-0 z-0 opacity-20"
      style={{
        backgroundImage:
          'radial-gradient(circle at top left, hsl(var(--primary)) 0%, transparent 50%), radial-gradient(circle at bottom right, hsl(var(--accent)) 0%, transparent 50%)',
      }}
    />
  )
}
