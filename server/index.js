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
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// API Routes
app.use('/api/workflows', workflowRoutes);
app.use('/api/executions', executionRoutes);
app.use('/webhook', webhookRoutes);

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
const clientBuildPath = path.join(__dirname, '../client/build');
app.use(express.static(clientBuildPath));

// Handle React routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Initialize database and start server
db.initialize();
scheduler.initializeScheduledWorkflows();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Automation Server running on port ${PORT}`);
  console.log(`📡 Webhook endpoint: /webhook/:workflowId`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
