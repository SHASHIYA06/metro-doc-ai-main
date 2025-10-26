import React, { useState, useEffect } from 'react';
import { Search, Upload, FileText, Download, Folder, ArrowLeft, CheckCircle, XCircle, Loader2, Settings, BarChart3, Database, Cloud, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';
import { googleDriveService } from '../services/googleDrive';
import { exportService } from '../services/exportService';
import { Enhanced3DBackground } from './Enhanced3DBackground';
import { StatusIndicator } from './StatusIndicator';
import { config } from '../config/environment';

// Types
interface SearchResult {
  id: string;
  title: string;
  content: string;
  system: string;
  subsystem: string;
  score: number;
  fileType: string;
  preview: string;
  sources: Array<{
    fileName: string;
    position: number;
    score: number;
    preview: string;
  }>;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  type: 'file' | 'folder';
}

interface DriveFolder {
  id: string;
  name: string;
  count: number;
}

interface BackendStats {
  totalChunks: number;
  totalFiles: number;
  indexSize: string;
}

type ConnectionStatus = 'connecting' | 'connected' | 'error';
type TabType = 'upload' | 'ai-search' | 'results' | 'drive' | 'stats';

export const MetroDashboard: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [driveConnectionStatus, setDriveConnectionStatus] = useState<ConnectionStatus>('connecting');
  
  // File management
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveFolders, setDriveFolders] = useState<DriveFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [folderHistory, setFolderHistory] = useState<Array<{id: string, name: string}>>([{id: 'root', name: 'Root'}]);
  
  // Filters and settings
  const [systemFilter, setSystemFilter] = useState('');
  const [subsystemFilter, setSubsystemFilter] = useState('');
  const [folderPath, setFolderPath] = useState('');
  const [totalIndexed, setTotalIndexed] = useState(0);
  const [backendStats, setBackendStats] = useState<BackendStats | null>(null);

  // Check connections on component mount
  useEffect(() => {
    checkBackendConnection();
    checkDriveConnection();
    loadBackendStats();
    loadDriveFolders();
    loadDriveFiles();
  }, []);

  const checkBackendConnection = async () => {
    try {
      setConnectionStatus('connecting');
      const isConnected = await apiService.testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'error');
      
      if (isConnected) {
        toast.success(`Backend connected: ${config.API_BASE_URL}`);
      } else {
        toast.error('Failed to connect to backend');
      }
    } catch (error) {
      console.error('Backend connection failed:', error);
      setConnectionStatus('error');
      toast.error('Backend connection failed');
    }
  };

  const checkDriveConnection = async () => {
    try {
      setDriveConnectionStatus('connecting');
      const isConnected = await googleDriveService.testConnection();
      setDriveConnectionStatus(isConnected ? 'connected' : 'error');
      
      if (isConnected) {
        toast.success('Google Drive connected successfully');
      } else {
        console.warn('Google Drive connection failed - using backend-only mode');
        toast.error('Google Drive unavailable - using backend storage');
      }
    } catch (error) {
      console.error('Drive connection failed:', error);
      setDriveConnectionStatus('error');
      toast.error('Google Drive unavailable - using backend storage');
    }
  };

  const loadBackendStats = async () => {
    try {
      const stats = await apiService.getStats();
      setBackendStats(stats);
      setTotalIndexed(stats.totalChunks);
    } catch (error) {
      console.error('Failed to load backend stats:', error);
    }
  };

  const loadDriveFolders = async () => {
    try {
      const folders = await googleDriveService.listFolders();
      setDriveFolders(folders);
    } catch (error) {
      console.error('Failed to load Drive folders:', error);
      toast.error('Failed to load Google Drive folders');
    }
  };

  const loadDriveFiles = async (folderId: string = currentFolderId) => {
    try {
      setLoading(true);
      const files = await googleDriveService.listFiles(folderId);
      setDriveFiles(files);
      toast.success(`Loaded ${files.length} files from Google Drive`);
    } catch (error) {
      console.error('Failed to load Drive files:', error);
      toast.error('Failed to load files from Google Drive');
    } finally {
      setLoading(false);
    }
  };

  const navigateToFolder = (folderId: string, folderName: string) => {
    setCurrentFolderId(folderId);
    setFolderHistory(prev => [...prev, {id: folderId, name: folderName}]);
    loadDriveFiles(folderId);
  };

  const navigateBack = () => {
    if (folderHistory.length <= 1) return;
    
    const newHistory = [...folderHistory];
    newHistory.pop();
    const previousFolder = newHistory[newHistory.length - 1];
    
    setFolderHistory(newHistory);
    setCurrentFolderId(previousFolder.id);
    loadDriveFiles(previousFolder.id);
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const createFolder = async () => {
    if (!folderPath.trim()) {
      toast.error('Please enter a folder path');
      return;
    }

    try {
      await googleDriveService.createFolder(folderPath, systemFilter, subsystemFilter);
      toast.success(`Folder created: ${folderPath}`);
      setFolderPath('');
      await loadDriveFolders();
    } catch (error: any) {
      toast.error(`Failed to create folder: ${error.message}`);
    }
  };

  const analyzeSelectedFiles = async () => {
    if (selectedFiles.size === 0) {
      toast.error('Please select files to analyze');
      return;
    }

    setIsProcessing(true);
    try {
      const selectedFilesList = driveFiles.filter(f => selectedFiles.has(f.id));
      toast.info(`Analyzing ${selectedFilesList.length} files from Google Drive...`);

      // Download file contents from Google Drive
      const filesWithContent = await Promise.all(
        selectedFilesList.map(async (file) => {
          try {
            const content = await googleDriveService.downloadFile(file.id);
            return {
              name: file.name,
              text: content.content || content.contentBase64 || '',
              meta: file.mimeType
            };
          } catch (error) {
            console.error(`Error downloading ${file.name}:`, error);
            return {
              name: file.name,
              text: `Error downloading file: ${error}`,
              meta: file.mimeType
            };
          }
        })
      );

      // Send to backend for AI analysis
      const response = await apiService.search(
        searchQuery || 'Analyze these selected documents for technical specifications and details',
        { k: 15 }
      );

      // Convert response to results
      const convertedResults: SearchResult[] = response.sources.map(source => ({
        id: source.ref.toString(),
        title: `${source.fileName} - ${source.system}/${source.subsystem}`,
        content: source.preview,
        system: source.system,
        subsystem: source.subsystem,
        score: source.score,
        fileType: 'PDF',
        preview: source.preview,
        sources: [{
          fileName: source.fileName,
          position: source.position,
          score: source.score,
          preview: source.preview
        }]
      }));

      setResults(convertedResults);
      setActiveTab('results');
      toast.success(`Analysis complete! Found ${convertedResults.length} relevant results`);

    } catch (error: any) {
      console.error('Analysis failed:', error);
      toast.error(`Analysis failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await apiService.search(searchQuery, { k: 15 });
      
      const convertedResults: SearchResult[] = response.sources.map(source => ({
        id: source.ref.toString(),
        title: `${source.fileName} - ${source.system}/${source.subsystem}`,
        content: source.preview,
        system: source.system,
        subsystem: source.subsystem,
        score: source.score,
        fileType: 'PDF',
        preview: source.preview,
        sources: [{
          fileName: source.fileName,
          position: source.position,
          score: source.score,
          preview: source.preview
        }]
      }));

      setResults(convertedResults);
      setActiveTab('results');
      toast.success(`Found ${convertedResults.length} relevant results`);
    } catch (error: any) {
      console.error('Search failed:', error);
      toast.error(`Search failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const fileArray = Array.from(files);
    let successCount = 0;
    let errorCount = 0;

    try {
      toast.info(`Starting upload of ${fileArray.length} file(s)...`);

      for (const file of fileArray) {
        try {
          toast.info(`Processing ${file.name}...`);
          
          // Try Google Drive upload first, but continue if it fails
          let driveSuccess = false;
          if (driveConnectionStatus === 'connected') {
            try {
              console.log('Uploading to Google Drive:', file.name);
              const driveResult = await googleDriveService.uploadFile(file, systemFilter, subsystemFilter);
              
              if (driveResult.success) {
                console.log('✅ Google Drive upload successful:', driveResult.fileId);
                driveSuccess = true;
              } else {
                console.warn('Google Drive upload failed:', driveResult.error);
              }
            } catch (driveError) {
              console.warn('Google Drive upload error:', driveError);
            }
          }
          
          // Always process with backend AI (this is the core functionality)
          console.log('Processing with backend AI:', file.name);
          await apiService.ingestFile(file, systemFilter, subsystemFilter);
          
          successCount++;
          const driveStatus = driveSuccess ? ' (saved to Google Drive)' : ' (backend only)';
          toast.success(`✅ ${file.name} processed successfully${driveStatus}`);
          
        } catch (fileError: any) {
          console.error(`Error processing ${file.name}:`, fileError);
          errorCount++;
          toast.error(`❌ ${file.name}: ${fileError.message}`);
        }
      }
      
      // Final summary
      if (successCount > 0) {
        toast.success(`🎉 Successfully processed ${successCount} file(s)!`);
        await loadBackendStats();
        await loadDriveFiles();
      }
      
      if (errorCount > 0) {
        toast.error(`⚠️ ${errorCount} file(s) failed to process`);
      }
      
    } catch (error: any) {
      console.error('Upload process failed:', error);
      toast.error(`Upload process failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
      // Clear the input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const exportResults = async (format: 'pdf' | 'word' | 'excel') => {
    if (results.length === 0) {
      toast.error('No results to export');
      return;
    }

    try {
      toast.info(`Generating ${format.toUpperCase()} export...`);
      
      const exportData = {
        query: searchQuery,
        results: results,
        timestamp: new Date().toISOString(),
        totalResults: results.length
      };

      await exportService.exportResults(exportData, format);
      toast.success(`${format.toUpperCase()} export completed successfully!`);
    } catch (error: any) {
      console.error('Export failed:', error);
      toast.error(`Export failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      <Enhanced3DBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            KMRCL Metro Intelligence
          </h1>
          <p className="text-xl text-blue-200 mb-6">
            AI-Powered Document Analysis & Google Drive Integration
          </p>
          
          {/* Status Indicators */}
          <div className="flex justify-center gap-6 mb-8">
            <StatusIndicator 
              label="Backend" 
              status={connectionStatus} 
              onClick={checkBackendConnection}
            />
            <StatusIndicator 
              label="Google Drive" 
              status={driveConnectionStatus} 
              onClick={checkDriveConnection}
            />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { id: 'upload', label: 'Upload', icon: Upload },
            { id: 'ai-search', label: 'AI Search', icon: Search },
            { id: 'drive', label: 'Google Drive', icon: Cloud },
            { id: 'results', label: 'Results', icon: FileText },
            { id: 'stats', label: 'Statistics', icon: BarChart3 }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as TabType)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeTab === id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white/10 text-blue-200 hover:bg-white/20 backdrop-blur-sm'
              }`}
            >
              <Icon size={20} />
              {label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-8">
          
          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Upload Documents</h2>
              
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <input
                  type="text"
                  placeholder="System (e.g., Signaling, Power)"
                  value={systemFilter}
                  onChange={(e) => setSystemFilter(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <input
                  type="text"
                  placeholder="Subsystem (e.g., CBTC, Traction)"
                  value={subsystemFilter}
                  onChange={(e) => setSubsystemFilter(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* File Upload */}
              <div 
                className="border-2 border-dashed border-blue-400 rounded-lg p-8 text-center transition-colors hover:border-blue-300 hover:bg-blue-400/5"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('border-blue-300', 'bg-blue-400/10');
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-blue-300', 'bg-blue-400/10');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-blue-300', 'bg-blue-400/10');
                  const files = e.dataTransfer.files;
                  if (files.length > 0) {
                    const fakeEvent = {
                      target: { files, value: '' }
                    } as React.ChangeEvent<HTMLInputElement>;
                    handleFileUpload(fakeEvent);
                  }
                }}
              >
                <Upload className="mx-auto mb-4 text-blue-400" size={48} />
                <p className="text-blue-200 mb-4">
                  Drag and drop files here, or click to select
                </p>
                <p className="text-blue-300 text-sm mb-4">
                  Supports: PDF, DOC, DOCX, TXT, CSV, XLSX, XLS, Images
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.gif,.bmp,.tiff"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={isProcessing}
                />
                <label
                  htmlFor="file-upload"
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg cursor-pointer transition-colors ${
                    isProcessing 
                      ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                  {isProcessing ? 'Processing...' : 'Select Files'}
                </label>
              </div>

              {isProcessing && (
                <div className="flex items-center justify-center gap-3 text-blue-200">
                  <Loader2 className="animate-spin" size={24} />
                  Processing files...
                </div>
              )}
            </div>
          )}

          {/* AI Search Tab */}
          {activeTab === 'ai-search' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">AI-Powered Search</h2>
              
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Ask anything about your documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  onClick={handleSearch}
                  disabled={isProcessing}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                  Search
                </button>
              </div>

              <div className="text-blue-200 text-sm">
                <p>💡 Try asking: "What are the voltage requirements for traction power?" or "Show me signaling system specifications"</p>
              </div>
            </div>
          )}

          {/* Google Drive Tab */}
          {activeTab === 'drive' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Google Drive Files</h2>
                <button
                  onClick={() => loadDriveFiles()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>

              {/* Folder Navigation */}
              <div className="flex items-center gap-2 text-blue-200">
                <button
                  onClick={navigateBack}
                  disabled={folderHistory.length <= 1}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft size={16} />
                </button>
                <span className="text-sm">
                  {folderHistory.map((folder, index) => (
                    <span key={folder.id}>
                      {index > 0 && ' / '}
                      {folder.name}
                    </span>
                  ))}
                </span>
              </div>

              {/* Create Folder */}
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="New folder path (e.g., Signaling/CBTC)"
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  onClick={createFolder}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Folder size={16} />
                  Create
                </button>
              </div>

              {/* File List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-blue-400" size={32} />
                  </div>
                ) : (
                  driveFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                        selectedFiles.has(file.id)
                          ? 'bg-blue-600/20 border-blue-400'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                      onClick={() => {
                        if (file.type === 'folder') {
                          navigateToFolder(file.id, file.name);
                        } else {
                          toggleFileSelection(file.id);
                        }
                      }}
                    >
                      {file.type === 'folder' ? (
                        <Folder className="text-yellow-400" size={20} />
                      ) : (
                        <FileText className="text-blue-400" size={20} />
                      )}
                      <div className="flex-1">
                        <p className="text-white font-medium">{file.name}</p>
                        {file.size && (
                          <p className="text-blue-200 text-sm">
                            {Math.round(parseInt(file.size) / 1024)} KB
                          </p>
                        )}
                      </div>
                      {file.type === 'file' && selectedFiles.has(file.id) && (
                        <CheckCircle className="text-green-400" size={20} />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Analyze Selected Files */}
              {selectedFiles.size > 0 && (
                <div className="flex items-center justify-between p-4 bg-blue-600/20 rounded-lg border border-blue-400">
                  <span className="text-white">
                    {selectedFiles.size} file(s) selected
                  </span>
                  <button
                    onClick={analyzeSelectedFiles}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                    Analyze with AI
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Results Tab */}
          {activeTab === 'results' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Search Results</h2>
                {results.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportResults('pdf')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <Download size={16} />
                      PDF
                    </button>
                    <button
                      onClick={() => exportResults('word')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Download size={16} />
                      Word
                    </button>
                    <button
                      onClick={() => exportResults('excel')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <Download size={16} />
                      Excel
                    </button>
                  </div>
                )}
              </div>

              {results.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="mx-auto mb-4 text-blue-400" size={48} />
                  <p className="text-blue-200">No results yet. Try searching or analyzing files.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {results.map((result) => (
                    <div key={result.id} className="bg-white/5 rounded-lg p-6 border border-white/10">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-white">{result.title}</h3>
                        <span className="text-sm text-blue-300 bg-blue-600/20 px-2 py-1 rounded">
                          {Math.round(result.score * 100)}% match
                        </span>
                      </div>
                      <p className="text-blue-200 mb-3">{result.preview}</p>
                      <div className="flex gap-4 text-sm text-blue-300">
                        <span>System: {result.system}</span>
                        <span>Subsystem: {result.subsystem}</span>
                        <span>Type: {result.fileType}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">System Statistics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <Database className="text-blue-400" size={24} />
                    <h3 className="text-lg font-semibold text-white">Documents</h3>
                  </div>
                  <p className="text-3xl font-bold text-blue-400">
                    {backendStats?.totalFiles || 0}
                  </p>
                  <p className="text-blue-200 text-sm">Total files indexed</p>
                </div>

                <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <FileText className="text-green-400" size={24} />
                    <h3 className="text-lg font-semibold text-white">Chunks</h3>
                  </div>
                  <p className="text-3xl font-bold text-green-400">
                    {backendStats?.totalChunks || 0}
                  </p>
                  <p className="text-blue-200 text-sm">Text chunks processed</p>
                </div>

                <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <Cloud className="text-purple-400" size={24} />
                    <h3 className="text-lg font-semibold text-white">Drive Files</h3>
                  </div>
                  <p className="text-3xl font-bold text-purple-400">
                    {driveFiles.length}
                  </p>
                  <p className="text-blue-200 text-sm">Files in current folder</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">System Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-200">Backend URL:</span>
                    <p className="text-white font-mono">{config.API_BASE_URL}</p>
                  </div>
                  <div>
                    <span className="text-blue-200">Google Drive Folder:</span>
                    <p className="text-white font-mono">{config.MAIN_FOLDER_ID}</p>
                  </div>
                  <div>
                    <span className="text-blue-200">Version:</span>
                    <p className="text-white">{config.VERSION}</p>
                  </div>
                  <div>
                    <span className="text-blue-200">Environment:</span>
                    <p className="text-white capitalize">{config.ENVIRONMENT}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};