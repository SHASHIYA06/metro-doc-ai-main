import React, { useState, useEffect } from 'react';
import { 
  Search, Upload, FileText, Loader2, CheckCircle, AlertCircle, 
  FolderOpen, File, RefreshCw, Download, Eye, Filter, FileDown, 
  FileSpreadsheet, FileText as FileTextIcon, Grid, List, 
  Settings, Database, Cloud, Zap, BarChart3, Users, Shield,
  Layers, Box, Cpu, HardDrive, Network, Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DashboardStats {
  totalFiles: number;
  totalFolders: number;
  totalSize: string;
  recentUploads: number;
  searchQueries: number;
  activeUsers: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
  storageUsed: number;
  storageTotal: number;
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  storage: number;
  network: number;
  uptime: string;
  lastBackup: string;
}

export default function EnhancedMetroDashboard() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalFiles: 1247,
    totalFolders: 89,
    totalSize: '15.7 GB',
    recentUploads: 23,
    searchQueries: 156,
    activeUsers: 12,
    systemHealth: 'excellent',
    storageUsed: 15.7,
    storageTotal: 100
  });

  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu: 23,
    memory: 67,
    storage: 45,
    network: 89,
    uptime: '15 days, 7 hours',
    lastBackup: '2 hours ago'
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'analytics' | 'settings'>('overview');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">    
  {/* Navigation Tabs */}
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center gap-2 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'files', label: 'File Manager', icon: FolderOpen },
            { id: 'analytics', label: 'Analytics', icon: Activity },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-400/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500/30 rounded-xl">
                    <FileText className="text-blue-300" size={24} />
                  </div>
                  <span className="text-green-400 text-sm font-medium">+12%</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{dashboardStats.totalFiles.toLocaleString()}</h3>
                <p className="text-blue-200 text-sm">Total Documents</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-400/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-500/30 rounded-xl">
                    <FolderOpen className="text-purple-300" size={24} />
                  </div>
                  <span className="text-green-400 text-sm font-medium">+5%</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{dashboardStats.totalFolders}</h3>
                <p className="text-purple-200 text-sm">Active Folders</p>
              </div>

              <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-2xl p-6 border border-green-400/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-500/30 rounded-xl">
                    <Search className="text-green-300" size={24} />
                  </div>
                  <span className="text-green-400 text-sm font-medium">+28%</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{dashboardStats.searchQueries}</h3>
                <p className="text-green-200 text-sm">AI Searches Today</p>
              </div>

              <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-sm rounded-2xl p-6 border border-orange-400/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-500/30 rounded-xl">
                    <Users className="text-orange-300" size={24} />
                  </div>
                  <span className="text-green-400 text-sm font-medium">+3</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{dashboardStats.activeUsers}</h3>
                <p className="text-orange-200 text-sm">Active Users</p>
              </div>
            </div>

            {/* System Health & Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* System Health */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Shield className="text-green-400" size={20} />
                  System Health
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Overall Status</span>
                    <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-medium">
                      Excellent
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { label: 'CPU Usage', value: systemMetrics.cpu, color: 'blue' },
                      { label: 'Memory', value: systemMetrics.memory, color: 'purple' },
                      { label: 'Storage', value: systemMetrics.storage, color: 'green' },
                      { label: 'Network', value: systemMetrics.network, color: 'orange' }
                    ].map((metric) => (
                      <div key={metric.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-white/80">{metric.label}</span>
                          <span className="text-white">{metric.value}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full bg-gradient-to-r from-${metric.color}-400 to-${metric.color}-500`}
                            style={{ width: `${metric.value}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Storage Overview */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <HardDrive className="text-blue-400" size={20} />
                  Storage Overview
                </h3>
                
                <div className="text-center mb-6">
                  <div className="relative w-32 h-32 mx-auto">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="2"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="2"
                        strokeDasharray={`${(dashboardStats.storageUsed / dashboardStats.storageTotal) * 100}, 100`}
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#8B5CF6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{Math.round((dashboardStats.storageUsed / dashboardStats.storageTotal) * 100)}%</div>
                        <div className="text-xs text-white/60">Used</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/80">Used Space</span>
                    <span className="text-white">{dashboardStats.totalSize}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/80">Available</span>
                    <span className="text-white">{(dashboardStats.storageTotal - dashboardStats.storageUsed).toFixed(1)} GB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/80">Total Capacity</span>
                    <span className="text-white">{dashboardStats.storageTotal} GB</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Activity className="text-green-400" size={20} />
                Recent Activity
              </h3>
              
              <div className="space-y-4">
                {[
                  { action: 'Document uploaded', file: 'B8_Service_Manual.pdf', user: 'Admin', time: '2 minutes ago', type: 'upload' },
                  { action: 'AI search performed', file: 'Door System Specs', user: 'Engineer_01', time: '5 minutes ago', type: 'search' },
                  { action: 'Folder created', file: 'Safety Protocols', user: 'Manager', time: '12 minutes ago', type: 'folder' },
                  { action: 'Document analyzed', file: 'Wiring_Diagram_v2.dwg', user: 'System', time: '18 minutes ago', type: 'analysis' },
                  { action: 'Export completed', file: 'Technical_Report.xlsx', user: 'Engineer_02', time: '25 minutes ago', type: 'export' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'upload' ? 'bg-blue-500/20 text-blue-300' :
                      activity.type === 'search' ? 'bg-green-500/20 text-green-300' :
                      activity.type === 'folder' ? 'bg-purple-500/20 text-purple-300' :
                      activity.type === 'analysis' ? 'bg-orange-500/20 text-orange-300' :
                      'bg-pink-500/20 text-pink-300'
                    }`}>
                      {activity.type === 'upload' && <Upload size={16} />}
                      {activity.type === 'search' && <Search size={16} />}
                      {activity.type === 'folder' && <FolderOpen size={16} />}
                      {activity.type === 'analysis' && <Cpu size={16} />}
                      {activity.type === 'export' && <Download size={16} />}
                    </div>
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">{activity.action}</div>
                      <div className="text-white/60 text-xs">{activity.file} • by {activity.user}</div>
                    </div>
                    <div className="text-white/40 text-xs">{activity.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Other tabs content would go here */}
        {activeTab !== 'overview' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              {activeTab === 'files' && '📁 Enhanced File Manager'}
              {activeTab === 'analytics' && '📊 Advanced Analytics'}
              {activeTab === 'settings' && '⚙️ System Settings'}
            </h3>
            <p className="text-white/70 mb-6">
              This section will contain the enhanced {activeTab} functionality.
            </p>
            <div className="text-blue-300">
              Coming in the next update...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}