import api from './api';

export const getComments = async (taskId, page = 1, limit = 20) => {
  const response = await api.get(`/tasks/${taskId}/comments?page=${page}&limit=${limit}`);
  return response.data;
};

export const addComment = async (taskId, message) => {
  const response = await api.post(`/tasks/${taskId}/comments`, { message });
  return response.data;
};