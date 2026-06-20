import api from './api';

export const getAdminDashboard = async () => {
  const response = await api.get('/dashboard/admin');
  return response.data;
};

export const getEmployeeDashboard = async () => {
  const response = await api.get('/dashboard/employee');
  return response.data;
};