const express = require('express');
const router = express.Router();
const { db } = require('../database');

// Get all executions
router.get('/', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const executions = db.getAllExecutions(limit);
    res.json(executions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get executions for a specific workflow
router.get('/workflow/:workflowId', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const executions = db.getWorkflowExecutions(req.params.workflowId, limit);
    res.json(executions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single execution
router.get('/:id', (req, res) => {
  try {
    const execution = db.getExecution(req.params.id);
    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }
    res.json(execution);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete execution
router.delete('/:id', (req, res) => {
  try {
    db.deleteExecution(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all executions for a workflow
router.delete('/workflow/:workflowId', (req, res) => {
  try {
    db.deleteWorkflowExecutions(req.params.workflowId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
