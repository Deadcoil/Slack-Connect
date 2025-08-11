import { promises as fs } from "fs"
import path from "path"

const MESSAGES_FILE = path.join(__dirname, "../../data/messages.json")

export interface ScheduledMessage {
  id: string
  channel: string
  channelName: string
  message: string
  scheduledAt: string
  status: "pending" | "sent" | "cancelled" | "failed"
  createdAt: string
  sentAt?: string
  error?: string
}


async function ensureDataDir() {
  const dataDir = path.dirname(MESSAGES_FILE)
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}


async function loadMessages(): Promise<ScheduledMessage[]> {
  try {
    const data = await fs.readFile(MESSAGES_FILE, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    if ((error as any).code === "ENOENT") {
      return []
    }
    console.error("Error loading messages:", error)
    throw error
  }
}


async function saveMessages(messages: ScheduledMessage[]): Promise<void> {
  try {
    await ensureDataDir()
    await fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2))
  } catch (error) {
    console.error("Error saving messages:", error)
    throw error
  }
}


export async function saveScheduledMessage(message: ScheduledMessage): Promise<void> {
  const messages = await loadMessages()
  messages.push(message)
  await saveMessages(messages)
}


export async function getScheduledMessages(): Promise<ScheduledMessage[]> {
  return await loadMessages()
}


export async function getPendingMessages(): Promise<ScheduledMessage[]> {
  const messages = await loadMessages()
  return messages.filter((msg) => msg.status === "pending" && new Date(msg.scheduledAt) > new Date())
}


export async function updateMessageStatus(
  messageId: string,
  status: ScheduledMessage["status"],
  error?: string,
): Promise<void> {
  const messages = await loadMessages()
  const messageIndex = messages.findIndex((msg) => msg.id === messageId)

  if (messageIndex === -1) {
    throw new Error(`Message with ID ${messageId} not found`)
  }

  messages[messageIndex].status = status
  if (status === "sent") {
    messages[messageIndex].sentAt = new Date().toISOString()
  }
  if (error) {
    messages[messageIndex].error = error
  }

  await saveMessages(messages)
}


export async function deleteScheduledMessage(messageId: string): Promise<void> {
  const messages = await loadMessages()
  const filteredMessages = messages.filter((msg) => msg.id !== messageId)
  await saveMessages(filteredMessages)
}


export async function getMessageById(messageId: string): Promise<ScheduledMessage | null> {
  const messages = await loadMessages()
  return messages.find((msg) => msg.id === messageId) || null
}
