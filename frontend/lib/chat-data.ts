export interface Message {
  id: string
  clientId?: string
  sender: string
  content: string
  timestamp: string
  seen: boolean
  type: "text" | "image" | "day-separator"
}

export const initialMessages: Message[] = [
  {
    id: "1",
    sender: "divyangini",
    content: "Hey! I saw your profile on Bumble. Thought we could chat here instead?",
    timestamp: "2023-05-10T14:30:00Z",
    seen: true,
    type: "text",
  },
  {
    id: "2",
    sender: "akash",
    content: "Hi Divyangini! Yeah, this is much better. How's your day going?",
    timestamp: "2023-05-10T14:35:00Z",
    seen: true,
    type: "text",
  },
  {
    id: "3",
    sender: "divyangini",
    content: "Pretty good! Just finished a meeting. What about you?",
    timestamp: "2023-05-10T14:40:00Z",
    seen: true,
    type: "text",
  },
  {
    id: "4",
    sender: "akash",
    content: "Working on some designs. Check this out",
    timestamp: "2023-05-10T14:45:00Z",
    seen: true,
    type: "text",
  },
  {
    id: "5",
    sender: "akash",
    content: "/placeholder.svg?height=600&width=400",
    timestamp: "2023-05-10T14:46:00Z",
    seen: true,
    type: "image",
  },
  {
    id: "6",
    sender: "divyangini",
    content: "That looks amazing! I love the colors 😍",
    timestamp: "2023-05-10T14:50:00Z",
    seen: true,
    type: "text",
  },
  {
    id: "7",
    sender: "divyangini",
    content: "By the way, check out this photo from the cafe I was telling you about",
    timestamp: "2023-05-10T14:51:00Z",
    seen: true,
    type: "text",
  },
  {
    id: "8",
    sender: "divyangini",
    content: "/placeholder.svg?height=600&width=400",
    timestamp: "2023-05-10T14:52:00Z",
    seen: true,
    type: "image",
  },
]
