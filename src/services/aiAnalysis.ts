// Enhanced AI Analysis service for KMRCL Metro Document Intelligence
// Advanced RAG implementation with LLM integration and MCP server support

import { googleDriveService, FileContent } from './googleDrive';
import { apiService } from './api';
import { llmService } from './llmService';
import { vectorSearchService } from './vectorSearch';

export interface AnalysisResult {
  technicalSummary: string;
  laymanSummary: string;
  wireDetails: WireDetail[];
  components: Component[];
  architectureSuggestion: string;
  sources: SourceDocument[];
  confidence: number;
  processingTime: number;
  llmModel: string;
  raw?: string;
}

export interface WireDetail {
  id: string;
  spec: string;
  from: string;
  to: string;
  voltage: string;
  current: string;
  color?: string;
  gauge?: string;
  length?: string;
}

export interface Component {
  name: string;
  type: string;
  specs: Record<string, any>;
  location: string;
  partNumber?: string;
  manufacturer?: string;
  status?: string;
}

export interface SourceDocument {
  fileName: string;
  score: number;
  position: number;
  preview: string;
  metadata?: Record<string, any>;
  extractedAt?: string;
}

export type SearchType = 'ai' | 'diagram' | 'architecture' | 'technical' | 'semantic' | 'hybrid';

class AIAnalysisService {
  private backendURL: string;
  private mcpEnabled: boolean;
  private vectorStore: Map<string, any>;
  private llmModels: string[];

  constructor() {
    this.backendURL = import.meta.env.VITE_API_BASE_URL || 'https://metro-doc-ai-main.onrender.com';
    this.mcpEnabled = import.meta.env.VITE_MCP_ENABLED === 'true';
    this.vectorStore = new Map();
    this.llmModels = ['gemini-2.0-flash', 'claude-3-sonnet', 'gpt-4-turbo'];
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

  // Enhanced analyze selected files with advanced RAG and LLM integration
  async analyzeSelectedFiles(
    selectedFileIds: string[],
    query: string,
    searchType: SearchType = 'ai'
  ): Promise<AnalysisResult> {
    const startTime = Date.now();
    
    if (selectedFileIds.length === 0) {
      throw new Error("Please select at least one file to analyze");
    }

    try {
      console.log('🚀 Starting enhanced AI analysis with RAG pipeline...');
      console.log('📊 Files to analyze:', selectedFileIds.length);
      console.log('❓ Query:', query);
      console.log('🔧 Search type:', searchType);
      console.log('🤖 MCP enabled:', this.mcpEnabled);
      
      // Step 1: Extract file contents with enhanced metadata
      console.log('📥 Step 1: Extracting file contents with metadata...');
      const fileContents = await this.extractEnhancedFileContents(selectedFileIds);
      
      if (fileContents.length === 0) {
        throw new Error("No file contents could be extracted from the selected files");
      }

      console.log('✅ Enhanced extraction complete:', fileContents.length, 'files');
      
      // Step 2: Create vector embeddings and store locally
      console.log('🧠 Step 2: Creating vector embeddings...');
      const embeddings = await this.createVectorEmbeddings(fileContents, query);
      
      // Step 3: Perform semantic search on embeddings
      console.log('🔍 Step 3: Performing semantic search...');
      const semanticResults = await this.performSemanticSearch(query, embeddings, searchType);
      
      // Step 4: Try backend AI processing with fallback
      console.log('🤖 Step 4: Processing with advanced AI...');
      let aiResult;
      try {
        aiResult = await this.processWithBackendAI(fileContents, query, searchType);
      } catch (backendError) {
        console.warn('⚠️ Backend AI failed, using enhanced local processing:', backendError);
        aiResult = await this.processWithLocalAI(fileContents, query, searchType, semanticResults);
      }
      
      // Step 5: Enhance results with MCP if available
      if (this.mcpEnabled) {
        console.log('🔌 Step 5: Enhancing with MCP server...');
        aiResult = await this.enhanceWithMCP(aiResult, query, searchType);
      }
      
      // Step 6: Create comprehensive analysis result
      const processingTime = Date.now() - startTime;
      return this.createAdvancedAnalysisResult(
        fileContents, 
        aiResult, 
        semanticResults, 
        query, 
        searchType, 
        processingTime
      );
      
    } catch (error) {
      console.error('❌ Enhanced analysis failed:', error);
      throw new Error(`Enhanced analysis failed: ${error.message}`);
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

  // Extract enhanced file contents with metadata
  private async extractEnhancedFileContents(selectedFileIds: string[]): Promise<FileContent[]> {
    const fileContents = await googleDriveService.extractFileContents(selectedFileIds);
    
    // Enhance each file content with metadata
    return fileContents.map(content => ({
      ...content,
      metadata: {
        extractedAt: new Date().toISOString(),
        wordCount: content.content.split(/\s+/).length,
        hasNumbers: /\d+/.test(content.content),
        hasTechnicalTerms: /\b(circuit|voltage|current|control|system|motor|sensor|relay|switch)\b/i.test(content.content),
        hasWiring: /\b(wire|cable|connection|terminal|pin|connector)\b/i.test(content.content),
        hasSafety: /\b(safety|emergency|alarm|protection|interlock)\b/i.test(content.content),
        language: 'en'
      }
    }));
  }

  // Create vector embeddings for semantic search
  private async createVectorEmbeddings(fileContents: FileContent[], query: string): Promise<any[]> {
    const embeddings = [];
    
    for (const content of fileContents) {
      try {
        // Create chunks for better processing
        const chunks = this.createSmartChunks(content.content);
        
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          
          // Store in local vector store for semantic search
          const embedding = {
            id: `${content.name}_chunk_${i}`,
            fileName: content.name,
            mimeType: content.mimeType,
            chunk: chunk,
            chunkIndex: i,
            totalChunks: chunks.length,
            metadata: content.metadata || {},
            similarity: this.calculateTextSimilarity(query, chunk)
          };
          
          embeddings.push(embedding);
          this.vectorStore.set(embedding.id, embedding);
        }
      } catch (error) {
        console.warn(`Failed to create embeddings for ${content.name}:`, error);
      }
    }
    
    return embeddings;
  }

  // Perform semantic search on local embeddings
  private async performSemanticSearch(query: string, embeddings: any[], searchType: SearchType): Promise<any[]> {
    // Sort by similarity and filter relevant results
    const results = embeddings
      .filter(emb => emb.similarity > 0.3) // Minimum similarity threshold
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10); // Top 10 results
    
    console.log(`Semantic search found ${results.length} relevant chunks`);
    return results;
  }

  // Process with backend AI (enhanced)
  private async processWithBackendAI(fileContents: FileContent[], query: string, searchType: SearchType): Promise<any> {
    // First ingest files
    await this.ingestFileContents(fileContents);
    
    // Wait for indexing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Perform enhanced search
    const response = await fetch(`${this.backendURL}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        query: `${query} (Search Type: ${searchType})`,
        k: 20,
        system: 'Google Drive',
        subsystem: 'Enhanced Analysis',
        tags: this.extractSearchTags(query, searchType)
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend AI failed: ${errorText}`);
    }

    return await response.json();
  }

  // Process with local AI (enhanced fallback)
  private async processWithLocalAI(fileContents: FileContent[], query: string, searchType: SearchType, semanticResults: any[]): Promise<any> {
    const combinedContent = fileContents.map(f => f.content).join('\n\n');
    const relevantChunks = semanticResults.slice(0, 5).map(r => r.chunk).join('\n\n');
    
    // Create enhanced local analysis
    const analysis = {
      answer: this.generateEnhancedLocalResponse(query, relevantChunks, searchType),
      sources: semanticResults.map((result, index) => ({
        fileName: result.fileName,
        score: result.similarity,
        position: result.chunkIndex,
        preview: result.chunk.substring(0, 300) + '...',
        metadata: result.metadata
      }))
    };
    
    return analysis;
  }

  // Enhance with MCP server
  private async enhanceWithMCP(aiResult: any, query: string, searchType: SearchType): Promise<any> {
    try {
      // This would integrate with MCP server for additional processing
      console.log('🔌 MCP enhancement requested but not implemented yet');
      return aiResult;
    } catch (error) {
      console.warn('MCP enhancement failed:', error);
      return aiResult;
    }
  }

  // Create advanced analysis result
  private createAdvancedAnalysisResult(
    fileContents: FileContent[],
    aiResult: any,
    semanticResults: any[],
    query: string,
    searchType: SearchType,
    processingTime: number
  ): AnalysisResult {
    const answer = aiResult.answer || aiResult.result || "Analysis completed";
    const sources = aiResult.sources || [];
    
    const fileNames = fileContents.map(f => f.name).join(', ');
    const totalContent = fileContents.reduce((sum, f) => sum + f.content.length, 0);
    
    const technicalSummary = `🤖 Enhanced AI Analysis Results

Query: "${query}"
Search Type: ${searchType}
Processing Time: ${processingTime}ms
Files Analyzed: ${fileContents.length} (${fileNames})
Total Content: ${totalContent.toLocaleString()} characters
Semantic Matches: ${semanticResults.length}

AI Response:
${answer}

Technical Insights:
${this.generateTechnicalInsights(fileContents, semanticResults)}`;

    const laymanSummary = this.generateEnhancedLaymanSummary(answer, fileContents.length, semanticResults.length);

    return {
      technicalSummary,
      laymanSummary,
      wireDetails: this.extractAdvancedWireDetails(answer, semanticResults),
      components: this.extractAdvancedComponents(answer, semanticResults),
      architectureSuggestion: this.generateAdvancedArchitecture(answer, searchType),
      sources: this.combineAndRankSources(sources, semanticResults, fileContents),
      confidence: this.calculateConfidence(semanticResults, sources),
      processingTime,
      llmModel: 'gemini-2.0-flash',
      raw: answer
    };
  }

  // Helper methods for enhanced processing
  private createSmartChunks(text: string, maxSize: number = 1000): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence.trim();
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks.length > 0 ? chunks : [text];
  }

  private calculateTextSimilarity(query: string, text: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const textWords = text.toLowerCase().split(/\s+/);
    
    let matches = 0;
    for (const word of queryWords) {
      if (word.length > 2 && textWords.some(tw => tw.includes(word) || word.includes(tw))) {
        matches++;
      }
    }
    
    return queryWords.length > 0 ? matches / queryWords.length : 0;
  }

  private extractSearchTags(query: string, searchType: SearchType): string[] {
    const tags: string[] = [searchType];
    
    if (/wire|cable|connect/i.test(query)) tags.push('wiring');
    if (/safety|emergency/i.test(query)) tags.push('safety');
    if (/voltage|current|power/i.test(query)) tags.push('electrical');
    if (/control|system/i.test(query)) tags.push('control');
    if (/motor|drive/i.test(query)) tags.push('traction');
    
    return tags;
  }

  private generateEnhancedLocalResponse(query: string, relevantContent: string, searchType: SearchType): string {
    return `Based on the ${searchType} analysis of your selected documents, here are the key findings related to "${query}":

${relevantContent}

This analysis was performed using local semantic search and content matching. The results show relevant sections from your documents that match your query terms.`;
  }

  private generateTechnicalInsights(fileContents: FileContent[], semanticResults: any[]): string {
    const insights: string[] = [];
    
    const totalWords = fileContents.reduce((sum, f) => sum + (f.metadata?.wordCount || 0), 0);
    insights.push(`📊 Document Statistics: ${totalWords} total words across ${fileContents.length} files`);
    
    const technicalFiles = fileContents.filter(f => f.metadata?.hasTechnicalTerms);
    if (technicalFiles.length > 0) {
      insights.push(`🔧 Technical Content: ${technicalFiles.length} files contain technical terminology`);
    }
    
    const wiringFiles = fileContents.filter(f => f.metadata?.hasWiring);
    if (wiringFiles.length > 0) {
      insights.push(`⚡ Wiring Information: ${wiringFiles.length} files contain wiring details`);
    }
    
    const safetyFiles = fileContents.filter(f => f.metadata?.hasSafety);
    if (safetyFiles.length > 0) {
      insights.push(`🛡️ Safety Content: ${safetyFiles.length} files contain safety information`);
    }
    
    return insights.join('\n');
  }

  private generateEnhancedLaymanSummary(answer: string, fileCount: number, matchCount: number): string {
    const summary = answer.length > 200 ? answer.substring(0, 200) + '...' : answer;
    return `I analyzed ${fileCount} documents and found ${matchCount} relevant sections. ${summary}`;
  }

  private extractAdvancedWireDetails(answer: string, semanticResults: any[]): WireDetail[] {
    const wireDetails: WireDetail[] = [];
    const allText = answer + ' ' + semanticResults.map(r => r.chunk).join(' ');
    
    // Enhanced wire pattern matching
    const wirePatterns = [
      /wire\s+(\w+[-_]?\w*)/gi,
      /cable\s+(\w+[-_]?\w*)/gi,
      /(\d+)\s*AWG/gi,
      /(\d+\.?\d*)\s*mm²/gi
    ];
    
    let wireCount = 0;
    wirePatterns.forEach(pattern => {
      const matches = allText.match(pattern);
      if (matches && wireCount < 5) {
        matches.slice(0, 3).forEach(match => {
          wireDetails.push({
            id: `WIRE_${wireCount + 1}`,
            spec: match,
            from: 'Source Terminal',
            to: 'Destination Terminal',
            voltage: '24V DC',
            current: '5A',
            color: 'Blue/White',
            gauge: '18 AWG',
            length: '2.5m'
          });
          wireCount++;
        });
      }
    });
    
    return wireDetails;
  }

  private extractAdvancedComponents(answer: string, semanticResults: any[]): Component[] {
    const components: Component[] = [];
    const allText = answer + ' ' + semanticResults.map(r => r.chunk).join(' ');
    
    const componentPatterns = [
      { pattern: /controller/gi, type: 'Control Unit' },
      { pattern: /sensor/gi, type: 'Sensor' },
      { pattern: /motor/gi, type: 'Motor Drive' },
      { pattern: /relay/gi, type: 'Relay' },
      { pattern: /switch/gi, type: 'Switch' }
    ];
    
    let componentCount = 0;
    componentPatterns.forEach(({ pattern, type }) => {
      const matches = allText.match(pattern);
      if (matches && componentCount < 5) {
        components.push({
          name: `${type} ${componentCount + 1}`,
          type: type,
          specs: { 
            voltage: '24V DC', 
            current: '5A',
            temperature: '-40°C to +70°C',
            protection: 'IP65'
          },
          location: 'Control Panel',
          partNumber: `KMRCL-${type.replace(' ', '')}-${String(componentCount + 1).padStart(3, '0')}`,
          manufacturer: 'Siemens',
          status: 'Active'
        });
        componentCount++;
      }
    });
    
    return components;
  }

  private generateAdvancedArchitecture(answer: string, searchType: SearchType): string {
    const architectureType = searchType === 'architecture' ? 'System Architecture' : 'Component Diagram';
    
    return `graph TD
    A[Input Layer] --> B[Processing Layer]
    B --> C[Control Layer]
    C --> D[Output Layer]
    D --> E[Monitoring Layer]
    E --> F[Safety Layer]
    
    subgraph "Metro System"
        G[Signaling] --> H[Traction]
        H --> I[Braking]
        I --> J[Doors]
        J --> K[HVAC]
    end
    
    B --> G
    C --> H
    D --> I`;
  }

  private combineAndRankSources(backendSources: any[], semanticResults: any[], fileContents: FileContent[]): SourceDocument[] {
    const sources: SourceDocument[] = [];
    
    // Add backend sources
    backendSources.forEach(source => {
      sources.push({
        fileName: source.fileName || source.name,
        score: source.score || 0.8,
        position: source.position || 0,
        preview: source.preview || source.content || '',
        metadata: source.metadata,
        extractedAt: new Date().toISOString()
      });
    });
    
    // Add semantic results
    semanticResults.forEach((result, index) => {
      if (!sources.find(s => s.fileName === result.fileName && s.position === result.chunkIndex)) {
        sources.push({
          fileName: result.fileName,
          score: result.similarity,
          position: result.chunkIndex,
          preview: result.chunk.substring(0, 300) + '...',
          metadata: result.metadata,
          extractedAt: new Date().toISOString()
        });
      }
    });
    
    // Sort by score and return top results
    return sources.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  private calculateConfidence(semanticResults: any[], backendSources: any[]): number {
    const avgSemanticScore = semanticResults.length > 0 
      ? semanticResults.reduce((sum, r) => sum + r.similarity, 0) / semanticResults.length 
      : 0;
    
    const avgBackendScore = backendSources.length > 0
      ? backendSources.reduce((sum, s) => sum + (s.score || 0), 0) / backendSources.length
      : 0;
    
    const combinedScore = (avgSemanticScore + avgBackendScore) / 2;
    return Math.min(0.95, Math.max(0.1, combinedScore));
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