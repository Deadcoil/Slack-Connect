"use client"

import type React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Trash2, Calendar, MessageSquare } from "lucide-react"
import toast from "react-hot-toast"
import { api } from "../api/client"

interface ScheduledMessage {
  id: string
  channel: string
  channelName: string
  message: string
  scheduledAt: string
  status: "pending" | "sent" | "cancelled"
}

const ScheduledMessages: React.FC = () => {
  const queryClient = useQueryClient()

  const { data: messages, isLoading } = useQuery({
    queryKey: ["scheduled-messages"],
    queryFn: async () => {
      const response = await api.get("/message/scheduled")
      return response.data as ScheduledMessage[]
    },
  })

  const cancelMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await api.delete(`/message/scheduled/${messageId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-messages"] })
      toast.success("Message cancelled successfully")
    },
    onError: () => {
      toast.error("Failed to cancel message")
    },
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const truncateMessage = (message: string, maxLength = 100) => {
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  const pendingMessages = messages?.filter((msg) => msg.status === "pending") || []

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Scheduled Messages</h1>
        <p className="text-gray-600">View and manage your scheduled messages</p>
      </div>

      {pendingMessages.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Scheduled Messages</h3>
          <p className="text-gray-600">You don't have any messages scheduled yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Channel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheduled Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingMessages.map((message) => (
                  <tr key={message.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MessageSquare className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">#{message.channelName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">{truncateMessage(message.message)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{formatDate(message.scheduledAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {message.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => cancelMutation.mutate(message.id)}
                        disabled={cancelMutation.isPending}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Cancel</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default ScheduledMessages
