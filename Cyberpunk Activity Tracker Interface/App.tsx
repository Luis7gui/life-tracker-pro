import React, { useState } from 'react';
import { CyberSidebar } from './components/CyberSidebar';
import { ActivityTracker } from './components/ActivityTracker';
import { DitheredBackground } from './components/DitheredBackground';

export default function App() {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderMainContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <ActivityTracker />;
      case 'goals':
        return (
          <div className="flex-1 bg-black text-white cyber-interface p-4">
            <div className="cyber-panel p-6 text-center">
              <h2 className="font-mono text-xl font-bold terminal-text mb-4">GOAL SYSTEM</h2>
              <p className="font-mono text-gray-400">Neural pathway optimization in progress...</p>
            </div>
          </div>
        );
      case 'timer':
        return (
          <div className="flex-1 bg-black text-white cyber-interface p-4">
            <div className="cyber-panel p-6 text-center">
              <h2 className="font-mono text-xl font-bold terminal-text mb-4">TIMER MODULE</h2>
              <p className="font-mono text-gray-400">Temporal tracking interface offline...</p>
            </div>
          </div>
        );
      case 'data':
        return (
          <div className="flex-1 bg-black text-white cyber-interface p-4">
            <div className="cyber-panel p-6 text-center">
              <h2 className="font-mono text-xl font-bold terminal-text mb-4">DATA ARCHIVE</h2>
              <p className="font-mono text-gray-400">Accessing neural memory banks...</p>
            </div>
          </div>
        );
      case 'config':
        return (
          <div className="flex-1 bg-black text-white cyber-interface p-4">
            <div className="cyber-panel p-6 text-center">
              <h2 className="font-mono text-xl font-bold terminal-text mb-4">SYSTEM CONFIG</h2>
              <p className="font-mono text-gray-400">Interface parameters loading...</p>
            </div>
          </div>
        );
      case 'alert':
        return (
          <div className="flex-1 bg-black text-white cyber-interface p-4">
            <div className="cyber-panel p-6 text-center border-red-500 border-2">
              <h2 className="font-mono text-xl font-bold text-red-500 glitch-text mb-4">ALERT SYSTEM</h2>
              <p className="font-mono text-red-400">WARNING: System anomaly detected...</p>
            </div>
          </div>
        );
      default:
        return <ActivityTracker />;
    }
  };

  return (
    <div className="size-full bg-black text-white relative overflow-hidden">
      {/* Background Effects */}
      <DitheredBackground />
      
      {/* Main Interface */}
      <div className="relative z-10 h-full flex">
        <CyberSidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
        />
        {renderMainContent()}
      </div>
    </div>
  );
}