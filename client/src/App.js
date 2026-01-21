import React, { useState, useEffect } from 'react';
import { Zap, Layers, Clock, Play, Plus, Settings } from 'lucide-react';
import WorkflowList from './components/WorkflowList';
import WorkflowEditor from './components/WorkflowEditor';
import ExecutionList from './components/ExecutionList';
import api from './services/api';

function App() {
  const [view, setView] = useState('workflows');
  const [workflows, setWorkflows] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [workflowsRes, executionsRes] = await Promise.all([
        api.getWorkflows(),
        api.getExecutions()
      ]);
      setWorkflows(workflowsRes.data);
      setExecutions(executionsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = async () => {
    try {
      const response = await api.createWorkflow({
        name: 'New Workflow',
        nodes: [],
        edges: []
      });
      setSelectedWorkflow(response.data);
      setView('editor');
    } catch (error) {
      console.error('Error creating workflow:', error);
    }
  };

  const handleEditWorkflow = (workflow) => {
    setSelectedWorkflow(workflow);
    setView('editor');
  };

  const handleSaveWorkflow = async (workflow) => {
    try {
      await api.updateWorkflow(workflow.id, workflow);
      loadData();
    } catch (error) {
      console.error('Error saving workflow:', error);
    }
  };

  const handleDeleteWorkflow = async (id) => {
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      try {
        await api.deleteWorkflow(id);
        loadData();
      } catch (error) {
        console.error('Error deleting workflow:', error);
      }
    }
  };

  const handleToggleWorkflow = async (workflow) => {
    try {
      await api.updateWorkflow(workflow.id, { active: !workflow.active });
      loadData();
    } catch (error) {
      console.error('Error toggling workflow:', error);
    }
  };

  const handleExecuteWorkflow = async (workflow) => {
    try {
      await api.executeWorkflow(workflow.id);
      loadData();
    } catch (error) {
      console.error('Error executing workflow:', error);
    }
  };

  const handleBackToList = () => {
    setSelectedWorkflow(null);
    setView('workflows');
    loadData();
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h1><Zap size={24} /> AutoFlow</h1>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${view === 'workflows' ? 'active' : ''}`}
            onClick={() => { setView('workflows'); setSelectedWorkflow(null); }}
          >
            <Layers size={20} />
            Workflows
          </button>
          <button 
            className={`nav-item ${view === 'executions' ? 'active' : ''}`}
            onClick={() => setView('executions')}
          >
            <Clock size={20} />
            Executions
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {view === 'workflows' && !selectedWorkflow && (
          <>
            <div className="header">
              <h2>Workflows</h2>
              <button className="btn btn-primary" onClick={handleCreateWorkflow}>
                <Plus size={18} />
                New Workflow
              </button>
            </div>
            <div className="content">
              {loading ? (
                <div className="loading"><div className="spinner"></div></div>
              ) : (
                <WorkflowList 
                  workflows={workflows}
                  onEdit={handleEditWorkflow}
                  onDelete={handleDeleteWorkflow}
                  onToggle={handleToggleWorkflow}
                  onExecute={handleExecuteWorkflow}
                />
              )}
            </div>
          </>
        )}

        {view === 'editor' && selectedWorkflow && (
          <WorkflowEditor 
            workflow={selectedWorkflow}
            onSave={handleSaveWorkflow}
            onBack={handleBackToList}
          />
        )}

        {view === 'executions' && (
          <>
            <div className="header">
              <h2>Executions</h2>
              <button className="btn btn-secondary" onClick={loadData}>
                Refresh
              </button>
            </div>
            <div className="content">
              {loading ? (
                <div className="loading"><div className="spinner"></div></div>
              ) : (
                <ExecutionList executions={executions} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
