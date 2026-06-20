import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../hooks/useAuth';
import StatsCard from './StatsCard';
import { 
  FiCheckSquare, FiClock, FiAlertCircle, FiTrendingUp, 
  FiAward, FiTarget, FiCalendar, FiStar, FiActivity,
  FiBarChart2
} from 'react-icons/fi';

const EmployeeDashboard = () => {
  const [stats, setStats] = useState({
    assignedTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
    productivityScore: 0,
    weeklyCompleted: 0,
    onTimeRate: 0,
    averageProgress: 0,
    rank: ''
  });
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadEmployeeData();
  }, [user]);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      console.log('📡 Fetching employee tasks...');
      console.log('👤 Current user:', user);
      
      // ✅ Get user ID from different possible locations
      const userId = user?._id || user?.id;
      const userEmail = user?.email;
      
      console.log('🔍 User ID:', userId);
      console.log('🔍 User Email:', userEmail);
      
      if (!userId && !userEmail) {
        console.error('❌ No user ID or email found');
        setLoading(false);
        return;
      }
      
      const tasksRes = await api.get('/tasks');
      console.log('📋 Tasks response:', tasksRes.data);
      
      const allTasks = tasksRes.data.tasks || [];
      console.log('📋 All tasks count:', allTasks.length);
      
      // ✅ Filter tasks assigned to current user
      const userTasks = allTasks.filter(task => {
        // Get assignedTo ID from different possible formats
        let assignedToId = task.assignedTo?._id || task.assignedTo;
        const assignedToEmail = task.assignedTo?.email;
        
        // Convert to string for comparison
        const assignedIdStr = assignedToId ? assignedToId.toString() : null;
        const userIdStr = userId ? userId.toString() : null;
        
        // Check if task is assigned to this user
        const matchById = assignedIdStr && userIdStr && assignedIdStr === userIdStr;
        const matchByEmail = assignedToEmail && userEmail && assignedToEmail === userEmail;
        
        if (matchById || matchByEmail) {
          console.log(`✅ Task "${task.title}" assigned to user`);
          return true;
        }
        return false;
      });
      
      console.log('✅ Filtered user tasks count:', userTasks.length);
      
      // ✅ Calculate stats
      const total = userTasks.length;
      const completed = userTasks.filter(t => t.status === 'completed').length;
      const inProgress = userTasks.filter(t => t.status === 'in-progress' || t.status === 'in progress').length;
      const overdue = userTasks.filter(t => t.status === 'overdue').length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      // Calculate on-time completion rate
      const onTimeCompleted = userTasks.filter(t => {
        if (t.status === 'completed' && t.completionDate) {
          return new Date(t.completionDate) <= new Date(t.dueDate);
        }
        return false;
      }).length;
      const onTimeRate = completed > 0 ? Math.round((onTimeCompleted / completed) * 100) : 0;
      
      // Calculate average progress
      const totalProgress = userTasks.reduce((sum, task) => sum + (task.progress || 0), 0);
      const averageProgress = total > 0 ? Math.round(totalProgress / total) : 0;
      
      // Calculate productivity score
      const productivityScore = Math.round((completionRate + onTimeRate) / 2);
      
      // Calculate weekly completed tasks
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weeklyCompleted = userTasks.filter(t => {
        if (t.status === 'completed' && t.completionDate) {
          return new Date(t.completionDate) >= oneWeekAgo;
        }
        return false;
      }).length;
      
      // Determine employee rank
      let rank = '';
      if (completionRate >= 80) rank = '🌟 Excellent';
      else if (completionRate >= 60) rank = '📈 Good';
      else if (completionRate >= 40) rank = '📊 Average';
      else rank = '⚠️ Needs Improvement';
      
      setStats({
        assignedTasks: total,
        completedTasks: completed,
        inProgressTasks: inProgress,
        overdueTasks: overdue,
        completionRate: completionRate,
        productivityScore: productivityScore,
        weeklyCompleted: weeklyCompleted,
        onTimeRate: onTimeRate,
        averageProgress: averageProgress,
        rank: rank
      });
      
      setMyTasks(userTasks.slice(0, 5));
      
      console.log('📊 Stats updated:', {
        total,
        completed,
        inProgress,
        overdue,
        completionRate
      });
      
    } catch (error) {
      console.error('❌ Error loading employee data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Personal KPI Items
  const personalKpiItems = [
    { 
      title: 'My Completion Rate', 
      value: `${stats.completionRate}%`, 
      icon: FiTrendingUp, 
      color: 'green', 
      subtitle: 'Tasks completed',
      progress: stats.completionRate
    },
    { 
      title: 'Productivity Score', 
      value: stats.productivityScore, 
      icon: FiAward, 
      color: 'purple', 
      subtitle: 'Out of 100',
      progress: stats.productivityScore
    },
    { 
      title: 'On-Time Rate', 
      value: `${stats.onTimeRate}%`, 
      icon: FiTarget, 
      color: 'blue', 
      subtitle: 'Completed before due date',
      progress: stats.onTimeRate
    },
    { 
      title: 'Avg Progress', 
      value: `${stats.averageProgress}%`, 
      icon: FiBarChart2, 
      color: 'orange', 
      subtitle: 'Across all tasks',
      progress: stats.averageProgress
    },
    { 
      title: 'This Week', 
      value: stats.weeklyCompleted, 
      icon: FiCalendar, 
      color: 'teal', 
      subtitle: 'Tasks completed',
      progress: stats.assignedTasks > 0 ? (stats.weeklyCompleted / stats.assignedTasks) * 100 : 0
    },
  ];

  const statItems = [
    { title: 'Assigned Tasks', value: stats.assignedTasks, icon: FiCheckSquare, color: 'blue' },
    { title: 'Completed', value: stats.completedTasks, icon: FiCheckSquare, color: 'green' },
    { title: 'In Progress', value: stats.inProgressTasks, icon: FiClock, color: 'orange' },
    { title: 'Overdue', value: stats.overdueTasks, icon: FiAlertCircle, color: 'red' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Welcome back, {user?.fullName || 'Employee'}! 👋</h2>
            <p className="text-blue-100 mt-1">Here's your performance summary</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{stats.completionRate}%</div>
            <p className="text-blue-100 text-sm">Overall Completion Rate</p>
          </div>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statItems.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Personal KPI Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FiActivity className="w-5 h-5 text-blue-600" />
            My Performance KPIs
          </h2>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            stats.completionRate >= 80 ? 'bg-green-100 text-green-700' :
            stats.completionRate >= 60 ? 'bg-blue-100 text-blue-700' :
            'bg-orange-100 text-orange-700'
          }`}>
            {stats.rank}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {personalKpiItems.map((kpi, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-${kpi.color}-100`}>
                  <kpi.icon className={`w-4 h-4 text-${kpi.color}-600`} />
                </div>
                <span className="text-xl font-bold text-gray-800">{kpi.value}</span>
              </div>
              <h3 className="font-medium text-gray-700 text-sm">{kpi.title}</h3>
              <p className="text-xs text-gray-400 mt-1">{kpi.subtitle}</p>
              {kpi.progress !== undefined && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`bg-${kpi.color}-600 rounded-full h-1.5 transition-all`}
                      style={{ width: `${Math.min(kpi.progress, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="mb-8 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <FiStar className="w-8 h-8 text-yellow-500" />
            <div>
              <h3 className="font-semibold text-gray-800">Performance Insights</h3>
              <p className="text-sm text-gray-600">
                {stats.completionRate >= 80 
                  ? "🎉 Outstanding! You're exceeding expectations. Keep up the great work!" 
                  : stats.completionRate >= 60 
                  ? "📈 Good progress! Focus on completing pending tasks to improve your score."
                  : stats.completionRate >= 40
                  ? "📊 You're making progress. Try to complete more tasks on time."
                  : "⚠️ Let's work together to improve your productivity. Start with small tasks!"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.completedTasks}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.weeklyCompleted}</p>
              <p className="text-xs text-gray-500">This Week</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.productivityScore}</p>
              <p className="text-xs text-gray-500">Productivity</p>
            </div>
          </div>
        </div>
      </div>

      {/* Next Task Suggestion */}
      {myTasks.length > 0 && (
        <div className="mb-8 bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <FiTarget className="w-6 h-6 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Next Focus</p>
              <p className="font-medium text-gray-800">
                {myTasks.find(t => t.status === 'in-progress')?.title || 
                 myTasks.find(t => t.status === 'new')?.title || 
                 myTasks.find(t => t.status === 'assigned')?.title ||
                 myTasks[0]?.title}
              </p>
            </div>
            <button 
              onClick={() => {
                const nextTask = myTasks.find(t => t.status === 'in-progress') || 
                                myTasks.find(t => t.status === 'new') || 
                                myTasks.find(t => t.status === 'assigned') ||
                                myTasks[0];
                if (nextTask) navigate(`/tasks/${nextTask._id}`);
              }}
              className="ml-auto bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* My Tasks List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">My Recent Tasks</h3>
        </div>
        <div className="p-6">
          {myTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No tasks assigned yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myTasks.map((task) => (
                <div 
                  key={task._id}
                  onClick={() => navigate(`/tasks/${task._id}`)}
                  className="border rounded-lg p-4 hover:shadow-md cursor-pointer transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900">{task.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">{task.description?.substring(0, 100)}...</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {task.priority || 'medium'}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        task.status === 'overdue' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status || 'new'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-sm text-gray-500">Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 rounded-full h-2 transition-all"
                          style={{ width: `${task.progress || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{task.progress || 0}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;