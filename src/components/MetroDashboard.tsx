import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { apiService, type SearchResponse, type UploadResponse } from '@/services/api';
import { googleDriveService, type DriveFile, type DriveFolder } from '@/services/googleDrive';
import { config } from '@/config/environment';
import {
  Search,
  Upload,
  FileText,
  Database,
  Brain,
  Zap,
  Download,
  Eye,
  Settings,
  Train,
  FileImage,
  FileSpreadsheet,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Network,
  BarChart3,
  Filter,
  RefreshCw,
  CircuitBoard,
  Activity,
  TrendingUp,
  Shield,
  Cpu,
  HardDrive,
  Wifi,
  Folder,
  FolderOpen,
  ArrowLeft,
  Plus,
  CloudUpload,
  ExternalLink
} from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  system: string;
  subsystem: string;
  score: number;
  fileType: string;
  preview: string;
  sources?: Array<{
    fileName: string;
    position: number;
    score: number;
    preview: string;
  }>;
}

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
}

interface AnalysisResult {
  summary: string;
  technical_details: string;
  wire_details: Array<{ number: string; specification: string }>;
  components: Array<{ type: string; part_number: string }>;
  system_architecture: {
    name: string;
    version: string;
    modules: string[];
  };
}

export const MetroDashboard = () => {
  // Search and AI states
  const [searchQuery, setSearchQuery] = useState('');
  const [systemFilter, setSystemFilter] = useState('');
  const [subsystemFilter, setSubsystemFilter] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeTab, setActiveTab] = useState('drive-files');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  // Google Drive states
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveFolders, setDriveFolders] = useState<DriveFolder[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [currentFolderId, setCurrentFolderId] = useState<string>(config.MAIN_FOLDER_ID);
  const [folderHistory, setFolderHistory] = useState<{id: string, name: string}[]>([
    {id: config.MAIN_FOLDER_ID, name: 'Root'}
  ]);
  
  // Upload states
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [folderPath, setFolderPath] = useState('');
  
  // Connection states
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [driveConnectionStatus, setDriveConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [backendStats, setBackendStats] = useState<any>(null);
  const [totalIndexed, setTotalIndexed] = useState(0);
  const [loading, setLoading] = useState(false);

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
        toast.error('Failed to connect to Google Drive');
      }
    } catch (error) {
      console.error('Drive connection failed:', error);
      setDriveConnectionStatus('error');
      toast.error('Google Drive connection failed');
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

  // Navigate to folder
  const navigateToFolder = (folderId: string, folderName: string) => {
    setCurrentFolderId(folderId);
    setFolderHistory(prev => [...prev, {id: folderId, name: folderName}]);
    loadDriveFiles(folderId);
  };

  // Navigate back
  const navigateBack = () => {
    if (folderHistory.length <= 1) return;
    
    const newHistory = [...folderHistory];
    newHistory.pop();
    const previousFolder = newHistory[newHistory.length - 1];
    
    setFolderHistory(newHistory);
    setCurrentFolderId(previousFolder.id);
    loadDriveFiles(previousFolder.id);
  };

  // Toggle file selection
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

  // Enhanced file upload with Google Drive integration
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      size: file.size,
      status: 'uploading',
      progress: 0
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    try {
      // Step 1: Upload to Google Drive
      toast.info('Uploading files to Google Drive...');
      const driveResults = await googleDriveService.uploadFiles(
        acceptedFiles, 
        systemFilter, 
        subsystemFilter, 
        folderPath
      );

      // Update progress for Drive upload
      newFiles.forEach(file => {
        setUploadedFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, progress: 50, status: 'processing' } : f
        ));
      });

      // Step 2: Upload to backend for AI processing
      toast.info('Processing files with AI...');
      const response = await apiService.uploadFiles(acceptedFiles, systemFilter, subsystemFilter);

      // Update files to completed status
      newFiles.forEach(file => {
        setUploadedFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'completed', progress: 100 } : f
        ));
      });

      setTotalIndexed(response.total);
      toast.success(`Successfully uploaded to Drive and processed ${response.added} chunks from ${acceptedFiles.length} file(s)`);
      
      // Reload both Drive files and backend stats
      await Promise.all([
        loadDriveFiles(),
        loadBackendStats()
      ]);
      
    } catch (error: any) {
      console.error('Upload failed:', error);
      
      // Update files to error status
      newFiles.forEach(file => {
        setUploadedFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'error', progress: 0 } : f
        ));
      });
      
      toast.error(`Upload failed: ${error.message}`);
    }
  }, [systemFilter, subsystemFilter, folderPath]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff', '.bmp']
    },
    multiple: true
  });

  // Analyze selected files from Google Drive
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
      setActiveTab('ai-search');
      toast.success(`Analysis complete! Found ${convertedResults.length} relevant results`);

    } catch (error: any) {
      console.error('Analysis failed:', error);
      toast.error(`Analysis failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSearch = async (type: string) => {
    if (!searchQuery.trim() && type !== 'structured') {
      toast.error('Please enter a search query');
      return;
    }

    if (connectionStatus !== 'connected') {
      toast.error('Backend not connected. Please check your connection.');
      return;
    }

    setIsProcessing(true);
    
    try {
      let response: SearchResponse;
      
      switch (type) {
        case 'structured':
          response = await apiService.searchMulti(
            searchQuery || 'Show all documents',
            systemFilter,
            subsystemFilter
          );
          break;
        case 'keyword':
          response = await apiService.searchMulti(searchQuery, systemFilter, subsystemFilter);
          break;
        default:
          response = await apiService.search(searchQuery, {
            system: systemFilter,
            subsystem: subsystemFilter,
            k: 15
          });
      }

      // Convert API response to our internal format
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

      // Generate analysis result from the API response
      const analysisFromResponse: AnalysisResult = {
        summary: response.result.substring(0, 300) + '...',
        technical_details: response.result,
        wire_details: [],
        components: [],
        system_architecture: {
          name: 'Metro System Analysis',
          version: '1.0',
          modules: [...new Set(response.sources.map(s => s.subsystem))]
        }
      };

      setResults(convertedResults);
      setAnalysisResult(analysisFromResponse);
      toast.success(`Found ${convertedResults.length} relevant results from ${response.totalIndexed} indexed documents`);
      
    } catch (error: any) {
      console.error('Search failed:', error);
      toast.error(`Search failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
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

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-300 border-green-400/50 bg-green-500/10';
      case 'connecting': return 'text-yellow-300 border-yellow-400/50 bg-yellow-500/10';
      case 'error': return 'text-red-300 border-red-400/50 bg-red-500/10';
      default: return 'text-gray-300 border-gray-400/50 bg-gray-500/10';
    }
  };

  const getConnectionStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Disconnected';
      default: return 'Unknown';
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="h-4 w-4 text-red-400" />;
    if (type.includes('image')) return <FileImage className="h-4 w-4 text-green-400" />;
    if (type.includes('spreadsheet') || type.includes('excel')) return <FileSpreadsheet className="h-4 w-4 text-blue-400" />;
    if (type.includes('folder')) return <Folder className="h-4 w-4 text-yellow-400" />;
    return <FileText className="h-4 w-4 text-gray-400" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading': return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
      case 'processing': return <Brain className="h-4 w-4 text-purple-400" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-400" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-6 relative z-10">
      {/* Enhanced Header with Glass Morphism */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <motion.div 
                  className="p-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl backdrop-blur-sm border border-white/10"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Train className="h-8 w-8 text-blue-400" />
                </motion.div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    KMRCL Metro Document Intelligence
                  </h1>
                  <p className="text-blue-200/80 flex items-center space-x-2">
                    <Sparkles className="h-4 w-4" />
                    <span>Google Drive • AI Search • OCR • Architecture Analysis</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className={getConnectionStatusColor(connectionStatus)}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    connectionStatus === 'connected' ? 'bg-green-500' : 
                    connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  Backend: {getConnectionStatusText(connectionStatus)}
                </Badge>
                <Badge variant="outline" className={getConnectionStatusColor(driveConnectionStatus)}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    driveConnectionStatus === 'connected' ? 'bg-green-500' : 
                    driveConnectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  Drive: {getConnectionStatusText(driveConnectionStatus)}
                </Badge>
                <Badge variant="outline" className="text-blue-300 border-blue-400/50 bg-blue-500/10">
                  <Database className="h-3 w-3 mr-1" />
                  {totalIndexed} Indexed
                </Badge>
                <Badge variant="outline" className="text-cyan-300 border-cyan-400/50 bg-cyan-500/10">
                  <Shield className="h-3 w-3 mr-1" />
                  SHASHI SHEKHAR MISHRA
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <HardDrive className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-blue-200/70">Drive Files</p>
                <p className="text-xl font-bold text-white">{driveFiles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Activity className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-blue-200/70">Selected</p>
                <p className="text-xl font-bold text-white">{selectedFiles.size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Cpu className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-blue-200/70">AI Results</p>
                <p className="text-xl font-bold text-white">{results.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <Wifi className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-blue-200/70">Accuracy</p>
                <p className="text-xl font-bold text-white">94.2%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-white/5 backdrop-blur-sm">
                <TabsTrigger value="drive-files" className="data-[state=active]:bg-blue-500/20">
                  <Folder className="h-4 w-4 mr-1" />
                  Google Drive
                </TabsTrigger>
                <TabsTrigger value="upload" className="data-[state=active]:bg-green-500/20">
                  <Upload className="h-4 w-4 mr-1" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="ai-search" className="data-[state=active]:bg-purple-500/20">
                  <Brain className="h-4 w-4 mr-1" />
                  AI Search
                </TabsTrigger>
                <TabsTrigger value="analysis" className="data-[state=active]:bg-orange-500/20">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Analysis
                </TabsTrigger>
                <TabsTrigger value="results" className="data-[state=active]:bg-cyan-500/20">
                  <Eye className="h-4 w-4 mr-1" />
                  Results
                </TabsTrigger>
              </TabsList>

              {/* Google Drive Files Tab */}
              <TabsContent value="drive-files" className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={navigateBack}
                      disabled={folderHistory.length <= 1}
                      className="border-white/20 text-blue-300"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                    <div className="text-sm text-blue-200">
                      {folderHistory.map((folder, index) => (
                        <span key={folder.id}>
                          {index > 0 && ' / '}
                          {folder.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFiles(new Set(driveFiles.map(f => f.id)))}
                      className="border-white/20 text-blue-300"
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFiles(new Set())}
                      className="border-white/20 text-blue-300"
                    >
                      Clear
                    </Button>
                    <Button
                      onClick={analyzeSelectedFiles}
                      disabled={selectedFiles.size === 0 || isProcessing}
                      className="bg-gradient-to-r from-purple-500 to-indigo-500"
                    >
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
                      Analyze Selected ({selectedFiles.size})
                    </Button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                    <span className="ml-2 text-blue-200">Loading files from Google Drive...</span>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px] w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {driveFiles.map((file) => (
                        <motion.div
                          key={file.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                            selectedFiles.has(file.id)
                              ? 'bg-blue-500/20 border-blue-400'
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
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              {getFileIcon(file.mimeType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-white truncate">{file.name}</h3>
                              <p className="text-xs text-blue-300/70 mt-1">
                                {file.type === 'folder' ? 'Folder' : file.mimeType}
                              </p>
                              {file.size && file.size !== '0' && (
                                <p className="text-xs text-blue-300/50">
                                  {(parseInt(file.size) / 1024 / 1024).toFixed(2)} MB
                                </p>
                              )}
                            </div>
                            {file.type !== 'folder' && (
                              <div className="flex-shrink-0">
                                <input
                                  type="checkbox"
                                  checked={selectedFiles.has(file.id)}
                                  onChange={() => toggleFileSelection(file.id)}
                                  className="rounded"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>

              {/* Upload Tab */}
              <TabsContent value="upload" className="space-y-4 mt-6">
                <motion.div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                    isDragActive 
                      ? 'border-blue-400 bg-blue-500/10' 
                      : 'border-blue-400/30 hover:border-blue-400/50 hover:bg-blue-500/5'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <input {...getInputProps()} />
                  <motion.div
                    animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CloudUpload className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {isDragActive ? 'Drop files here!' : 'Upload to Google Drive & AI Processing'}
                  </h3>
                  <p className="text-blue-200 mb-4">
                    Files will be uploaded to Google Drive and processed by AI for intelligent search
                  </p>
                  <p className="text-sm text-blue-300/70">
                    Supports: PDF, DOCX, XLSX, Images (PNG, JPG, TIFF), CSV
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="System (e.g., Rolling Stock)"
                    value={systemFilter}
                    onChange={(e) => setSystemFilter(e.target.value)}
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                  />
                  <Input
                    placeholder="Subsystem (e.g., Doors)"
                    value={subsystemFilter}
                    onChange={(e) => setSubsystemFilter(e.target.value)}
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                  />
                  <Input
                    placeholder="Folder path (optional)"
                    value={folderPath}
                    onChange={(e) => setFolderPath(e.target.value)}
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={createFolder}
                    disabled={!folderPath.trim()}
                    variant="outline"
                    className="border-white/20 text-blue-300"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Folder
                  </Button>
                  <Button
                    onClick={() => loadDriveFiles()}
                    variant="outline"
                    className="border-white/20 text-blue-300"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Drive
                  </Button>
                  <Button
                    onClick={() => window.open(googleDriveService.getDriveRootUrl(), '_blank')}
                    variant="outline"
                    className="border-white/20 text-blue-300"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Drive
                  </Button>
                </div>

                {uploadedFiles.length > 0 && (
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-sm text-white">Upload Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-32 w-full">
                        <div className="space-y-2">
                          {uploadedFiles.map((file) => (
                            <motion.div
                              key={file.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center space-x-2 p-2 bg-white/5 rounded-lg"
                            >
                              {getFileIcon(file.type)}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-white truncate">{file.name}</p>
                                <Progress value={file.progress} className="h-1 mt-1" />
                              </div>
                              {getStatusIcon(file.status)}
                            </motion.div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* AI Search Tab */}
              <TabsContent value="ai-search" className="space-y-4 mt-6">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Ask anything about your documents... (e.g., 'Show me door control specifications')"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch('ai')}
                  />
                  <Button
                    onClick={() => handleSearch('ai')}
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="System filter (optional)"
                    value={systemFilter}
                    onChange={(e) => setSystemFilter(e.target.value)}
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                  />
                  <Input
                    placeholder="Subsystem filter (optional)"
                    value={subsystemFilter}
                    onChange={(e) => setSubsystemFilter(e.target.value)}
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-blue-300 hover:bg-blue-500/10"
                    onClick={() => setSearchQuery('Show me door control unit specifications')}
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Door Systems
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-blue-300 hover:bg-purple-500/10"
                    onClick={() => setSearchQuery('Find HVAC system architecture')}
                  >
                    <Database className="h-3 w-3 mr-1" />
                    HVAC Systems
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-blue-300 hover:bg-green-500/10"
                    onClick={() => setSearchQuery('Show electrical circuit diagrams')}
                  >
                    <FileImage className="h-3 w-3 mr-1" />
                    Circuit Diagrams
                  </Button>
                </div>
              </TabsContent>

              {/* Analysis Tab */}
              <TabsContent value="analysis" className="space-y-4 mt-6">
                <div className="text-center py-8">
                  <Brain className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Advanced Document Analysis</h3>
                  <p className="text-blue-200 mb-4">
                    Select files from Google Drive and use AI search to get detailed technical analysis
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button
                      onClick={() => setActiveTab('drive-files')}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500"
                    >
                      <Folder className="h-4 w-4 mr-2" />
                      Browse Drive Files
                    </Button>
                    <Button
                      onClick={() => setActiveTab('ai-search')}
                      variant="outline"
                      className="border-white/20 text-blue-300"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Start AI Search
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Results Tab */}
              <TabsContent value="results" className="space-y-4 mt-6">
                <ScrollArea className="h-[600px] w-full">
                  <AnimatePresence>
                    {results.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16"
                      >
                        <Database className="h-20 w-20 text-blue-400/30 mx-auto mb-6" />
                        <h3 className="text-xl font-semibold text-blue-200 mb-2">Ready for Intelligence</h3>
                        <p className="text-blue-300/70">
                          Select files from Google Drive and run AI search to see detailed results here!
                        </p>
                      </motion.div>
                    ) : (
                      <div className="space-y-4">
                        {results.map((result, index) => (
                          <motion.div
                            key={result.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300">
                              <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-3">
                                      {getFileIcon(result.fileType)}
                                      <h3 className="font-semibold text-white text-lg">{result.title}</h3>
                                      <Badge 
                                        variant="secondary" 
                                        className="bg-green-500/20 text-green-300 text-xs"
                                      >
                                        {Math.round(result.score * 100)}% Match
                                      </Badge>
                                    </div>
                                    
                                    <p className="text-blue-200 mb-4 leading-relaxed">{result.content}</p>
                                    
                                    <div className="flex flex-wrap gap-2 mb-4">
                                      <Badge variant="outline" className="border-blue-400/50 text-blue-300 bg-blue-500/10">
                                        📁 {result.system}
                                      </Badge>
                                      <Badge variant="outline" className="border-cyan-400/50 text-cyan-300 bg-cyan-500/10">
                                        🔧 {result.subsystem}
                                      </Badge>
                                      <Badge variant="outline" className="border-purple-400/50 text-purple-300 bg-purple-500/10">
                                        📄 {result.fileType}
                                      </Badge>
                                    </div>

                                    {result.sources && result.sources.length > 0 && (
                                      <details className="mt-4">
                                        <summary className="cursor-pointer text-blue-300 hover:text-blue-200 text-sm font-medium">
                                          📚 View Sources ({result.sources.length})
                                        </summary>
                                        <div className="mt-2 space-y-2 pl-4 border-l-2 border-blue-500/30">
                                          {result.sources.map((source, idx) => (
                                            <div key={idx} className="text-sm">
                                              <p className="text-blue-200 font-medium">{source.fileName}</p>
                                              <p className="text-blue-300/70 text-xs">{source.preview}</p>
                                            </div>
                                          ))}
                                        </div>
                                      </details>
                                    )}
                                  </div>
                                  
                                  <div className="flex flex-col space-y-2 ml-4">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-blue-300 hover:bg-blue-500/10"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-green-300 hover:bg-green-500/10"
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </AnimatePresence>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};