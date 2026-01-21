const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');
const nodes = require('./nodes');

class WorkflowExecutor {
  async executeWorkflow(workflow, triggerData = {}, triggerType = 'manual') {
    const executionId = uuidv4();
    const startedAt = new Date().toISOString();
    const nodeResults = {};
    let status = 'running';
    let error = null;
    let finalOutput = null;

    // Parse workflow data
    const workflowNodes = workflow.nodes || [];
    const workflowEdges = workflow.edges || [];

    // Create execution record
    db.createExecution({
      id: executionId,
      workflow_id: workflow.id,
      workflow_name: workflow.name,
      status: 'running',
      started_at: startedAt,
      finished_at: null,
      trigger_type: triggerType,
      node_results: {},
      error: null
    });

    try {
      // Build execution order from edges
      const executionOrder = this.buildExecutionOrder(workflowNodes, workflowEdges);
      
      // Context that flows between nodes
      let context = {
        trigger: triggerData,
        execution: {
          id: executionId,
          workflowId: workflow.id,
          startedAt
        }
      };

      // Execute nodes in order
      for (const node of executionOrder) {
        console.log(`Executing node: ${node.data.label} (${node.type})`);
        
        try {
          const nodeExecutor = nodes[node.type];
          if (!nodeExecutor) {
            throw new Error(`Unknown node type: ${node.type}`);
          }

          // Merge node config for execution
          const nodeConfig = { ...node.data, ...node.data.config };
          const result = await nodeExecutor.execute(nodeConfig, context, nodeResults);
          
          nodeResults[node.id] = {
            nodeId: node.id,
            nodeType: node.type,
            nodeName: node.data.label,
            status: 'success',
            output: result,
            executedAt: new Date().toISOString()
          };

          // Add result to context for next nodes
          context[node.id] = result;
          context.lastOutput = result;
          finalOutput = result;

        } catch (nodeError) {
          nodeResults[node.id] = {
            nodeId: node.id,
            nodeType: node.type,
            nodeName: node.data.label,
            status: 'error',
            error: nodeError.message,
            executedAt: new Date().toISOString()
          };
          throw nodeError;
        }
      }

      status = 'success';
    } catch (err) {
      status = 'error';
      error = err.message;
      console.error('Workflow execution error:', err);
    }

    // Update execution record
    db.updateExecution(executionId, {
      status,
      finished_at: new Date().toISOString(),
      node_results: nodeResults,
      error
    });

    return {
      executionId,
      status,
      error,
      nodeResults,
      finalOutput
    };
  }

  buildExecutionOrder(nodes, edges) {
    // Build adjacency list
    const graph = new Map();
    const inDegree = new Map();
    
    nodes.forEach(node => {
      graph.set(node.id, []);
      inDegree.set(node.id, 0);
    });

    edges.forEach(edge => {
      if (graph.has(edge.source)) {
        graph.get(edge.source).push(edge.target);
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
      }
    });

    // Topological sort
    const queue = [];
    const order = [];

    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    while (queue.length > 0) {
      const nodeId = queue.shift();
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        order.push(node);
      }

      for (const neighbor of graph.get(nodeId) || []) {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }

    return order;
  }
}

module.exports = new WorkflowExecutor();
