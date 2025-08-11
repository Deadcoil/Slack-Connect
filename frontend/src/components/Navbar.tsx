import type React from "react"
import { Link, useLocation } from "react-router-dom"
import { MessageSquare, Calendar, Home, Slack } from "lucide-react"

const Navbar: React.FC = () => {
  const location = useLocation()

  const navItems = [
    { path: "/", label: "Connect", icon: Slack },
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/compose", label: "Compose", icon: MessageSquare },
    { path: "/scheduled", label: "Scheduled", icon: Calendar },
  ]

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Slack className="h-8 w-8 text-purple-600" />
            <span className="text-xl font-bold text-gray-900">Slack Connect</span>
          </div>

          <div className="flex space-x-4">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === path
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
