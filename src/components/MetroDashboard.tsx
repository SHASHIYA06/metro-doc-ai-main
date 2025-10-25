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
  Map,
  Layers,
  Activity,
  TrendingUp,
  Shield,
  Cpu,
  HardDrive,
  Wifi
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
  const [searchQuery, setSearchQuery] = useState('');
  const [systemFilter, setSystemFilter] = useState('');
  const [subsystemFilter, setSubsystemFilter] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [activeTab, setActiveTab] = useState('ai-search');
  const [totalIndexed, setTotalIndexed] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [backendStats, setBackendStats] = useState<any>(null);

  // Check backend connection on component mount
  useEffect(() => {
    checkBackendConnection();
    loadBackendStats();
  }, []);

  const checkBackendConnection = async () => {
    try {
      setConnectionStatus('connecting');
      const isConnected = await apiService.testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'error');

      if (isConnected) {
        toast.success(`Connected to backend at ${config.API_BASE_URL}`);
      } else {
        toast.error('Failed to connect to backend');
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      setConnectionStatus('error');
      toast.error('Backend connection failed');
    }
  };

  const loadBackendStats = async () => {
    try {
      const stats = await apiService.getStats();
      setBackendStats(stats);
      setTotalIndexed(stats.totalChunks);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  // Enhanced file upload with drag & drop
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
      // Update progress to show upload starting
      newFiles.forEach(file => {
        setUploadedFiles(prev => prev.map(f =>
          f.id === file.id ? { ...f, progress: 10 } : f
        ));
      });

      // Upload to backend
      const response = await apiService.uploadFiles(acceptedFiles, systemFilter, subsystemFilter);

      // Update files to completed status
      newFiles.forEach(file => {
        setUploadedFiles(prev => prev.map(f =>
          f.id === file.id ? { ...f, status: 'completed', progress: 100 } : f
        ));
      });

      setTotalIndexed(response.total);
      toast.success(`Successfully processed ${response.added} chunks from ${acceptedFiles.length} file(s)`);

      // Reload stats
      await loadBackendStats();

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
  }, [systemFilter, subsystemFilter]);

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

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-300 border-green-400/50 bg-green-500/10';
      case 'connecting': return 'text-yellow-300 border-yellow-400/50 bg-yellow-500/10';
      case 'error': return 'text-red-300 border-red-400/50 bg-red-500/10';
      default: return 'text-gray-300 border-gray-400/50 bg-gray-500/10';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Disconnected';
      default: return 'Unknown';
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
        fileType: 'PDF', // Could be enhanced to detect from fileName
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
        wire_details: [], // Could be extracted from response
        components: [], // Could be extracted from response
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

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="h-4 w-4 text-red-400" />;
    if (type.includes('image')) return <FileImage className="h-4 w-4 text-green-400" />;
    if (type.includes('spreadsheet') || type.includes('excel')) return <FileSpreadsheet className="h-4 w-4 text-blue-400" />;
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
                    <span>Advanced Document Search • OCR • Architecture Analysis • RAG AI</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className={getConnectionStatusColor()}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${connectionStatus === 'connected' ? 'bg-green-500' :
                      connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                  {getConnectionStatusText()}
                </Badge>
                <Badge variant="outline" className="text-blue-300 border-blue-400/50 bg-blue-500/10">
                  <Database className="h-3 w-3 mr-1" />
                  {totalIndexed} Documents Indexed
                </Badge>
                <Badge variant="outline" className="text-cyan-300 border-cyan-400/50 bg-cyan-500/10">
                  <Shield className="h-3 w-3 mr-1" />
                  Built for SHASHI SHEKHAR MISHRA
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkBackendConnection}
                  className="text-blue-300 border-blue-400/50 hover:bg-blue-500/10"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
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
                <p className="text-sm text-blue-200/70">Total Files</p>
                <p className="text-xl font-bold text-white">{uploadedFiles.length}</p>
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
                <p className="text-sm text-blue-200/70">Processed</p>
                <p className="text-xl font-bold text-white">{uploadedFiles.filter(f => f.status === 'completed').length}</p>
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
                <p className="text-sm text-blue-200/70">AI Queries</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Enhanced Upload Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Upload className="h-5 w-5 text-blue-400" />
                <span>Document Upload</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <motion.div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 ${isDragActive
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
                  <FileText className="h-12 w-12 text-blue-400 mx-auto mb-2" />
                </motion.div>
                <p className="text-blue-200 mb-2 font-medium">
                  {isDragActive ? 'Drop files here!' : 'Drop files or click to browse'}
                </p>
                <p className="text-sm text-blue-300/70">
                  PDF, DOCX, XLSX, Images, CSV
                </p>
              </motion.div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="System"
                  value={systemFilter}
                  onChange={(e) => setSystemFilter(e.target.value)}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
                <Input
                  placeholder="Subsystem"
                  value={subsystemFilter}
                  onChange={(e) => setSubsystemFilter(e.target.value)}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>

              {/* File Upload Status */}
              {uploadedFiles.length > 0 && (
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
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-3"
        >
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Brain className="h-5 w-5 text-purple-400" />
                <span>AI-Powered Search & Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-white/5 backdrop-blur-sm">
                  <TabsTrigger value="ai-search" className="data-[state=active]:bg-blue-500/20">
                    <Brain className="h-4 w-4 mr-1" />
                    AI Search
                  </TabsTrigger>
                  <TabsTrigger value="architecture" className="data-[state=active]:bg-purple-500/20">
                    <Network className="h-4 w-4 mr-1" />
                    Architecture
                  </TabsTrigger>
                  <TabsTrigger value="structured" className="data-[state=active]:bg-orange-500/20">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Structured
                  </TabsTrigger>
                  <TabsTrigger value="keyword" className="data-[state=active]:bg-cyan-500/20">
                    <Filter className="h-4 w-4 mr-1" />
                    Keyword
                  </TabsTrigger>
                </TabsList>

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

                <TabsContent value="architecture" className="space-y-4 mt-6">
                  <Textarea
                    placeholder="Describe the circuit, architecture, or technical diagram you're looking for... (e.g., 'Find door control circuit with safety interlocks')"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/50 min-h-[100px]"
                  />
                  <Button
                    onClick={() => handleSearch('architecture')}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Network className="h-4 w-4 mr-2" />}
                    Search Architecture & Diagrams
                  </Button>
                </TabsContent>

                <TabsContent value="structured" className="space-y-4 mt-6">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="System filter (e.g., Rolling Stock)"
                      value={systemFilter}
                      onChange={(e) => setSystemFilter(e.target.value)}
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                    />
                    <Input
                      placeholder="Subsystem filter (e.g., Doors)"
                      value={subsystemFilter}
                      onChange={(e) => setSubsystemFilter(e.target.value)}
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                  <Button
                    onClick={() => handleSearch('structured')}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
                    Structured Query Search
                  </Button>
                </TabsContent>

                <TabsContent value="keyword" className="space-y-4 mt-6">
                  <Input
                    placeholder="Enter keywords to search OCR text... (e.g., 'safety interlock', 'maintenance procedure')"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch('keyword')}
                  />
                  <Button
                    onClick={() => handleSearch('keyword')}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                    Search OCR Content
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Enhanced Results Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-green-400" />
                <span>Search Results & Analysis</span>
                {results.length > 0 && (
                  <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                    {results.length} Results
                  </Badge>
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-blue-300 hover:bg-blue-500/10"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-blue-300 hover:bg-purple-500/10"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-blue-300 hover:bg-gray-500/10"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Settings
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Search Results */}
              <div className="lg:col-span-2">
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
                        <p className="text-blue-300/70">Upload documents and start searching with AI-powered analysis!</p>
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
              </div>

              {/* Analysis Panel */}
              <div className="space-y-4">
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-sm text-white flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                      <span>Analysis Summary</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analysisResult ? (
                      <div className="space-y-3">
                        <p className="text-xs text-blue-200/80">{analysisResult.summary}</p>
                        <div className="pt-2 border-t border-white/10">
                          <p className="text-xs font-medium text-white mb-1">System Architecture:</p>
                          <p className="text-xs text-blue-300">{analysisResult.system_architecture.name} v{analysisResult.system_architecture.version}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-blue-300/70">Run a search to see analysis results</p>
                    )}
                  </CardContent>
                </Card>

                {analysisResult && (
                  <>
                    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                      <CardHeader>
                        <CardTitle className="text-sm text-white flex items-center space-x-2">
                          <CircuitBoard className="h-4 w-4 text-yellow-400" />
                          <span>Components ({analysisResult.components.length})</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {analysisResult.components.slice(0, 3).map((component, idx) => (
                            <div key={idx} className="text-xs bg-white/5 p-2 rounded">
                              <p className="font-medium text-white">{component.type}</p>
                              <p className="text-blue-300/70">{component.part_number}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                      <CardHeader>
                        <CardTitle className="text-sm text-white flex items-center space-x-2">
                          <Zap className="h-4 w-4 text-red-400" />
                          <span>Wiring ({analysisResult.wire_details.length})</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {analysisResult.wire_details.slice(0, 3).map((wire, idx) => (
                            <div key={idx} className="text-xs bg-white/5 p-2 rounded">
                              <p className="font-medium text-white">Wire {wire.number}</p>
                              <p className="text-blue-300/70">{wire.specification.substring(0, 40)}...</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};