import React from 'react';
import { Monitor, Clock, BarChart3, User, Settings, Power } from 'lucide-react';

interface CyberSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function CyberSidebar({ activeSection, onSectionChange }: CyberSidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'STATS', icon: BarChart3 },
    { id: 'goals', label: 'GOALS', icon: Clock },
    { id: 'timer', label: 'TIMER', icon: Monitor },
    { id: 'data', label: 'DATA', icon: User },
    { id: 'config', label: 'CONFIG', icon: Settings },
    { id: 'alert', label: 'ALERT', icon: Power },
  ];

  return (
    <div className="w-28 bg-gradient-to-b from-gray-900 to-black border-r-2 border-gray-700 cyber-interface relative">
      {/* Header */}
      <div className="p-3 border-b-2 border-gray-700">
        <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 border-2 border-gray-300 flex items-center justify-center rounded-sm shadow-lg">
          <div className="w-5 h-5 bg-white rounded-sm"></div>
        </div>
        <div className="text-gray-200 text-xs mt-2 font-mono tracking-wider">CYBER_AI</div>
        <div className="text-gray-500 text-xs font-mono">v2.1.0</div>
      </div>

      {/* Menu Items */}
      <div className="p-3 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          const isAlert = item.id === 'alert';
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`
                w-full p-3 border-2 transition-all duration-200 font-mono text-xs font-bold rounded-sm
                relative overflow-hidden group
                ${isActive 
                  ? 'bg-gradient-to-r from-red-600 to-red-700 border-red-400 text-white shadow-lg' 
                  : isAlert
                  ? 'bg-red-600 border-red-400 text-white pulse-glow'
                  : 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:border-red-500 hover:text-red-400'
                }
              `}
            >
              <div className="relative z-10">
                <Icon className="w-5 h-5 mx-auto mb-2" />
                <div className="tracking-wider">{item.label}</div>
              </div>
              
              {/* Hover effect overlay */}
              {!isActive && !isAlert && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent 
                               translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Status Indicator */}
      <div className="absolute bottom-6 left-3 right-3">
        <div className="cyber-card p-3">
          <div className="status-bar mb-2">
            <div className="status-fill w-3/4"></div>
          </div>
          <div className="text-gray-200 text-xs font-mono text-center">PWR: 74%</div>
          <div className="text-gray-500 text-xs font-mono text-center mt-1">STABLE</div>
        </div>
      </div>

      {/* Ambient glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent pointer-events-none"></div>
    </div>
  );
}