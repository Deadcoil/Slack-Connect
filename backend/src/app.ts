import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import authRoutes from "./routes/auth"
import messageRoutes from "./routes/message"
import channelRoutes from "./routes/channels"
import { initializeScheduler } from "./jobs/scheduler"
import { errorHandler } from "./utils/errorHandler"


dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

const allowedOrigins = [
  "http://localhost:3000", // for local dev
  "https://slack-connect-delta.vercel.app" // for deployed frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json())
app.use(express.urlencoded({ extended: true }))


app.use("/api/auth", authRoutes)
app.use("/api/message", messageRoutes)
app.use("/api/channels", channelRoutes)


app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() })
})


app.use(errorHandler)

initializeScheduler()

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`)
})

export default app
