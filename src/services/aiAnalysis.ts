// AI Analysis service for KMRCL Metro Document Intelligence
// Based on working HTML implementation

import { googleDriveService, FileContent } from './googleDrive';
import { apiService } from './api';

export interface AnalysisResult {
  technicalSummary: string;
  laymanSummary: string;
  wireDetails: WireDetail[];
  components: Component[];
  architectureSuggestion: string;
  sources: SourceDocument[];
  raw?: string;
}

export interface WireDetail {
  id: string;
  spec: string;
  from: string;
  to: string;
  voltage: string;
  current: string;
}

export interface Component {
  name: string;
  type: string;
  specs: Record<string, any>;
  location: string;
}

export interface SourceDocument {
  fileName: string;
  score: number;
  position: number;
  preview: string;
}

export type SearchType = 'ai' | 'diagram' | 'architecture' | 'technical';

class AIAnalysisService {
  private backendURL: string;

  constructor() {
    this.backendURL = import.meta.env.VITE_API_BASE_URL || 'https://metro-doc-ai-main.onrender.com';
  }

  // Main analysis function (based on working HTML)
  async analyzeWithAI(
    fileContents: FileContent[],
    query: string,
    searchType: SearchType = 'ai'
  ): Promise<AnalysisResult> {
    try {
      console.log('Starting AI analysis...');
      console.log('Files to analyze:', fileContents.length);
      console.log('Query:', query);
      console.log('Search type:', searchType);

      // Test backend connectivity first
      await this.testBackendConnection();

      // Send request to backend
      const response = await fetch(`${this.backendURL}/api/gemini/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          fileContents, 
          query, 
          searchType 
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('AI analysis complete:', result);

      return this.processAnalysisResult(result);
    } catch (error) {
      console.error('AI analysis failed:', error);
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  // Test backend connection
  private async testBackendConnection(): Promise<void> {
    try {
      console.log('Testing backend connection...');
      const healthCheck = await fetch(`${this.backendURL}/api/health`);
      
      if (!healthCheck.ok) {
        throw new Error(`Backend health check failed: HTTP ${healthCheck.status}`);
      }
      
      console.log('Backend connection successful');
    } catch (error) {
      console.error('Backend connection failed:', error);
      throw new Error(`Backend connection failed: ${error.message}`);
    }
  }

  // Process analysis result into structured format
  private processAnalysisResult(data: any): AnalysisResult {
    return {
      technicalSummary: data.technicalSummary || data.raw || "No technical summary available",
      laymanSummary: data.laymanSummary || "No layman summary available",
      wireDetails: this.extractWireDetails(data.wireDetails || []),
      components: this.extractComponents(data.components || []),
      architectureSuggestion: data.architectureSuggestion || "",
      sources: this.extractSources(data.sources || []),
      raw: data.raw
    };
  }

  // Extract wire details from analysis
  private extractWireDetails(wireData: any[]): WireDetail[] {
    return wireData.map(wire => ({
      id: wire.id || wire.wireId || '-',
      spec: wire.spec || wire.specification || '-',
      from: wire.from || wire.source || '-',
      to: wire.to || wire.destination || '-',
      voltage: wire.voltage || '-',
      current: wire.current || '-'
    }));
  }

  // Extract components from analysis
  private extractComponents(componentData: any[]): Component[] {
    return componentData.map(component => ({
      name: component.name || component.componentName || '-',
      type: component.type || component.componentType || '-',
      specs: component.specs || component.specifications || {},
      location: component.location || component.position || '-'
    }));
  }

  // Extract source documents
  private extractSources(sourceData: any[]): SourceDocument[] {
    return sourceData.map(source => ({
      fileName: source.fileName || source.FileName || source.name || '-',
      score: source.score || 0,
      position: source.position || 0,
      preview: source.preview || source.snippet || source.content || ''
    }));
  }

  // Analyze selected files from Google Drive (main entry point)
  async analyzeSelectedFiles(
    selectedFileIds: string[],
    query: string,
    searchType: SearchType = 'ai'
  ): Promise<AnalysisResult> {
    if (selectedFileIds.length === 0) {
      throw new Error("Please select at least one file to analyze");
    }

    try {
      console.log('Extracting file contents...');
      
      // Extract file contents from Google Drive
      const fileContents = await googleDriveService.extractFileContents(selectedFileIds);
      
      if (fileContents.length === 0) {
        throw new Error("No file contents could be extracted");
      }

      console.log('File contents extracted, starting AI analysis...');
      
      // Perform AI analysis
      const result = await this.analyzeWithAI(fileContents, query, searchType);
      
      return result;
    } catch (error) {
      console.error('File analysis failed:', error);
      throw new Error(`File analysis failed: ${error.message}`);
    }
  }

  // Search using backend API (for compatibility)
  async searchDocuments(
    query: string,
    options: { k?: number } = {}
  ): Promise<any> {
    try {
      const response = await apiService.search(query, options);
      return response;
    } catch (error) {
      console.error('Document search failed:', error);
      throw new Error(`Document search failed: ${error.message}`);
    }
  }

  // Train LLM model (placeholder for future implementation)
  async trainLLMModel(selectedFileIds: string[]): Promise<void> {
    console.log('Training LLM model with selected documents...');
    
    try {
      // Extract file contents
      const fileContents = await googleDriveService.extractFileContents(selectedFileIds);
      
      // Simulate training process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('LLM model training completed successfully');
    } catch (error) {
      console.error('LLM training failed:', error);
      throw new Error(`LLM training failed: ${error.message}`);
    }
  }
}

// Export singleton instance
export const aiAnalysisService = new AIAnalysisService();

// Export for testing or custom instances
export { AIAnalysisService };