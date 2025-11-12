import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, BarChart3, Settings, Home, Microscope, 
  Database, Zap, ArrowRight 
} from 'lucide-react';

export default function NavigationHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    {
      path: '/',
      label: 'Enhanced Search',
      icon: Microscope,
      description: 'Advanced AI search with matrix/table support',
      color: 'from-blue-500 to-purple-600'
    },
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      description: 'System monitoring and analytics',
      color: 'from-green-500 to-blue-600'
    },
    {
      path: '/simple',
      label: 'Simple Mode',
      icon: Search,
      description: 'Original interface',
      color: 'from-gray-500 to-gray-600'
    }
  ];

  const currentItem = navigationItems.find(item => item.path === location.pathname) || navigationItems[0];

  return (
    <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 border-b border-white/20">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Current Page */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Database className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <currentItem.icon size={20} className="text-blue-400" />
                BEML Metro Intelligence - {currentItem.label}
              </h1>
              <p className="text-blue-200 text-sm">{currentItem.description}</p>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="flex items-center gap-2">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    isActive
                      ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                  {isActive && <ArrowRight size={14} className="opacity-70" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feature Highlights */}
        {location.pathname === '/' && (
          <div className="mt-4 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">
              <Zap size={14} />
              <span>Multiple File Selection</span>
            </div>
            <div className="flex items-center gap-2 bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full">
              <Database size={14} />
              <span>Matrix/Table Format</span>
            </div>
            <div className="flex items-center gap-2 bg-green-500/20 text-green-300 px-3 py-1 rounded-full">
              <Microscope size={14} />
              <span>Drawing Analysis</span>
            </div>
            <div className="flex items-center gap-2 bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full">
              <Settings size={14} />
              <span>Advanced Filters</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}