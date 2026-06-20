import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiX, FiTrash2, FiEdit, FiRefreshCw } from 'react-icons/fi';
import api from '../api';
import { useAuth } from '../hooks/useAuth';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTaskList, setShowTaskList] = useState(true);
  const [updatingProgress, setUpdatingProgress] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    dateFrom: '',
    dateTo: ''
  });
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tasks, searchTerm, filters.status, filters.priority, filters.dateFrom, filters.dateTo]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tasks');
      let allTasks = response.data.tasks || [];
      
      if (!isAdmin && user) {
        allTasks = allTasks.filter(task => 
          task.assignedTo?._id === user.id || 
          task.assignedTo?.email === user.email
        );
      }
      
      setTasks(allTasks);
      setFilteredTasks(allTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];
    
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status);
    }
    
    if (filters.priority) {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }
    
    if (filters.dateFrom) {
      filtered = filtered.filter(task => new Date(task.dueDate) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(task => new Date(task.dueDate) <= new Date(filters.dateTo));
    }
    
    setFilteredTasks(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: '', priority: '', dateFrom: '', dateTo: '' });
    setSearchTerm('');
    setFilteredTasks(tasks);
  };

  const handleProgressUpdate = async (taskId, newProgress) => {
    try {
      setUpdatingProgress(taskId);
      console.log(`📊 Updating task ${taskId} progress to ${newProgress}%`);
      
      const response = await api.patch(`/tasks/${taskId}/progress`, { progress: newProgress });
      console.log('✅ Progress updated:', response.data);
      
      await fetchTasks();
      
    } catch (error) {
      console.error('❌ Error updating progress:', error);
      alert('Failed to update progress');
    } finally {
      setUpdatingProgress(null);
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(task => task._id !== taskId));
      setFilteredTasks(filteredTasks.filter(task => task._id !== taskId));
      alert('Task deleted successfully!');
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
  };

  const canEditTask = (task) => {
    const isAssigned = task.assignedTo?._id === user?.id || task.assignedTo === user?.id;
    return isAdmin || isAssigned;
  };

  const statusOptions = ['new', 'assigned', 'in-progress', 'completed', 'overdue'];
  const priorityOptions = ['low', 'medium', 'high', 'urgent'];
  const progressOptions = [0, 25, 50, 75, 100];

  const getProgressColor = (progress) => {
    const value = Number(progress) || 0;
    if (value >= 80) return 'bg-green-600';
    if (value >= 50) return 'bg-blue-600';
    if (value >= 25) return 'bg-yellow-600';
    return 'bg-gray-400';
  };

  const getProgressValue = (progress) => {
    return Number(progress) || 0;
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={fetchTasks}
            className="flex-1 sm:flex-none bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 flex items-center justify-center gap-2"
          >
            <FiRefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => navigate('/tasks/create')}
              className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <FiPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters - Mobile Friendly */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All Status</option>
            {statusOptions.map(s => (
              <option key={s} value={s}>{s.toUpperCase()}</option>
            ))}
          </select>
          
          <select
            name="priority"
            value={filters.priority}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All Priority</option>
            {priorityOptions.map(p => (
              <option key={p} value={p}>{p.toUpperCase()}</option>
            ))}
          </select>
          
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <FiX className="w-4 h-4" />
            Clear Filters
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">From Date</label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">To Date</label>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
        
        {(searchTerm || filters.status || filters.priority || filters.dateFrom || filters.dateTo) && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Found <span className="font-bold text-blue-600">{filteredTasks.length}</span> tasks
            </p>
          </div>
        )}
      </div>

      {/* ✅ Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No tasks found
          </div>
        ) : (
          filteredTasks.map((task) => {
            const canEdit = canEditTask(task);
            const progressValue = getProgressValue(task.progress);
            const progressColor = getProgressColor(task.progress);
            
            return (
              <div key={task._id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start">
                  <h3 
                    className="font-semibold text-gray-900 cursor-pointer flex-1"
                    onClick={() => navigate(`/tasks/${task._id}`)}
                  >
                    {task.title}
                  </h3>
                  <div className="flex gap-1">
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => navigate(`/tasks/edit/${task._id}`)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Edit Task"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(task._id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete Task"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 mt-1">
                  Assigned: {task.assignedTo?.fullName || 'Unassigned'}
                </p>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.priority}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    task.status === 'completed' ? 'bg-green-100 text-green-800' :
                    task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                    task.status === 'overdue' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                  </span>
                </div>
                
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`rounded-full h-2 transition-all ${progressColor}`}
                        style={{ width: `${progressValue}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 min-w-[30px]">{progressValue}%</span>
                  </div>
                  
                  {canEdit && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {progressOptions.map((value) => (
                        <button
                          key={value}
                          onClick={() => handleProgressUpdate(task._id, value)}
                          disabled={updatingProgress === task._id}
                          className={`px-2 py-0.5 text-xs rounded border transition-all ${
                            progressValue === value
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                          } disabled:opacity-50`}
                        >
                          {value}%
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ✅ Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-lg shadow-md overflow-hidden">
        <div 
          onClick={() => setShowTaskList(!showTaskList)}
          className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
        >
          <h2 className="text-md font-semibold text-gray-700 flex items-center gap-2">
            <span>📋</span> Task List
            <span className="text-sm font-normal text-gray-400">({filteredTasks.length} tasks)</span>
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {showTaskList ? 'Click to hide' : 'Click to expand'}
            </span>
            <span className="text-gray-400 text-xl">
              {showTaskList ? '▲' : '▼'}
            </span>
          </div>
        </div>
        
        {showTaskList && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      No tasks found
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => {
                    const canEdit = canEditTask(task);
                    const progressValue = getProgressValue(task.progress);
                    const progressColor = getProgressColor(task.progress);
                    
                    return (
                      <tr 
                        key={task._id} 
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td 
                          className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 cursor-pointer"
                          onClick={() => navigate(`/tasks/${task._id}`)}
                        >
                          {task.title}
                        </td>
                        <td 
                          className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer"
                          onClick={() => navigate(`/tasks/${task._id}`)}
                        >
                          {task.assignedTo?.fullName || 'Unassigned'}
                        </td>
                        <td 
                          className="px-4 py-4 whitespace-nowrap cursor-pointer"
                          onClick={() => navigate(`/tasks/${task._id}`)}
                        >
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.priority}
                          </span>
                        </td>
                        <td 
                          className="px-4 py-4 whitespace-nowrap cursor-pointer"
                          onClick={() => navigate(`/tasks/${task._id}`)}
                        >
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                            task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            task.status === 'overdue' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.status}
                          </span>
                        </td>
                        <td 
                          className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer"
                          onClick={() => navigate(`/tasks/${task._id}`)}
                        >
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                              <div 
                                className={`rounded-full h-2.5 transition-all ${progressColor}`}
                                style={{ width: `${progressValue}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500 min-w-[30px]">
                              {progressValue}%
                            </span>
                          </div>
                          
                          {canEdit && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {progressOptions.map((value) => (
                                <button
                                  key={value}
                                  onClick={() => handleProgressUpdate(task._id, value)}
                                  disabled={updatingProgress === task._id}
                                  className={`px-2 py-0.5 text-xs rounded border transition-all ${
                                    progressValue === value
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                                  } disabled:opacity-50`}
                                >
                                  {value}%
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => navigate(`/tasks/edit/${task._id}`)}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Edit Task"
                                >
                                  <FiEdit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(task._id)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Delete Task"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;