const cron = require('node-cron');
const { db } = require('../database');

class Scheduler {
  constructor() {
    this.jobs = new Map();
  }

  initializeScheduledWorkflows() {
    try {
      const workflows = db.getActiveScheduledWorkflows();

      workflows.forEach(workflow => {
        this.scheduleWorkflow(workflow);
      });

      console.log(`📅 Initialized ${workflows.length} scheduled workflows`);
    } catch (error) {
      console.error('Error initializing scheduled workflows:', error);
    }
  }

  scheduleWorkflow(workflow) {
    const workflowData = typeof workflow === 'object' ? workflow : db.getWorkflow(workflow);
    
    if (!workflowData) return;

    // Unschedule existing job if any
    this.unscheduleWorkflow(workflowData.id);

    const triggerConfig = workflowData.trigger_config || {};

    if (!triggerConfig.cronExpression) {
      console.warn(`No cron expression for workflow ${workflowData.id}`);
      return;
    }

    const cronExpression = triggerConfig.cronExpression;

    if (!cron.validate(cronExpression)) {
      console.error(`Invalid cron expression for workflow ${workflowData.id}: ${cronExpression}`);
      return;
    }

    const job = cron.schedule(cronExpression, async () => {
      console.log(`⏰ Executing scheduled workflow: ${workflowData.name}`);
      const executor = require('./executor');
      try {
        // Get fresh workflow data
        const freshWorkflow = db.getWorkflow(workflowData.id);
        if (freshWorkflow && freshWorkflow.active) {
          await executor.executeWorkflow(freshWorkflow, { scheduledAt: new Date().toISOString() }, 'schedule');
        }
      } catch (error) {
        console.error(`Error executing scheduled workflow ${workflowData.id}:`, error);
      }
    });

    this.jobs.set(workflowData.id, job);
    console.log(`📅 Scheduled workflow: ${workflowData.name} (${cronExpression})`);
  }

  unscheduleWorkflow(workflowId) {
    const job = this.jobs.get(workflowId);
    if (job) {
      job.stop();
      this.jobs.delete(workflowId);
      console.log(`🛑 Unscheduled workflow: ${workflowId}`);
    }
  }

  getScheduledJobs() {
    return Array.from(this.jobs.keys());
  }
}

module.exports = new Scheduler();
