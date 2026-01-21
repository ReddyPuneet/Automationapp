// Schedule node - trigger node for cron-based scheduling
module.exports = {
  type: 'schedule',
  name: 'Schedule',
  description: 'Trigger workflow on a schedule',
  
  async execute(config, context) {
    // Schedule node just passes through trigger data
    return {
      triggered: true,
      scheduledAt: context.trigger?.scheduledAt || new Date().toISOString(),
      cronExpression: config.cronExpression || '* * * * *'
    };
  }
};
