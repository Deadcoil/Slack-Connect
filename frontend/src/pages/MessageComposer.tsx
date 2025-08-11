"use client"

import type React from "react"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Send, Clock } from "lucide-react"
import toast from "react-hot-toast"
import { api } from "../api/client"

interface Channel {
  id: string
  name: string
}

const MessageComposer: React.FC = () => {
  const [selectedChannel, setSelectedChannel] = useState("")
  const [message, setMessage] = useState("")
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("")
  const [isScheduled, setIsScheduled] = useState(false)
  const [loading, setLoading] = useState(false)

  const { data: channels, isLoading: channelsLoading } = useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const response = await api.get("/channels")
      return response.data as Channel[]
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedChannel || !message.trim()) {
      toast.error("Please select a channel and enter a message")
      return
    }

    if (isScheduled && (!scheduleDate || !scheduleTime)) {
      toast.error("Please select date and time for scheduling")
      return
    }

    setLoading(true)

    try {
      if (isScheduled) {
        const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`)
        if (scheduledAt <= new Date()) {
          toast.error("Scheduled time must be in the future")
          return
        }

        await api.post("/message/schedule", {
          channel: selectedChannel,
          message: message.trim(),
          scheduledAt: scheduledAt.toISOString(),
        })
        toast.success("Message scheduled successfully!")
      } else {
        await api.post("/message/send", {
          channel: selectedChannel,
          message: message.trim(),
        })
        toast.success("Message sent successfully!")
      }

      setMessage("")
      setSelectedChannel("")
      setScheduleDate("")
      setScheduleTime("")
      setIsScheduled(false)
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to process message")
    } finally {
      setLoading(false)
    }
  }

  if (channelsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Compose Message</h1>

        <form onSubmit={handleSubmit} className="space-y-6">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Channel</label>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="">Choose a channel...</option>
              {channels?.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  #{channel.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter your message..."
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="schedule"
              checked={isScheduled}
              onChange={(e) => setIsScheduled(e.target.checked)}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="schedule" className="ml-2 text-sm text-gray-700">
              Schedule for later
            </label>
          </div>

          {isScheduled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                {isScheduled ? <Clock className="h-5 w-5" /> : <Send className="h-5 w-5" />}
                <span>{isScheduled ? "Schedule Message" : "Send Now"}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default MessageComposer
