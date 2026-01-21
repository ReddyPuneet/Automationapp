const axios = require('axios');

// HTTP node - make HTTP requests
module.exports = {
  type: 'http',
  name: 'HTTP Request',
  description: 'Make HTTP requests to external APIs',
  
  async execute(config, context, nodeResults) {
    const { method = 'GET', url, headers = {}, body, queryParams = {} } = config;

    if (!url) {
      throw new Error('URL is required for HTTP node');
    }

    // Replace variables in URL and body
    const processedUrl = replaceVariables(url, context, nodeResults);
    const processedHeaders = {};
    
    Object.keys(headers).forEach(key => {
      processedHeaders[key] = replaceVariables(headers[key], context, nodeResults);
    });

    let processedBody = body;
    if (typeof body === 'string') {
      processedBody = replaceVariables(body, context, nodeResults);
      try {
        processedBody = JSON.parse(processedBody);
      } catch (e) {
        // Keep as string if not valid JSON
      }
    } else if (typeof body === 'object') {
      processedBody = JSON.parse(replaceVariables(JSON.stringify(body), context, nodeResults));
    }

    const requestConfig = {
      method: method.toUpperCase(),
      url: processedUrl,
      headers: processedHeaders,
      params: queryParams
    };

    if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && processedBody) {
      requestConfig.data = processedBody;
    }

    try {
      const response = await axios(requestConfig);
      
      return {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      };
    } catch (error) {
      if (error.response) {
        return {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data,
          error: true
        };
      }
      throw error;
    }
  }
};

function replaceVariables(str, context, nodeResults) {
  if (typeof str !== 'string') return str;
  
  // Replace {{nodeId.path}} with actual values
  return str.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const parts = path.trim().split('.');
    let value = { ...context, ...nodeResults };
    
    for (const part of parts) {
      if (value && typeof value === 'object') {
        // Check if it's a node result
        if (value[part]?.output) {
          value = value[part].output;
        } else {
          value = value[part];
        }
      } else {
        return match; // Return original if path not found
      }
    }
    
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  });
}
