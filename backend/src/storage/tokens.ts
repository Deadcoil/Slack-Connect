import { promises as fs } from "fs"
import path from "path"
import { WebClient } from "@slack/web-api"

const TOKENS_FILE = path.join(__dirname, "../../data/tokens.json")

export interface TokenData {
  accessToken: string
  refreshToken: string | null
  teamId: string
  teamName: string
  userId: string
  scope: string
  expiresAt: string | null
  updatedAt: string
}


async function ensureDataDir() {
  const dataDir = path.dirname(TOKENS_FILE)
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}


export async function saveTokens(tokens: Omit<TokenData, "updatedAt">): Promise<void> {
  try {
    await ensureDataDir()

    const tokenData: TokenData = {
      ...tokens,
      updatedAt: new Date().toISOString(),
    }

    await fs.writeFile(TOKENS_FILE, JSON.stringify(tokenData, null, 2))
    console.log("✅ Tokens saved successfully")
  } catch (error) {
    console.error("Error saving tokens:", error)
    throw error
  }
}


export async function getTokens(): Promise<TokenData | null> {
  try {
    const data = await fs.readFile(TOKENS_FILE, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    if ((error as any).code === "ENOENT") {
      return null
    }
    console.error("Error reading tokens:", error)
    throw error
  }
}


export async function deleteTokens(): Promise<void> {
  try {
    await fs.unlink(TOKENS_FILE)
    console.log("✅ Tokens deleted successfully")
  } catch (error) {
    if ((error as any).code !== "ENOENT") {
      console.error("Error deleting tokens:", error)
      throw error
    }
  }
}


export async function refreshTokensIfNeeded(): Promise<boolean> {
  try {
    const tokens = await getTokens()
    if (!tokens) return false

    const slack = new WebClient(tokens.accessToken)

    try {
      await slack.auth.test()
      return true 
    } catch (error: any) {
      if (error.data?.error === "invalid_auth") {
        console.log("🔄 Token invalid, attempting refresh...")

        if (tokens.refreshToken) {
          const result = await slack.oauth.v2.access({
            client_id: process.env.SLACK_CLIENT_ID!,
            client_secret: process.env.SLACK_CLIENT_SECRET!,
            refresh_token: tokens.refreshToken,
          })

          if (result.ok && result.access_token) {
            await saveTokens({
              accessToken: result.access_token,
              refreshToken: result.refresh_token || tokens.refreshToken,
              teamId: tokens.teamId,
              teamName: tokens.teamName,
              userId: tokens.userId,
              scope: result.scope || tokens.scope,
              expiresAt: null,
            })
            console.log("✅ Tokens refreshed successfully")
            return true
          }
        }

        await deleteTokens()
        console.log("❌ Token refresh failed, tokens deleted")
        return false
      }
      throw error
    }
  } catch (error) {
    console.error("Error refreshing tokens:", error)
    return false
  }
}
