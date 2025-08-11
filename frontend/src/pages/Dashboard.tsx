import type React from "react"
import { Link } from "react-router-dom"
import { MessageSquare, Calendar, Users, Clock } from 'lucide-react'
import { useQuery } from "@tanstack/react-query"
import { api } from "../api/client"

interface ScheduledMessage {
  id: string
  channel: string
  channelName: string
  message: string
  scheduledAt: string
  status: "pending" | "sent" | "cancelled" | "failed"
}

const Dashboard: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [channelsRes, scheduledRes] = await Promise.all([api.get("/channels"), api.get("/message/scheduled")])
      const pendingScheduledMessages = (scheduledRes.data as ScheduledMessage[]).filter((msg) => msg.status === "pending")
      return {
        channels: channelsRes.data.length,
        scheduled: pendingScheduledMessages.length,
      }
    },
  })

  const cards = [
    {
      title: "Compose Message",
      description: "Send messages now or schedule for later",
      icon: MessageSquare,
      link: "/compose",
      color: "bg-blue-500",
    },
    {
      title: "Scheduled Messages",
      description: "View and manage your scheduled messages",
      icon: Calendar,
      link: "/scheduled",
      color: "bg-green-500",
    },
  ]

  const statCards = [
    {
      title: "Available Channels",
      value: stats?.channels || 0,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Scheduled Messages",
      value: stats?.scheduled || 0,
      icon: Clock,
      color: "text-green-600",
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Manage your Slack messages and scheduling</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <stat.icon className={`h-12 w-12 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card, index) => (
          <Link
            key={index}
            to={card.link}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className={`p-3 rounded-lg ${card.color} text-white mr-4`}>
                <card.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">{card.title}</h3>
            </div>
            <p className="text-gray-600">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Dashboard
