import express from "express"
import { WebClient } from "@slack/web-api"
import { v4 as uuidv4 } from "uuid"
import { getTokens, refreshTokensIfNeeded } from "../storage/tokens"
import { saveScheduledMessage, getScheduledMessages, updateMessageStatus } from "../storage/messages"
import { scheduleMessage, cancelScheduledMessage } from "../jobs/scheduler"
import { sanitizeInput } from "../utils/helpers"

const router = express.Router()


router.post("/send", async (req, res) => {
  try {
    const { channel, message } = req.body

    if (!channel || !message) {
      return res.status(400).json({ error: "Channel and message are required" })
    }

    const tokens = await getTokens()
    if (!tokens?.accessToken) {
      return res.status(401).json({ error: "Not connected to Slack" })
    }

    await refreshTokensIfNeeded()
    const updatedTokens = await getTokens()

    const slack = new WebClient(updatedTokens!.accessToken)

    const sanitizedMessage = sanitizeInput(message)

    const result = await slack.chat.postMessage({
      channel,
      text: sanitizedMessage,
    })

    if (!result.ok) {
      throw new Error(result.error || "Failed to send message")
    }

    console.log(`✅ Message sent to channel ${channel}`)
    res.json({ success: true, messageId: result.ts })
  } catch (error: any) {
    console.error("Error sending message:", error)

    if (error.data?.error === "invalid_auth") {
      return res.status(401).json({ error: "Invalid Slack authentication" })
    }

    if (error.data?.error === "channel_not_found") {
      return res.status(404).json({ error: "Channel not found" })
    }

    res.status(500).json({ error: "Failed to send message" })
  }
})


router.post("/schedule", async (req, res) => {
  try {
    const { channel, message, scheduledAt } = req.body

    if (!channel || !message || !scheduledAt) {
      return res.status(400).json({ error: "Channel, message, and scheduledAt are required" })
    }

    const scheduledDate = new Date(scheduledAt)
    if (scheduledDate <= new Date()) {
      return res.status(400).json({ error: "Scheduled time must be in the future" })
    }

    const tokens = await getTokens()
    if (!tokens?.accessToken) {
      return res.status(401).json({ error: "Not connected to Slack" })
    }

    const slack = new WebClient(tokens.accessToken)
    const channelInfo = await slack.conversations.info({ channel })
    const channelName = channelInfo.channel?.name || channel

    const messageId = uuidv4()
    const scheduledMessage = {
      id: messageId,
      channel,
      channelName,
      message: sanitizeInput(message),
      scheduledAt: scheduledDate.toISOString(),
      status: "pending" as const,
      createdAt: new Date().toISOString(),
    }

    await saveScheduledMessage(scheduledMessage)

    scheduleMessage(messageId, scheduledDate, channel, scheduledMessage.message)

    console.log(`📅 Message scheduled for ${scheduledDate.toISOString()}`)
    res.json({ success: true, messageId, scheduledAt: scheduledDate.toISOString() })
  } catch (error: any) {
    console.error("Error scheduling message:", error)

    if (error.data?.error === "invalid_auth") {
      return res.status(401).json({ error: "Invalid Slack authentication" })
    }

    if (error.data?.error === "channel_not_found") {
      return res.status(404).json({ error: "Channel not found" })
    }

    res.status(500).json({ error: "Failed to schedule message" })
  }
})


router.get("/scheduled", async (req, res) => {
  try {
    const messages = await getScheduledMessages()
    res.json(messages)
  } catch (error) {
    console.error("Error fetching scheduled messages:", error)
    res.status(500).json({ error: "Failed to fetch scheduled messages" })
  }
})


router.delete("/scheduled/:id", async (req, res) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ error: "Message ID is required" })
    }

    cancelScheduledMessage(id)

    await updateMessageStatus(id, "cancelled")

    console.log(`❌ Scheduled message ${id} cancelled`)
    res.json({ success: true })
  } catch (error) {
    console.error("Error cancelling message:", error)
    res.status(500).json({ error: "Failed to cancel message" })
  }
})

export default router
