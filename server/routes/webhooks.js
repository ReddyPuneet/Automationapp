const express = require('express');
const router = express.Router();
const { db } = require('../database');
const executor = require('../services/executor');

// Handle webhook triggers (GET and POST)
router.all('/:workflowId', async (req, res) => {
  try {
    const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.workflowId);
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    if (!workflow.active) {
      return res.status(400).json({ error: 'Workflow is not active' });
    }

    if (workflow.trigger_type !== 'webhook') {
      return res.status(400).json({ error: 'Workflow is not a webhook workflow' });
    }

    // Prepare webhook data
    const webhookData = {
      method: req.method,
      headers: req.headers,
      query: req.query,
      body: req.body,
      params: req.params,
      url: req.originalUrl
    };

    // Execute workflow
    const result = await executor.executeWorkflow(workflow, webhookData, 'webhook');

    // Return response based on workflow configuration
    const triggerConfig = workflow.trigger_config ? JSON.parse(workflow.trigger_config) : {};
    
    if (triggerConfig.respondImmediately) {
      res.json({ 
        success: true, 
        message: 'Workflow triggered',
        executionId: result.executionId 
      });
    } else {
      res.json({
        success: result.status === 'success',
        executionId: result.executionId,
        data: result.finalOutput
      });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
