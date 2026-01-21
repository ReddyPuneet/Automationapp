// Code node - execute custom JavaScript code using Function constructor
module.exports = {
  type: 'code',
  name: 'Code',
  description: 'Execute custom JavaScript code',
  
  async execute(config, context, nodeResults) {
    const { code = '' } = config;

    if (!code.trim()) {
      return { result: null, message: 'No code provided' };
    }

    // Prepare input data for the code
    const inputData = {
      trigger: context.trigger,
      execution: context.execution,
      lastOutput: context.lastOutput,
      nodes: {}
    };

    // Add all previous node results
    Object.keys(nodeResults).forEach(nodeId => {
      inputData.nodes[nodeId] = nodeResults[nodeId]?.output;
    });

    try {
      // Create a safer execution context using Function constructor
      const safeGlobals = {
        JSON,
        Math,
        Date,
        Array,
        Object,
        String,
        Number,
        Boolean,
        RegExp,
        Error,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
        encodeURIComponent,
        decodeURIComponent,
        encodeURI,
        decodeURI,
        console: {
          log: (...args) => console.log('[Code Node]', ...args),
          error: (...args) => console.error('[Code Node]', ...args),
          warn: (...args) => console.warn('[Code Node]', ...args)
        }
      };

      // Create an async function that executes the user code
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      
      const wrappedCode = `
        const input = arguments[0];
        const { JSON, Math, Date, Array, Object, String, Number, Boolean, RegExp, Error, parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent, encodeURI, decodeURI, console } = arguments[1];
        
        ${code}
      `;

      const fn = new AsyncFunction(wrappedCode);
      const result = await fn(inputData, safeGlobals);
      
      return {
        result: result !== undefined ? result : null,
        executedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Code execution error: ${error.message}`);
    }
  }
};
