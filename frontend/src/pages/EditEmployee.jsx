import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import api from '../api';
import AlertDialog from '../components/common/AlertDialog';

const EditEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    department: '',
    role: 'employee',
    status: 'active',
    password: '',           // ✅ ADD THIS
    confirmPassword: ''     // ✅ ADD THIS
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [originalData, setOriginalData] = useState({});

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const fetchEmployee = async () => {
    try {
      const response = await api.get(`/employees/${id}`);
      const employee = response.data.employee;
      setFormData({
        fullName: employee.fullName || '',
        email: employee.email || '',
        department: employee.department || '',
        role: employee.role || 'employee',
        status: employee.status || 'active',
        password: '',
        confirmPassword: ''
      });
      setOriginalData(employee);
    } catch (error) {
      console.error('Error fetching employee:', error);
      alert('Failed to load employee data');
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ Validate password if provided
    if (formData.password && formData.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      // ✅ Create update data with password if provided
      const updateData = {
        fullName: formData.fullName,
        email: formData.email,
        department: formData.department,
        role: formData.role,
        status: formData.status
      };
      
      // Only include password if it's been changed
      if (formData.password) {
        updateData.password = formData.password;
      }

      await api.put(`/employees/${id}`, updateData);
      alert('Employee updated successfully!');
      navigate('/employees');
    } catch (error) {
      console.error('Error updating employee:', error);
      alert(error.response?.data?.message || 'Failed to update employee');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const hasChanges = 
      formData.fullName !== originalData.fullName ||
      formData.email !== originalData.email ||
      formData.department !== originalData.department ||
      formData.role !== originalData.role ||
      formData.status !== originalData.status ||
      formData.password ||
      formData.confirmPassword;
    
    if (hasChanges) {
      setCancelDialog(true);
    } else {
      navigate('/employees');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Edit Employee
      </h1>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        {/* Full Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* ===== PASSWORD SECTION ===== */}
        <div className="mb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
            Leave blank to keep current password
          </p>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter new password (min 6 characters)"
              className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative mt-2">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Department */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Department
          </label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Role */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Role *
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Status */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status *
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={cancelDialog}
        onClose={() => setCancelDialog(false)}
        onConfirm={() => navigate('/employees')}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to leave?"
        type="warning"
        confirmText="Yes, Discard"
        cancelText="Keep Editing"
      />
    </div>
  );
};

export default EditEmployee;