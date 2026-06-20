import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../api';
import { FiDownload, FiFileText, FiFile, FiPrinter } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Reports = () => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllTasks, setShowAllTasks] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const tasksRes = await api.get('/tasks');
      const employeesRes = await api.get('/employees');
      setTasks(tasksRes.data.tasks || []);
      setEmployees(employeesRes.data.employees || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    const exportData = tasks.map(task => ({
      'Task Title': task.title,
      'Description': task.description,
      'Assigned To': task.assignedTo?.fullName || 'Unassigned',
      'Priority': task.priority,
      'Status': task.status,
      'Progress': `${task.progress}%`,
      'Due Date': new Date(task.dueDate).toLocaleDateString(),
      'Created Date': new Date(task.createdAt).toLocaleDateString()
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tasks Report');
    XLSX.writeFile(wb, `tasks_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('TaskFlow Pro - Tasks Report', 14, 20);
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Tasks: ${tasks.length}`, 14, 40);
    doc.text(`Completed Tasks: ${tasks.filter(t => t.status === 'completed').length}`, 14, 48);
    doc.text(`Completion Rate: ${tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0}%`, 14, 56);
    
    const tableData = tasks.map(task => [
      task.title,
      task.assignedTo?.fullName || 'Unassigned',
      task.priority,
      task.status,
      `${task.progress}%`,
      new Date(task.dueDate).toLocaleDateString()
    ]);
    
    doc.autoTable({
      startY: 65,
      head: [['Title', 'Assigned To', 'Priority', 'Status', 'Progress', 'Due Date']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    doc.save(`tasks_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Export Employee Performance Report
  const exportEmployeeReport = () => {
    const employeeData = employees.map(emp => {
      const empTasks = tasks.filter(t => t.assignedTo?._id === emp._id || t.assignedTo === emp._id);
      const completed = empTasks.filter(t => t.status === 'completed').length;
      const completionRate = empTasks.length > 0 ? Math.round((completed / empTasks.length) * 100) : 0;
      return {
        'Employee Name': emp.fullName,
        'Email': emp.email,
        'Department': emp.department || 'N/A',
        'Total Tasks': empTasks.length,
        'Completed': completed,
        'In Progress': empTasks.filter(t => t.status === 'in-progress').length,
        'Overdue': empTasks.filter(t => t.status === 'overdue').length,
        'Completion Rate': `${completionRate}%`
      };
    });
    
    const ws = XLSX.utils.json_to_sheet(employeeData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employee Performance');
    XLSX.writeFile(wb, `employee_performance_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Print Report
  const printReport = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>TaskFlow Pro Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #2563eb; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #2563eb; color: white; }
          .stats { display: flex; gap: 20px; margin: 20px 0; }
          .stat-card { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; }
        </style>
        </head>
        <body>
          <h1>TaskFlow Pro - Tasks Report</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <div class="stats">
            <div class="stat-card"><h3>Total Tasks</h3><p>${tasks.length}</p></div>
            <div class="stat-card"><h3>Completed</h3><p>${tasks.filter(t => t.status === 'completed').length}</p></div>
            <div class="stat-card"><h3>In Progress</h3><p>${tasks.filter(t => t.status === 'in-progress').length}</p></div>
            <div class="stat-card"><h3>Overdue</h3><p>${tasks.filter(t => t.status === 'overdue').length}</p></div>
          </div>
          <table>
            <thead><tr><th>Title</th><th>Assigned To</th><th>Priority</th><th>Status</th><th>Progress</th><th>Due Date</th></tr></thead>
            <tbody>
              ${tasks.map(task => `<tr>
                <td>${task.title}</td>
                <td>${task.assignedTo?.fullName || 'Unassigned'}</td>
                <td>${task.priority}</td>
                <td>${task.status}</td>
                <td>${task.progress}%</td>
                <td>${new Date(task.dueDate).toLocaleDateString()}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.print();
  };

  // Statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const overdueTasks = tasks.filter(t => t.status === 'overdue').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const statusData = [
    { name: 'Completed', value: completedTasks, color: '#10b981' },
    { name: 'In Progress', value: inProgressTasks, color: '#f59e0b' },
    { name: 'Overdue', value: overdueTasks, color: '#ef4444' },
  ].filter(item => item.value > 0);

  const priorityData = [
    { name: 'Low', count: tasks.filter(t => t.priority === 'low').length, color: '#10b981' },
    { name: 'Medium', count: tasks.filter(t => t.priority === 'medium').length, color: '#f59e0b' },
    { name: 'High', count: tasks.filter(t => t.priority === 'high').length, color: '#f97316' },
    { name: 'Urgent', count: tasks.filter(t => t.priority === 'urgent').length, color: '#ef4444' },
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports Dashboard</h1>
        <div className="flex gap-3">
          <button onClick={exportToExcel} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
            <FiFile className="w-4 h-4" /> Export to Excel
          </button>
          <button onClick={exportToPDF} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2">
            <FiFileText className="w-4 h-4" /> Export to PDF
          </button>
          <button onClick={exportEmployeeReport} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2">
            <FiDownload className="w-4 h-4" /> Employee Report
          </button>
          <button onClick={printReport} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2">
            <FiPrinter className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4 text-center"><p className="text-sm text-gray-500">Total Tasks</p><p className="text-3xl font-bold text-blue-600">{totalTasks}</p></div>
        <div className="bg-white rounded-lg shadow p-4 text-center"><p className="text-sm text-gray-500">Completed</p><p className="text-3xl font-bold text-green-600">{completedTasks}</p></div>
        <div className="bg-white rounded-lg shadow p-4 text-center"><p className="text-sm text-gray-500">In Progress</p><p className="text-3xl font-bold text-orange-600">{inProgressTasks}</p></div>
        <div className="bg-white rounded-lg shadow p-4 text-center"><p className="text-sm text-gray-500">Overdue</p><p className="text-3xl font-bold text-red-600">{overdueTasks}</p></div>
        <div className="bg-white rounded-lg shadow p-4 text-center"><p className="text-sm text-gray-500">Completion Rate</p><p className="text-3xl font-bold text-purple-600">{completionRate}%</p></div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Task Status Distribution</h2>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-12">No data available</p>
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Tasks by Priority</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6">
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* All Tasks Table - WITH TOGGLE */}
      <div className="bg-white rounded-lg shadow p-6">
        <div 
          onClick={() => setShowAllTasks(!showAllTasks)}
          className="flex justify-between items-center cursor-pointer hover:bg-gray-50 -m-6 p-6 rounded-lg transition-colors"
        >
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span>📋</span> All Tasks
            <span className="text-sm font-normal text-gray-400">({tasks.length} tasks)</span>
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {showAllTasks ? 'Click to hide' : 'Click to expand'}
            </span>
            <span className="text-gray-400 text-xl">
              {showAllTasks ? '▲' : '▼'}
            </span>
          </div>
        </div>
        
        {showAllTasks && (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      No tasks found
                    </td>
                  </tr>
                ) : (
                  tasks.map(task => (
                    <tr key={task._id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900">{task.title}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{task.assignedTo?.fullName || 'Unassigned'}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm capitalize">{task.status}</td>
                      <td className="px-4 py-2 text-sm">{task.progress}%</td>
                      <td className="px-4 py-2 text-sm">{new Date(task.dueDate).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;