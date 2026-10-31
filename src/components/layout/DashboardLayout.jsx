import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export const DashboardLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          isCollapsed={isCollapsed}
          toggleCollapsed={() => setIsCollapsed(!isCollapsed)}
        />
      </div>

      {/* Mobile Sidebar Overlay Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-white z-50 shadow-2xl">
            <Sidebar
              isCollapsed={false}
              toggleCollapsed={() => setIsMobileOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Workspace Frame */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        <TopNav toggleMobileSidebar={() => setIsMobileOpen(!isMobileOpen)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

