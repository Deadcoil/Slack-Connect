"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Slack, CheckCircle } from "lucide-react"
import toast from "react-hot-toast"
import { api } from "../api/client"

const ConnectSlack: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      const response = await api.get("/auth/status")
      setIsConnected(response.data.connected)
      if (response.data.connected) {
        setTimeout(() => navigate("/dashboard"), 2000)
      }
    } catch (error) {
      setIsConnected(false)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    try {
      const response = await api.get("/auth/slack")
      window.location.href = response.data.url
    } catch (error) {
      toast.error("Failed to initiate Slack connection")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        {isConnected ? (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Connected to Slack!</h1>
            <p className="text-gray-600 mb-6">
              Your Slack workspace is successfully connected. Redirecting to dashboard...
            </p>
          </>
        ) : (
          <>
            <Slack className="h-16 w-16 text-purple-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Connect to Slack</h1>
            <p className="text-gray-600 mb-6">Connect your Slack workspace to start sending and scheduling messages.</p>
            <button
              onClick={handleConnect}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 transition-colors font-medium"
            >
              Connect with Slack
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default ConnectSlack
