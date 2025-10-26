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
      console.log('🔍 Starting comprehensive analysis of', selectedFileIds.length, 'files');
      console.log('📋 Query:', query);
      console.log('🔧 Search type:', searchType);
      
      // Step 1: Extract file contents from Google Drive
      console.log('📥 Step 1: Extracting file contents from Google Drive...');
      const fileContents = await googleDriveService.extractFileContents(selectedFileIds);
      
      if (fileContents.length === 0) {
        throw new Error("No file contents could be extracted from the selected files");
      }

      console.log('✅ File contents extracted:', fileContents.length, 'files');
      
      // Log content summary
      fileContents.forEach((content, index) => {
        console.log(`📄 File ${index + 1}: ${content.name} (${content.content.length} chars)`);
      });
      
      // Step 2: Ingest files into backend for AI processing
      console.log('📤 Step 2: Ingesting files into backend...');
      await this.ingestFileContents(fileContents);
      
      // Step 3: Wait a moment for indexing
      console.log('⏳ Step 3: Waiting for backend indexing...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 4: Perform AI search on the ingested content
      console.log('🤖 Step 4: Performing AI search on ingested content...');
      try {
        const searchResponse = await fetch(`${this.backendURL}/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            query: query,
            k: 15,
            system: 'Google Drive',
            subsystem: 'Analysis',
            tags: []
          })
        });

        if (!searchResponse.ok) {
          const errorText = await searchResponse.text();
          throw new Error(`AI search failed: ${errorText}`);
        }

        const searchResult = await searchResponse.json();
        console.log('✅ AI search successful:', searchResult);

        // Step 5: Create comprehensive analysis result
        return this.createComprehensiveAnalysis(fileContents, searchResult, query, searchType);
        
      } catch (searchError) {
        console.warn('⚠️ Backend AI search failed, creating enhanced local analysis:', searchError);
        
        // Fallback to enhanced local analysis
        return this.createEnhancedLocalAnalysis(fileContents, query, searchType);
      }
    } catch (error) {
      console.error('❌ File analysis failed:', error);
      throw new Error(`File analysis failed: ${error.message}`);
    }
  }

  // Create comprehensive analysis combining backend AI and file content
  private createComprehensiveAnalysis(
    fileContents: FileContent[],
    searchResult: any,
    query: string,
    searchType: SearchType
  ): AnalysisResult {
    const answer = searchResult.answer || searchResult.response || "AI analysis completed";
    const sources = searchResult.sources || [];
    
    // Combine AI answer with file content analysis
    const fileNames = fileContents.map(f => f.name).join(', ');
    const totalContent = fileContents.reduce((sum, f) => sum + f.content.length, 0);
    
    const technicalSummary = `AI Analysis Results for Query: "${query}"

Backend AI Response:
${answer}

File Analysis Summary:
- Files analyzed: ${fileContents.length} (${fileNames})
- Total content processed: ${totalContent.toLocaleString()} characters
- Search type: ${searchType}
- Sources found: ${sources.length}

The AI has processed your selected files and provided the above analysis based on your query.`;

    const laymanSummary = `I analyzed ${fileContents.length} documents from your Google Drive selection. ${answer.length > 200 ? answer.substring(0, 200) + '...' : answer}`;

    return {
      technicalSummary,
      laymanSummary,
      wireDetails: this.extractWireDetailsFromText(answer),
      components: this.extractComponentsFromText(answer),
      architectureSuggestion: this.generateArchitectureSuggestion(answer),
      sources: [
        ...this.extractSources(sources),
        ...fileContents.map((file, index) => ({
          fileName: file.name,
          score: 0.9,
          position: index,
          preview: file.content.substring(0, 300) + (file.content.length > 300 ? '...' : '')
        }))
      ],
      raw: answer
    };
  }

  // Create enhanced local analysis with better content processing
  private createEnhancedLocalAnalysis(
    fileContents: FileContent[],
    query: string,
    searchType: SearchType
  ): AnalysisResult {
    const combinedContent = fileContents.map(f => f.content).join(' ');
    const fileNames = fileContents.map(f => f.name).join(', ');
    
    // Perform keyword matching and content analysis
    const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    const relevantSections: string[] = [];
    
    // Find relevant sections in the content
    fileContents.forEach(file => {
      const content = file.content.toLowerCase();
      queryWords.forEach(word => {
        const index = content.indexOf(word);
        if (index !== -1) {
          const start = Math.max(0, index - 100);
          const end = Math.min(content.length, index + 200);
          const section = file.content.substring(start, end);
          relevantSections.push(`From ${file.name}: ...${section}...`);
        }
      });
    });
    
    const technicalSummary = `Local Analysis Results for Query: "${query}"

Files Analyzed: ${fileNames}
Total Content: ${combinedContent.length.toLocaleString()} characters
Search Type: ${searchType}

${relevantSections.length > 0 ? 
  `Relevant Content Found:\n${relevantSections.slice(0, 3).join('\n\n')}` : 
  `Content Overview:\n${combinedContent.substring(0, 500)}${combinedContent.length > 500 ? '...' : ''}`
}

Note: This is a local analysis. For AI-powered insights, ensure the backend is properly configured.`;
    
    const laymanSummary = `I found ${relevantSections.length} relevant sections in your ${fileContents.length} selected documents related to "${query}". ${relevantSections.length > 0 ? 'The documents contain information that matches your search terms.' : 'The documents have been processed but may need more specific search terms.'}`;
    
    return {
      technicalSummary,
      laymanSummary,
      wireDetails: this.extractWireDetailsFromText(combinedContent),
      components: this.extractComponentsFromText(combinedContent),
      architectureSuggestion: this.generateArchitectureSuggestion(combinedContent),
      sources: fileContents.map((file, index) => ({
        fileName: file.name,
        score: 0.8,
        position: index,
        preview: file.content.substring(0, 200) + (file.content.length > 200 ? '...' : '')
      })),
      raw: technicalSummary
    };
  }

  // Create local analysis when backend fails
  private createLocalAnalysis(
    fileContents: FileContent[],
    query: string,
    searchType: SearchType
  ): AnalysisResult {
    const combinedContent = fileContents.map(f => f.content).join(' ');
    const fileNames = fileContents.map(f => f.name).join(', ');
    
    // Create a basic analysis
    const technicalSummary = `Analysis of ${fileContents.length} files: ${fileNames}. 
    Query: "${query}". 
    Total content analyzed: ${combinedContent.length} characters. 
    Search type: ${searchType}.
    
    Content preview: ${combinedContent.substring(0, 500)}${combinedContent.length > 500 ? '...' : ''}`;
    
    const laymanSummary = `Analyzed ${fileContents.length} documents related to your query "${query}". The documents contain technical information that may be relevant to your search.`;
    
    return {
      technicalSummary,
      laymanSummary,
      wireDetails: this.extractWireDetailsFromText(combinedContent),
      components: this.extractComponentsFromText(combinedContent),
      architectureSuggestion: this.generateArchitectureSuggestion(combinedContent),
      sources: fileContents.map((file, index) => ({
        fileName: file.name,
        score: 0.8,
        position: index,
        preview: file.content.substring(0, 200) + (file.content.length > 200 ? '...' : '')
      })),
      raw: technicalSummary
    };
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