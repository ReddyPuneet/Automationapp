const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const dbPath = path.join(dataDir, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Simple JSON-based database
class Database {
  constructor() {
    this.data = {
      workflows: [],
      executions: [],
      google_credentials: []
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(dbPath)) {
        const content = fs.readFileSync(dbPath, 'utf8');
        this.data = JSON.parse(content);
      }
    } catch (error) {
      console.error('Error loading database:', error);
    }
  }

  save() {
    try {
      fs.writeFileSync(dbPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Error saving database:', error);
    }
  }

  // Workflows
  getAllWorkflows() {
    return this.data.workflows.sort((a, b) => 
      new Date(b.updated_at) - new Date(a.updated_at)
    );
  }

  getWorkflow(id) {
    return this.data.workflows.find(w => w.id === id);
  }

  createWorkflow(workflow) {
    const now = new Date().toISOString();
    const newWorkflow = {
      ...workflow,
      created_at: now,
      updated_at: now,
      active: false
    };
    this.data.workflows.push(newWorkflow);
    this.save();
    return newWorkflow;
  }

  updateWorkflow(id, updates) {
    const index = this.data.workflows.findIndex(w => w.id === id);
    if (index === -1) return null;
    
    this.data.workflows[index] = {
      ...this.data.workflows[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.save();
    return this.data.workflows[index];
  }

  deleteWorkflow(id) {
    this.data.workflows = this.data.workflows.filter(w => w.id !== id);
    this.data.executions = this.data.executions.filter(e => e.workflow_id !== id);
    this.save();
  }

  getActiveScheduledWorkflows() {
    return this.data.workflows.filter(w => w.active && w.trigger_type === 'schedule');
  }

  // Executions
  getAllExecutions(limit = 100) {
    return this.data.executions
      .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))
      .slice(0, limit);
  }

  getWorkflowExecutions(workflowId, limit = 50) {
    return this.data.executions
      .filter(e => e.workflow_id === workflowId)
      .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))
      .slice(0, limit);
  }

  getExecution(id) {
    return this.data.executions.find(e => e.id === id);
  }

  createExecution(execution) {
    this.data.executions.push(execution);
    this.save();
    return execution;
  }

  updateExecution(id, updates) {
    const index = this.data.executions.findIndex(e => e.id === id);
    if (index === -1) return null;
    
    this.data.executions[index] = {
      ...this.data.executions[index],
      ...updates
    };
    this.save();
    return this.data.executions[index];
  }

  deleteExecution(id) {
    this.data.executions = this.data.executions.filter(e => e.id !== id);
    this.save();
  }

  deleteWorkflowExecutions(workflowId) {
    this.data.executions = this.data.executions.filter(e => e.workflow_id !== workflowId);
    this.save();
  }
}

const db = new Database();

function initialize() {
  console.log('✅ Database initialized (JSON-based)');
}

module.exports = {
  db,
  initialize
};
