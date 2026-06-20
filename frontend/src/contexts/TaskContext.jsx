import React, { createContext, useState, useContext } from 'react';
import toast from 'react-hot-toast';

export const TaskContext = createContext();

// Mock tasks data - frontend only
const MOCK_TASKS = [
  {
    _id: '1',
    title: 'Design Dashboard UI',
    description: 'Create a modern dashboard design with charts and statistics for admin and employee views.',
    assignedTo: { _id: '2', fullName: 'John Employee', email: 'employee@example.com', department: 'Development' },
    assignedBy: { _id: '1', fullName: 'Admin User' },
    priority: 'high',
    category: 'Design',
    status: 'in-progress',
    progress: 75,
    startDate: new Date('2024-01-01'),
    dueDate: new Date('2024-01-15'),
    createdAt: new Date('2024-01-01')
  },
  {
    _id: '2',
    title: 'Implement Authentication',
    description: 'Add JWT authentication, login page, and protected routes for the application.',
    assignedTo: { _id: '2', fullName: 'John Employee', email: 'employee@example.com', department: 'Development' },
    assignedBy: { _id: '1', fullName: 'Admin User' },
    priority: 'urgent',
    category: 'Backend',
    status: 'completed',
    progress: 100,
    startDate: new Date('2024-01-05'),
    dueDate: new Date('2024-01-10'),
    completionDate: new Date('2024-01-09'),
    createdAt: new Date('2024-01-05')
  },
  {
    _id: '3',
    title: 'Write API Documentation',
    description: 'Create comprehensive API documentation using Swagger/OpenAPI for all endpoints.',
    assignedTo: { _id: '2', fullName: 'John Employee', email: 'employee@example.com', department: 'Development' },
    assignedBy: { _id: '1', fullName: 'Admin User' },
    priority: 'medium',
    category: 'Documentation',
    status: 'new',
    progress: 0,
    startDate: new Date('2024-01-10'),
    dueDate: new Date('2024-01-20'),
    createdAt: new Date('2024-01-10')
  },
  {
    _id: '4',
    title: 'Setup Database Schema',
    description: 'Design and implement MongoDB schemas for users, tasks, comments, and notifications.',
    assignedTo: { _id: '2', fullName: 'John Employee', email: 'employee@example.com', department: 'Development' },
    assignedBy: { _id: '1', fullName: 'Admin User' },
    priority: 'high',
    category: 'Database',
    status: 'completed',
    progress: 100,
    startDate: new Date('2024-01-02'),
    dueDate: new Date('2024-01-08'),
    completionDate: new Date('2024-01-07'),
    createdAt: new Date('2024-01-02')
  },
  {
    _id: '5',
    title: 'Create Task Management UI',
    description: 'Build task list, task details, and task creation forms with proper validation.',
    assignedTo: { _id: '2', fullName: 'John Employee', email: 'employee@example.com', department: 'Development' },
    assignedBy: { _id: '1', fullName: 'Admin User' },
    priority: 'high',
    category: 'Frontend',
    status: 'in-progress',
    progress: 60,
    startDate: new Date('2024-01-08'),
    dueDate: new Date('2024-01-18'),
    createdAt: new Date('2024-01-08')
  },
  {
    _id: '6',
    title: 'Implement Real-time Notifications',
    description: 'Add WebSocket support for real-time notifications when tasks are assigned or updated.',
    assignedTo: { _id: '2', fullName: 'John Employee', email: 'employee@example.com', department: 'Development' },
    assignedBy: { _id: '1', fullName: 'Admin User' },
    priority: 'medium',
    category: 'Feature',
    status: 'new',
    progress: 0,
    startDate: new Date('2024-01-12'),
    dueDate: new Date('2024-01-25'),
    createdAt: new Date('2024-01-12')
  },
  {
    _id: '7',
    title: 'Write Unit Tests',
    description: 'Create comprehensive unit tests for all API endpoints and React components.',
    assignedTo: { _id: '2', fullName: 'John Employee', email: 'employee@example.com', department: 'Development' },
    assignedBy: { _id: '1', fullName: 'Admin User' },
    priority: 'low',
    category: 'Testing',
    status: 'overdue',
    progress: 20,
    startDate: new Date('2024-01-01'),
    dueDate: new Date('2024-01-05'),
    createdAt: new Date('2024-01-01')
  }
];

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ 
    page: 1, 
    limit: 10, 
    total: MOCK_TASKS.length, 
    pages: Math.ceil(MOCK_TASKS.length / 10) 
  });

  // Fetch tasks with filters
  const fetchTasks = async (filters = {}) => {
    setLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filteredTasks = [...MOCK_TASKS];
    
    // Apply filters
    if (filters.status) {
      filteredTasks = filteredTasks.filter(t => t.status === filters.status);
    }
    if (filters.priority) {
      filteredTasks = filteredTasks.filter(t => t.priority === filters.priority);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredTasks = filteredTasks.filter(t => 
        t.title.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedTasks = filteredTasks.slice(start, end);
    
    setTasks(paginatedTasks);
    setPagination({
      page: page,
      limit: limit,
      total: filteredTasks.length,
      pages: Math.ceil(filteredTasks.length / limit)
    });
    
    setLoading(false);
    return { tasks: paginatedTasks, pagination: pagination };
  };

  // Get single task by ID
  const getTask = async (id) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    const task = MOCK_TASKS.find(t => t._id === id);
    setLoading(false);
    return { success: true, task };
  };

  // Create new task
  const createTask = async (taskData) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newTask = {
      _id: String(Date.now()),
      ...taskData,
      assignedTo: { 
        _id: taskData.assignedTo, 
        fullName: taskData.assignedTo === '2' ? 'John Employee' : 'Employee User',
        email: 'employee@example.com'
      },
      assignedBy: { _id: '1', fullName: 'Admin User' },
      createdAt: new Date(),
      progress: 0,
      status: 'new'
    };
    
    MOCK_TASKS.unshift(newTask);
    setTasks([newTask, ...tasks]);
    toast.success('Task created successfully');
    setLoading(false);
    return { success: true, task: newTask };
  };

  // Update task
  const updateTask = async (id, taskData) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const index = MOCK_TASKS.findIndex(t => t._id === id);
    if (index !== -1) {
      MOCK_TASKS[index] = { ...MOCK_TASKS[index], ...taskData };
      setTasks(prev => prev.map(task => 
        task._id === id ? { ...task, ...taskData } : task
      ));
    }
    
    toast.success('Task updated successfully');
    setLoading(false);
    return { success: true };
  };

  // Delete task
  const deleteTask = async (id) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const index = MOCK_TASKS.findIndex(t => t._id === id);
    if (index !== -1) {
      MOCK_TASKS.splice(index, 1);
      setTasks(prev => prev.filter(task => task._id !== id));
    }
    
    toast.success('Task deleted successfully');
    setLoading(false);
    return true;
  };

  // Update task status
  const updateStatus = async (id, status) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const index = MOCK_TASKS.findIndex(t => t._id === id);
    if (index !== -1) {
      MOCK_TASKS[index].status = status;
      if (status === 'completed') {
        MOCK_TASKS[index].progress = 100;
        MOCK_TASKS[index].completionDate = new Date();
      }
      setTasks(prev => prev.map(task => 
        task._id === id ? { ...task, status, progress: status === 'completed' ? 100 : task.progress } : task
      ));
    }
    
    toast.success('Status updated');
    return { success: true };
  };

  // Update task progress
  const updateProgress = async (id, progress) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const index = MOCK_TASKS.findIndex(t => t._id === id);
    if (index !== -1) {
      MOCK_TASKS[index].progress = progress;
      if (progress === 100) {
        MOCK_TASKS[index].status = 'completed';
        MOCK_TASKS[index].completionDate = new Date();
      } else if (progress > 0 && MOCK_TASKS[index].status === 'new') {
        MOCK_TASKS[index].status = 'in-progress';
      }
      setTasks(prev => prev.map(task => 
        task._id === id ? { ...task, progress, status: progress === 100 ? 'completed' : task.status } : task
      ));
    }
    
    toast.success('Progress updated');
    return { success: true };
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        pagination,
        fetchTasks,
        getTask,
        createTask,
        updateTask,
        deleteTask,
        updateStatus,
        updateProgress,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);