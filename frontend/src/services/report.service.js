import api from './api';

export const getTaskReport = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await api.get(`/reports/tasks${params ? `?${params}` : ''}`);
  return response.data;
};

export const getPerformanceReport = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await api.get(`/reports/performance${params ? `?${params}` : ''}`);
  return response.data;
};