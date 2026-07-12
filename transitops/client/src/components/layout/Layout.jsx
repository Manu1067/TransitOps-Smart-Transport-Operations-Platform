import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <Navbar onMenuToggle={() => setSidebarOpen(true)} />

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
