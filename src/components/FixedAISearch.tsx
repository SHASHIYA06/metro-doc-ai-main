import React, { useState, useEffect } from 'react';
import { 
  Search, Upload, FileText, Loader2, CheckCircle, AlertCircle, 
  FolderOpen, File, RefreshCw, Download, Eye, Filter, X,
  ArrowLeft, Home, Folder, FileIcon, Image, FileSpreadsheet
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { googleDriveFixedService, DriveFile, FileContent } from '../services/googleDriveFixed';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  relevanceScore: number;
  fileId: string;
  fileName: string;
  preview: string;
}

const config = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://metro-doc-ai-main.onrender.com'
};

export default function FixedAISearch() {
  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveFolders, setDriveFolders] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [folderPath, setFolderPath] = useState<string[]>(['BEML DOCUMENTS']);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  
  // UI state
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [backendStats, setBackendStats] = useState<any>(null);

  // Initialize application
  useEffect(() => {
    initializeApplication();
  }, []);

  // Clear search when file changes
  useEffect(() => {
    if (selectedFile) {
      // Clear previous search results and query
      setSearchQuery('');
      setSearchResults([]);
      setFileContent(null);
      console.log(`🔄 Cleared search state for new file: ${selectedFile.name}`);
    }
  }, [selectedFile]);

  const initializeApplication = async () => {
    setIsLoading(true);
    try {
      console.log('🔧 Initializing Fixed AI Search application...');
      
      // Initialize Google Drive service
      await googleDriveFixedService.initialize();
      setIsConnected(googleDriveFixedService.isConnected());
      
      // Load initial data
      await Promise.all([
        loadFolders(),
        loadFiles('root'),
        loadBackendStats()
      ]);
      
      toast.success('✅ Application initialized successfully');
      console.log('✅ Fixed AI Search application ready');
      
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      toast.error(`❌ Initialization failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      console.log('📁 Loading BEML DOCUMENTS folders...');
      const folders = await googleDriveFixedService.loadFolders();
      setDriveFolders(folders);
      console.log(`✅ Loaded ${folders.length} folders`);
    } catch (error) {
      console.error('❌ Failed to load folders:', error);
      toast.error('❌ Failed to load folders');
    }
  };

  const loadFiles = async (folderId: string = 'root') => {
    try {
      console.log(`📁 Loading files from folder: ${folderId}`);
      setIsLoading(true);
      
      // Load actual files from the specified folder
      const files = await googleDriveFixedService.loadFiles(folderId);
      setDriveFiles(files);
      setCurrentFolderId(folderId);
      
      console.log(`✅ Loaded ${files.length} files from folder`);
      
      if (files.length === 0) {
        toast.info('📁 This folder is empty or no files are accessible');
      } else {
        const folderCount = files.filter(f => f.type === 'folder').length;
        const fileCount = files.filter(f => f.type === 'file').length;
        toast.success(`📊 Loaded ${folderCount} folders and ${fileCount} files`);
      }
      
    } catch (error) {
      console.error('❌ Failed to load files:', error);
      toast.error('❌ Failed to load files from folder');
      setDriveFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBackendStats = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/stats`);
      if (response.ok) {
        const stats = await response.json();
        setBackendStats(stats);
      }
    } catch (error) {
      console.warn('Failed to load backend stats:', error);
    }
  };

  const handleFolderClick = async (folder: DriveFile) => {
    if (folder.type !== 'folder') return;
    
    try {
      console.log(`📁 Opening folder: ${folder.name}`);
      
      // Update folder path
      const newPath = [...folderPath, folder.name];
      setFolderPath(newPath);
      
      // Load files from the selected folder
      await loadFiles(folder.id);
      
      // Clear selected file when changing folders
      setSelectedFile(null);
      setSearchQuery('');
      setSearchResults([]);
      setFileContent(null);
      
    } catch (error) {
      console.error('❌ Failed to open folder:', error);
      toast.error(`❌ Failed to open folder: ${folder.name}`);
    }
  };

  const handleBackClick = async () => {
    if (folderPath.length <= 1) return;
    
    try {
      // Go back to parent folder
      const newPath = folderPath.slice(0, -1);
      setFolderPath(newPath);
      
      // Load parent folder (simplified - in real implementation you'd track parent IDs)
      if (newPath.length === 1) {
        await loadFiles('root');
      } else {
        // For now, go back to root - in real implementation, track parent folder IDs
        await loadFiles('root');
      }
      
      // Clear selected file when navigating
      setSelectedFile(null);
      setSearchQuery('');
      setSearchResults([]);
      setFileContent(null);
      
    } catch (error) {
      console.error('❌ Failed to navigate back:', error);
      toast.error('❌ Failed to navigate back');
    }
  };

  const handleFileSelect = async (file: DriveFile) => {
    if (file.type === 'folder') {
      await handleFolderClick(file);
      return;
    }

    try {
      console.log(`📄 Selecting file: ${file.name}`);
      setSelectedFile(file);
      setIsProcessing(true);
      
      // Clear previous search state immediately
      setSearchQuery('');
      setSearchResults([]);
      setFileContent(null);
      
      toast(`📄 Processing ${file.name}...`);
      
      // Extract file content
      const content = await googleDriveFixedService.extractFileContent(file.id);
      setFileContent(content);
      
      // Clear backend and upload new content
      await fetch(`${config.API_BASE_URL}/clear`, { method: 'POST' });
      
      // Upload to backend for AI search
      const formData = new FormData();
      const blob = new Blob([content.content], { type: 'text/plain' });
      formData.append('files', blob, file.name);
      formData.append('system', `BEML DOCUMENTS - ${file.name}`);
      formData.append('subsystem', 'Google Drive File');

      const uploadResponse = await fetch(`${config.API_BASE_URL}/ingest`, {
        method: 'POST',
        body: formData
      });

      if (uploadResponse.ok) {
        const result = await uploadResponse.json();
        console.log(`✅ File processed: ${result.added} chunks added`);
        toast.success(`✅ ${file.name} is ready for AI search!`);
        
        // Refresh backend stats
        await loadBackendStats();
      } else {
        throw new Error('Failed to upload file to backend');
      }
      
    } catch (error) {
      console.error('❌ Failed to process file:', error);
      toast.error(`❌ Failed to process ${file.name}: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsSearching(true);
    
    try {
      console.log(`🔍 Searching for "${searchQuery}" in ${selectedFile.name}`);
      
      // Enhanced query for better results
      let enhancedQuery = searchQuery.trim();
      
      // Add context for specific searches
      if (searchQuery.toLowerCase().includes('circuit diagram')) {
        enhancedQuery = `Find and describe any circuit diagrams, electrical schematics, or wiring diagrams related to "${searchQuery}". If no specific diagram is found, provide technical information about circuits mentioned in the document.`;
      } else if (searchQuery.toLowerCase().includes('diagram')) {
        enhancedQuery = `Find and describe any diagrams, drawings, or visual representations related to "${searchQuery}". Include technical details and specifications.`;
      } else if (searchQuery.toLowerCase().includes('specification')) {
        enhancedQuery = `Find technical specifications, parameters, and requirements related to "${searchQuery}". Present the information in a structured format.`;
      }

      const searchResponse = await fetch(`${config.API_BASE_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: enhancedQuery,
          k: 5,
          system: `BEML DOCUMENTS - ${selectedFile.name}`,
          subsystem: 'Google Drive File'
        })
      });

      if (!searchResponse.ok) {
        throw new Error(`Search failed: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      console.log('📊 Search response:', searchData);

      if (searchData.result && !searchData.result.includes('No relevant documents found')) {
        // Create single, most relevant result
        const result: SearchResult = {
          id: 'search_result',
          title: `🎯 Search Result for "${searchQuery}"`,
          content: searchData.result,
          relevanceScore: 1.0,
          fileId: selectedFile.id,
          fileName: selectedFile.name,
          preview: searchData.result.substring(0, 300) + (searchData.result.length > 300 ? '...' : '')
        };

        setSearchResults([result]);
        toast.success(`✅ Found relevant information in ${selectedFile.name}`);
      } else {
        // No results found
        const noResult: SearchResult = {
          id: 'no_result',
          title: `🔍 No Results Found`,
          content: `No relevant information found for "${searchQuery}" in ${selectedFile.name}.

**Suggestions:**
• Try different keywords or phrases
• Use more specific technical terms
• Check if the information exists in this file
• Try searching for related concepts

**File Information:**
• Name: ${selectedFile.name}
• Type: ${selectedFile.mimeType}
• Content: ${fileContent?.content.length || 0} characters`,
          relevanceScore: 0,
          fileId: selectedFile.id,
          fileName: selectedFile.name,
          preview: `No results found for "${searchQuery}"`
        };

        setSearchResults([noResult]);
        toast.info(`🔍 No results found for "${searchQuery}" in ${selectedFile.name}`);
      }

    } catch (error) {
      console.error('❌ Search failed:', error);
      toast.error(`❌ Search failed: ${error.message}`);
      
      const errorResult: SearchResult = {
        id: 'search_error',
        title: '❌ Search Error',
        content: `Search failed: ${error.message}

**Troubleshooting:**
• Check if the file is properly processed
• Verify backend connection
• Try refreshing and selecting the file again

**Technical Details:**
• File: ${selectedFile?.name}
• Error: ${error.message}`,
        relevanceScore: 0,
        fileId: selectedFile?.id || '',
        fileName: selectedFile?.name || '',
        preview: `Search error: ${error.message}`
      };
      
      setSearchResults([errorResult]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      setIsProcessing(true);
      console.log(`📤 Uploading ${uploadFile.name} to current folder...`);
      
      const result = await googleDriveFixedService.uploadFile(uploadFile, currentFolderId);
      
      if (result.success) {
        toast.success(`✅ ${uploadFile.name} uploaded successfully!`);
        
        // Refresh file list
        await loadFiles(currentFolderId);
        
        // Reset upload state
        setShowUploadDialog(false);
        setUploadFile(null);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('❌ Upload failed:', error);
      toast.error(`❌ Upload failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getFileIcon = (file: DriveFile) => {
    if (file.type === 'folder') return <Folder className="text-blue-400" size={20} />;
    if (file.mimeType.includes('pdf')) return <FileText className="text-red-400" size={20} />;
    if (file.mimeType.includes('image')) return <Image className="text-green-400" size={20} />;
    if (file.mimeType.includes('sheet')) return <FileSpreadsheet className="text-green-600" size={20} />;
    return <FileIcon className="text-gray-400" size={20} />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-blue-400" size={48} />
          <h3 className="text-xl font-bold text-white mb-2">Loading BEML DOCUMENTS</h3>
          <p className="text-blue-200">Connecting to Google Drive...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-6 py-6">
        {/* Status Bar */}
        <div className="text-center mb-6">
          <div className="flex justify-center items-center gap-6 text-sm">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
              isConnected ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
            }`}>
              {isConnected ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              Google Drive: {isConnected ? 'Connected' : 'Disconnected'}
            </div>
            <div className="flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">
              <FileText size={16} />
              {driveFiles.length} items loaded
            </div>
            {selectedFile && (
              <div className="flex items-center gap-2 bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full">
                <CheckCircle size={16} />
                {selectedFile.name}
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Left Panel: File Browser */}
            <div className="xl:col-span-1 bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FolderOpen className="text-blue-400" size={20} />
                  BEML DOCUMENTS
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowUploadDialog(true)}
                    className="p-2 text-green-300 hover:text-white hover:bg-green-700/30 rounded-lg transition-all"
                    title="Upload file"
                  >
                    <Upload size={16} />
                  </button>
                  <button
                    onClick={() => loadFiles(currentFolderId)}
                    className="p-2 text-blue-300 hover:text-white hover:bg-blue-700/30 rounded-lg transition-all"
                    title="Refresh"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              {/* Folder Navigation */}
              <div className="mb-4">
                <div className="flex items-center gap-2 text-blue-200 text-sm mb-2">
                  <Home size={14} />
                  {folderPath.map((folder, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <span>/</span>}
                      <span className={index === folderPath.length - 1 ? 'text-white font-medium' : ''}>
                        {folder}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
                
                {folderPath.length > 1 && (
                  <button
                    onClick={handleBackClick}
                    className="flex items-center gap-2 text-blue-300 hover:text-white transition-colors text-sm"
                  >
                    <ArrowLeft size={14} />
                    Back to parent folder
                  </button>
                )}
              </div>

              {/* Files List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {driveFiles.length === 0 ? (
                  <div className="text-center py-8 text-blue-300">
                    <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No files found in this folder</p>
                    <p className="text-xs mt-2 opacity-70">
                      Check Google Drive permissions or try refreshing
                    </p>
                  </div>
                ) : (
                  driveFiles.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => handleFileSelect(file)}
                      className={`p-3 rounded-lg cursor-pointer transition-all border ${
                        selectedFile?.id === file.id
                          ? 'bg-blue-600/30 text-white border-blue-400'
                          : 'bg-white/5 hover:bg-white/10 text-blue-100 border-transparent hover:border-blue-400/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {getFileIcon(file)}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate text-sm">{file.name}</div>
                          <div className="text-xs opacity-70 flex items-center gap-2">
                            <span>{file.type === 'folder' ? 'Folder' : file.size}</span>
                            {file.modifiedTime && (
                              <span>• {file.modifiedTime}</span>
                            )}
                          </div>
                        </div>
                        {isProcessing && selectedFile?.id === file.id && (
                          <Loader2 className="animate-spin text-yellow-400" size={16} />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Middle Panel: AI Search */}
            <div className="xl:col-span-1 bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Search className="text-green-400" size={20} />
                  AI Search
                </h2>
                {selectedFile && (
                  <div className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">
                    Searching in: {selectedFile.name}
                  </div>
                )}
              </div>

              {/* Search Input */}
              <div className="mb-6">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder={selectedFile ? `Search in ${selectedFile.name}...` : "Select a file first..."}
                    className="flex-1 px-4 py-3 rounded-lg border border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 text-gray-900 placeholder-gray-500"
                    disabled={!selectedFile || isSearching}
                  />
                  <button
                    onClick={handleSearch}
                    disabled={!selectedFile || isSearching || !searchQuery.trim()}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed font-medium flex items-center gap-2 transition-all"
                  >
                    {isSearching ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <Search size={20} />
                    )}
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>

                {/* Clear button */}
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="mt-2 text-blue-300 hover:text-white text-sm flex items-center gap-1"
                  >
                    <X size={14} />
                    Clear search
                  </button>
                )}
              </div>

              {/* Search Status */}
              <div className="mb-6 text-sm">
                {!selectedFile && (
                  <div className="text-yellow-300 bg-yellow-300/10 p-3 rounded-lg">
                    👆 Select a file from the browser to enable AI search
                  </div>
                )}
                {selectedFile && !isProcessing && (
                  <div className="text-green-300 bg-green-300/10 p-3 rounded-lg">
                    ✅ Ready to search in {selectedFile.name}
                  </div>
                )}
                {isProcessing && (
                  <div className="text-yellow-300 bg-yellow-300/10 p-3 rounded-lg">
                    ⏳ Processing {selectedFile?.name}... Please wait
                  </div>
                )}
              </div>

              {/* Example Queries */}
              {selectedFile && !isProcessing && (
                <div className="mb-6">
                  <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                    💡 Example Queries
                  </h3>
                  <div className="space-y-2">
                    {[
                      'circuit diagram',
                      'technical specifications',
                      'wiring details',
                      'safety procedures',
                      'maintenance steps',
                      'system architecture'
                    ].map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setSearchQuery(example)}
                        className="block w-full text-left text-blue-200 hover:text-white hover:bg-blue-700/30 px-3 py-2 rounded text-sm transition-all border border-blue-600/20 hover:border-blue-400/50"
                      >
                        "{example}"
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel: Search Results */}
            <div className="xl:col-span-1 bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="text-orange-400" size={20} />
                  Search Results
                </h2>
                {searchResults.length > 0 && (
                  <div className="text-sm text-blue-300">
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {/* Results Display */}
              {searchResults.length > 0 ? (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-white font-medium text-sm leading-tight">
                          {result.title}
                        </h4>
                        {result.relevanceScore > 0 && (
                          <span className="text-xs bg-green-600/30 text-green-200 px-2 py-1 rounded ml-2">
                            {Math.round(result.relevanceScore * 100)}% match
                          </span>
                        )}
                      </div>
                      
                      <div className="text-blue-200 text-xs mb-3">
                        📄 {result.fileName}
                      </div>
                      
                      <div className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                        {result.content}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-blue-300">
                  <Search size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No search results yet</p>
                  <p className="text-sm opacity-70">
                    {!selectedFile 
                      ? 'Select a file to start searching'
                      : 'Enter a search query to find information'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upload Dialog */}
        {showUploadDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">📤 Upload File</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select File</label>
                  <input
                    type="file"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {uploadFile && (
                    <div className="mt-2 text-sm text-gray-600">
                      Selected: {uploadFile.name} ({Math.round(uploadFile.size / 1024)} KB)
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowUploadDialog(false);
                    setUploadFile(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!uploadFile || isProcessing}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Upload
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}