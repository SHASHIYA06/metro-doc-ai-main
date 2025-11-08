import React, { useState, useEffect } from 'react';
import { Search, Upload, FileText, Loader2, CheckCircle, AlertCircle, FolderOpen, File, RefreshCw, Download, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { googleDriveServiceFixed as googleDriveService } from '../services/googleDriveFixed';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  type: 'file' | 'folder';
  size?: number;
  modifiedTime?: string;
}

interface SearchResult {
  id: string;
  title: string;
  content: string;
  system: string;
  subsystem: string;
  score: number;
  preview: string;
  sources: Array<{
    fileName: string;
    score: number;
    preview: string;
  }>;
}

const config = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://metro-doc-ai-main.onrender.com'
};

// Enhanced file type support
const SUPPORTED_FILE_TYPES = {
  'application/pdf': { icon: '📄', name: 'PDF Document' },
  'application/vnd.google-apps.document': { icon: '📝', name: 'Google Doc' },
  'application/vnd.google-apps.spreadsheet': { icon: '📊', name: 'Google Sheet' },
  'application/vnd.google-apps.presentation': { icon: '📈', name: 'Google Slides' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: '📝', name: 'Word Doc' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: '📊', name: 'Excel Sheet' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { icon: '📈', name: 'PowerPoint' },
  'text/plain': { icon: '📄', name: 'Text File' },
  'text/csv': { icon: '📊', name: 'CSV File' },
  'image/jpeg': { icon: '🖼️', name: 'JPEG Image' },
  'image/png': { icon: '🖼️', name: 'PNG Image' },
  'image/gif': { icon: '🖼️', name: 'GIF Image' },
  'image/tiff': { icon: '🖼️', name: 'TIFF Image' },
  'application/vnd.google-apps.folder': { icon: '📁', name: 'Folder' }
};

export default function SimpleAISearch() {
  const [isConnected, setIsConnected] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isFileReady, setIsFileReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>('root');
  const [folderPath, setFolderPath] = useState<string[]>(['My Drive']);
  const [isInitializing, setIsInitializing] = useState(true);
  const [backendStats, setBackendStats] = useState<any>(null);
  const [processingProgress, setProcessingProgress] = useState<string>('');
  const [filePreview, setFilePreview] = useState<string>('');

  // Initialize Google Drive connection
  useEffect(() => {
    initializeApplication();
  }, []);

  const initializeApplication = async () => {
    setIsInitializing(true);
    try {
      // Test backend connection first
      console.log('🔧 Testing backend connection...');
      const healthResponse = await fetch(`${config.API_BASE_URL}/health`);
      if (!healthResponse.ok) {
        throw new Error('Backend not responding');
      }
      console.log('✅ Backend connection successful');

      // Initialize Google Drive
      console.log('🔧 Initializing Google Drive...');
      const isConnected = await googleDriveService.testConnection();
      if (!isConnected) {
        throw new Error('Google Drive connection failed');
      }
      
      setIsConnected(true);
      await loadDriveFiles();
      await loadBackendStats();
      
      toast.success('✅ Application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      toast.error(`❌ Initialization failed: ${error.message}`);
    } finally {
      setIsInitializing(false);
    }
  };

  const loadBackendStats = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/stats`);
      const stats = await response.json();
      setBackendStats(stats);
    } catch (error) {
      console.warn('Failed to load backend stats:', error);
    }
  };

  const loadDriveFiles = async (folderId: string = 'root') => {
    try {
      console.log(`📁 Loading files from folder: ${folderId}`);
      const files = await googleDriveService.listFiles(folderId);
      
      // Sort files: folders first, then by name
      const sortedFiles = files.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      
      setDriveFiles(sortedFiles);
      setCurrentFolder(folderId);
      console.log(`✅ Loaded ${sortedFiles.length} items`);
    } catch (error) {
      console.error('Failed to load files:', error);
      toast.error('❌ Failed to load files');
    }
  };

  const getFileIcon = (file: DriveFile) => {
    if (file.type === 'folder') {
      return SUPPORTED_FILE_TYPES['application/vnd.google-apps.folder']?.icon || '📁';
    }
    return SUPPORTED_FILE_TYPES[file.mimeType]?.icon || '📄';
  };

  const getFileTypeName = (file: DriveFile) => {
    if (file.type === 'folder') {
      return 'Folder';
    }
    return SUPPORTED_FILE_TYPES[file.mimeType]?.name || file.mimeType;
  };

  const isFileSupported = (file: DriveFile) => {
    if (file.type === 'folder') return true;
    return Object.keys(SUPPORTED_FILE_TYPES).includes(file.mimeType) || 
           file.mimeType.startsWith('text/') || 
           file.mimeType.startsWith('image/');
  };

  const handleFolderClick = async (folder: DriveFile) => {
    setFolderPath([...folderPath, folder.name]);
    await loadDriveFiles(folder.id);
  };

  const handleBackClick = async () => {
    if (folderPath.length > 1) {
      const newPath = folderPath.slice(0, -1);
      setFolderPath(newPath);
      
      // Navigate back to parent folder
      if (newPath.length === 1) {
        await loadDriveFiles('root');
      } else {
        // Find parent folder ID (simplified - in real app you'd track this)
        await loadDriveFiles('root');
      }
    }
  };

  const handleFileSelect = async (file: DriveFile) => {
    if (file.type === 'folder') {
      await handleFolderClick(file);
      return;
    }

    // Check if file type is supported
    if (!isFileSupported(file)) {
      toast.error(`❌ File type ${file.mimeType} is not supported`);
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);
    setIsFileReady(false);
    setSearchResults([]);
    setFilePreview('');
    setProcessingProgress('Initializing...');

    try {
      toast(`📤 Processing ${file.name}...`);

      // Step 1: Clear backend to ensure only selected file is indexed
      setProcessingProgress('Clearing previous data...');
      console.log('🧹 Clearing backend for selected file...');
      try {
        await fetch(`${config.API_BASE_URL}/clear`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        console.log('✅ Backend cleared');
      } catch (clearError) {
        console.log('⚠️ Backend clear failed, continuing...');
      }

      // Step 2: Extract file content with progress
      setProcessingProgress('Extracting file content...');
      console.log('📥 Extracting file content from:', file.name, 'ID:', file.id);
      
      let fileContents;
      try {
        fileContents = await googleDriveService.extractFileContents([file.id]);
        console.log('📥 File extraction result:', fileContents);
      } catch (extractError) {
        console.error('❌ File extraction failed:', extractError);
        throw new Error(`Failed to extract content from ${file.name}: ${extractError.message}`);
      }
      
      if (!fileContents || fileContents.length === 0) {
        throw new Error('No content extracted from file');
      }

      const content = fileContents[0];
      console.log(`📄 Extracted ${content.content.length} characters from ${file.name}`);
      console.log('📄 Content preview:', content.content.substring(0, 200) + '...');
      
      // Set preview of content
      setFilePreview(content.content.substring(0, 500) + (content.content.length > 500 ? '...' : ''));

      // Step 3: Upload to AI backend with enhanced processing
      setProcessingProgress('Uploading to AI backend...');
      console.log('📤 Uploading to AI backend...');
      const formData = new FormData();
      
      // Create enhanced content with metadata
      const enhancedContent = `DOCUMENT INFORMATION:
File Name: ${file.name}
File Type: ${getFileTypeName(file)}
MIME Type: ${file.mimeType}
Size: ${file.size || 'Unknown'}
Modified: ${file.modifiedTime || 'Unknown'}

SEARCHABLE CONTENT:
${content.content}

KEYWORDS: ${extractKeywords(content.content)}
SUGGESTED QUERIES: ${generateSuggestedQueries(content.content, file.name)}`;

      const blob = new Blob([enhancedContent], { type: 'text/plain' });
      const uploadFile = new File([blob], file.name, { type: 'text/plain' });
      
      formData.append('files', uploadFile);
      formData.append('system', `Selected File - ${file.name.split('.')[0]}`);
      formData.append('subsystem', 'Google Drive Upload');

      const uploadResponse = await fetch(`${config.API_BASE_URL}/ingest`, {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      const uploadResult = await uploadResponse.json();
      console.log('✅ Upload result:', uploadResult);

      if (!uploadResult.added || uploadResult.added === 0) {
        throw new Error('No content was indexed from the file');
      }

      // Step 4: Wait for indexing with progress
      setProcessingProgress('Indexing content for AI search...');
      console.log('⏳ Waiting for indexing...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Step 5: Verify file is ready
      setProcessingProgress('Verifying indexing...');
      const statsResponse = await fetch(`${config.API_BASE_URL}/stats`);
      const stats = await statsResponse.json();
      setBackendStats(stats);
      
      if (stats.totalChunks > 0) {
        setIsFileReady(true);
        setProcessingProgress('Ready for search!');
        toast.success(`✅ ${file.name} is ready for AI search!`);
        toast.success(`📊 ${uploadResult.added} chunks indexed`);
      } else {
        throw new Error('File was not properly indexed');
      }

    } catch (error: any) {
      console.error('File processing error:', error);
      toast.error(`❌ Failed to process ${file.name}: ${error.message}`);
      setSelectedFile(null);
      setProcessingProgress('');
    } finally {
      setIsUploading(false);
    }
  };

  // Extract keywords from content
  const extractKeywords = (content: string): string => {
    const words = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const frequency: { [key: string]: number } = {};
    
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word)
      .join(', ');
  };

  // Generate suggested queries based on content
  const generateSuggestedQueries = (content: string, fileName: string): string => {
    const suggestions = [
      `What is the main purpose of ${fileName}?`,
      'What are the key specifications?',
      'What are the main procedures?',
      'What are the technical requirements?'
    ];

    // Add content-specific suggestions
    if (content.toLowerCase().includes('door')) {
      suggestions.push('What are the door system details?');
    }
    if (content.toLowerCase().includes('maintenance')) {
      suggestions.push('What are the maintenance procedures?');
    }
    if (content.toLowerCase().includes('safety')) {
      suggestions.push('What are the safety requirements?');
    }

    return suggestions.slice(0, 6).join('; ');
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    if (!selectedFile || !isFileReady) {
      toast.error('Please select and upload a file first');
      return;
    }

    setIsSearching(true);

    try {
      console.log(`🔍 Searching in ${selectedFile.name} for: "${searchQuery}"`);

      // Enhanced query processing
      let finalQuery = searchQuery.trim();
      const lowerQuery = searchQuery.toLowerCase();
      
      // Smart query enhancement based on content and context
      if (!lowerQuery.match(/^(what|how|describe|explain|list|show|find|tell)/)) {
        if (lowerQuery.includes('door')) {
          finalQuery = `What are the door system details and specifications related to "${searchQuery}"?`;
        } else if (lowerQuery.includes('maintenance')) {
          finalQuery = `What are the maintenance procedures for "${searchQuery}"?`;
        } else if (lowerQuery.includes('safety')) {
          finalQuery = `What are the safety requirements and procedures for "${searchQuery}"?`;
        } else if (lowerQuery.includes('technical') || lowerQuery.includes('specification')) {
          finalQuery = `What are the technical specifications for "${searchQuery}"?`;
        } else if (lowerQuery.includes('procedure') || lowerQuery.includes('process')) {
          finalQuery = `What are the procedures and processes for "${searchQuery}"?`;
        } else {
          finalQuery = `What information is available about "${searchQuery}" in this document?`;
        }
      }

      console.log(`🔍 Enhanced query: "${finalQuery}"`);

      // Search with file-specific filtering
      const searchResponse = await fetch(`${config.API_BASE_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: finalQuery,
          k: 8,
          system: `Selected File - ${selectedFile.name.split('.')[0]}`,
          subsystem: 'Google Drive Upload',
          tags: []
        })
      });

      if (!searchResponse.ok) {
        throw new Error(`Search request failed: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      console.log('📊 Search response:', searchData);

      const results: SearchResult[] = [];

      if (searchData.result && !searchData.result.includes('No relevant documents found') && searchData.sources?.length > 0) {
        // Enhanced AI response processing
        let aiResponse = searchData.result;
        
        // Clean HTML tags but preserve formatting
        aiResponse = aiResponse.replace(/<br\s*\/?>/gi, '\n');
        aiResponse = aiResponse.replace(/<\/?(p|div|h[1-6])\s*[^>]*>/gi, '\n');
        aiResponse = aiResponse.replace(/<[^>]*>/g, '');
        aiResponse = aiResponse.replace(/\n\s*\n\s*\n/g, '\n\n').trim();

        results.push({
          id: 'ai_response',
          title: `🤖 AI Analysis: "${searchQuery}"`,
          content: aiResponse,
          system: `Selected File - ${selectedFile.name}`,
          subsystem: 'AI Generated Response',
          score: 1.0,
          preview: aiResponse.substring(0, 400) + (aiResponse.length > 400 ? '...' : ''),
          sources: searchData.sources.map((source: any) => ({
            fileName: source.fileName,
            score: source.score,
            preview: source.preview
          }))
        });

        // Add detailed source information
        if (searchData.sources && searchData.sources.length > 0) {
          searchData.sources.forEach((source: any, index: number) => {
            results.push({
              id: `source_${index}`,
              title: `📄 Source Content (${Math.round(source.score * 100)}% match)`,
              content: source.preview || 'No preview available',
              system: source.system || selectedFile.name,
              subsystem: `Chunk ${source.position + 1}`,
              score: source.score || 0.5,
              preview: (source.preview || 'No preview available').substring(0, 350),
              sources: [{
                fileName: source.fileName,
                score: source.score || 0.5,
                preview: source.preview || 'No preview available'
              }]
            });
          });
        }

        toast.success(`🎉 Found ${searchData.sources.length} relevant sections in ${selectedFile.name}!`);
      } else {
        // Enhanced no results handling
        const suggestions = generateSearchSuggestions(searchQuery, selectedFile.name);
        
        results.push({
          id: 'no_results',
          title: '🔍 No Results Found',
          content: `No relevant information found for "${searchQuery}" in ${selectedFile.name}.

**Search Suggestions:**
${suggestions.map(s => `• ${s}`).join('\n')}

**File Information:**
• Name: ${selectedFile.name}
• Type: ${getFileTypeName(selectedFile)}
• Status: ${backendStats?.totalChunks || 0} chunks indexed

**Tips for Better Results:**
• Use specific keywords from the document
• Try broader or more specific terms
• Ask complete questions (What, How, Where, etc.)
• Check if the information exists in this specific file`,
          system: 'Search Help',
          subsystem: 'No Results',
          score: 0.5,
          preview: `No results for "${searchQuery}" in ${selectedFile.name}`,
          sources: []
        });

        toast('🔍 No results found. Try the suggested queries below.');
      }

      setSearchResults(results);

    } catch (error: any) {
      console.error('Search error:', error);
      toast.error(`Search failed: ${error.message}`);
      
      setSearchResults([{
        id: 'search_error',
        title: '❌ Search Error',
        content: `Search failed: ${error.message}

**Troubleshooting Steps:**
1. Check if ${selectedFile?.name} is properly processed
2. Verify backend connection (${config.API_BASE_URL})
3. Try refreshing and selecting the file again
4. Ensure the file contains searchable text content

**Technical Details:**
• Selected File: ${selectedFile?.name}
• File Type: ${selectedFile?.mimeType}
• Backend Status: ${backendStats?.totalChunks || 0} chunks indexed
• Error: ${error.message}`,
        system: 'Error Handler',
        subsystem: 'Search Error',
        score: 0,
        preview: `Search failed: ${error.message}`,
        sources: []
      }]);
    } finally {
      setIsSearching(false);
    }
  };

  // Generate smart search suggestions
  const generateSearchSuggestions = (query: string, fileName: string): string[] => {
    const suggestions = [
      `What is the main content of ${fileName}?`,
      'What are the key points?',
      'What are the specifications?',
      'What are the procedures?'
    ];

    // Add query-specific suggestions
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('door')) {
      suggestions.push('door system', 'door specifications', 'door maintenance');
    }
    if (lowerQuery.includes('safety')) {
      suggestions.push('safety procedures', 'safety requirements', 'emergency protocols');
    }
    if (lowerQuery.includes('technical')) {
      suggestions.push('technical specifications', 'technical requirements', 'technical details');
    }

    return suggestions.slice(0, 6);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🔍 Enhanced Google Drive AI Search
          </h1>
          <p className="text-blue-200 text-lg mb-4">
            Connect to Google Drive, select any file, and search its contents with advanced AI
          </p>
          
          {/* Status Bar */}
          <div className="flex justify-center items-center gap-6 text-sm">
            <div className={`flex items-center gap-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              Google Drive: {isConnected ? 'Connected' : 'Disconnected'}
            </div>
            <div className={`flex items-center gap-2 ${backendStats ? 'text-green-400' : 'text-yellow-400'}`}>
              {backendStats ? <CheckCircle size={16} /> : <Loader2 className="animate-spin" size={16} />}
              Backend: {backendStats ? `${backendStats.totalChunks} chunks` : 'Connecting...'}
            </div>
            {selectedFile && (
              <div className={`flex items-center gap-2 ${isFileReady ? 'text-green-400' : 'text-yellow-400'}`}>
                {isFileReady ? <CheckCircle size={16} /> : <Loader2 className="animate-spin" size={16} />}
                File: {isFileReady ? 'Ready' : 'Processing...'}
              </div>
            )}
          </div>
        </div>

        {/* Loading Overlay */}
        {isInitializing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 text-center">
              <Loader2 className="animate-spin mx-auto mb-4" size={48} />
              <h3 className="text-xl font-bold mb-2">Initializing Application</h3>
              <p className="text-gray-600">Connecting to Google Drive and backend services...</p>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Left Panel: Google Drive Files */}
            <div className="xl:col-span-1 bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  📁 Google Drive Files
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadDriveFiles(currentFolder)}
                    className="p-2 text-blue-300 hover:text-white hover:bg-blue-700/30 rounded-lg transition-all"
                    title="Refresh files"
                  >
                    <RefreshCw size={16} />
                  </button>
                  {isConnected && (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle size={16} />
                      <span className="text-xs">Connected</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Folder Navigation */}
              {folderPath.length > 1 && (
                <div className="mb-4">
                  <button
                    onClick={handleBackClick}
                    className="flex items-center gap-2 text-blue-300 hover:text-white transition-colors"
                  >
                    ← Back to {folderPath[folderPath.length - 2]}
                  </button>
                  <div className="text-blue-200 text-sm mt-1">
                    📍 {folderPath.join(' / ')}
                  </div>
                </div>
              )}

              {/* Enhanced Files List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {driveFiles.length === 0 ? (
                  <div className="text-center py-8 text-blue-300">
                    <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No files found in this folder</p>
                  </div>
                ) : (
                  driveFiles.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => handleFileSelect(file)}
                      className={`p-3 rounded-lg cursor-pointer transition-all border ${
                        selectedFile?.id === file.id
                          ? 'bg-blue-600 text-white border-blue-400'
                          : isFileSupported(file)
                          ? 'bg-white/5 hover:bg-white/10 text-blue-100 border-transparent hover:border-blue-400/30'
                          : 'bg-gray-500/20 text-gray-400 border-transparent cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {getFileIcon(file)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{file.name}</div>
                          <div className="text-xs opacity-70 flex items-center gap-2">
                            <span>{getFileTypeName(file)}</span>
                            {file.size && (
                              <span>• {typeof file.size === 'string' ? file.size : `${Math.round(Number(file.size) / 1024)} KB`}</span>
                            )}
                            {!isFileSupported(file) && file.type !== 'folder' && (
                              <span className="text-red-400">• Unsupported</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isUploading && selectedFile?.id === file.id && (
                            <Loader2 className="animate-spin text-yellow-400" size={16} />
                          )}
                          {isFileReady && selectedFile?.id === file.id && (
                            <CheckCircle className="text-green-400" size={16} />
                          )}
                          {file.type === 'folder' && (
                            <span className="text-xs text-blue-300">→</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Enhanced Selected File Status */}
              {selectedFile && (
                <div className="mt-6 p-4 bg-blue-800/50 rounded-lg border border-blue-600/30">
                  <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                    {getFileIcon(selectedFile)} Selected File
                  </h3>
                  <div className="text-blue-200 text-sm space-y-2">
                    <div><strong>Name:</strong> {selectedFile.name}</div>
                    <div><strong>Type:</strong> {getFileTypeName(selectedFile)}</div>
                    {selectedFile.size && (
                      <div><strong>Size:</strong> {typeof selectedFile.size === 'string' ? selectedFile.size : `${Math.round(Number(selectedFile.size) / 1024)} KB`}</div>
                    )}
                    <div className="flex items-center gap-2 pt-2 border-t border-blue-600/30">
                      <strong>Status:</strong>
                      {isUploading && (
                        <span className="text-yellow-400 flex items-center gap-1">
                          <Loader2 className="animate-spin" size={14} />
                          {processingProgress || 'Processing...'}
                        </span>
                      )}
                      {isFileReady && !isUploading && (
                        <span className="text-green-400 flex items-center gap-1">
                          <CheckCircle size={14} />
                          Ready for AI search
                        </span>
                      )}
                      {!isUploading && !isFileReady && (
                        <span className="text-gray-400">Not processed</span>
                      )}
                    </div>
                    {filePreview && (
                      <div className="mt-3 pt-3 border-t border-blue-600/30">
                        <div className="text-xs text-blue-300 mb-1">Content Preview:</div>
                        <div className="text-xs bg-blue-900/50 p-2 rounded max-h-20 overflow-y-auto">
                          {filePreview}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Middle Panel: AI Search */}
            <div className="xl:col-span-1 bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  🤖 AI Search
                </h2>
                {selectedFile && isFileReady && (
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
                    className="flex-1 px-4 py-3 rounded-lg border border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!isFileReady || isSearching}
                  />
                  <button
                    onClick={handleSearch}
                    disabled={!isFileReady || isSearching || !searchQuery.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed font-medium flex items-center gap-2 transition-all"
                  >
                    {isSearching ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <Search size={20} />
                    )}
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>

                {/* Search Status */}
                <div className="mt-3 text-sm">
                  {!selectedFile && (
                    <div className="text-yellow-300">
                      👆 Select a file from Google Drive to enable search
                    </div>
                  )}
                  {selectedFile && !isFileReady && (
                    <div className="text-yellow-300">
                      ⏳ Processing {selectedFile.name}... Please wait
                    </div>
                  )}
                  {selectedFile && isFileReady && (
                    <div className="text-green-300">
                      ✅ Ready to search in {selectedFile.name}
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Example Queries */}
              {selectedFile && isFileReady && (
                <div className="mb-6">
                  <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                    💡 Suggested Queries
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      'What is the main content?',
                      'What are the key specifications?',
                      'What are the procedures?',
                      'What are the technical requirements?',
                      'What are the safety guidelines?',
                      'What are the maintenance steps?'
                    ].map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setSearchQuery(example)}
                        className="text-left text-blue-200 hover:text-white hover:bg-blue-700/30 px-3 py-2 rounded text-sm transition-all border border-blue-600/20 hover:border-blue-400/50"
                      >
                        <span className="text-blue-400">Q:</span> {example}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Right Panel: Search Results */}
            <div className="xl:col-span-1 bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  📊 Search Results
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
                  {searchResults.map((result, index) => (
                    <div
                      key={result.id}
                      className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-white font-medium text-sm leading-tight">
                          {result.title}
                        </h4>
                        <div className="flex items-center gap-2 ml-2">
                          {result.score > 0 && (
                            <span className="text-xs bg-blue-600/30 text-blue-200 px-2 py-1 rounded">
                              {Math.round(result.score * 100)}%
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-blue-200 text-xs mb-3 flex items-center gap-2">
                        <span>📁 {result.system}</span>
                        <span>•</span>
                        <span>📂 {result.subsystem}</span>
                      </div>
                      
                      <div className="text-white text-sm leading-relaxed mb-3 max-h-40 overflow-y-auto">
                        {result.content.split('\n').map((line, i) => (
                          <div key={i} className={line.startsWith('**') ? 'font-medium mt-2' : ''}>
                            {line}
                          </div>
                        ))}
                      </div>
                      
                      {result.sources.length > 0 && (
                        <div className="pt-3 border-t border-white/10">
                          <div className="text-blue-200 text-xs">
                            📚 Sources: {result.sources.map(s => s.fileName).join(', ')}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-blue-300">
                  <Search size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No search results yet</p>
                  <p className="text-sm opacity-70">
                    {!selectedFile 
                      ? 'Select a file from Google Drive to start searching'
                      : !isFileReady 
                      ? 'Wait for file processing to complete'
                      : 'Enter a search query to find information'
                    }
                  </p>
                </div>
              )}

              {/* Quick Actions */}
              {selectedFile && isFileReady && searchResults.length === 0 && (
                <div className="mt-6 p-4 bg-blue-800/30 rounded-lg border border-blue-600/30">
                  <h4 className="text-white font-medium mb-2">🚀 Quick Start</h4>
                  <div className="text-blue-200 text-sm space-y-1">
                    <p>• File "{selectedFile.name}" is ready for search</p>
                    <p>• Try the suggested queries above</p>
                    <p>• Ask specific questions about the content</p>
                    <p>• Use keywords from the document</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Stats */}
          {backendStats && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-6 bg-white/5 backdrop-blur-sm rounded-lg px-6 py-3 text-sm text-blue-200">
                <span>📊 {backendStats.totalChunks} chunks indexed</span>
                <span>📁 {backendStats.uniqueFiles} files processed</span>
                <span>🔍 AI-powered search ready</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}