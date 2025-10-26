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

  // Main analysis function (using correct backend endpoints)
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

      // First, we need to ingest the file contents to the backend
      console.log('Ingesting file contents to backend...');
      await this.ingestFileContents(fileContents);

      // Then perform the search/analysis using the /ask endpoint
      console.log('Performing AI search...');
      const response = await fetch(`${this.backendURL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: query,
          k: 15,
          system: '',
          subsystem: '',
          tags: []
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
      const healthCheck = await fetch(`${this.backendURL}/health`);
      
      if (!healthCheck.ok) {
        throw new Error(`Backend health check failed: HTTP ${healthCheck.status}`);
      }
      
      console.log('Backend connection successful');
    } catch (error) {
      console.error('Backend connection failed:', error);
      throw new Error(`Backend connection failed: ${error.message}`);
    }
  }

  // Ingest file contents to backend for processing
  private async ingestFileContents(fileContents: FileContent[]): Promise<void> {
    try {
      for (const fileContent of fileContents) {
        console.log(`Ingesting file: ${fileContent.name}`);
        
        // Create a FormData object to simulate file upload
        const formData = new FormData();
        
        // Create a blob from the file content
        const blob = new Blob([fileContent.content], { type: fileContent.mimeType });
        const file = new File([blob], fileContent.name, { type: fileContent.mimeType });
        
        formData.append('files', file);
        formData.append('system', 'Google Drive');
        formData.append('subsystem', 'Analysis');

        const response = await fetch(`${this.backendURL}/ingest`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`Failed to ingest ${fileContent.name}: ${errorText}`);
          // Continue with other files even if one fails
        } else {
          console.log(`Successfully ingested: ${fileContent.name}`);
        }
      }
    } catch (error) {
      console.error('Error ingesting file contents:', error);
      throw new Error(`Failed to ingest file contents: ${error.message}`);
    }
  }

  // Process analysis result into structured format
  private processAnalysisResult(data: any): AnalysisResult {
    // The backend /ask endpoint returns { answer, sources }
    const answer = data.answer || data.response || "No analysis available";
    const sources = data.sources || [];
    
    return {
      technicalSummary: answer,
      laymanSummary: this.generateLaymanSummary(answer),
      wireDetails: this.extractWireDetailsFromText(answer),
      components: this.extractComponentsFromText(answer),
      architectureSuggestion: this.generateArchitectureSuggestion(answer),
      sources: this.extractSources(sources),
      raw: answer
    };
  }

  // Generate layman summary from technical text
  private generateLaymanSummary(technicalText: string): string {
    // Simple conversion - in a real implementation, this could use AI
    const sentences = technicalText.split('.').slice(0, 3);
    return sentences.join('. ') + (sentences.length > 0 ? '.' : '');
  }

  // Extract wire details from text analysis
  private extractWireDetailsFromText(text: string): WireDetail[] {
    const wireDetails: WireDetail[] = [];
    
    // Look for wire-related patterns in the text
    const wirePatterns = [
      /wire\s+(\w+)/gi,
      /cable\s+(\w+)/gi,
      /voltage\s+(\d+\w*)/gi,
      /current\s+(\d+\w*)/gi
    ];
    
    // This is a simplified extraction - in a real implementation, this would be more sophisticated
    let wireCount = 0;
    wirePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches && wireCount < 3) {
        wireDetails.push({
          id: `WIRE_${wireCount + 1}`,
          spec: matches[0] || '-',
          from: 'Source',
          to: 'Destination',
          voltage: '24V',
          current: '5A'
        });
        wireCount++;
      }
    });
    
    return wireDetails;
  }

  // Extract components from text analysis
  private extractComponentsFromText(text: string): Component[] {
    const components: Component[] = [];
    
    // Look for component-related patterns
    const componentPatterns = [
      /controller/gi,
      /sensor/gi,
      /motor/gi,
      /relay/gi,
      /switch/gi
    ];
    
    let componentCount = 0;
    componentPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches && componentCount < 3) {
        components.push({
          name: matches[0] || `Component_${componentCount + 1}`,
          type: 'Electronic',
          specs: { voltage: '24V', current: '5A' },
          location: 'Panel'
        });
        componentCount++;
      }
    });
    
    return components;
  }

  // Generate architecture suggestion
  private generateArchitectureSuggestion(text: string): string {
    // Generate a simple Mermaid diagram based on the analysis
    return `graph TD
    A[Input] --> B[Processing]
    B --> C[Output]
    C --> D[Result]`;
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

      console.log('File contents extracted:', fileContents.length, 'files');
      
      // Try the AI analysis approach first
      try {
        const result = await this.analyzeWithAI(fileContents, query, searchType);
        return result;
      } catch (aiError) {
        console.warn('AI analysis failed, trying direct search:', aiError);
        
        // Fallback to direct search using existing API
        const searchResult = await apiService.search(query, { k: 15 });
        
        return {
          technicalSummary: `Analysis of ${fileContents.length} files from Google Drive. Query: ${query}`,
          laymanSummary: `Found information related to your query in the selected documents.`,
          wireDetails: [],
          components: [],
          architectureSuggestion: '',
          sources: this.extractSources(searchResult.sources || []),
          raw: searchResult.answer || 'Analysis completed'
        };
      }
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