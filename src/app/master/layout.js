'use client';
import React from 'react';
import AdminSidebar from '../components/master/adminSidebar';

export default function MasterLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-4">
        {children}
      </main>
    </div>
  );
}