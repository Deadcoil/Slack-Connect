import crypto from "crypto"


export function generateRandomString(length: number): string {
  return crypto.randomBytes(length).toString("hex").slice(0, length)
}


export function sanitizeInput(input: string): string {
  if (typeof input !== "string") {
    return ""
  }

  
  return input
    .trim()
    .replace(/[<>]/g, "") 
    .substring(0, 4000) 
}


export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}


export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  })
}


export function isFutureDate(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date
  return d > new Date()
}


export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
