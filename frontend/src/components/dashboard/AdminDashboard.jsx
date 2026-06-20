import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
//import api from '../../api';
import StatsCard from './StatsCard';
import { 
  FiUsers, FiCheckSquare, FiClock, FiAlertCircle, FiPlus, 
  FiSearch, FiX, FiTrendingUp, FiAward, FiBarChart2, 
  FiStar, FiTarget, FiCalendar, FiActivity 
} from 'react-icons/fi';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
    avgTasksPerEmployee: 0,
    productivityScore: 0,
    urgentTasks: 0,
    weeklyCompleted: 0
  });
  const [allTasks, setAllTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [topEmployee, setTopEmployee] = useState(null);
  const [showAllEmployees, setShowAllEmployees] = useState(false);
  const [allEmployeePerformance, setAllEmployeePerformance] = useState([]);
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [showKPIDetail, setShowKPIDetail] = useState(false);
  const [monthlyData, setMonthlyData] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    priority: ''
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allTasks, searchTerm, filters.status, filters.priority]);

  const loadAdminData = async () => {
    try {
      const employeesRes = await api.get('/employees');
      const tasksRes = await api.get('/tasks');
      const tasks = tasksRes.data.tasks || [];
      const employees = employeesRes.data.employees || [];
      
      const completed = tasks.filter(t => t.status === 'completed').length;
      const inProgress = tasks.filter(t => t.status === 'in-progress').length;
      const overdue = tasks.filter(t => t.status === 'overdue').length;
      const urgent = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;
      const completionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
      const avgTasksPerEmployee = employees.length > 0 ? Math.round(tasks.length / employees.length) : 0;
      
      const onTimeTasks = tasks.filter(t => {
        if (t.status === 'completed' && t.completionDate) {
          return new Date(t.completionDate) <= new Date(t.dueDate);
        }
        return false;
      }).length;
      const onTimeRate = tasks.length > 0 ? (onTimeTasks / tasks.length) * 100 : 0;
      const productivityScore = Math.round((completionRate + onTimeRate) / 2);
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weeklyCompleted = tasks.filter(t => {
        if (t.status === 'completed' && t.completionDate) {
          return new Date(t.completionDate) >= oneWeekAgo;
        }
        return false;
      }).length;
      
      setStats({
        totalEmployees: employees.length,
        totalTasks: tasks.length,
        completedTasks: completed,
        inProgressTasks: inProgress,
        overdueTasks: overdue,
        completionRate: completionRate,
        avgTasksPerEmployee: avgTasksPerEmployee,
        productivityScore: productivityScore,
        urgentTasks: urgent,
        weeklyCompleted: weeklyCompleted
      });
      
      setAllTasks(tasks);
      setFilteredTasks(tasks);

      // Calculate employee performance
      const employeePerformance = {};
      employees.forEach(emp => {
        const empTasks = tasks.filter(t => t.assignedTo?._id === emp._id || t.assignedTo === emp._id);
        const completedTasks = empTasks.filter(t => t.status === 'completed').length;
        const totalTasks = empTasks.length;
        const rate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        employeePerformance[emp._id] = { ...emp, completedTasks, totalTasks, completionRate: rate };
      });

      // Find top performer
      let top = null;
      let topRate = -1;
      Object.values(employeePerformance).forEach(emp => {
        if (emp.totalTasks > 0 && emp.completionRate > topRate) {
          topRate = emp.completionRate;
          top = emp;
        }
      });
      setTopEmployee(top);

      // Store all employee performance data
      const allPerf = Object.values(employeePerformance)
        .filter(emp => emp.totalTasks > 0)
        .sort((a, b) => b.completionRate - a.completionRate);
      setAllEmployeePerformance(allPerf);

      // Calculate monthly data
      const monthly = calculateMonthlyData(tasks);
      setMonthlyData(monthly);

    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyData = (tasks) => {
    const months = {};
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      months[key] = { month: key, completed: 0, total: 0, rate: 0 };
    }
    
    tasks.forEach(task => {
      const taskDate = new Date(task.createdAt);
      const monthKey = taskDate.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (months[monthKey]) {
        months[monthKey].total++;
        if (task.status === 'completed') {
          months[monthKey].completed++;
        }
      }
    });
    
    Object.keys(months).forEach(key => {
      const m = months[key];
      m.rate = m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0;
    });
    
    return Object.values(months);
  };

  const handleKPIClick = (kpi, index) => {
    setSelectedKPI({ ...kpi, index });
    setShowKPIDetail(true);
  };

  const applyFilters = () => {
    let filtered = [...allTasks];
    
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(task => 
        task.title?.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower) ||
        task.assignedTo?.fullName?.toLowerCase().includes(searchLower) ||
        task.category?.toLowerCase().includes(searchLower) ||
        task.status?.toLowerCase().includes(searchLower) ||
        task.priority?.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status);
    }
    
    if (filters.priority) {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }
    
    setFilteredTasks(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: '', priority: '' });
    setSearchTerm('');
    setFilteredTasks(allTasks);
  };

  const kpiItems = [
    { title: 'Completion Rate', value: `${stats.completionRate}%`, icon: FiTrendingUp, color: 'green', subtitle: 'Tasks completed' },
    { title: 'Productivity Score', value: stats.productivityScore, icon: FiAward, color: 'purple', subtitle: 'Out of 100' },
    { title: 'Avg Tasks/Employee', value: stats.avgTasksPerEmployee, icon: FiBarChart2, color: 'blue', subtitle: 'Per person' },
    { title: 'Urgent Tasks', value: stats.urgentTasks, icon: FiAlertCircle, color: 'red', subtitle: 'Need attention' },
    { title: 'Weekly Completed', value: stats.weeklyCompleted, icon: FiCalendar, color: 'orange', subtitle: 'Last 7 days' },
  ];

  const statusOptions = ['new', 'assigned', 'in-progress', 'completed', 'overdue'];
  const priorityOptions = ['low', 'medium', 'high', 'urgent'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* ========== MAIN STATS CARDS ========== */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        <StatsCard title="Total Employees" value={stats.totalEmployees} icon={FiUsers} color="blue" />
        <StatsCard title="Total Tasks" value={stats.totalTasks} icon={FiCheckSquare} color="green" />
        <StatsCard title="Completed" value={stats.completedTasks} icon={FiCheckSquare} color="purple" />
        <StatsCard title="In Progress" value={stats.inProgressTasks} icon={FiClock} color="orange" />
        <StatsCard title="Overdue" value={stats.overdueTasks} icon={FiAlertCircle} color="red" />
      </div>

      {/* ========== KPI SECTION ========== */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {kpiItems.map((kpi, index) => (
          <div 
            key={index} 
            onClick={() => handleKPIClick(kpi, index)}
            className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-green-100">
                <kpi.icon className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{kpi.value}</span>
            </div>
            <h3 className="font-medium text-gray-700">{kpi.title}</h3>
            <p className="text-xs text-gray-400 mt-1">{kpi.subtitle}</p>
            <p className="text-xs text-blue-600 mt-1">Click for details →</p>
          </div>
        ))}
        
        {/* ========== TOP PERFORMER CARD ========== */}
        {topEmployee && (
          <div 
            onClick={() => setShowAllEmployees(!showAllEmployees)}
            className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-purple-100">
                <span className="text-xl">🏆</span>
              </div>
              <span className="text-2xl font-bold text-purple-600">{topEmployee.completionRate}%</span>
            </div>
            <h3 className="font-medium text-gray-700">Top Performer</h3>
            <p className="text-xs text-gray-400 mt-1">{topEmployee.fullName}</p>
            <p className="text-xs text-gray-400">{topEmployee.completedTasks} tasks done</p>
            <p className="text-xs text-purple-600 mt-1">{showAllEmployees ? '▲ Click to hide' : '▼ Click to expand'}</p>
          </div>
        )}
      </div>

      {/* ========== KPI DETAIL MODAL ========== */}
      {showKPIDetail && selectedKPI && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedKPI.title}</h2>
                <p className="text-sm text-gray-500">Monthly Performance Overview</p>
              </div>
              <button
                onClick={() => setShowKPIDetail(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6 bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Current Value</p>
                <p className="text-4xl font-bold text-blue-600">{selectedKPI.value}</p>
                <p className="text-sm text-gray-400">{selectedKPI.subtitle}</p>
              </div>
              
              <h3 className="font-semibold text-gray-800 mb-3">Monthly Trend (Last 6 Months)</h3>
              <div className="space-y-3">
                {monthlyData.map((month, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-700">{month.month}</span>
                      <span className="text-sm font-bold text-blue-600">{month.rate}%</span>
                    </div>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span>Total: {month.total}</span>
                      <span>Completed: {month.completed}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className={`rounded-full h-2 ${
                          month.rate >= 80 ? 'bg-green-600' :
                          month.rate >= 60 ? 'bg-blue-600' :
                          month.rate >= 40 ? 'bg-yellow-600' : 'bg-red-600'
                        }`}
                        style={{ width: `${month.rate}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {monthlyData.filter(m => m.rate >= 80).length}
                  </p>
                  <p className="text-xs text-gray-500">Good Months</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {monthlyData.filter(m => m.rate >= 40 && m.rate < 80).length}
                  </p>
                  <p className="text-xs text-gray-500">Average Months</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {monthlyData.filter(m => m.rate < 40).length}
                  </p>
                  <p className="text-xs text-gray-500">Needs Work</p>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowKPIDetail(false)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== ALL EMPLOYEES PERFORMANCE LIST ========== */}
      {showAllEmployees && allEmployeePerformance.length > 0 && (
        <div className="mb-8 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-800">All Employees Performance</h3>
            <p className="text-xs text-gray-500">Ranked by completion rate</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allEmployeePerformance.map((emp, index) => (
                  <tr key={emp._id} className={`hover:bg-gray-50 ${index === 0 ? 'bg-yellow-50' : ''}`}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{emp.fullName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{emp.department || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{emp.totalTasks}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{emp.completedTasks}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`rounded-full h-2 ${
                              emp.completionRate >= 80 ? 'bg-green-600' :
                              emp.completionRate >= 60 ? 'bg-blue-600' :
                              emp.completionRate >= 40 ? 'bg-yellow-600' : 'bg-red-600'
                            }`}
                            style={{ width: `${emp.completionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{emp.completionRate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        emp.completionRate >= 80 ? 'bg-green-100 text-green-800' :
                        emp.completionRate >= 60 ? 'bg-blue-100 text-blue-800' :
                        emp.completionRate >= 40 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {emp.completionRate >= 80 ? 'Excellent' :
                         emp.completionRate >= 60 ? 'Good' :
                         emp.completionRate >= 40 ? 'Average' : 'Needs Work'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== TOP PERFORMER MONTHLY DETAILS ========== */}
      {showAllEmployees && topEmployee && (
        <div className="mb-8 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">🏆 {topEmployee.fullName} - Monthly Performance</h3>
                <p className="text-xs text-gray-500">Last 6 months performance breakdown</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-purple-600">{topEmployee.completionRate}% Overall</p>
                <p className="text-xs text-gray-500">{topEmployee.completedTasks} of {topEmployee.totalTasks} tasks completed</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {monthlyData.map((month, index) => {
                const empMonthlyTasks = allTasks.filter(task => {
                  const taskDate = new Date(task.createdAt);
                  const monthKey = taskDate.toLocaleString('default', { month: 'short', year: 'numeric' });
                  const isAssigned = task.assignedTo?._id === topEmployee._id || task.assignedTo === topEmployee._id;
                  return monthKey === month.month && isAssigned;
                });
                const empCompleted = empMonthlyTasks.filter(t => t.status === 'completed').length;
                const empTotal = empMonthlyTasks.length;
                const empRate = empTotal > 0 ? Math.round((empCompleted / empTotal) * 100) : 0;
                
                return (
                  <div key={index} className="border rounded-lg p-3 hover:bg-gray-50">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-700">{month.month}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">{empCompleted}/{empTotal} tasks</span>
                        <span className={`text-sm font-bold ${
                          empRate >= 80 ? 'text-green-600' :
                          empRate >= 60 ? 'text-blue-600' :
                          empRate >= 40 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {empRate}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`rounded-full h-2 ${
                          empRate >= 80 ? 'bg-green-600' :
                          empRate >= 60 ? 'bg-blue-600' :
                          empRate >= 40 ? 'bg-yellow-600' : 'bg-red-600'
                        }`}
                        style={{ width: `${empRate}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="bg-green-50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-green-600">
                  {monthlyData.filter((month) => {
                    const empMonthlyTasks = allTasks.filter(task => {
                      const taskDate = new Date(task.createdAt);
                      const monthKey = taskDate.toLocaleString('default', { month: 'short', year: 'numeric' });
                      const isAssigned = task.assignedTo?._id === topEmployee._id || task.assignedTo === topEmployee._id;
                      return monthKey === month.month && isAssigned;
                    });
                    const empTotal = empMonthlyTasks.length;
                    const empCompleted = empMonthlyTasks.filter(t => t.status === 'completed').length;
                    const empRate = empTotal > 0 ? Math.round((empCompleted / empTotal) * 100) : 0;
                    return empRate >= 80 && empTotal > 0;
                  }).length
                }</p>
                <p className="text-xs text-gray-500">Good Months</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-yellow-600">
                  {monthlyData.filter((month) => {
                    const empMonthlyTasks = allTasks.filter(task => {
                      const taskDate = new Date(task.createdAt);
                      const monthKey = taskDate.toLocaleString('default', { month: 'short', year: 'numeric' });
                      const isAssigned = task.assignedTo?._id === topEmployee._id || task.assignedTo === topEmployee._id;
                      return monthKey === month.month && isAssigned;
                    });
                    const empTotal = empMonthlyTasks.length;
                    const empCompleted = empMonthlyTasks.filter(t => t.status === 'completed').length;
                    const empRate = empTotal > 0 ? Math.round((empCompleted / empTotal) * 100) : 0;
                    return empRate >= 40 && empRate < 80 && empTotal > 0;
                  }).length
                }</p>
                <p className="text-xs text-gray-500">Average Months</p>
              </div>
              <div className="bg-red-50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-red-600">
                  {monthlyData.filter((month) => {
                    const empMonthlyTasks = allTasks.filter(task => {
                      const taskDate = new Date(task.createdAt);
                      const monthKey = taskDate.toLocaleString('default', { month: 'short', year: 'numeric' });
                      const isAssigned = task.assignedTo?._id === topEmployee._id || task.assignedTo === topEmployee._id;
                      return monthKey === month.month && isAssigned;
                    });
                    const empTotal = empMonthlyTasks.length;
                    const empCompleted = empMonthlyTasks.filter(t => t.status === 'completed').length;
                    const empRate = empTotal > 0 ? Math.round((empCompleted / empTotal) * 100) : 0;
                    return empRate < 40 && empTotal > 0;
                  }).length
                }</p>
                <p className="text-xs text-gray-500">Needs Work</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== CREATE TASK BUTTON ========== */}
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => navigate('/tasks/create')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          Create New Task
        </button>
      </div>

      {/* ========== SEARCH AND FILTERS ========== */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search all tasks by title, description, employee, category..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setTimeout(applyFilters, 200);
              }}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Priority</option>
            {priorityOptions.map(p => (
              <option key={p} value={p}>{p.toUpperCase()}</option>
            ))}
          </select>
          
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
          >
            <FiX className="w-4 h-4" />
            Clear Filters
          </button>
        </div>
        
        {/* Search Results Count */}
        {(searchTerm || filters.status || filters.priority) && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm">
              <span>🔍 Found <span className="font-bold text-blue-600">{filteredTasks.length}</span> tasks matching your search</span>
              {filteredTasks.length === 0 && (
                <span className="text-red-500">No tasks match your criteria</span>
              )}
              <button
                onClick={clearFilters}
                className="text-xs text-blue-600 hover:text-blue-800 ml-auto"
              >
                Clear filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========== SEARCH RESULTS ========== */}
      {(searchTerm || filters.status || filters.priority) && filteredTasks.length > 0 && (
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span>🔍</span> Search Results ({filteredTasks.length})
            </h4>
            <button
              onClick={clearFilters}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Clear
            </button>
          </div>
          <div className="p-3">
            <div className="space-y-2">
              {filteredTasks.slice(0, 10).map((task) => (
                <div 
                  key={task._id}
                  onClick={() => navigate(`/tasks/${task._id}`)}
                  className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold bg-blue-100 text-blue-600">
                      {task.progress}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {task.assignedTo?.fullName || 'Unassigned'} • {task.status} • {task.priority}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                      task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      task.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
              {filteredTasks.length > 10 && (
                <p className="text-xs text-gray-400 text-center">Showing 10 of {filteredTasks.length} results</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== RECENT TASKS - DAILY & URGENT ========== */}
      {!searchTerm && !filters.status && !filters.priority && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-md font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-blue-500">📋</span> Recent Tasks
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                  🔵 Daily: {allTasks.filter(t => !t.scheduledDate && t.status !== 'completed').length}
                </span>
                <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                  🔴 Urgent: {allTasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length}
                </span>
              </div>
              <button
                onClick={() => navigate('/tasks')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View All →
              </button>
            </div>
          </div>
          <div className="p-4">
            {(() => {
              const dailyTasks = allTasks.filter(task => 
                !task.scheduledDate && task.status !== 'completed'
              );
              const urgentTasks = allTasks.filter(task => 
                task.priority === 'urgent' && task.status !== 'completed'
              );
              
              const combinedTasks = [...dailyTasks, ...urgentTasks];
              const uniqueTasks = combinedTasks.filter((task, index, self) => 
                index === self.findIndex(t => t._id === task._id)
              );
              
              const recentTasks = uniqueTasks.slice(0, 5);
              
              if (recentTasks.length === 0) {
                return (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">No active tasks</p>
                  </div>
                );
              }
              
              return (
                <div className="space-y-2">
                  {recentTasks.map((task) => (
                    <div 
                      key={task._id}
                      onClick={() => navigate(`/tasks/${task._id}`)}
                      className={`flex items-center justify-between p-3 border rounded-lg hover:shadow-md cursor-pointer transition-colors ${
                        task.priority === 'urgent' ? 'border-red-200 hover:bg-red-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                          task.priority === 'urgent' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {task.progress}%
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                          <p className="text-xs text-gray-500 truncate">→ {task.assignedTo?.fullName || 'Unassigned'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {task.priority === 'urgent' && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800 font-medium">
                            URGENT
                          </span>
                        )}
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          task.status === 'overdue' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;