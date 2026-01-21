import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  ArrowLeft, Save, Play, Clock, Webhook, Globe, 
  Code, FileSpreadsheet, X, Settings
} from 'lucide-react';
import api from '../services/api';

// Node type configurations
const nodeTypes = {
  schedule: { 
    label: 'Schedule', 
    icon: Clock, 
    color: '#805ad5',
    description: 'Trigger on schedule'
  },
  webhook: { 
    label: 'Webhook', 
    icon: Webhook, 
    color: '#38a169',
    description: 'HTTP webhook trigger'
  },
  http: { 
    label: 'HTTP Request', 
    icon: Globe, 
    color: '#3182ce',
    description: 'Make HTTP requests'
  },
  code: { 
    label: 'Code', 
    icon: Code, 
    color: '#d69e2e',
    description: 'Execute custom code'
  },
  googleSheet: { 
    label: 'Google Sheets', 
    icon: FileSpreadsheet, 
    color: '#38a169',
    description: 'Read/Write sheets'
  },
};

// Custom Node Component
function CustomNode({ data, selected }) {
  const nodeConfig = nodeTypes[data.nodeType] || {};
  const Icon = nodeConfig.icon || Code;
  
  return (
    <div className={`custom-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="custom-node-header">
        <div 
          className="custom-node-icon" 
          style={{ backgroundColor: nodeConfig.color || '#718096' }}
        >
          <Icon size={16} />
        </div>
        <div>
          <div className="custom-node-title">{data.label}</div>
          <div className="custom-node-type">{nodeConfig.label}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

const customNodeTypes = {
  schedule: CustomNode,
  webhook: CustomNode,
  http: CustomNode,
  code: CustomNode,
  googleSheet: CustomNode,
};

function WorkflowEditor({ workflow, onSave, onBack }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(workflow.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow.edges || []);
  const [selectedNode, setSelectedNode] = useState(null);
  const [workflowName, setWorkflowName] = useState(workflow.name);
  const [triggerType, setTriggerType] = useState(workflow.trigger_type || 'manual');
  const [triggerConfig, setTriggerConfig] = useState(workflow.trigger_config || {});
  const [saving, setSaving] = useState(false);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleDragStart = (event, nodeType) => {
    event.dataTransfer.setData('nodeType', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      const nodeType = event.dataTransfer.getData('nodeType');
      
      if (!nodeType) return;

      const reactFlowBounds = event.target.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 75,
        y: event.clientY - reactFlowBounds.top - 25,
      };

      const newNode = {
        id: `${nodeType}-${Date.now()}`,
        type: nodeType,
        position,
        data: { 
          label: nodeTypes[nodeType].label,
          nodeType: nodeType,
          config: {}
        },
      };

      setNodes((nds) => nds.concat(newNode));
      
      // Auto-select trigger type if first node is a trigger
      if (nodes.length === 0 && (nodeType === 'schedule' || nodeType === 'webhook')) {
        setTriggerType(nodeType);
      }
    },
    [nodes.length, setNodes]
  );

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const updateNodeData = (nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      })
    );
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, ...newData } });
    }
  };

  const deleteSelectedNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        ...workflow,
        name: workflowName,
        nodes,
        edges,
        trigger_type: triggerType,
        trigger_config: triggerConfig,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExecute = async () => {
    try {
      await handleSave();
      await api.executeWorkflow(workflow.id);
      alert('Workflow executed! Check the Executions tab for results.');
    } catch (error) {
      console.error('Error executing workflow:', error);
      alert('Error executing workflow: ' + error.message);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-secondary" onClick={onBack}>
            <ArrowLeft size={18} />
            Back
          </button>
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              border: 'none',
              background: 'transparent',
              padding: '4px 8px',
              borderRadius: 4,
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-success" onClick={handleExecute}>
            <Play size={18} />
            Execute
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={18} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="workflow-editor">
        {/* Node Palette */}
        <div className="node-palette">
          <h3>Triggers</h3>
          {['schedule', 'webhook'].map((type) => {
            const config = nodeTypes[type];
            const Icon = config.icon;
            return (
              <div
                key={type}
                className="node-item"
                draggable
                onDragStart={(e) => handleDragStart(e, type)}
              >
                <div className={`node-icon ${type}`}>
                  <Icon size={18} />
                </div>
                <div className="node-item-info">
                  <h4>{config.label}</h4>
                  <p>{config.description}</p>
                </div>
              </div>
            );
          })}

          <h3 style={{ marginTop: 20 }}>Actions</h3>
          {['http', 'code', 'googleSheet'].map((type) => {
            const config = nodeTypes[type];
            const Icon = config.icon;
            return (
              <div
                key={type}
                className="node-item"
                draggable
                onDragStart={(e) => handleDragStart(e, type)}
              >
                <div className={`node-icon ${type}`}>
                  <Icon size={18} />
                </div>
                <div className="node-item-info">
                  <h4>{config.label}</h4>
                  <p>{config.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Canvas */}
        <div 
          className="canvas-area" 
          onDrop={handleDrop} 
          onDragOver={handleDragOver}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={customNodeTypes}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        {/* Node Config Panel */}
        {selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            onUpdate={updateNodeData}
            onDelete={deleteSelectedNode}
            onClose={() => setSelectedNode(null)}
            triggerConfig={triggerConfig}
            setTriggerConfig={setTriggerConfig}
          />
        )}
      </div>
    </div>
  );
}

// Node Configuration Panel Component
function NodeConfigPanel({ node, onUpdate, onDelete, onClose, triggerConfig, setTriggerConfig }) {
  const nodeType = node.data.nodeType;
  const config = node.data.config || {};

  const updateConfig = (key, value) => {
    const newConfig = { ...config, [key]: value };
    onUpdate(node.id, { config: newConfig });
  };

  return (
    <div className="node-panel">
      <h3>
        <span><Settings size={18} style={{ marginRight: 8 }} />{node.data.label}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <X size={18} />
        </button>
      </h3>

      <div className="form-group">
        <label>Node Name</label>
        <input
          type="text"
          value={node.data.label}
          onChange={(e) => onUpdate(node.id, { label: e.target.value })}
        />
      </div>

      {/* Schedule Node Config */}
      {nodeType === 'schedule' && (
        <div className="form-group">
          <label>Cron Expression</label>
          <input
            type="text"
            value={config.cronExpression || ''}
            onChange={(e) => {
              updateConfig('cronExpression', e.target.value);
              setTriggerConfig({ ...triggerConfig, cronExpression: e.target.value });
            }}
            placeholder="*/5 * * * * (every 5 min)"
          />
          <small style={{ color: '#718096', fontSize: '0.75rem' }}>
            Examples: * * * * * (every min), 0 * * * * (every hour)
          </small>
        </div>
      )}

      {/* Webhook Node Config */}
      {nodeType === 'webhook' && (
        <>
          <div className="form-group">
            <label>Webhook URL</label>
            <input
              type="text"
              value={`${window.location.origin}/webhook/${node.id}`}
              readOnly
              style={{ background: '#f7fafc' }}
            />
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={config.respondImmediately || false}
                onChange={(e) => {
                  updateConfig('respondImmediately', e.target.checked);
                  setTriggerConfig({ ...triggerConfig, respondImmediately: e.target.checked });
                }}
                style={{ marginRight: 8 }}
              />
              Respond immediately
            </label>
          </div>
        </>
      )}

      {/* HTTP Node Config */}
      {nodeType === 'http' && (
        <>
          <div className="form-group">
            <label>Method</label>
            <select
              value={config.method || 'GET'}
              onChange={(e) => updateConfig('method', e.target.value)}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div className="form-group">
            <label>URL</label>
            <input
              type="text"
              value={config.url || ''}
              onChange={(e) => updateConfig('url', e.target.value)}
              placeholder="https://api.example.com/data"
            />
          </div>
          <div className="form-group">
            <label>Headers (JSON)</label>
            <textarea
              value={config.headers || '{}'}
              onChange={(e) => updateConfig('headers', e.target.value)}
              placeholder='{"Authorization": "Bearer xxx"}'
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>Body (JSON)</label>
            <textarea
              value={config.body || ''}
              onChange={(e) => updateConfig('body', e.target.value)}
              placeholder='{"key": "value"}'
              rows={4}
            />
          </div>
        </>
      )}

      {/* Code Node Config */}
      {nodeType === 'code' && (
        <div className="form-group">
          <label>JavaScript Code</label>
          <textarea
            value={config.code || ''}
            onChange={(e) => updateConfig('code', e.target.value)}
            placeholder={`// Access input data via 'input'
// input.trigger - trigger data
// input.lastOutput - previous node output
// input.nodes - all node outputs

const data = input.lastOutput;
return { processed: true, data };`}
            rows={12}
            style={{ fontFamily: 'Monaco, Menlo, monospace' }}
          />
        </div>
      )}

      {/* Google Sheets Node Config */}
      {nodeType === 'googleSheet' && (
        <>
          <div className="form-group">
            <label>Operation</label>
            <select
              value={config.operation || 'read'}
              onChange={(e) => updateConfig('operation', e.target.value)}
            >
              <option value="read">Read</option>
              <option value="append">Append</option>
              <option value="update">Update</option>
              <option value="clear">Clear</option>
            </select>
          </div>
          <div className="form-group">
            <label>Spreadsheet ID</label>
            <input
              type="text"
              value={config.spreadsheetId || ''}
              onChange={(e) => updateConfig('spreadsheetId', e.target.value)}
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
            />
          </div>
          <div className="form-group">
            <label>Range</label>
            <input
              type="text"
              value={config.range || ''}
              onChange={(e) => updateConfig('range', e.target.value)}
              placeholder="Sheet1!A1:D10"
            />
          </div>
          {(config.operation === 'append' || config.operation === 'update') && (
            <div className="form-group">
              <label>Values (JSON)</label>
              <textarea
                value={config.values || ''}
                onChange={(e) => updateConfig('values', e.target.value)}
                placeholder='[["Name", "Email"], ["John", "john@example.com"]]'
                rows={4}
              />
            </div>
          )}
          <div className="form-group">
            <label>Credentials (JSON)</label>
            <textarea
              value={config.credentials || ''}
              onChange={(e) => updateConfig('credentials', e.target.value)}
              placeholder="Paste your Google service account JSON here (optional for mock data)"
              rows={4}
            />
          </div>
        </>
      )}

      <div style={{ marginTop: 20 }}>
        <button className="btn btn-danger" onClick={onDelete}>
          Delete Node
        </button>
      </div>
    </div>
  );
}

export default WorkflowEditor;
