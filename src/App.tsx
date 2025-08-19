/**
 * Life Tracker Pro - Main App Component
 * Clean app component without Redux Provider (handled in index.tsx)
 */

import React from 'react';
import { Toaster } from 'sonner';
import CyberpunkDashboard from './pages/dashboard/CyberpunkDashboard';

// Main App Component with Cyberpunk Dashboard and Notifications
const App: React.FC = () => {
  return (
    <>
      <CyberpunkDashboard />
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#1a1612',
            color: '#d4c4a0',
            border: '2px solid #cd853f',
            fontFamily: 'Courier New, monospace',
            fontWeight: 'bold',
            borderRadius: '4px',
          },
        }}
      />
    </>
  );
};

export default App;
