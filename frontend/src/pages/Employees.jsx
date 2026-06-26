import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { FiEdit, FiTrash2, FiUserPlus, FiBarChart2 } from 'react-icons/fi';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showKPIModal, setShowKPIModal] = useState(false);
  const [employeeKPIs, setEmployeeKPIs] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees');
      console.log('📋 Employees response:', response.data);
      setEmployees(response.data.employees || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/employees/${id}`);
        fetchEmployees();
        alert('User deleted successfully');
      } catch (error) {
        alert(error.response?.data?.message || 'Error deleting user');
      }
    }
  };

  const viewEmployeeKPI = async (employee) => {
    setSelectedEmployee(employee);
    setShowKPIModal(true);
    
    try {
      const tasksRes = await api.get('/tasks');
      const allTasks = tasksRes.data.tasks || [];
      
      const employeeTasks = allTasks.filter(task => {
        const assignedToId = task.assignedTo?._id || task.assignedTo;
        return assignedToId === employee._id;
      });
      
      const totalTasks = employeeTasks.length;
      const completedTasks = employeeTasks.filter(t => t.status === 'completed').length;
      const inProgressTasks = employeeTasks.filter(t => t.status === 'in-progress').length;
      const overdueTasks = employeeTasks.filter(t => t.status === 'overdue').length;
      const newTasks = employeeTasks.filter(t => t.status === 'new').length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      const onTimeCompleted = employeeTasks.filter(t => {
        if (t.status === 'completed' && t.completionDate) {
          return new Date(t.completionDate) <= new Date(t.dueDate);
        }
        return false;
      }).length;
      const onTimeRate = completedTasks > 0 ? Math.round((onTimeCompleted / completedTasks) * 100) : 0;
      
      const totalProgress = employeeTasks.reduce((sum, task) => sum + (task.progress || 0), 0);
      const averageProgress = totalTasks > 0 ? Math.round(totalProgress / totalTasks) : 0;
      
      const productivityScore = Math.round((completionRate + onTimeRate) / 2);
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weeklyCompleted = employeeTasks.filter(t => {
        if (t.status === 'completed' && t.completionDate) {
          return new Date(t.completionDate) >= oneWeekAgo;
        }
        return false;
      }).length;
      
      const overdueRate = totalTasks > 0 ? Math.round((overdueTasks / totalTasks) * 100) : 0;
      
      let rank = '';
      let rankColor = '';
      if (completionRate >= 80) {
        rank = 'Excellent';
        rankColor = 'text-green-600 bg-green-100';
      } else if (completionRate >= 60) {
        rank = 'Good';
        rankColor = 'text-blue-600 bg-blue-100';
      } else if (completionRate >= 40) {
        rank = 'Average';
        rankColor = 'text-yellow-600 bg-yellow-100';
      } else {
        rank = 'Needs Improvement';
        rankColor = 'text-red-600 bg-red-100';
      }
      
      const recentTasks = employeeTasks.slice(0, 5);
      
      setEmployeeKPIs({
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        newTasks,
        completionRate,
        onTimeRate,
        averageProgress,
        productivityScore,
        weeklyCompleted,
        overdueRate,
        rank,
        rankColor,
        recentTasks
      });
    } catch (error) {
      console.error('Error fetching employee KPIs:', error);
    }
  };

  const closeKPIModal = () => {
    setShowKPIModal(false);
    setSelectedEmployee(null);
    setEmployeeKPIs(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <div className="flex gap-2">
          <span className="text-sm text-gray-500 flex items-center">
            Total: {employees.length} users
          </span>
          <button
            onClick={() => navigate('/employees/create')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FiUserPlus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr key={employee._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {employee.fullName}
                    {employee.role === 'admin' && (
                      <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        Admin
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.department || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {employee.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => viewEmployeeKPI(employee)}
                      className="text-green-600 hover:text-green-900 mr-2"
                      title="View KPI"
                    >
                      <FiBarChart2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/employees/edit/${employee._id}`)}
                      className="text-blue-600 hover:text-blue-900 mr-2"
                      title="Edit"
                    >
                      <FiEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(employee._id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* KPI Modal */}
      {showKPIModal && selectedEmployee && employeeKPIs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">User Performance KPI</h2>
                <p className="text-sm text-gray-500">{selectedEmployee.fullName} • {selectedEmployee.email}</p>
              </div>
              <button
                onClick={closeKPIModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              {/* Rank Banner */}
              <div className={`mb-6 p-4 rounded-lg ${employeeKPIs.rankColor} text-center`}>
                <span className="font-bold text-lg">Performance Rank: {employeeKPIs.rank}</span>
              </div>
              
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{employeeKPIs.totalTasks}</p>
                  <p className="text-xs text-gray-600">Total Tasks</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{employeeKPIs.completedTasks}</p>
                  <p className="text-xs text-gray-600">Completed</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{employeeKPIs.inProgressTasks}</p>
                  <p className="text-xs text-gray-600">In Progress</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{employeeKPIs.overdueTasks}</p>
                  <p className="text-xs text-gray-600">Overdue</p>
                </div>
              </div>
              
              {/* KPI Grid */}
              <h3 className="font-semibold text-gray-900 mb-3">Key Performance Indicators</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Completion Rate</p>
                  <p className="text-2xl font-bold text-green-600">{employeeKPIs.completionRate}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-green-600 rounded-full h-2" style={{ width: `${employeeKPIs.completionRate}%` }}></div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Productivity Score</p>
                  <p className="text-2xl font-bold text-purple-600">{employeeKPIs.productivityScore}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-purple-600 rounded-full h-2" style={{ width: `${employeeKPIs.productivityScore}%` }}></div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">On-Time Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{employeeKPIs.onTimeRate}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-blue-600 rounded-full h-2" style={{ width: `${employeeKPIs.onTimeRate}%` }}></div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Average Progress</p>
                  <p className="text-2xl font-bold text-orange-600">{employeeKPIs.averageProgress}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-orange-600 rounded-full h-2" style={{ width: `${employeeKPIs.averageProgress}%` }}></div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Weekly Completed</p>
                  <p className="text-2xl font-bold text-teal-600">{employeeKPIs.weeklyCompleted}</p>
                  <p className="text-xs text-gray-400">Last 7 days</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Overdue Rate</p>
                  <p className="text-2xl font-bold text-red-600">{employeeKPIs.overdueRate}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-red-600 rounded-full h-2" style={{ width: `${employeeKPIs.overdueRate}%` }}></div>
                  </div>
                </div>
              </div>
              
              {/* Recent Tasks */}
              {employeeKPIs.recentTasks.length > 0 && (
                <>
                  <h3 className="font-semibold text-gray-900 mb-3">Recent Tasks</h3>
                  <div className="space-y-2">
                    {employeeKPIs.recentTasks.map((task) => (
                      <div key={task._id} className="border rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-800">{task.title}</p>
                          <p className="text-xs text-gray-500">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end">
              <button
                onClick={closeKPIModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;