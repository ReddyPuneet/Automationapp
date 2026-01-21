import React, { useState } from 'react';
import { 
  CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, 
  Loader, Zap
} from 'lucide-react';

function ExecutionList({ executions }) {
  const [expandedId, setExpandedId] = useState(null);

  if (executions.length === 0) {
    return (
      <div className="empty-state">
        <Clock size={80} />
        <h3>No executions yet</h3>
        <p>Execute a workflow to see results here</p>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <XCircle size={20} />;
      case 'running':
        return <Loader size={20} className="spinning" />;
      default:
        return <Clock size={20} />;
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const getDuration = (started, finished) => {
    if (!finished) return 'Running...';
    const start = new Date(started);
    const end = new Date(finished);
    const diff = end - start;
    if (diff < 1000) return `${diff}ms`;
    if (diff < 60000) return `${(diff / 1000).toFixed(1)}s`;
    return `${(diff / 60000).toFixed(1)}min`;
  };

  return (
    <div className="execution-list">
      {executions.map(execution => (
        <div key={execution.id} className="execution-item-wrapper">
          <div 
            className="execution-item"
            onClick={() => setExpandedId(expandedId === execution.id ? null : execution.id)}
          >
            <div className="execution-info">
              <h4>
                <Zap size={16} style={{ marginRight: 8, color: '#667eea' }} />
                {execution.workflow_name || 'Unknown Workflow'}
              </h4>
              <p>
                {formatDate(execution.started_at)} • 
                {getDuration(execution.started_at, execution.finished_at)} •
                Trigger: {execution.trigger_type || 'manual'}
              </p>
            </div>
            <div className="execution-status">
              <div className={`status-icon ${execution.status}`}>
                {getStatusIcon(execution.status)}
              </div>
              {expandedId === execution.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>
          
          {expandedId === execution.id && (
            <div className="execution-detail">
              {execution.error && (
                <div className="node-result" style={{ background: '#fed7d7' }}>
                  <div className="node-result-header">
                    <h4 style={{ color: '#c53030' }}>Error</h4>
                  </div>
                  <pre style={{ background: '#c53030' }}>{execution.error}</pre>
                </div>
              )}
              
              {execution.node_results && Object.keys(execution.node_results).length > 0 && (
                <>
                  <h4 style={{ marginBottom: 12, color: '#4a5568' }}>Node Results</h4>
                  {Object.entries(execution.node_results).map(([nodeId, result]) => (
                    <div key={nodeId} className="node-result">
                      <div className="node-result-header">
                        <h4>
                          {result.nodeName || nodeId}
                          <span style={{ 
                            marginLeft: 8, 
                            fontSize: '0.75rem', 
                            color: result.status === 'success' ? '#276749' : '#c53030'
                          }}>
                            ({result.status})
                          </span>
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: '#718096' }}>
                          {result.nodeType}
                        </span>
                      </div>
                      <pre>
                        {JSON.stringify(result.output || result.error, null, 2)}
                      </pre>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default ExecutionList;
