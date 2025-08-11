import cron from "node-cron"
import { WebClient } from "@slack/web-api"
import { getPendingMessages, updateMessageStatus } from "../storage/messages"
import { getTokens, refreshTokensIfNeeded } from "../storage/tokens"

const scheduledJobs = new Map<string, cron.ScheduledTask>()


export async function initializeScheduler(): Promise<void> {
  try {
    console.log("🔄 Initializing message scheduler...")

    const pendingMessages = await getPendingMessages()
    console.log(`📅 Found ${pendingMessages.length} pending messages to reschedule`)

    for (const message of pendingMessages) {
      const scheduledDate = new Date(message.scheduledAt)

      // Only reschedule if the time hasn't passed
      if (scheduledDate > new Date()) {
        scheduleMessage(message.id, scheduledDate, message.channel, message.message)
        console.log(`⏰ Rescheduled message ${message.id} for ${scheduledDate.toISOString()}`)
      } else {
        // Mark as failed if the scheduled time has passed
        await updateMessageStatus(message.id, "failed", "Scheduled time has passed")
        console.log(`❌ Message ${message.id} marked as failed (scheduled time passed)`)
      }
    }

    console.log("✅ Scheduler initialized successfully")
  } catch (error) {
    console.error("Error initializing scheduler:", error)
  }
}

export function scheduleMessage(messageId: string, scheduledDate: Date, channel: string, message: string): void {
  try {
    // Cancel existing job if it exists
    if (scheduledJobs.has(messageId)) {
      scheduledJobs.get(messageId)?.stop()
    }

    const cronExpression = dateToCronExpression(scheduledDate)

    const task = cron.schedule(
      cronExpression,
      async () => {
        await sendScheduledMessage(messageId, channel, message)

        // Clean up the job after execution
        scheduledJobs.delete(messageId)
        task.stop()
      },
      {
        scheduled: true,
        timezone: "UTC",
      },
    )

    scheduledJobs.set(messageId, task)
    console.log(`⏰ Message ${messageId} scheduled for ${scheduledDate.toISOString()}`)
  } catch (error) {
    console.error(`Error scheduling message ${messageId}:`, error)
  }
}


export function cancelScheduledMessage(messageId: string): void {
  const task = scheduledJobs.get(messageId)
  if (task) {
    task.stop()
    scheduledJobs.delete(messageId)
    console.log(`❌ Cancelled scheduled message ${messageId}`)
  }
}

async function sendScheduledMessage(messageId: string, channel: string, message: string): Promise<void> {
  try {
    console.log(`📤 Sending scheduled message ${messageId}...`)

    const tokens = await getTokens()
    if (!tokens?.accessToken) {
      throw new Error("No valid Slack tokens found")
    }

    await refreshTokensIfNeeded()
    const updatedTokens = await getTokens()

    const slack = new WebClient(updatedTokens!.accessToken)

    // Send the message
    const result = await slack.chat.postMessage({
      channel,
      text: message,
    })

    if (!result.ok) {
      throw new Error(result.error || "Failed to send message")
    }

    // Update message status to sent
    await updateMessageStatus(messageId, "sent")
    console.log(`✅ Scheduled message ${messageId} sent successfully`)
  } catch (error: any) {
    console.error(`Error sending scheduled message ${messageId}:`, error)

    await updateMessageStatus(messageId, "failed", error.message)
  }
}

function dateToCronExpression(date: Date): string {
  const minute = date.getUTCMinutes()
  const hour = date.getUTCHours()
  const day = date.getUTCDate()
  const month = date.getUTCMonth() + 1 

  return `${minute} ${hour} ${day} ${month} *`
}


export function getSchedulerStatus(): { messageId: string; scheduled: boolean }[] {
  return Array.from(scheduledJobs.keys()).map((messageId) => ({
    messageId,
    scheduled: scheduledJobs.has(messageId),
  }))
}
