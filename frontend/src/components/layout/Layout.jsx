import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../../hooks/useAuth';

const Layout = () => {
  const { user } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      
      <div className="flex">
        {/* ✅ Mobile Sidebar - Overlay */}
        <div 
          className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          } lg:hidden`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        <Sidebar 
          userRole={user?.role}
          onToggle={setIsSidebarCollapsed}
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
        />
        
        <main className={`flex-1 p-4 md:p-6 mt-16 transition-all duration-300 ${
          isSidebarCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-64'
        }`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;