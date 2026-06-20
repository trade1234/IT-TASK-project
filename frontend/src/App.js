import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { TaskProvider } from './contexts/TaskContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import TaskDetails from './pages/TaskDetails';
import CreateTask from './pages/CreateTask';
import EditTask from './pages/EditTask';
import Employees from './pages/Employees';
import CreateEmployee from './pages/CreateEmployee';
import EditEmployee from './pages/EditEmployee';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Chat from './pages/Chat'; // ✅ ADD THIS
import NotFound from './pages/NotFound';

// Components
import Layout from './components/layout/Layout';
import PrivateRoute from './components/common/PrivateRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <TaskProvider>
          <NotificationProvider>
            <Toaster position="top-right" />
            <Routes>
              {/* Public route */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected routes with Layout */}
              <Route 
                path="/" 
                element={
                  <PrivateRoute>
                    <Layout />
                  </PrivateRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="tasks/:id" element={<TaskDetails />} />
                <Route path="tasks/create" element={<CreateTask />} />
                <Route path="tasks/edit/:id" element={<EditTask />} />
                <Route path="employees" element={<Employees />} />
                <Route path="employees/create" element={<CreateEmployee />} />
                <Route path="employees/edit/:id" element={<EditEmployee />} />
                <Route path="reports" element={<Reports />} />
                <Route path="profile" element={<Profile />} />
                <Route path="chat" element={<Chat />} /> {/* ✅ ADD THIS */}
              </Route>
              
              {/* 404 - Not Found - MUST BE LAST */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </NotificationProvider>
        </TaskProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;