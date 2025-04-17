interface ChatBackgroundProps {
  role: 'akash' | 'divyangini';
}

export default function ChatBackground({ role }: ChatBackgroundProps) {
  const imageUrl = role === 'akash'
    ? 'url(https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)' // Beach background for Akash
    : 'url(https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1948&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)'; // Forest background for Divyangini

  return (
    <div
      className="absolute inset-0 z-0 opacity-30 dark:opacity-20" // Slightly adjusted opacity
      style={{
        backgroundImage: imageUrl,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed', // Keep background fixed during scroll
      }}
    />
  )
}
