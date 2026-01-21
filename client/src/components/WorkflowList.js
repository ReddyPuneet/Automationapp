import React from 'react';
import { 
  Play, Edit, Trash2, Clock, Webhook, Code, 
  FileSpreadsheet, Globe 
} from 'lucide-react';

const getTriggerIcon = (type) => {
  switch (type) {
    case 'schedule': return <Clock size={14} />;
    case 'webhook': return <Webhook size={14} />;
    default: return <Play size={14} />;
  }
};

function WorkflowList({ workflows, onEdit, onDelete, onToggle, onExecute }) {
  if (workflows.length === 0) {
    return (
      <div className="empty-state">
        <Code size={80} />
        <h3>No workflows yet</h3>
        <p>Create your first workflow to get started</p>
      </div>
    );
  }

  return (
    <div className="workflow-list">
      {workflows.map(workflow => (
        <div key={workflow.id} className="workflow-card">
          <div className="workflow-info">
            <h3>{workflow.name}</h3>
            <p>{workflow.description || 'No description'}</p>
            <div className="workflow-meta">
              <span>
                {getTriggerIcon(workflow.trigger_type)}
                {workflow.trigger_type || 'Manual'}
              </span>
              <span>
                <Clock size={14} />
                Updated {new Date(workflow.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="workflow-actions">
            <span className={`status-badge ${workflow.active ? 'active' : 'inactive'}`}>
              {workflow.active ? 'Active' : 'Inactive'}
            </span>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={workflow.active}
                onChange={() => onToggle(workflow)}
              />
              <span className="toggle-slider"></span>
            </label>
            <button 
              className="btn btn-sm btn-success" 
              onClick={() => onExecute(workflow)}
              title="Execute workflow"
            >
              <Play size={16} />
            </button>
            <button 
              className="btn btn-sm btn-secondary" 
              onClick={() => onEdit(workflow)}
              title="Edit workflow"
            >
              <Edit size={16} />
            </button>
            <button 
              className="btn btn-sm btn-danger" 
              onClick={() => onDelete(workflow.id)}
              title="Delete workflow"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default WorkflowList;
