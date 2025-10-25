// API service layer for KMRCL Metro Document Intelligence

import { API_ENDPOINTS, config } from '@/config/environment';

export interface UploadResponse {
  ok: boolean;
  added: number;
  total: number;
  results: Array<{
    fileName: string;
    status: 'success' | 'error';
    chunks?: number;
    error?: string;
    metadata?: any;
  }>;
}

export interface SearchResponse {
  result: string;
  sources: Array<{
    ref: number;
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
  result_format?: string;
  has_tabular?: boolean;
}

export interface HealthResponse {
  ok: boolean;
  indexed: number;
  uptime: number;
  memory: any;
  timestamp: string;
}

export interface StatsResponse {
  totalChunks: number;
  uniqueFiles: number;
  byFile: Record<string, number>;
  bySystem: Record<string, number>;
  bySubsystem: Record<string, number>;
  byMimeType: Record<string, number>;
  tagCounts: Record<string, number>;
  averageChunkSize: number;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = config.API_BASE_URL;
  }

  // Generic fetch wrapper with error handling
  private async fetchWithErrorHandling<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(endpoint, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Health check
  async checkHealth(): Promise<HealthResponse> {
    return this.fetchWithErrorHandling<HealthResponse>(API_ENDPOINTS.HEALTH);
  }

  // Get statistics
  async getStats(): Promise<StatsResponse> {
    return this.fetchWithErrorHandling<StatsResponse>(API_ENDPOINTS.STATS);
  }

  // Upload files
  async uploadFiles(
    files: File[],
    system: string = '',
    subsystem: string = ''
  ): Promise<UploadResponse> {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file);
    });
    
    if (system) formData.append('system', system);
    if (subsystem) formData.append('subsystem', subsystem);

    const response = await fetch(API_ENDPOINTS.INGEST, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${errorText}`);
    }

    return await response.json();
  }

  // AI-powered search
  async search(
    query: string,
    options: {
      k?: number;
      system?: string;
      subsystem?: string;
      tags?: string[];
    } = {}
  ): Promise<SearchResponse> {
    return this.fetchWithErrorHandling<SearchResponse>(API_ENDPOINTS.ASK, {
      method: 'POST',
      body: JSON.stringify({
        query,
        k: options.k || 15,
        system: options.system || '',
        subsystem: options.subsystem || '',
        tags: options.tags || [],
      }),
    });
  }

  // Multi-document search (legacy compatibility)
  async searchMulti(
    keyword: string,
    system: string = '',
    subsystem: string = ''
  ): Promise<SearchResponse> {
    return this.fetchWithErrorHandling<SearchResponse>(API_ENDPOINTS.SEARCH_MULTI, {
      method: 'POST',
      body: JSON.stringify({
        keyword,
        system,
        subsystem,
      }),
    });
  }

  // Search by tags
  async searchByTags(
    tags: string[],
    query: string = 'Analyze documents with these tags'
  ): Promise<SearchResponse> {
    return this.fetchWithErrorHandling<SearchResponse>(API_ENDPOINTS.SEARCH_BY_TAGS, {
      method: 'POST',
      body: JSON.stringify({
        tags,
        query,
      }),
    });
  }

  // Clear index
  async clearIndex(): Promise<{ ok: boolean; total: number; message: string }> {
    return this.fetchWithErrorHandling(API_ENDPOINTS.CLEAR, {
      method: 'POST',
    });
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      await this.checkHealth();
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export for testing or custom instances
export { ApiService };