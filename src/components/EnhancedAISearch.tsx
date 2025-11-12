import React, { useState, useEffect } from 'react';
import { 
  Search, Upload, FileText, Loader2, CheckCircle, AlertCircle, 
  FolderOpen, File, RefreshCw, Download, Eye, Filter, FileDown, 
  FileSpreadsheet, FileText as FileTextIcon, Grid, List, 
  Settings, Database, Cloud, Zap, BarChart3, Users, Shield,
  Layers, Box, Cpu, HardDrive, Network, Activity, Image,
  FileImage, Wrench, Clipboard, Target, Microscope
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { googleDriveEnhancedV2Service } from '../services/googleDriveEnhancedV2';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  system: string;
  subsystem: string;
  score: number;
  preview: string;
  format: 'text' | 'table' | 'matrix' | 'diagram' | 'specification';
  sources: Array<{
    fileName: string;
    score: number;
    preview: string;
  }>;
  metadata?: {
    hasTable?: boolean;
    hasMatrix?: boolean;
    hasDiagram?: boolean;
    hasSpecifications?: boolean;
    tableData?: any[][];
    matrixData?: any[][];
  };
}

interface AdvancedSearchFilters {
  documentType: string;
  diagramType: string;
  wiringType: string;
  contentType: string;
  searchScope: string;
  resultFormat: string;
  includeDrawings: boolean;
  includeSpecifications: boolean;
  includeArchitecture: boolean;
  includeDesigns: boolean;
}

const config = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://metro-doc-ai-main.onrender.com'
};

export default function EnhancedAISearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [currentFolder, setCurrentFolder] = useState('root');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<any[]>([]);
  
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedSearchFilters>({
    documentType: '',
    diagramType: '',
    wiringType: '',
    contentType: '',
    searchScope: 'all',
    resultFormat: 'auto',
    includeDrawings: true,
    includeSpecifications: true,
    includeArchitecture: true,
    includeDesigns: true
  });

  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [backendStats, setBackendStats] = useState<any>(null);

  // Initialize service
  useEffect(() => {
    initializeService();
  }, []);

  const initializeService = async () => {
    try {
      await googleDriveEnhancedV2Service.initialize();
      await loadDriveFiles();
      await loadBackendStats();
      toast.success('✅ Enhanced AI Search initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Enhanced AI Search:', error);
      toast.error('❌ Failed to initialize Enhanced AI Search');
    }
  };

  const loadDriveFiles = async () => {
    try {
      const files = await googleDriveEnhancedV2Service.loadFiles(currentFolder);
      setDriveFiles(files);
    } catch (error) {
      console.error('Failed to load files:', error);
      toast.error('❌ Failed to load files');
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

  // Handle multiple file selection
  const handleFileToggle = (fileId: string) => {
    googleDriveEnhancedV2Service.toggleFileSelection(fileId);
    setSelectedFiles(googleDriveEnhancedV2Service.getSelectedFiles());
    
    // Update the display
    setDriveFiles(prev => prev.map(file => ({
      ...file,
      isSelected: googleDriveEnhancedV2Service.getSelectedFiles().includes(file.id)
    })));
  };

  const handleSelectAll = () => {
    googleDriveEnhancedV2Service.selectAllFiles(driveFiles);
    setSelectedFiles(googleDriveEnhancedV2Service.getSelectedFiles());
    setDriveFiles(prev => prev.map(file => ({
      ...file,
      isSelected: file.type === 'file' ? true : file.isSelected
    })));
    toast.success(`✅ Selected ${googleDriveEnhancedV2Service.getSelectedCount()} files`);
  };

  const handleClearSelection = () => {
    googleDriveEnhancedV2Service.clearSelection();
    setSelectedFiles([]);
    setDriveFiles(prev => prev.map(file => ({
      ...file,
      isSelected: false
    })));
    toast.success('✅ Selection cleared');
  };

  // Process selected files with enhanced chunking
  const handleProcessSelectedFiles = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress([]);

    try {
      // Clear backend first
      await fetch(`${config.API_BASE_URL}/clear`, { method: 'POST' });

      // Extract content from selected files
      const fileContents = await googleDriveEnhancedV2Service.extractFileContents(
        selectedFiles,
        (progress) => {
          setProcessingProgress(prev => {
            const updated = [...prev];
            const existingIndex = updated.findIndex(p => p.fileName === progress.fileName);
            if (existingIndex >= 0) {
              updated[existingIndex] = progress;
            } else {
              updated.push(progress);
            }
            return updated;
          });
        }
      );

      // Upload to backend with enhanced processing
      let totalUploaded = 0;
      for (const content of fileContents) {
        try {
          const formData = new FormData();
          const blob = new Blob([content.content], { type: 'text/plain' });
          formData.append('files', blob, content.name);
          formData.append('system', `Multi-File Selection - ${content.name.split('.')[0]}`);
          formData.append('subsystem', 'Enhanced Google Drive Upload');

          const response = await fetch(`${config.API_BASE_URL}/ingest`, {
            method: 'POST',
            body: formData
          });

          if (response.ok) {
            totalUploaded++;
          }
        } catch (error) {
          console.error(`Failed to upload ${content.name}:`, error);
        }
      }

      await loadBackendStats();
      toast.success(`✅ Processed ${totalUploaded}/${fileContents.length} files successfully`);

    } catch (error: any) {
      console.error('Processing failed:', error);
      toast.error(`❌ Processing failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };  // Enhanc
ed AI search with matrix/table support
  const handleEnhancedSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    if (selectedFiles.length === 0) {
      toast.error('Please select and process files first');
      return;
    }

    setIsSearching(true);

    try {
      console.log(`🔍 Enhanced AI search: "${searchQuery}"`);

      // Build enhanced query with filters and format preferences
      let enhancedQuery = searchQuery.trim();
      
      // Add format-specific instructions
      if (advancedFilters.resultFormat === 'table' || searchQuery.toLowerCase().includes('table') || searchQuery.toLowerCase().includes('matrix')) {
        enhancedQuery += ' Please format the response as a table or matrix when appropriate. Include column headers and organize data in rows and columns.';
      }
      
      if (advancedFilters.resultFormat === 'specification' || searchQuery.toLowerCase().includes('specification')) {
        enhancedQuery += ' Please provide detailed technical specifications with parameters, values, and units in a structured format.';
      }

      // Add drawing/diagram search capabilities
      if (advancedFilters.includeDrawings || searchQuery.toLowerCase().includes('drawing') || searchQuery.toLowerCase().includes('diagram')) {
        enhancedQuery += ' Include information about drawings, diagrams, schematics, and visual representations. Describe any architectural elements, wiring diagrams, or technical drawings mentioned.';
      }

      if (advancedFilters.includeArchitecture || searchQuery.toLowerCase().includes('architecture')) {
        enhancedQuery += ' Include architectural information, system architecture, component layouts, and structural designs.';
      }

      // Add advanced filter context
      const filterContext = [];
      if (advancedFilters.documentType) filterContext.push(`Document type: ${advancedFilters.documentType}`);
      if (advancedFilters.diagramType) filterContext.push(`Diagram type: ${advancedFilters.diagramType}`);
      if (advancedFilters.wiringType) filterContext.push(`Wiring type: ${advancedFilters.wiringType}`);
      if (advancedFilters.contentType) filterContext.push(`Content type: ${advancedFilters.contentType}`);

      if (filterContext.length > 0) {
        enhancedQuery += ` [Search filters: ${filterContext.join(', ')}]`;
      }

      console.log(`🔍 Enhanced query: "${enhancedQuery}"`);

      // Perform enhanced search
      const searchResponse = await fetch(`${config.API_BASE_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: enhancedQuery,
          k: 15, // More results for comprehensive analysis
          system: 'Multi-File Selection',
          subsystem: 'Enhanced Google Drive Upload',
          tags: [],
          enhanced: true,
          format_preference: advancedFilters.resultFormat
        })
      });

      if (!searchResponse.ok) {
        throw new Error(`Search request failed: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      console.log('📊 Enhanced search response:', searchData);

      const results: SearchResult[] = [];

      if (searchData.result && !searchData.result.includes('No relevant documents found')) {
        // Enhanced AI response processing with format detection
        let aiResponse = searchData.result;
        
        // Detect and preserve table/matrix formatting
        const hasTableData = this.detectTableFormat(aiResponse);
        const hasMatrixData = this.detectMatrixFormat(aiResponse);
        const hasDiagramInfo = this.detectDiagramContent(aiResponse);
        const hasSpecifications = this.detectSpecifications(aiResponse);

        // Format the response based on detected content
        let formattedResponse = aiResponse;
        let resultFormat: 'text' | 'table' | 'matrix' | 'diagram' | 'specification' = 'text';
        let metadata: any = {};

        if (hasTableData) {
          const tableData = this.extractTableData(aiResponse);
          formattedResponse = this.formatAsTable(aiResponse, tableData);
          resultFormat = 'table';
          metadata.hasTable = true;
          metadata.tableData = tableData;
        } else if (hasMatrixData) {
          const matrixData = this.extractMatrixData(aiResponse);
          formattedResponse = this.formatAsMatrix(aiResponse, matrixData);
          resultFormat = 'matrix';
          metadata.hasMatrix = true;
          metadata.matrixData = matrixData;
        } else if (hasSpecifications) {
          formattedResponse = this.formatAsSpecification(aiResponse);
          resultFormat = 'specification';
          metadata.hasSpecifications = true;
        } else if (hasDiagramInfo) {
          formattedResponse = this.formatAsDiagram(aiResponse);
          resultFormat = 'diagram';
          metadata.hasDiagram = true;
        }

        results.push({
          id: 'enhanced_ai_response',
          title: `🤖 Enhanced AI Analysis: "${searchQuery}"`,
          content: formattedResponse,
          system: 'Enhanced AI Search',
          subsystem: 'Multi-File Analysis',
          score: 1.0,
          format: resultFormat,
          preview: this.generatePreview(formattedResponse, resultFormat),
          sources: searchData.sources?.map((source: any) => ({
            fileName: source.fileName,
            score: source.score,
            preview: source.preview
          })) || [],
          metadata
        });

        // Add enhanced source analysis
        if (searchData.sources && searchData.sources.length > 0) {
          searchData.sources.forEach((source: any, index: number) => {
            const sourceFormat = this.detectSourceFormat(source.preview);
            
            results.push({
              id: `enhanced_source_${index}`,
              title: `📄 ${source.fileName} (${Math.round(source.score * 100)}% match)`,
              content: source.preview || 'No preview available',
              system: source.system || 'Multi-File Selection',
              subsystem: `Chunk ${source.position + 1}`,
              score: source.score || 0.5,
              format: sourceFormat,
              preview: this.generatePreview(source.preview, sourceFormat),
              sources: [{
                fileName: source.fileName,
                score: source.score || 0.5,
                preview: source.preview || 'No preview available'
              }],
              metadata: this.extractSourceMetadata(source.preview)
            });
          });
        }

        toast.success(`🎉 Found ${searchData.sources?.length || 0} relevant sections with enhanced formatting!`);
      } else {
        // Enhanced no results handling
        results.push({
          id: 'no_results_enhanced',
          title: '🔍 No Results Found - Enhanced Search',
          content: this.generateEnhancedNoResultsMessage(searchQuery, selectedFiles.length),
          system: 'Enhanced Search Help',
          subsystem: 'No Results',
          score: 0.5,
          format: 'text',
          preview: `No results for "${searchQuery}" in ${selectedFiles.length} selected files`,
          sources: []
        });

        toast('🔍 No results found. Try the enhanced search suggestions below.');
      }

      setSearchResults(results);

    } catch (error: any) {
      console.error('Enhanced search error:', error);
      toast.error(`Enhanced search failed: ${error.message}`);
      
      setSearchResults([{
        id: 'search_error_enhanced',
        title: '❌ Enhanced Search Error',
        content: this.generateErrorMessage(error.message, selectedFiles.length),
        system: 'Error Handler',
        subsystem: 'Enhanced Search Error',
        score: 0,
        format: 'text',
        preview: `Enhanced search failed: ${error.message}`,
        sources: []
      }]);
    } finally {
      setIsSearching(false);
    }
  };

  // Helper methods for format detection and processing
  private detectTableFormat = (content: string): boolean => {
    return /\|.*\|.*\|/.test(content) || 
           /┌.*┐/.test(content) || 
           /├.*┤/.test(content) ||
           content.includes('│') ||
           /\b(table|matrix|specification|parameter|value)\b/i.test(content);
  };

  private detectMatrixFormat = (content: string): boolean => {
    return /\[.*\].*\[.*\]/.test(content) || 
           content.includes('matrix') ||
           /\d+\s*x\s*\d+/.test(content);
  };

  private detectDiagramContent = (content: string): boolean => {
    return /\b(diagram|drawing|schematic|blueprint|layout|architecture|design)\b/i.test(content);
  };

  private detectSpecifications = (content: string): boolean => {
    return /\b(specification|spec|parameter|requirement|standard|tolerance)\b/i.test(content);
  };

  private extractTableData = (content: string): any[][] => {
    // Extract table data from formatted content
    const lines = content.split('\n');
    const tableData: any[][] = [];
    
    for (const line of lines) {
      if (line.includes('|') || line.includes('│')) {
        const cells = line.split(/[|│]/).map(cell => cell.trim()).filter(cell => cell);
        if (cells.length > 1) {
          tableData.push(cells);
        }
      }
    }
    
    return tableData;
  };

  private extractMatrixData = (content: string): any[][] => {
    // Extract matrix data from content
    const matrixPattern = /\[(.*?)\]/g;
    const matches = content.match(matrixPattern);
    
    if (matches) {
      return matches.map(match => 
        match.slice(1, -1).split(',').map(item => item.trim())
      );
    }
    
    return [];
  };

  private formatAsTable = (content: string, tableData: any[][]): string => {
    if (tableData.length === 0) return content;
    
    let formatted = content + '\n\n📊 ENHANCED TABLE VIEW:\n';
    formatted += '┌' + '─'.repeat(80) + '┐\n';
    
    tableData.forEach((row, index) => {
      if (index === 0) {
        // Header row
        formatted += '│ ' + row.map(cell => cell.padEnd(18)).join(' │ ') + ' │\n';
        formatted += '├' + '─'.repeat(80) + '┤\n';
      } else {
        formatted += '│ ' + row.map(cell => String(cell).padEnd(18)).join(' │ ') + ' │\n';
      }
    });
    
    formatted += '└' + '─'.repeat(80) + '┘\n';
    return formatted;
  };

  private formatAsMatrix = (content: string, matrixData: any[][]): string => {
    if (matrixData.length === 0) return content;
    
    let formatted = content + '\n\n🔢 ENHANCED MATRIX VIEW:\n';
    formatted += '┌' + ' '.repeat(60) + '┐\n';
    
    matrixData.forEach(row => {
      formatted += '│ [' + row.join(', ') + ']'.padEnd(58) + ' │\n';
    });
    
    formatted += '└' + ' '.repeat(60) + '┘\n';
    return formatted;
  };

  private formatAsSpecification = (content: string): string => {
    let formatted = content + '\n\n📋 ENHANCED SPECIFICATION VIEW:\n';
    formatted += '═'.repeat(80) + '\n';
    
    // Extract specifications and format them
    const lines = content.split('\n');
    const specs: string[] = [];
    
    lines.forEach(line => {
      if (line.includes(':') && (
        /\b(voltage|current|power|speed|temperature|pressure|frequency)\b/i.test(line) ||
        /\b\d+\s*(V|A|W|Hz|°C|bar|psi|rpm|km\/h|m\/s)\b/i.test(line)
      )) {
        specs.push(line.trim());
      }
    });
    
    if (specs.length > 0) {
      formatted += '┌─────────────────────────────────────────────────────────────┐\n';
      formatted += '│                    TECHNICAL SPECIFICATIONS                  │\n';
      formatted += '├─────────────────────────────────────────────────────────────┤\n';
      
      specs.forEach(spec => {
        formatted += `│ ${spec.padEnd(59)} │\n`;
      });
      
      formatted += '└─────────────────────────────────────────────────────────────┘\n';
    }
    
    return formatted;
  };

  private formatAsDiagram = (content: string): string => {
    let formatted = content + '\n\n🎨 ENHANCED DIAGRAM ANALYSIS:\n';
    formatted += '═'.repeat(80) + '\n';
    
    // Extract diagram-related information
    const diagramKeywords = ['diagram', 'drawing', 'schematic', 'layout', 'architecture', 'design', 'blueprint'];
    const lines = content.split('\n');
    const diagramInfo: string[] = [];
    
    lines.forEach(line => {
      if (diagramKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
        diagramInfo.push(line.trim());
      }
    });
    
    if (diagramInfo.length > 0) {
      formatted += '┌─────────────────────────────────────────────────────────────┐\n';
      formatted += '│                    DIAGRAM INFORMATION                       │\n';
      formatted += '├─────────────────────────────────────────────────────────────┤\n';
      
      diagramInfo.forEach(info => {
        formatted += `│ ${info.substring(0, 59).padEnd(59)} │\n`;
      });
      
      formatted += '└─────────────────────────────────────────────────────────────┘\n';
    }
    
    return formatted;
  };

  private detectSourceFormat = (content: string): 'text' | 'table' | 'matrix' | 'diagram' | 'specification' => {
    if (this.detectTableFormat(content)) return 'table';
    if (this.detectMatrixFormat(content)) return 'matrix';
    if (this.detectSpecifications(content)) return 'specification';
    if (this.detectDiagramContent(content)) return 'diagram';
    return 'text';
  };

  private generatePreview = (content: string, format: string): string => {
    const maxLength = format === 'table' || format === 'matrix' ? 500 : 300;
    return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
  };

  private extractSourceMetadata = (content: string): any => {
    return {
      hasTable: this.detectTableFormat(content),
      hasMatrix: this.detectMatrixFormat(content),
      hasDiagram: this.detectDiagramContent(content),
      hasSpecifications: this.detectSpecifications(content),
      contentLength: content.length,
      wordCount: content.split(/\s+/).length
    };
  };

  private generateEnhancedNoResultsMessage = (query: string, fileCount: number): string => {
    return `No relevant information found for "${query}" in ${fileCount} selected files.

🔍 ENHANCED SEARCH SUGGESTIONS:

**For Technical Specifications:**
• "What are the technical specifications for [component]?"
• "Show me the parameter table for [system]"
• "What are the voltage and current ratings?"

**For Drawings and Diagrams:**
• "Show me the wiring diagram for [system]"
• "What architectural drawings are available?"
• "Describe the schematic layout of [component]"

**For Matrix/Table Data:**
• "Show me the specification matrix"
• "What are the test results in table format?"
• "Display the parameter comparison table"

**For Architecture and Design:**
• "What is the system architecture?"
• "Show me the component layout design"
• "Describe the structural drawings"

📊 SEARCH SCOPE: ${fileCount} files processed
🎯 TIP: Use the advanced filters to narrow down your search by document type, diagram type, or content format.`;
  };

  private generateErrorMessage = (error: string, fileCount: number): string => {
    return `Enhanced search failed: ${error}

🔧 TROUBLESHOOTING STEPS:
1. Verify ${fileCount} selected files are properly processed
2. Check backend connection (${config.API_BASE_URL})
3. Try refreshing and reprocessing the files
4. Ensure files contain searchable text content

📊 TECHNICAL DETAILS:
• Selected Files: ${fileCount}
• Backend Status: ${this.backendStats?.totalChunks || 0} chunks indexed
• Error Type: ${error}
• Search Mode: Enhanced AI with format detection

💡 SUGGESTIONS:
• Try a simpler query first
• Use the advanced search filters
• Check if the information exists in the selected files
• Contact support if the problem persists`;
  };  return (

    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-6 py-8">
        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Microscope className="text-blue-400" size={40} />
            Enhanced AI Search & Analysis
          </h1>
          <p className="text-blue-200 text-lg mb-4">
            Advanced multi-file search with matrix/table support, diagram analysis, and architectural intelligence
          </p>
          
          {/* Enhanced Status Bar */}
          <div className="flex justify-center items-center gap-6 text-sm">
            <div className="flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">
              <Database size={16} />
              <span>{backendStats?.totalChunks || 0} chunks indexed</span>
            </div>
            <div className="flex items-center gap-2 bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full">
              <FileText size={16} />
              <span>{selectedFiles.length} files selected</span>
            </div>
            <div className="flex items-center gap-2 bg-green-500/20 text-green-300 px-3 py-1 rounded-full">
              <Target size={16} />
              <span>Enhanced Format Detection</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            
            {/* Left Panel: File Selection */}
            <div className="xl:col-span-1 bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FolderOpen className="text-blue-400" size={20} />
                  Multi-File Selection
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="p-2 text-blue-300 hover:text-white hover:bg-blue-700/30 rounded-lg transition-all"
                    title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
                  >
                    {viewMode === 'grid' ? <List size={16} /> : <Grid size={16} />}
                  </button>
                  <button
                    onClick={loadDriveFiles}
                    className="p-2 text-blue-300 hover:text-white hover:bg-blue-700/30 rounded-lg transition-all"
                    title="Refresh files"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              {/* Selection Controls */}
              <div className="mb-4 flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="flex-1 px-3 py-2 bg-blue-600/30 text-blue-200 rounded-lg hover:bg-blue-600/50 transition-all text-sm"
                >
                  Select All
                </button>
                <button
                  onClick={handleClearSelection}
                  className="flex-1 px-3 py-2 bg-red-600/30 text-red-200 rounded-lg hover:bg-red-600/50 transition-all text-sm"
                >
                  Clear
                </button>
              </div>

              {/* Files List */}
              <div className={`space-y-2 max-h-96 overflow-y-auto ${viewMode === 'grid' ? 'grid grid-cols-1 gap-2' : ''}`}>
                {driveFiles.length === 0 ? (
                  <div className="text-center py-8 text-blue-300">
                    <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No files found</p>
                  </div>
                ) : (
                  driveFiles.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => handleFileToggle(file.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all border ${
                        file.isSelected
                          ? 'bg-blue-600/30 text-white border-blue-400'
                          : file.type === 'file'
                          ? 'bg-white/5 hover:bg-white/10 text-blue-100 border-transparent hover:border-blue-400/30'
                          : 'bg-gray-500/20 text-gray-400 border-transparent cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-lg">
                          {file.type === 'folder' ? '📁' : 
                           file.mimeType?.includes('pdf') ? '📄' :
                           file.mimeType?.includes('image') ? '🖼️' :
                           file.mimeType?.includes('sheet') ? '📊' :
                           file.mimeType?.includes('document') ? '📝' : '📄'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate text-sm">{file.name}</div>
                          <div className="text-xs opacity-70 flex items-center gap-2">
                            <span>{file.size}</span>
                            {file.isSelected && (
                              <span className="text-green-400">• Selected</span>
                            )}
                          </div>
                        </div>
                        {file.isSelected && (
                          <CheckCircle className="text-green-400" size={16} />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Process Button */}
              {selectedFiles.length > 0 && (
                <div className="mt-6">
                  <button
                    onClick={handleProcessSelectedFiles}
                    disabled={isProcessing}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Processing {selectedFiles.length} files...
                      </>
                    ) : (
                      <>
                        <Upload size={20} />
                        Process {selectedFiles.length} Selected Files
                      </>
                    )}
                  </button>
                  
                  {/* Processing Progress */}
                  {isProcessing && processingProgress.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {processingProgress.map((progress, index) => (
                        <div key={index} className="bg-blue-800/30 rounded-lg p-2">
                          <div className="flex justify-between text-xs text-blue-200 mb-1">
                            <span>{progress.fileName}</span>
                            <span>{Math.round(progress.progress)}%</span>
                          </div>
                          <div className="w-full bg-blue-900/50 rounded-full h-1">
                            <div 
                              className="bg-blue-400 h-1 rounded-full transition-all"
                              style={{ width: `${progress.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Middle Panel: Enhanced Search */}
            <div className="xl:col-span-2 bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Microscope className="text-green-400" size={20} />
                  Enhanced AI Search
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                    className="flex items-center gap-2 px-3 py-2 bg-purple-600/30 text-purple-200 rounded-lg hover:bg-purple-600/50 transition-all text-sm"
                  >
                    <Filter size={14} />
                    {showAdvancedSearch ? 'Hide' : 'Show'} Advanced
                  </button>
                </div>
              </div>

              {/* Search Input */}
              <div className="mb-6">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleEnhancedSearch()}
                    placeholder="Ask about specifications, diagrams, architecture, or technical details..."
                    className="flex-1 px-4 py-3 rounded-lg border border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    disabled={isSearching || selectedFiles.length === 0}
                  />
                  <button
                    onClick={handleEnhancedSearch}
                    disabled={isSearching || !searchQuery.trim() || selectedFiles.length === 0}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed font-medium flex items-center gap-2 transition-all"
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
                  {selectedFiles.length === 0 && (
                    <div className="text-yellow-300 flex items-center gap-2">
                      <AlertCircle size={16} />
                      Select and process files to enable enhanced search
                    </div>
                  )}
                  {selectedFiles.length > 0 && (
                    <div className="text-green-300 flex items-center gap-2">
                      <CheckCircle size={16} />
                      Ready to search in {selectedFiles.length} processed files
                    </div>
                  )}
                </div>
              </div>

              {/* Advanced Search Filters */}
              {showAdvancedSearch && (
                <div className="mb-6 bg-purple-900/20 rounded-lg p-4 border border-purple-400/30">
                  <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                    <Settings className="text-purple-400" size={16} />
                    Advanced Search Configuration
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-purple-200 text-xs mb-1 block">Document Type</label>
                      <select
                        value={advancedFilters.documentType}
                        onChange={(e) => setAdvancedFilters({...advancedFilters, documentType: e.target.value})}
                        className="w-full px-2 py-1 text-xs bg-purple-900/50 text-white rounded border border-purple-600/30"
                      >
                        <option value="">All Types</option>
                        <option value="technical">Technical Specifications</option>
                        <option value="safety">Safety Documentation</option>
                        <option value="maintenance">Maintenance Manuals</option>
                        <option value="operational">Operational Procedures</option>
                        <option value="architectural">Architectural Drawings</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-purple-200 text-xs mb-1 block">Result Format</label>
                      <select
                        value={advancedFilters.resultFormat}
                        onChange={(e) => setAdvancedFilters({...advancedFilters, resultFormat: e.target.value})}
                        className="w-full px-2 py-1 text-xs bg-purple-900/50 text-white rounded border border-purple-600/30"
                      >
                        <option value="auto">Auto-Detect Format</option>
                        <option value="table">Table/Matrix Format</option>
                        <option value="specification">Technical Specifications</option>
                        <option value="diagram">Diagram Analysis</option>
                        <option value="text">Standard Text</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-purple-200 text-xs mb-1 block">Diagram Type</label>
                      <select
                        value={advancedFilters.diagramType}
                        onChange={(e) => setAdvancedFilters({...advancedFilters, diagramType: e.target.value})}
                        className="w-full px-2 py-1 text-xs bg-purple-900/50 text-white rounded border border-purple-600/30"
                      >
                        <option value="">All Diagrams</option>
                        <option value="wiring">Wiring Diagrams</option>
                        <option value="schematic">Schematic Drawings</option>
                        <option value="layout">Layout Plans</option>
                        <option value="architectural">Architectural Drawings</option>
                        <option value="flowchart">Process Flowcharts</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-purple-200 text-xs mb-1 block">Content Scope</label>
                      <select
                        value={advancedFilters.searchScope}
                        onChange={(e) => setAdvancedFilters({...advancedFilters, searchScope: e.target.value})}
                        className="w-full px-2 py-1 text-xs bg-purple-900/50 text-white rounded border border-purple-600/30"
                      >
                        <option value="all">All Content</option>
                        <option value="specifications">Specifications Only</option>
                        <option value="procedures">Procedures Only</option>
                        <option value="drawings">Drawings & Diagrams</option>
                        <option value="tables">Tables & Data</option>
                      </select>
                    </div>
                  </div>

                  {/* Enhanced Search Options */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-purple-200 text-xs">
                        <input
                          type="checkbox"
                          checked={advancedFilters.includeDrawings}
                          onChange={(e) => setAdvancedFilters({...advancedFilters, includeDrawings: e.target.checked})}
                          className="rounded"
                        />
                        <Image size={14} />
                        Include Drawings & Diagrams
                      </label>
                      <label className="flex items-center gap-2 text-purple-200 text-xs">
                        <input
                          type="checkbox"
                          checked={advancedFilters.includeSpecifications}
                          onChange={(e) => setAdvancedFilters({...advancedFilters, includeSpecifications: e.target.checked})}
                          className="rounded"
                        />
                        <Clipboard size={14} />
                        Include Technical Specifications
                      </label>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-purple-200 text-xs">
                        <input
                          type="checkbox"
                          checked={advancedFilters.includeArchitecture}
                          onChange={(e) => setAdvancedFilters({...advancedFilters, includeArchitecture: e.target.checked})}
                          className="rounded"
                        />
                        <Layers size={14} />
                        Include Architecture & Design
                      </label>
                      <label className="flex items-center gap-2 text-purple-200 text-xs">
                        <input
                          type="checkbox"
                          checked={advancedFilters.includeDesigns}
                          onChange={(e) => setAdvancedFilters({...advancedFilters, includeDesigns: e.target.checked})}
                          className="rounded"
                        />
                        <Wrench size={14} />
                        Include Engineering Designs
                      </label>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setAdvancedFilters({
                      documentType: '', diagramType: '', wiringType: '', contentType: '',
                      searchScope: 'all', resultFormat: 'auto',
                      includeDrawings: true, includeSpecifications: true,
                      includeArchitecture: true, includeDesigns: true
                    })}
                    className="mt-3 text-xs text-purple-300 hover:text-white"
                  >
                    Reset All Filters
                  </button>
                </div>
              )}

              {/* Enhanced Example Queries */}
              {selectedFiles.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                    <Target className="text-green-400" size={16} />
                    Enhanced Query Examples
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { query: 'Show me the technical specifications in table format', icon: '📊' },
                      { query: 'What wiring diagrams and schematics are available?', icon: '🔌' },
                      { query: 'Display the system architecture and component layout', icon: '🏗️' },
                      { query: 'What are the voltage and current specifications matrix?', icon: '⚡' },
                      { query: 'Show me the maintenance procedures and safety protocols', icon: '🔧' },
                      { query: 'What drawings show the structural design details?', icon: '📐' }
                    ].map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setSearchQuery(example.query)}
                        className="text-left text-blue-200 hover:text-white hover:bg-blue-700/30 px-3 py-2 rounded text-sm transition-all border border-blue-600/20 hover:border-blue-400/50 flex items-center gap-2"
                      >
                        <span className="text-lg">{example.icon}</span>
                        <span>{example.query}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel: Enhanced Results */}
            <div className="xl:col-span-1 bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <BarChart3 className="text-orange-400" size={20} />
                  Enhanced Results
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
                        <h4 className="text-white font-medium text-sm leading-tight flex items-center gap-2">
                          {result.format === 'table' && <FileSpreadsheet className="text-green-400" size={16} />}
                          {result.format === 'matrix' && <Grid className="text-blue-400" size={16} />}
                          {result.format === 'diagram' && <FileImage className="text-purple-400" size={16} />}
                          {result.format === 'specification' && <Clipboard className="text-orange-400" size={16} />}
                          {result.format === 'text' && <FileText className="text-gray-400" size={16} />}
                          {result.title}
                        </h4>
                        <div className="flex items-center gap-2 ml-2">
                          {result.score > 0 && (
                            <span className="text-xs bg-blue-600/30 text-blue-200 px-2 py-1 rounded">
                              {Math.round(result.score * 100)}%
                            </span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded ${
                            result.format === 'table' ? 'bg-green-600/30 text-green-200' :
                            result.format === 'matrix' ? 'bg-blue-600/30 text-blue-200' :
                            result.format === 'diagram' ? 'bg-purple-600/30 text-purple-200' :
                            result.format === 'specification' ? 'bg-orange-600/30 text-orange-200' :
                            'bg-gray-600/30 text-gray-200'
                          }`}>
                            {result.format.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-blue-200 text-xs mb-3 flex items-center gap-2">
                        <span>📁 {result.system}</span>
                        <span>•</span>
                        <span>📂 {result.subsystem}</span>
                      </div>
                      
                      <div className="text-white text-xs leading-relaxed mb-3 max-h-40 overflow-y-auto font-mono">
                        {result.content.split('\n').map((line, i) => (
                          <div key={i} className={
                            line.includes('┌') || line.includes('├') || line.includes('└') || line.includes('│') ? 'text-blue-300' :
                            line.includes('═') ? 'text-yellow-300 font-bold' :
                            line.startsWith('**') ? 'font-medium mt-2 text-green-300' : 
                            'text-white'
                          }>
                            {line}
                          </div>
                        ))}
                      </div>
                      
                      {result.metadata && (
                        <div className="pt-3 border-t border-white/10">
                          <div className="text-blue-200 text-xs flex items-center gap-4">
                            {result.metadata.hasTable && <span className="flex items-center gap-1"><FileSpreadsheet size={12} /> Table</span>}
                            {result.metadata.hasMatrix && <span className="flex items-center gap-1"><Grid size={12} /> Matrix</span>}
                            {result.metadata.hasDiagram && <span className="flex items-center gap-1"><FileImage size={12} /> Diagram</span>}
                            {result.metadata.hasSpecifications && <span className="flex items-center gap-1"><Clipboard size={12} /> Specs</span>}
                          </div>
                        </div>
                      )}
                      
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
                  <Microscope size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No enhanced search results yet</p>
                  <p className="text-sm opacity-70">
                    {selectedFiles.length === 0 
                      ? 'Select and process files to enable enhanced search'
                      : 'Enter a query to search with enhanced format detection'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Footer Stats */}
          {backendStats && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-6 bg-white/5 backdrop-blur-sm rounded-lg px-6 py-3 text-sm text-blue-200">
                <span className="flex items-center gap-2">
                  <Database size={16} />
                  {backendStats.totalChunks} chunks indexed
                </span>
                <span className="flex items-center gap-2">
                  <FileText size={16} />
                  {backendStats.uniqueFiles} files processed
                </span>
                <span className="flex items-center gap-2">
                  <Microscope size={16} />
                  Enhanced AI analysis ready
                </span>
                <span className="flex items-center gap-2">
                  <Target size={16} />
                  Multi-format detection enabled
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}