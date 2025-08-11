# Slack Connect - Message Scheduling Application

A full-stack TypeScript application that allows users to connect their Slack workspace and send messages immediately or schedule them for later delivery.

## 🚀 Features

- **Slack OAuth Integration**: Secure connection to Slack workspaces
- **Immediate Messaging**: Send messages to Slack channels instantly
- **Message Scheduling**: Schedule messages for future delivery
- **Persistent Storage**: JSON-based storage for tokens and scheduled messages
- **Background Jobs**: Reliable message scheduling that survives server restarts
- **Channel Management**: Browse and select from available Slack channels
- **Message Management**: View, list, and cancel scheduled messages

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Query** for state management and API calls
- **React Hot Toast** for notifications
- **Lucide React** for icons

### Backend
- **Node.js** with Express.js and TypeScript
- **Slack Web API** for Slack integration
- **node-cron** for message scheduling
- **JSON file storage** with custom storage layer
- **CORS** enabled for frontend communication

## 📋 Detailed Setup Instructions

To get this project up and running on your local machine, follow these steps:

### 1. Clone the Repository

First, clone the project repository to your local machine:

\`\`\`bash
git clone https://github.com/your-username/slack-connect.git
cd slack-connect
\`\`\`

### 2. Slack App Configuration

Before running the application, you need to create and configure a Slack app:

1.  Go to [Slack API](https://api.slack.com/apps) and click "Create New App".
2.  Choose "From scratch" and select your Slack workspace.
3.  **OAuth & Permissions**:
    *   Under "Scopes" -> "Bot Token Scopes", add the following permissions:
        *   \`channels:read\`
        *   \`chat:write\`
        *   \`groups:read\`
        *   \`im:read\`
        *   \`mpim:read\`
    *   Under "Redirect URLs", add: \`http://localhost:3001/api/auth/slack/callback\`
4.  **Basic Information**:
    *   Navigate to "Basic Information" in the sidebar.
    *   Note down your **App ID**, **Client ID**, and **Client Secret**. You will need these for your backend environment variables.
5.  **Install App**:
    *   Go to "Install App" in the sidebar and click "Install to Workspace". This will generate a Bot User OAuth Token.

### 3. Backend Setup

Navigate to the `backend` directory:

\`\`\`bash
cd backend
npm install
\`\`\`

Create a \`.env\` file in the `backend` directory and populate it with your Slack app credentials and other configurations:

\`\`\`env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

SLACK_CLIENT_ID=your_slack_client_id_here
SLACK_CLIENT_SECRET=your_slack_client_secret_here
SLACK_REDIRECT_URI=http://localhost:3001/api/auth/slack/callback
\`\`\`

Replace `your_slack_client_id_here` and `your_slack_client_secret_here` with the values you obtained from your Slack app.

Build and start the backend server:

\`\`\`bash
npm run build
npm start

# Or for development with hot reload:
npm run dev
\`\`\`

The backend server will run on `http://localhost:3001`.

## 🌐 Development with HTTPS (ngrok Tunneling)

Slack requires HTTPS URLs for OAuth and event subscriptions — it will reject `http://localhost`.
During development, we use [ngrok](https://ngrok.com/download) to create a secure tunnel to your local backend.

### Why ngrok?

*   Slack does not accept `http://localhost` for redirect URLs or event subscriptions.
*   ngrok creates a public HTTPS URL that tunnels traffic to your local backend.
*   Lets you test Slack OAuth and message sending without deploying.

### 🛠 ngrok Setup

1.  **Install ngrok**
    *   [Download here](https://ngrok.com/download) or install via npm:

    \`\`\`bash
    npm install -g ngrok
    \`\`\`

2.  **Sign up & Authenticate**
    *   Create a free ngrok account
    *   Get your auth token from your ngrok dashboard
    *   Authenticate:

    \`\`\`bash
    ngrok config add-authtoken YOUR_AUTH_TOKEN
    \`\`\`

3.  **Start Backend**

    \`\`\`bash
    cd backend
    npm run dev
    \`\`\`

4.  **Run ngrok Tunnel**

    \`\`\`bash
    ngrok http 3001
    \`\`\`

    You'll get a forwarding URL like:

    \`\`\`
    Forwarding https://abc123.ngrok-free.app -> http://localhost:3001
    \`\`\`

5.  **Update Slack App Redirect URL**
    *   Go to Slack App Settings → OAuth & Permissions
    *   Replace:

    \`\`\`bash
    http://localhost:3001/api/auth/slack/callback
    \`\`\`

    with:

    \`\`\`bash
    https://abc123.ngrok-free.app/api/auth/slack/callback
    \`\`\`

    (Replace `abc123.ngrok-free.app` with your actual ngrok URL)
    *   Save.

6.  **Update .env in Backend**

    Update your `backend/.env` file:

    \`\`\`env
    SLACK_REDIRECT_URI=https://abc123.ngrok-free.app/api/auth/slack/callback
    FRONTEND_URL=http://localhost:3000
    \`\`\`

    (Replace `abc123.ngrok-free.app` with your actual ngrok URL)

7.  **Reconnect Slack**
    *   Run your frontend
    *   Click "Connect to Slack" → works with ngrok tunnel.

    **Note**: ngrok free version gives a new URL every restart. Paid plans offer static URLs.

### 4. Frontend Setup

Open a new terminal, navigate to the `frontend` directory:

\`\`\`bash
cd frontend
npm install
\`\`\`

Create a \`.env\` file in the `frontend` directory (optional, but recommended for clarity):

\`\`\`env
REACT_APP_API_URL=http://localhost:3001/api
\`\`\`

Start the frontend development server:

\`\`\`bash
npm start
\`\`\`

The frontend application will be available at \`http://localhost:3000\`.

## 🏛 Architectural Overview

The Slack Connect application follows a client-server architecture, with a React frontend and a Node.js/Express backend.

### OAuth Flow
The application uses Slack's OAuth 2.0 flow for user authentication and authorization.
1.  **Initiation**: When a user clicks "Connect to Slack" on the frontend, the frontend makes a request to the backend's `/api/auth/slack` endpoint.
2.  **Authorization URL Generation**: The backend generates a unique `state` parameter (to prevent CSRF attacks) and constructs the Slack OAuth authorization URL using the `SLACK_CLIENT_ID`, required `scopes`, the generated `state`, and the `SLACK_REDIRECT_URI`. This URL is then returned to the frontend.
3.  **Redirection**: The frontend redirects the user's browser to the Slack authorization URL.
4.  **User Consent**: The user grants permission to the Slack app within their Slack workspace.
5.  **Callback**: Slack redirects the user back to the `SLACK_REDIRECT_URI` (backend's `/api/auth/slack/callback` endpoint) with an authorization `code` and the `state` parameter.
6.  **Token Exchange**: The backend verifies the `state` parameter against the stored one. If valid, it uses the `code` and `SLACK_CLIENT_SECRET` to exchange them for an `access_token` (and potentially a `refresh_token`) with Slack's OAuth API.
7.  **Token Storage**: The obtained `access_token` and other relevant team/user information are securely saved to a local JSON file (`data/tokens.json`). This token is crucial for making subsequent API calls to Slack on behalf of the connected workspace.
8.  **Redirection to Dashboard**: Finally, the backend redirects the user back to the frontend dashboard, indicating a successful connection.

### Token Management
The application manages Slack access tokens to ensure continuous access to the Slack API:
*   **Persistence**: Access tokens are stored in a local JSON file (`data/tokens.json`). This allows the application to retain the connection even after the backend server restarts.
*   **Refresh (if applicable)**: While Slack's bot tokens generally do not expire, the `refreshTokensIfNeeded` function is implemented as a safeguard. It attempts to test the validity of the current token by making a lightweight Slack API call (`auth.test`). If the token is invalid (e.g., due to revocation), and a `refreshToken` is available, it attempts to use the `refreshToken` to obtain a new `accessToken`. If refresh fails, the invalid tokens are deleted, prompting the user to reconnect. This ensures that API calls always use a valid token.

### Scheduled Task Handling
Message scheduling is handled using `node-cron` for robust background job management:
*   **Scheduling**: When a user schedules a message, the backend saves the message details (including `scheduledAt` timestamp) to `data/messages.json`. It then uses `node-cron` to create a one-time scheduled task. The cron expression is dynamically generated from the `scheduledAt` date.
*   **Persistence & Recovery**: The `initializeScheduler` function runs on application startup. It reads all `pending` messages from `data/messages.json` that are scheduled for a future time and re-schedules them using `node-cron`. This ensures that scheduled messages are not lost if the server restarts. Messages whose scheduled time has already passed are marked as `failed`.
*   **Execution**: At the exact scheduled time, the `node-cron` task triggers the `sendScheduledMessage` function. This function retrieves the latest Slack access token (refreshing it if necessary) and uses the Slack Web API (`chat.postMessage`) to send the message to the specified channel.
*   **Status Updates**: After attempting to send, the message's status in `data/messages.json` is updated to `sent` or `failed`, along with any error details.
*   **Cancellation**: Users can cancel pending scheduled messages. This involves destroying the corresponding `node-cron` task and updating the message's status to `cancelled` in storage.

## 🚧 Challenges & Learnings

Developing this application presented a few key challenges and valuable learnings:

1.  **Understanding Slack OAuth Scopes**: Initially, I struggled with identifying the exact Slack OAuth scopes required for the application's functionality (reading channels, sending messages). It was a learning curve to understand that `chat:write` is needed for sending messages, and various `*:read` scopes are necessary for listing different types of conversations (public, private, DMs). The key learning was to consult the Slack API documentation thoroughly for each API method's required permissions.

2.  **Robust Token Management**: While Slack's bot tokens are generally long-lived, ensuring the application could gracefully handle token invalidation (e.g., if a user revokes access) was important. Implementing `refreshTokensIfNeeded` and integrating it into every API call was crucial. The challenge was to make this process seamless without impacting user experience or introducing significant latency. The learning was to always anticipate token expiry or invalidation in third-party API integrations and build a resilient refresh mechanism.

3.  **Persistent Scheduling with `node-cron`**: The primary challenge with scheduling was ensuring messages would still be sent even if the backend server went down and restarted. `node-cron` itself doesn't inherently persist jobs across restarts. The solution involved:
    *   **Storing Scheduled Messages**: Persisting all scheduled message details in `data/messages.json`.
    *   **Re-scheduling on Startup**: Implementing an `initializeScheduler` function that reads all `pending` messages from storage on server startup and re-creates their `node-cron` tasks.
    *   **Handling Past Schedules**: A critical detail was to check if the `scheduledAt` time had already passed during re-initialization. If so, the message should be marked as `failed` rather than attempting to schedule it for a past time. This prevented a backlog of "stuck" messages.
    This taught me the importance of combining a persistent storage layer with a job scheduler for true reliability in background task management.

4.  **Frontend-Backend Communication and CORS**: Setting up the `axios` client in the frontend and configuring CORS in the Express backend was a common hurdle. Ensuring `REACT_APP_API_URL` in the frontend matched the backend's `FRONTEND_URL` in the CORS configuration was key to avoiding cross-origin errors. This reinforced the importance of careful environment variable management and understanding HTTP headers.

## 🚀 Deployment

### Backend Deployment (Render/Heroku)

1.  **Environment Variables**: Set all environment variables from \`.env.example\`
2.  **Build Command**: \`npm run build\`
3.  **Start Command**: \`npm start\`
4.  **Update Slack Redirect URI**: Change to your production backend URL

### Frontend Deployment (Vercel/Netlify)

1.  **Build Command**: \`npm run build\`
2.  **Build Directory**: \`build\`
3.  **Environment Variables**: Set \`REACT_APP_API_URL\` to your backend URL

## 📁 Project Structure

\`\`\`
slack-connect/
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── api/            # API client configuration
│   │   └── hooks/          # Custom React hooks
│   ├── public/
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── routes/         # Express routes
│   │   ├── services/       # Business logic
│   │   ├── storage/        # JSON file handling
│   │   ├── jobs/           # Background job scheduling
│   │   └── utils/          # Utility functions
│   ├── data/               # JSON storage files (auto-created)
│   └── package.json
└── README.md
\`\`\`

## 🔐 Security Features

-   **OAuth 2.0**: Secure Slack authentication
-   **Input Sanitization**: All user inputs are sanitized
-   **Token Security**: Tokens never exposed to frontend
-   **CORS Protection**: Configured for specific origins
-   **Error Handling**: Graceful error handling throughout

## 🔄 How Scheduling Works

1.  **Message Creation**: User creates a scheduled message via the frontend
2.  **Storage**: Message details saved to \`messages.json\`
3.  **Job Scheduling**: \`node-cron\` creates a scheduled job
4.  **Persistence**: On server restart, pending messages are reloaded and rescheduled
5.  **Execution**: At scheduled time, message is sent via Slack API
6.  **Status Update**: Message status updated to 'sent' or 'failed'

## 🔧 OAuth & Token Refresh

The application implements Slack OAuth 2.0 flow:

1.  **Authorization**: User clicks "Connect to Slack"
2.  **Redirect**: User redirected to Slack for authorization
3.  **Callback**: Slack redirects back with authorization code
4.  **Token Exchange**: Backend exchanges code for access token
5.  **Storage**: Tokens stored securely in \`tokens.json\`
6.  **Refresh**: Automatic token validation and refresh when needed

## 🐛 Troubleshooting

### Common Issues

1.  **"Not connected to Slack"**
    *   Ensure Slack app is properly configured
    *   Check if tokens.json exists and contains valid tokens
    *   Verify OAuth redirect URI matches exactly

2.  **"Channel not found"**
    *   Ensure the bot is added to the channel
    *   Check if channel still exists
    *   Verify bot has necessary permissions

3.  **Scheduled messages not sending**
    *   Check server logs for errors
    *   Ensure server time is correct
    *   Verify tokens are still valid

4.  **CORS errors**
    *   Check FRONTEND_URL environment variable
    *   Ensure frontend and backend URLs match

### Debug Mode

Set \`NODE_ENV=development\` for detailed error messages and stack traces.

## 📝 API Endpoints

### Authentication
-   \`GET /api/auth/slack\` - Initiate OAuth flow
-   \`GET /api/auth/slack/callback\` - Handle OAuth callback
-   \`GET /api/auth/status\` - Check connection status

### Channels
-   \`GET /api/channels\` - Get available Slack channels

### Messages
-   \`POST /api/message/send\` - Send immediate message
-   \`POST /api/message/schedule\` - Schedule message
-   \`GET /api/message/scheduled\` - Get scheduled messages
-   \`DELETE /api/message/scheduled/:id\` - Cancel scheduled message

## 🎯 Future Enhancements

-   [ ] User authentication and multi-user support
-   [ ] Message templates
-   [ ] Recurring message scheduling
-   [ ] Message analytics and delivery reports
-   [ ] Slack slash command integration
-   [ ] Database migration from JSON files
-   [ ] Message editing before sending
-   [ ] Timezone support for scheduling

## 🤝 Contributing

1.  Fork the repository
2.  Create a feature branch
3.  Make your changes
4.  Add tests if applicable
5.  Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1.  Check the troubleshooting section
2.  Review server logs for errors
3.  Ensure all environment variables are set correctly
4.  Verify Slack app configuration matches the setup instructions

For additional help, please open an issue in the repository.
