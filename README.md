# Automation App

A workflow automation tool similar to n8n with a visual editor.

## Features

- **Visual Workflow Editor** - Drag & drop interface to build workflows
- **5 Node Types**:
  - 📅 **Schedule** - Cron-based triggers
  - 🔗 **Webhook** - HTTP webhook triggers
  - 🌐 **HTTP Request** - Make API calls
  - 💻 **Code** - Execute custom JavaScript
  - 📊 **Google Sheets** - Read/write spreadsheet data
- **Execution History** - View all workflow runs with detailed results
- **Real-time Scheduling** - Workflows run automatically based on cron

## Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install
cd ..
```

### 2. Start the Application

```bash
# Start both server and client
npm run dev
```

Or run separately:

```bash
# Terminal 1 - Start server
npm run server

# Terminal 2 - Start client
cd client && npm start
```



## How to Use

### Creating a Workflow

1. Click **"New Workflow"** button
2. Drag nodes from the left palette onto the canvas
3. Connect nodes by dragging from output (bottom) to input (top)
4. Click on nodes to configure them
5. Click **Save** to save your workflow

### Node Types

#### Schedule Trigger

- Uses cron expressions (e.g., `* * * * *` for every minute)
- Workflow must be **Active** for scheduling to work

#### Webhook Trigger

- Provides a unique URL for external services to call
- Supports GET and POST requests

#### HTTP Request

- Make requests to external APIs
- Supports all HTTP methods
- Use `{{nodeId.data}}` syntax to reference previous node outputs

#### Code

- Execute custom JavaScript
- Access data via `input` object:
  - `input.trigger` - Trigger data
  - `input.lastOutput` - Previous node output
  - `input.nodes` - All node outputs

#### Google Sheets

- Read, append, update, or clear data
- Works in mock mode without credentials
- Add Google service account JSON for real operations

### Executing Workflows

- **Manual**: Click the Play button on a workflow
- **Schedule**: Activate the workflow and set a cron expression
- **Webhook**: Send a request to the webhook URL

### Viewing Executions

Click **"Executions"** in the sidebar to see:

- Workflow run history
- Status (success/error)
- Duration
- Detailed node-by-node results

## Project Structure

```
automation-app/
├── server/
│   ├── index.js           # Express server
│   ├── database.js        # SQLite database
│   ├── routes/
│   │   ├── workflows.js   # Workflow CRUD
│   │   ├── executions.js  # Execution history
│   │   └── webhooks.js    # Webhook handlers
│   └── services/
│       ├── executor.js    # Workflow execution
│       ├── scheduler.js   # Cron scheduling
│       └── nodes/         # Node implementations
├── client/
│   └── src/
│       ├── App.js
│       ├── components/
│       │   ├── WorkflowList.js
│       │   ├── WorkflowEditor.js
│       │   └── ExecutionList.js
│       └── services/
│           └── api.js
└── data/                  # SQLite database
```

## API Endpoints

### Workflows

- `GET /api/workflows` - List all workflows
- `POST /api/workflows` - Create workflow
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow
- `POST /api/workflows/:id/execute` - Execute workflow

### Executions

- `GET /api/executions` - List executions
- `GET /api/executions/:id` - Get execution details

### Webhooks

- `GET/POST /webhook/:workflowId` - Trigger webhook workflow

## Technologies

- **Backend**: Node.js, Express, SQLite (better-sqlite3)
- **Frontend**: React, React Flow
- **Scheduling**: node-cron
- **Code Execution**: vm2 (sandboxed)

## License

MIT
