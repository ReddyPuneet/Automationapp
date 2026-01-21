const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');
const scheduler = require('../services/scheduler');

// Get all workflows
router.get('/', (req, res) => {
  try {
    const workflows = db.getAllWorkflows();
    res.json(workflows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single workflow
router.get('/:id', (req, res) => {
  try {
    const workflow = db.getWorkflow(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json(workflow);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create workflow
router.post('/', (req, res) => {
  try {
    const { name, description, nodes, edges, trigger_type, trigger_config } = req.body;
    
    const workflow = db.createWorkflow({
      id: uuidv4(),
      name: name || 'Untitled Workflow',
      description: description || '',
      nodes: nodes || [],
      edges: edges || [],
      trigger_type: trigger_type || null,
      trigger_config: trigger_config || null
    });

    res.status(201).json(workflow);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update workflow
router.put('/:id', (req, res) => {
  try {
    const existing = db.getWorkflow(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const updates = {};
    const { name, description, nodes, edges, active, trigger_type, trigger_config } = req.body;
    
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (nodes !== undefined) updates.nodes = nodes;
    if (edges !== undefined) updates.edges = edges;
    if (active !== undefined) updates.active = active;
    if (trigger_type !== undefined) updates.trigger_type = trigger_type;
    if (trigger_config !== undefined) updates.trigger_config = trigger_config;

    const workflow = db.updateWorkflow(req.params.id, updates);

    // Update scheduler if workflow is activated/deactivated
    if (workflow.trigger_type === 'schedule') {
      if (workflow.active) {
        scheduler.scheduleWorkflow(workflow);
      } else {
        scheduler.unscheduleWorkflow(req.params.id);
      }
    }

    res.json(workflow);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete workflow
router.delete('/:id', (req, res) => {
  try {
    scheduler.unscheduleWorkflow(req.params.id);
    db.deleteWorkflow(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute workflow manually
router.post('/:id/execute', async (req, res) => {
  try {
    const workflow = db.getWorkflow(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const executor = require('../services/executor');
    const result = await executor.executeWorkflow(workflow, req.body || {}, 'manual');
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
