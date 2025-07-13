import React from 'react';
import Sidebar from './Sidebar';
import FloatingChatBot from './components/FloatingChatBot';
import { Outlet } from 'react-router-dom';

export default function MainLayout() {
  return (
    <div className="flex overflow-hidden bg-white pt-0" dir="rtl">
      <Sidebar />
      <main className="flex-1 bg-gray-50 min-h-screen p-6 text-right mr-64 pb-20">
        <Outlet />
      </main>
      <FloatingChatBot />
    </div>
  );
}
