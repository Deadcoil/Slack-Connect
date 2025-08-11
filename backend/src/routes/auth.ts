import express from "express"
import { WebClient } from "@slack/web-api"
import { saveTokens, getTokens } from "../storage/tokens"
import { generateRandomString } from "../utils/helpers"

const router = express.Router()

const oauthStates = new Map<string, { timestamp: number }>()

setInterval(() => {
  const now = Date.now()
  for (const [state, data] of oauthStates.entries()) {
    if (now - data.timestamp > 3600000) {
      oauthStates.delete(state)
    }
  }
}, 3600000)


router.get("/slack", (req, res) => {
  try {
    const state = generateRandomString(32)
    oauthStates.set(state, { timestamp: Date.now() })

    const scopes = ["channels:read", "chat:write", "groups:read", "im:read", "mpim:read"].join(",")

    const authUrl =
      `https://slack.com/oauth/v2/authorize?` +
      `client_id=${process.env.SLACK_CLIENT_ID}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `state=${state}&` +
      `redirect_uri=${encodeURIComponent(process.env.SLACK_REDIRECT_URI!)}`

    res.json({ url: authUrl })
  } catch (error) {
    console.error("OAuth initiation error:", error)
    res.status(500).json({ error: "Failed to initiate OAuth flow" })
  }
})


router.get("/slack/callback", async (req, res) => {
  try {
    const { code, state, error } = req.query

    if (error) {
      console.error("OAuth error:", error)
      return res.redirect(`${process.env.FRONTEND_URL}?error=oauth_denied`)
    }

    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL}?error=missing_params`)
    }

    if (!oauthStates.has(state as string)) {
      return res.redirect(`${process.env.FRONTEND_URL}?error=invalid_state`)
    }
    oauthStates.delete(state as string)

    const slack = new WebClient()
    const result = await slack.oauth.v2.access({
      client_id: process.env.SLACK_CLIENT_ID!,
      client_secret: process.env.SLACK_CLIENT_SECRET!,
      code: code as string,
      redirect_uri: process.env.SLACK_REDIRECT_URI!,
    })

    if (!result.ok || !result.access_token) {
      throw new Error("Failed to exchange code for tokens")
    }

    await saveTokens({
      accessToken: result.access_token,
      refreshToken: result.refresh_token || null,
      teamId: result.team?.id || "",
      teamName: result.team?.name || "",
      userId: result.authed_user?.id || "",
      scope: result.scope || "",
      expiresAt: null,
    })

    console.log(`✅ OAuth successful for team: ${result.team?.name}`)
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`)
  } catch (error) {
    console.error("OAuth callback error:", error)
    res.redirect(`${process.env.FRONTEND_URL}?error=oauth_failed`)
  }
})


router.get("/status", async (req, res) => {
  try {
    const tokens = await getTokens()
    res.json({ connected: !!tokens?.accessToken })
  } catch (error) {
    res.json({ connected: false })
  }
})

export default router
