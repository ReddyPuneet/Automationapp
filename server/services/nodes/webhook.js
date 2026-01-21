// Webhook node - trigger node for HTTP webhooks
module.exports = {
  type: 'webhook',
  name: 'Webhook',
  description: 'Trigger workflow via HTTP webhook',
  
  async execute(config, context) {
    // Webhook node passes through the incoming request data
    const trigger = context.trigger || {};
    
    return {
      triggered: true,
      method: trigger.method || 'GET',
      headers: trigger.headers || {},
      query: trigger.query || {},
      body: trigger.body || {},
      url: trigger.url || '',
      receivedAt: new Date().toISOString()
    };
  }
};
