import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../hooks/useAuth';

const EditTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    category: '',
    status: 'new',
    progress: 0,
    startDate: '',
    dueDate: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTaskAndEmployees();
  }, [id]);

  const fetchTaskAndEmployees = async () => {
    try {
      setLoading(true);
      
      const taskRes = await api.get(`/tasks/${id}`);
      const task = taskRes.data.task;
      console.log('📋 Task loaded:', task);
      
      const employeesRes = await api.get('/employees');
      const activeEmployees = employeesRes.data.employees?.filter(emp => emp.status === 'active') || [];
      setEmployees(activeEmployees);
      
      setFormData({
        title: task.title || '',
        description: task.description || '',
        assignedTo: task.assignedTo?._id || task.assignedTo || '',
        priority: task.priority || 'medium',
        category: task.category || '',
        status: task.status || 'new',
        progress: task.progress || 0,
        startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
      });
      
    } catch (error) {
      console.error('❌ Error fetching task:', error);
      setError('Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleProgressClick = (value) => {
    setFormData(prev => ({ ...prev, progress: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const isAssigned = formData.assignedTo === user?._id || formData.assignedTo === user?.id;
      const canEdit = isAdmin || isAssigned;
      
      if (!canEdit) {
        setError('You are not authorized to edit this task');
        setSubmitting(false);
        return;
      }

      const updateData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        category: formData.category,
        startDate: formData.startDate,
        dueDate: formData.dueDate,
        progress: formData.progress,
        status: formData.status
      };

      if (isAdmin) {
        updateData.assignedTo = formData.assignedTo;
        updateData.status = formData.status;
      }

      console.log('📤 Updating task:', updateData);
      
      const response = await api.put(`/tasks/${id}`, updateData);
      console.log('✅ Task updated:', response.data);
      
      alert('Task updated successfully!');
      navigate(`/tasks/${id}`);
      
    } catch (error) {
      console.error('❌ Error updating task:', error);
      setError(error.response?.data?.message || 'Failed to update task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await api.delete(`/tasks/${id}`);
      alert('Task deleted successfully!');
      navigate('/tasks');
    } catch (error) {
      console.error('❌ Error deleting task:', error);
      setError('Failed to delete task');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isAssigned = formData.assignedTo && 
    (formData.assignedTo === user?._id || formData.assignedTo === user?.id);
  const canEdit = isAdmin || isAssigned;

  // ✅ Read-only view for non-authorized users
  if (!canEdit) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Task Details (Read Only)</h1>
          <button
            type="button"
            onClick={() => navigate(`/tasks/${id}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Task
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <p className="text-gray-900">{formData.title}</p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <p className="text-gray-900">{formData.description}</p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <p className="text-gray-900 capitalize">{formData.priority}</p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <p className="text-gray-900">{formData.category}</p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <p className="text-gray-900 capitalize">{formData.status}</p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Progress</label>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
              <div 
                className={`rounded-full h-3 transition-all duration-500 ${
                  formData.progress >= 80 ? 'bg-green-600' :
                  formData.progress >= 50 ? 'bg-blue-600' :
                  formData.progress >= 25 ? 'bg-yellow-600' : 'bg-gray-400'
                }`}
                style={{ width: `${formData.progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">{formData.progress}%</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <p className="text-gray-900">{formData.startDate || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <p className="text-gray-900">{formData.dueDate || 'N/A'}</p>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={() => navigate(`/tasks/${id}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Task
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Edit view for authorized users
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Task</h1>
        {isAdmin && (
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            🗑️ Delete Task
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea
            name="description"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Assign To - Only Admin */}
        {isAdmin && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
            <select
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select employee</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>{emp.fullName}</option>
              ))}
            </select>
          </div>
        )}
        
        {/* Priority */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        
        {/* Category */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status - Only Admin */}
        {isAdmin && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="new">New</option>
              <option value="assigned">Assigned</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        )}
        
        {/* Progress */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Progress: {formData.progress}%</label>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-3 overflow-hidden">
            <div 
              className={`rounded-full h-3 transition-all duration-500 ${
                formData.progress >= 80 ? 'bg-green-600' :
                formData.progress >= 50 ? 'bg-blue-600' :
                formData.progress >= 25 ? 'bg-yellow-600' : 'bg-gray-400'
              }`}
              style={{ width: `${formData.progress}%` }}
            ></div>
          </div>
          
          {/* Progress Buttons */}
          <div className="flex gap-2 flex-wrap">
            {[0, 25, 50, 75, 100].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleProgressClick(value)}
                className={`px-4 py-1.5 text-sm rounded-full border transition-all ${
                  formData.progress === value
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                {value}%
              </button>
            ))}
          </div>
        </div>
        
        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {/* Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={() => navigate(`/tasks/${id}`)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditTask;