/**
 * Life Tracker Pro - Main App Component
 * Clean app component without Redux Provider (handled in index.tsx)
 */

import React from 'react';
import { Toaster } from 'sonner';
import SimpleDashboard from './pages/dashboard/SimpleDashboard';

// Main App Component with Simple Dashboard and Notifications
const App: React.FC = () => {
  return (
    <>
      <SimpleDashboard />
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#ffffff',
            border: '2px solid #dc2626',
            fontFamily: 'monospace',
            fontWeight: 'bold',
          },
        }}
      />
    </>
  );
};

export default App;
