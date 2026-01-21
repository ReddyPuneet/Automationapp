const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const workflowRoutes = require('./routes/workflows');
const executionRoutes = require('./routes/executions');
const webhookRoutes = require('./routes/webhooks');
const scheduler = require('./services/scheduler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// API Routes
app.use('/api/workflows', workflowRoutes);
app.use('/api/executions', executionRoutes);
app.use('/webhook', webhookRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Initialize database and start server
db.initialize();
scheduler.initializeScheduledWorkflows();

app.listen(PORT, () => {
  console.log(`🚀 Automation Server running on http://localhost:${PORT}`);
  console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook/:workflowId`);
});
