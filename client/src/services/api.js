import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = {
  // Workflows
  getWorkflows: () => axios.get(`${API_URL}/workflows`),
  getWorkflow: (id) => axios.get(`${API_URL}/workflows/${id}`),
  createWorkflow: (data) => axios.post(`${API_URL}/workflows`, data),
  updateWorkflow: (id, data) => axios.put(`${API_URL}/workflows/${id}`, data),
  deleteWorkflow: (id) => axios.delete(`${API_URL}/workflows/${id}`),
  executeWorkflow: (id, data = {}) => axios.post(`${API_URL}/workflows/${id}/execute`, data),

  // Executions
  getExecutions: (limit = 100) => axios.get(`${API_URL}/executions?limit=${limit}`),
  getExecution: (id) => axios.get(`${API_URL}/executions/${id}`),
  getWorkflowExecutions: (workflowId, limit = 50) => 
    axios.get(`${API_URL}/executions/workflow/${workflowId}?limit=${limit}`),
  deleteExecution: (id) => axios.delete(`${API_URL}/executions/${id}`),
};

export default api;
