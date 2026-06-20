import React from 'react';
import { NavLink } from 'react-router-dom';
import { filmessageSquare } from 'react-icons/fi';
import { 
  FiHome, 
  FiCheckSquare, 
  FiUsers, 
  FiBarChart2, 
  FiUser, 
  FiMessageSquare,
  FiX
} from 'react-icons/fi';

const Sidebar = ({ userRole, onToggle, isMobileOpen, onMobileClose }) => {
  const isAdmin = userRole === 'admin';

  const menuItems = [
    { path: '/dashboard', icon: FiHome, label: 'Dashboard' },
    { path: '/tasks', icon: FiCheckSquare, label: 'Tasks' },
    { path: '/chat', icon: FiMessageSquare, label: 'Chat' },
    ...(isAdmin ? [{ path: '/employees', icon: FiUsers, label: 'Employees' }] : []),
    ...(isAdmin ? [{ path: '/reports', icon: FiBarChart2, label: 'Reports' }] : []),
    { path: '/profile', icon: FiUser, label: 'Profile' },
  ];

  return (
    <>
      {/* ✅ Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-16 h-full bg-white shadow-md z-20 transition-all duration-300 overflow-y-auto">
        <nav className="p-4 space-y-1 w-64">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* ✅ Mobile Sidebar - Slide from left */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 lg:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <span className="text-lg font-bold text-gray-800">TaskFlow Pro</span>
          <button onClick={onMobileClose} className="p-2 text-gray-600 hover:text-gray-800">
            <FiX className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onMobileClose}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;