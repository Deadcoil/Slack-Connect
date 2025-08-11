import express from "express"
import { WebClient } from "@slack/web-api"
import { getTokens, refreshTokensIfNeeded } from "../storage/tokens"

const router = express.Router()

router.get("/", async (req, res) => {
  try {
    const tokens = await getTokens()
    if (!tokens?.accessToken) {
      return res.status(401).json({ error: "Not connected to Slack" })
    }

    await refreshTokensIfNeeded()
    const updatedTokens = await getTokens()

    const slack = new WebClient(updatedTokens!.accessToken)

    const [publicChannels, privateChannels, directMessages] = await Promise.all([
      slack.conversations.list({ types: "public_channel", limit: 1000 }),
      slack.conversations.list({ types: "private_channel", limit: 1000 }),
      slack.conversations.list({ types: "im,mpim", limit: 1000 }),
    ])

    const channels = [
      ...(publicChannels.channels || []),
      ...(privateChannels.channels || []),
      ...(directMessages.channels || []),
    ]
      .filter((channel) => !channel.is_archived)
      .map((channel) => ({
        id: channel.id,
        name: channel.name || `DM-${channel.id}`,
        isPrivate: channel.is_private || false,
        isDM: channel.is_im || channel.is_mpim || false,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    res.json(channels)
  } catch (error: any) {
    console.error("Error fetching channels:", error)

    if (error.data?.error === "invalid_auth") {
      return res.status(401).json({ error: "Invalid Slack authentication" })
    }

    res.status(500).json({ error: "Failed to fetch channels" })
  }
})

export default router
