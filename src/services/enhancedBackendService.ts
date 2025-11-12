// Enhanced Backend Service with advanced features
import { config } from '../config/environment';

export interface EnhancedSearchRequest {
  query: string;
  k?: number;
  system?: string;
  subsystem?: string;
  tags?: string[];
  enhanced?: boolean;
  format_preference?: 'auto' | 'table' | 'matrix' | 'diagram' | 'specification';
  include_drawings?: boolean;
  include_architecture?: boolean;
  include_specifications?: boolean;
  search_scope?: 'all' | 'specifications' | 'procedures' | 'drawings' | 'tables';
}

export interface EnhancedSearchResult {
  result: string;
  sources: Array<{
    fileName: string;
    system: string;
    subsystem: string;
    position: number;
    score: number;
    preview: string;
    metadata?: any;
  }>;
  used: number;
  totalIndexed: number;
  query: string;
  result_format: string;
  has_tabular: boolean;
  processing_time: number;
  enhanced_features: {
    format_detected: string;
    table_count: number;
    diagram_count: number;
    specification_count: number;
  };
}

export interface ChunkedUploadRequest {
  fileName: string;
  fileSize: number;
  mimeType: string;
  totalChunks: number;
  system: string;
  subsystem: string;
}

export interface ChunkUploadRequest {
  uploadId: string;
  chunkIndex: number;
  chunkData: string;
  isLastChunk: boolean;
}

class EnhancedBackendService {
  private baseURL: string;
  private uploadQueue: Map<string, any> = new Map();

  constructor() {
    this.baseURL = config.API_BASE_URL || 'https://metro-doc-ai-main.onrender.com';
    console.log('🚀 EnhancedBackendService initialized with URL:', this.baseURL);
  }

  // Enhanced AI search with format detection
  async enhancedSearch(request: EnhancedSearchRequest): Promise<EnhancedSearchResult> {
    try {
      console.log('🔍 Enhanced AI search request:', request);

      // Build enhanced query with format hints
      let enhancedQuery = request.query;
      
      if (request.format_preference === 'table' || request.query.toLowerCase().includes('table') || request.query.toLowerCase().includes('matrix')) {
        enhancedQuery += ' Please format the response as a table or matrix when appropriate. Include column headers and organize data in rows and columns with proper alignment.';
      }
      
      if (request.format_preference === 'specification' || request.query.toLowerCase().includes('specification')) {
        enhancedQuery += ' Please provide detailed technical specifications with parameters, values, units, and tolerances in a structured format with clear categories.';
      }

      if (request.include_drawings || request.query.toLowerCase().includes('drawing') || request.query.toLowerCase().includes('diagram')) {
        enhancedQuery += ' Include comprehensive information about drawings, diagrams, schematics, blueprints, and visual representations. Describe architectural elements, wiring diagrams, technical drawings, and any visual documentation mentioned in the documents.';
      }

      if (request.include_architecture || request.query.toLowerCase().includes('architecture')) {
        enhancedQuery += ' Include detailed architectural information, system architecture, component layouts, structural designs, and overall system organization.';
      }

      if (request.include_specifications || request.query.toLowerCase().includes('spec')) {
        enhancedQuery += ' Include all technical specifications, parameters, requirements, standards, tolerances, and performance criteria.';
      }

      // Add search scope context
      if (request.search_scope && request.search_scope !== 'all') {
        enhancedQuery += ` Focus specifically on ${request.search_scope} content.`;
      }

      const searchPayload = {
        query: enhancedQuery,
        k: request.k || 15,
        system: request.system || '',
        subsystem: request.subsystem || '',
        tags: request.tags || [],
        enhanced: true,
        format_preference: request.format_preference || 'auto'
      };

      const response = await fetch(`${this.baseURL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchPayload)
      });

      if (!response.ok) {
        throw new Error(`Enhanced search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 Enhanced search response received');

      // Enhance the response with format detection
      const enhancedResult: EnhancedSearchResult = {
        ...data,
        enhanced_features: {
          format_detected: this.detectResponseFormat(data.result),
          table_count: this.countTables(data.result),
          diagram_count: this.countDiagrams(data.result),
          specification_count: this.countSpecifications(data.result)
        }
      };

      return enhancedResult;

    } catch (error: any) {
      console.error('❌ Enhanced search failed:', error);
      throw new Error(`Enhanced search failed: ${error.message}`);
    }
  }

  // Detect response format
  private detectResponseFormat(content: string): string {
    if (this.hasTableFormat(content)) return 'table';
    if (this.hasMatrixFormat(content)) return 'matrix';
    if (this.hasSpecificationFormat(content)) return 'specification';
    if (this.hasDiagramContent(content)) return 'diagram';
    return 'text';
  }

  private hasTableFormat(content: string): boolean {
    return /\|.*\|.*\|/.test(content) || 
           /┌.*┐/.test(content) || 
           /├.*┤/.test(content) ||
           content.includes('│') ||
           /\b(table|matrix|specification|parameter|value)\b/i.test(content);
  }

  private hasMatrixFormat(content: string): boolean {
    return /\[.*\].*\[.*\]/.test(content) || 
           content.includes('matrix') ||
           /\d+\s*x\s*\d+/.test(content);
  }

  private hasSpecificationFormat(content: string): boolean {
    return /\b(specification|spec|parameter|requirement|standard|tolerance)\b/i.test(content) &&
           /\b\d+\s*(V|A|W|Hz|°C|bar|psi|rpm|km\/h|m\/s|mm|cm|m|kg|g|lb)\b/i.test(content);
  }

  private hasDiagramContent(content: string): boolean {
    return /\b(diagram|drawing|schematic|blueprint|layout|architecture|design|wiring|circuit)\b/i.test(content);
  }

  private countTables(content: string): number {
    const tableMatches = content.match(/┌.*?└/gs) || [];
    const pipeTableMatches = content.match(/\|.*?\|.*?\|/g) || [];
    return tableMatches.length + Math.floor(pipeTableMatches.length / 3);
  }

  private countDiagrams(content: string): number {
    const diagramKeywords = ['diagram', 'drawing', 'schematic', 'blueprint', 'layout', 'architecture', 'design'];
    let count = 0;
    diagramKeywords.forEach(keyword => {
      const matches = content.toLowerCase().match(new RegExp(`\\b${keyword}\\b`, 'g'));
      if (matches) count += matches.length;
    });
    return count;
  }

  private countSpecifications(content: string): number {
    const specMatches = content.match(/\b\d+\s*(V|A|W|Hz|°C|bar|psi|rpm|km\/h|m\/s|mm|cm|m|kg|g|lb)\b/gi) || [];
    return specMatches.length;
  }

  // Initialize chunked upload for large files
  async initializeChunkedUpload(request: ChunkedUploadRequest): Promise<{ success: boolean; uploadId?: string; error?: string }> {
    try {
      console.log('📦 Initializing chunked upload:', request.fileName);

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'init_chunked_upload',
          ...request
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to initialize chunked upload');
      }

      // Store upload info
      this.uploadQueue.set(result.uploadId, {
        ...request,
        uploadId: result.uploadId,
        chunksUploaded: 0,
        startTime: Date.now()
      });

      console.log('✅ Chunked upload initialized:', result.uploadId);
      return result;

    } catch (error: any) {
      console.error('❌ Failed to initialize chunked upload:', error);
      return { success: false, error: error.message };
    }
  }

  // Upload a single chunk
  async uploadChunk(request: ChunkUploadRequest): Promise<{ success: boolean; error?: string }> {
    try {
      const uploadInfo = this.uploadQueue.get(request.uploadId);
      if (!uploadInfo) {
        throw new Error('Upload session not found');
      }

      console.log(`📦 Uploading chunk ${request.chunkIndex + 1}/${uploadInfo.totalChunks}`);

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upload_chunk',
          ...request
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Chunk ${request.chunkIndex + 1} upload failed`);
      }

      // Update upload progress
      uploadInfo.chunksUploaded = request.chunkIndex + 1;
      this.uploadQueue.set(request.uploadId, uploadInfo);

      console.log(`✅ Chunk ${request.chunkIndex + 1} uploaded successfully`);
      return result;

    } catch (error: any) {
      console.error(`❌ Chunk ${request.chunkIndex + 1} upload failed:`, error);
      return { success: false, error: error.message };
    }
  }

  // Finalize chunked upload
  async finalizeChunkedUpload(uploadId: string): Promise<{ success: boolean; fileId?: string; error?: string }> {
    try {
      const uploadInfo = this.uploadQueue.get(uploadId);
      if (!uploadInfo) {
        throw new Error('Upload session not found');
      }

      console.log('🏁 Finalizing chunked upload:', uploadId);

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'finalize_chunked_upload',
          uploadId
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to finalize chunked upload');
      }

      // Clean up upload info
      this.uploadQueue.delete(uploadId);

      const totalTime = Date.now() - uploadInfo.startTime;
      console.log(`✅ Chunked upload completed in ${totalTime}ms:`, result.fileId);

      return result;

    } catch (error: any) {
      console.error('❌ Failed to finalize chunked upload:', error);
      return { success: false, error: error.message };
    }
  }

  // Enhanced file ingestion with JSON support
  async ingestJSON(data: {
    content: string;
    fileName: string;
    system: string;
    subsystem: string;
    mimeType?: string;
  }): Promise<{ success: boolean; added?: number; error?: string }> {
    try {
      console.log('📤 Enhanced JSON ingestion:', data.fileName);

      const response = await fetch(`${this.baseURL}/ingest-json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          enhanced: true,
          timestamp: new Date().toISOString()
        })
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'JSON ingestion failed');
      }

      console.log('✅ JSON ingestion successful:', result.added, 'chunks added');
      return { success: true, added: result.added };

    } catch (error: any) {
      console.error('❌ JSON ingestion failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Enhanced statistics with format breakdown
  async getEnhancedStats(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/stats`);
      const stats = await response.json();

      // Add enhanced statistics
      const enhancedStats = {
        ...stats,
        enhanced_features: {
          format_support: ['table', 'matrix', 'diagram', 'specification'],
          chunked_upload_support: true,
          multi_file_processing: true,
          advanced_search: true
        },
        upload_queue_size: this.uploadQueue.size,
        active_uploads: Array.from(this.uploadQueue.keys())
      };

      return enhancedStats;

    } catch (error: any) {
      console.error('❌ Failed to get enhanced stats:', error);
      throw new Error(`Failed to get enhanced stats: ${error.message}`);
    }
  }

  // Search with advanced filters
  async searchWithFilters(filters: {
    keyword?: string;
    documentType?: string;
    diagramType?: string;
    wiringType?: string;
    contentType?: string;
    fileTypes?: string[];
    dateRange?: { start: Date; end: Date };
    sizeRange?: { min: number; max: number };
  }): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      params.append('action', 'enhanced_search');
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else if (typeof value === 'object' && value.start && value.end) {
            params.append(`${key}_start`, value.start.toISOString());
            params.append(`${key}_end`, value.end.toISOString());
          } else {
            params.append(key, String(value));
          }
        }
      });

      const url = `${this.baseURL}?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Enhanced search with filters failed');
      }

      return data.results || [];

    } catch (error: any) {
      console.error('❌ Enhanced search with filters failed:', error);
      throw new Error(`Enhanced search with filters failed: ${error.message}`);
    }
  }

  // Clear backend with confirmation
  async clearBackend(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🧹 Clearing backend...');

      const response = await fetch(`${this.baseURL}/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error('Failed to clear backend');
      }

      console.log('✅ Backend cleared successfully');
      return { success: true, message: 'Backend cleared successfully' };

    } catch (error: any) {
      console.error('❌ Failed to clear backend:', error);
      return { success: false, message: error.message };
    }
  }

  // Health check with enhanced information
  async healthCheck(): Promise<{
    ok: boolean;
    indexed: number;
    uptime: number;
    memory: any;
    timestamp: string;
    enhanced_features: string[];
  }> {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      const health = await response.json();

      return {
        ...health,
        enhanced_features: [
          'chunked_upload',
          'multi_file_processing',
          'format_detection',
          'advanced_search',
          'table_matrix_support',
          'diagram_analysis'
        ]
      };

    } catch (error: any) {
      console.error('❌ Health check failed:', error);
      throw new Error(`Health check failed: ${error.message}`);
    }
  }

  // Get upload queue status
  getUploadQueueStatus(): Array<{
    uploadId: string;
    fileName: string;
    progress: number;
    chunksUploaded: number;
    totalChunks: number;
    elapsedTime: number;
  }> {
    return Array.from(this.uploadQueue.entries()).map(([uploadId, info]) => ({
      uploadId,
      fileName: info.fileName,
      progress: (info.chunksUploaded / info.totalChunks) * 100,
      chunksUploaded: info.chunksUploaded,
      totalChunks: info.totalChunks,
      elapsedTime: Date.now() - info.startTime
    }));
  }

  // Cancel upload
  cancelUpload(uploadId: string): boolean {
    if (this.uploadQueue.has(uploadId)) {
      this.uploadQueue.delete(uploadId);
      console.log('🚫 Upload cancelled:', uploadId);
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const enhancedBackendService = new EnhancedBackendService();

// Export for testing or custom instances
export { EnhancedBackendService };