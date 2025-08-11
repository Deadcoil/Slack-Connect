import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "react-hot-toast"
import ConnectSlack from "./pages/ConnectSlack"
import Dashboard from "./pages/Dashboard"
import MessageComposer from "./pages/MessageComposer"
import ScheduledMessages from "./pages/ScheduledMessages"
import Navbar from "./components/Navbar"

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<ConnectSlack />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/compose" element={<MessageComposer />} />
              <Route path="/scheduled" element={<ScheduledMessages />} />
            </Routes>
          </main>
          <Toaster position="top-right" />
        </div>
      </Router>
    </QueryClientProvider>
  )
}

export default App
