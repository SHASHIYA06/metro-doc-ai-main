// Enhanced Vector Search Service for KMRCL Metro Document Intelligence
// Advanced semantic search with multiple embedding models and similarity algorithms

import { config } from '../config/environment';

export interface VectorEmbedding {
  id: string;
  vector: number[];
  metadata: Record<string, any>;
  text: string;
  timestamp: string;
}

export interface SearchResult {
  id: string;
  score: number;
  text: string;
  metadata: Record<string, any>;
  highlights: string[];
}

export interface EmbeddingModel {
  name: string;
  provider: 'google' | 'openai' | 'huggingface' | 'local';
  dimensions: number;
  maxTokens: number;
  apiKey?: string;
}

class VectorSearchService {
  private embeddings: Map<string, VectorEmbedding>;
  private models: Map<string, EmbeddingModel>;
  private defaultModel: string;
  private indexedCount: number;

  constructor() {
    this.embeddings = new Map();
    this.models = new Map();
    this.defaultModel = 'text-embedding-004';
    this.indexedCount = 0;
    this.initializeModels();
  }

  private initializeModels() {
    // Google Text Embedding Models
    this.models.set('text-embedding-004', {
      name: 'text-embedding-004',
      provider: 'google',
      dimensions: 768,
      maxTokens: 2048,
      apiKey: import.meta.env.VITE_GEMINI_API_KEY
    });

    this.models.set('text-embedding-gecko', {
      name: 'text-embedding-gecko@003',
      provider: 'google',
      dimensions: 768,
      maxTokens: 3072,
      apiKey: import.meta.env.VITE_GEMINI_API_KEY
    });

    // OpenAI Embedding Models
    this.models.set('text-embedding-3-large', {
      name: 'text-embedding-3-large',
      provider: 'openai',
      dimensions: 3072,
      maxTokens: 8191,
      apiKey: import.meta.env.VITE_OPENAI_API_KEY
    });

    this.models.set('text-embedding-3-small', {
      name: 'text-embedding-3-small',
      provider: 'openai',
      dimensions: 1536,
      maxTokens: 8191,
      apiKey: import.meta.env.VITE_OPENAI_API_KEY
    });

    // Local/HuggingFace Models (for offline use)
    this.models.set('all-MiniLM-L6-v2', {
      name: 'all-MiniLM-L6-v2',
      provider: 'local',
      dimensions: 384,
      maxTokens: 512
    });
  }

  // Create embeddings for text using specified model
  async createEmbedding(
    text: string, 
    modelName: string = this.defaultModel
  ): Promise<number[]> {
    const model = this.models.get(modelName);
    if (!model) {
      throw new Error(`Embedding model '${modelName}' not found`);
    }

    try {
      switch (model.provider) {
        case 'google':
          return await this.createGoogleEmbedding(text, model);
        case 'openai':
          return await this.createOpenAIEmbedding(text, model);
        case 'local':
          return await this.createLocalEmbedding(text, model);
        default:
          throw new Error(`Unsupported embedding provider: ${model.provider}`);
      }
    } catch (error) {
      console.error(`Embedding creation failed for model ${modelName}:`, error);
      
      // Fallback to default Google model
      if (modelName !== 'text-embedding-004') {
        console.log('Falling back to default Google embedding model...');
        return this.createEmbedding(text, 'text-embedding-004');
      }
      
      throw error;
    }
  }

  // Google embedding API
  private async createGoogleEmbedding(text: string, model: EmbeddingModel): Promise<number[]> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model.name}:embedContent?key=${model.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: { parts: [{ text: text.slice(0, model.maxTokens * 4) }] },
        taskType: 'RETRIEVAL_DOCUMENT'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google embedding API error: ${errorText}`);
    }

    const data = await response.json();
    return data.embedding?.values || [];
  }

  // OpenAI embedding API
  private async createOpenAIEmbedding(text: string, model: EmbeddingModel): Promise<number[]> {
    const url = 'https://api.openai.com/v1/embeddings';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${model.apiKey}`
      },
      body: JSON.stringify({
        model: model.name,
        input: text.slice(0, model.maxTokens * 4),
        encoding_format: 'float'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI embedding API error: ${errorText}`);
    }

    const data = await response.json();
    return data.data?.[0]?.embedding || [];
  }

  // Local embedding (placeholder for future implementation)
  private async createLocalEmbedding(text: string, model: EmbeddingModel): Promise<number[]> {
    // This would integrate with local embedding models via MCP or direct API
    console.warn(`Local embedding model ${model.name} not implemented yet`);
    
    // Return a mock embedding for now
    const dimensions = model.dimensions;
    const mockEmbedding = Array.from({ length: dimensions }, () => Math.random() - 0.5);
    
    // Normalize the vector
    const magnitude = Math.sqrt(mockEmbedding.reduce((sum, val) => sum + val * val, 0));
    return mockEmbedding.map(val => val / magnitude);
  }

  // Add document to vector index
  async addDocument(
    id: string,
    text: string,
    metadata: Record<string, any> = {},
    modelName: string = this.defaultModel
  ): Promise<void> {
    try {
      console.log(`Adding document to vector index: ${id}`);
      
      // Create embedding
      const vector = await this.createEmbedding(text, modelName);
      
      // Store embedding
      const embedding: VectorEmbedding = {
        id,
        vector,
        metadata: {
          ...metadata,
          model: modelName,
          textLength: text.length,
          addedAt: new Date().toISOString()
        },
        text,
        timestamp: new Date().toISOString()
      };

      this.embeddings.set(id, embedding);
      this.indexedCount++;
      
      console.log(`Document ${id} added to vector index (${this.indexedCount} total)`);
    } catch (error) {
      console.error(`Failed to add document ${id} to vector index:`, error);
      throw error;
    }
  }

  // Batch add documents
  async addDocuments(
    documents: Array<{
      id: string;
      text: string;
      metadata?: Record<string, any>;
    }>,
    modelName: string = this.defaultModel
  ): Promise<void> {
    console.log(`Batch adding ${documents.length} documents to vector index...`);
    
    const results = await Promise.allSettled(
      documents.map(doc => this.addDocument(doc.id, doc.text, doc.metadata, modelName))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Batch add complete: ${successful} successful, ${failed} failed`);
    
    if (failed > 0) {
      const errors = results
        .filter(r => r.status === 'rejected')
        .map(r => (r as PromiseRejectedResult).reason);
      console.warn('Batch add errors:', errors);
    }
  }

  // Semantic search with multiple similarity algorithms
  async search(
    query: string,
    options: {
      limit?: number;
      threshold?: number;
      algorithm?: 'cosine' | 'euclidean' | 'dot' | 'hybrid';
      modelName?: string;
      filters?: Record<string, any>;
    } = {}
  ): Promise<SearchResult[]> {
    const {
      limit = 10,
      threshold = 0.7,
      algorithm = 'cosine',
      modelName = this.defaultModel,
      filters = {}
    } = options;

    try {
      console.log(`Performing semantic search: "${query}"`);
      console.log(`Algorithm: ${algorithm}, Model: ${modelName}, Limit: ${limit}`);

      // Create query embedding
      const queryVector = await this.createEmbedding(query, modelName);
      
      // Calculate similarities
      const similarities: Array<{
        id: string;
        score: number;
        embedding: VectorEmbedding;
      }> = [];

      for (const [id, embedding] of this.embeddings) {
        // Apply filters
        if (!this.matchesFilters(embedding.metadata, filters)) {
          continue;
        }

        // Calculate similarity based on algorithm
        let score: number;
        switch (algorithm) {
          case 'cosine':
            score = this.cosineSimilarity(queryVector, embedding.vector);
            break;
          case 'euclidean':
            score = this.euclideanSimilarity(queryVector, embedding.vector);
            break;
          case 'dot':
            score = this.dotProductSimilarity(queryVector, embedding.vector);
            break;
          case 'hybrid':
            score = this.hybridSimilarity(queryVector, embedding.vector);
            break;
          default:
            score = this.cosineSimilarity(queryVector, embedding.vector);
        }

        if (score >= threshold) {
          similarities.push({ id, score, embedding });
        }
      }

      // Sort by score and limit results
      similarities.sort((a, b) => b.score - a.score);
      const topResults = similarities.slice(0, limit);

      // Generate highlights
      const results: SearchResult[] = topResults.map(({ id, score, embedding }) => ({
        id,
        score,
        text: embedding.text,
        metadata: embedding.metadata,
        highlights: this.generateHighlights(query, embedding.text)
      }));

      console.log(`Search complete: ${results.length} results found`);
      return results;

    } catch (error) {
      console.error('Semantic search failed:', error);
      throw error;
    }
  }

  // Similarity algorithms
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }

  private euclideanSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let sumSquaredDiff = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sumSquaredDiff += diff * diff;
    }
    
    const distance = Math.sqrt(sumSquaredDiff);
    return 1 / (1 + distance); // Convert distance to similarity
  }

  private dotProductSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
    }
    
    return Math.max(0, dotProduct); // Ensure non-negative
  }

  private hybridSimilarity(a: number[], b: number[]): number {
    const cosine = this.cosineSimilarity(a, b);
    const euclidean = this.euclideanSimilarity(a, b);
    const dot = this.dotProductSimilarity(a, b);
    
    // Weighted combination
    return 0.5 * cosine + 0.3 * euclidean + 0.2 * dot;
  }

  // Filter matching
  private matchesFilters(metadata: Record<string, any>, filters: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(filters)) {
      if (metadata[key] !== value) {
        return false;
      }
    }
    return true;
  }

  // Generate text highlights
  private generateHighlights(query: string, text: string, maxHighlights: number = 3): string[] {
    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    const highlights: string[] = [];
    
    for (const word of queryWords) {
      const regex = new RegExp(`\\b\\w*${word}\\w*\\b`, 'gi');
      const matches = text.match(regex);
      
      if (matches) {
        for (const match of matches.slice(0, maxHighlights)) {
          const index = text.toLowerCase().indexOf(match.toLowerCase());
          if (index !== -1) {
            const start = Math.max(0, index - 50);
            const end = Math.min(text.length, index + match.length + 50);
            const highlight = text.substring(start, end);
            highlights.push(`...${highlight}...`);
          }
        }
      }
    }
    
    return highlights.slice(0, maxHighlights);
  }

  // Cluster similar documents
  async clusterDocuments(k: number = 5): Promise<Array<{
    centroid: number[];
    documents: string[];
    coherence: number;
  }>> {
    if (this.embeddings.size < k) {
      throw new Error(`Not enough documents for ${k} clusters`);
    }

    console.log(`Clustering ${this.embeddings.size} documents into ${k} clusters...`);
    
    // Simple k-means clustering implementation
    const vectors = Array.from(this.embeddings.values()).map(e => e.vector);
    const ids = Array.from(this.embeddings.keys());
    
    // Initialize centroids randomly
    const centroids: number[][] = [];
    for (let i = 0; i < k; i++) {
      const randomIndex = Math.floor(Math.random() * vectors.length);
      centroids.push([...vectors[randomIndex]]);
    }
    
    let assignments = new Array(vectors.length).fill(0);
    let converged = false;
    let iterations = 0;
    const maxIterations = 100;
    
    while (!converged && iterations < maxIterations) {
      const newAssignments = new Array(vectors.length);
      
      // Assign each vector to nearest centroid
      for (let i = 0; i < vectors.length; i++) {
        let bestCluster = 0;
        let bestDistance = Infinity;
        
        for (let j = 0; j < k; j++) {
          const distance = 1 - this.cosineSimilarity(vectors[i], centroids[j]);
          if (distance < bestDistance) {
            bestDistance = distance;
            bestCluster = j;
          }
        }
        
        newAssignments[i] = bestCluster;
      }
      
      // Check for convergence
      converged = assignments.every((a, i) => a === newAssignments[i]);
      assignments = newAssignments;
      
      // Update centroids
      for (let j = 0; j < k; j++) {
        const clusterVectors = vectors.filter((_, i) => assignments[i] === j);
        if (clusterVectors.length > 0) {
          const dimensions = clusterVectors[0].length;
          const newCentroid = new Array(dimensions).fill(0);
          
          for (const vector of clusterVectors) {
            for (let d = 0; d < dimensions; d++) {
              newCentroid[d] += vector[d];
            }
          }
          
          for (let d = 0; d < dimensions; d++) {
            newCentroid[d] /= clusterVectors.length;
          }
          
          centroids[j] = newCentroid;
        }
      }
      
      iterations++;
    }
    
    // Build cluster results
    const clusters = [];
    for (let j = 0; j < k; j++) {
      const clusterDocuments = ids.filter((_, i) => assignments[i] === j);
      const clusterVectors = vectors.filter((_, i) => assignments[i] === j);
      
      // Calculate cluster coherence (average intra-cluster similarity)
      let coherence = 0;
      if (clusterVectors.length > 1) {
        let totalSimilarity = 0;
        let pairCount = 0;
        
        for (let i = 0; i < clusterVectors.length; i++) {
          for (let k = i + 1; k < clusterVectors.length; k++) {
            totalSimilarity += this.cosineSimilarity(clusterVectors[i], clusterVectors[k]);
            pairCount++;
          }
        }
        
        coherence = pairCount > 0 ? totalSimilarity / pairCount : 0;
      }
      
      clusters.push({
        centroid: centroids[j],
        documents: clusterDocuments,
        coherence
      });
    }
    
    console.log(`Clustering complete: ${iterations} iterations, ${clusters.length} clusters`);
    return clusters;
  }

  // Get statistics
  getStats(): {
    totalDocuments: number;
    totalEmbeddings: number;
    models: string[];
    averageVectorSize: number;
    memoryUsage: string;
  } {
    const vectors = Array.from(this.embeddings.values());
    const averageVectorSize = vectors.length > 0 
      ? vectors.reduce((sum, e) => sum + e.vector.length, 0) / vectors.length 
      : 0;
    
    const memoryUsage = vectors.reduce((sum, e) => 
      sum + e.vector.length * 8 + e.text.length * 2, 0
    );
    
    return {
      totalDocuments: this.embeddings.size,
      totalEmbeddings: this.indexedCount,
      models: Array.from(this.models.keys()),
      averageVectorSize: Math.round(averageVectorSize),
      memoryUsage: `${Math.round(memoryUsage / 1024 / 1024 * 100) / 100} MB`
    };
  }

  // Clear index
  clear(): void {
    this.embeddings.clear();
    this.indexedCount = 0;
    console.log('Vector index cleared');
  }

  // Export embeddings
  exportEmbeddings(): VectorEmbedding[] {
    return Array.from(this.embeddings.values());
  }

  // Import embeddings
  importEmbeddings(embeddings: VectorEmbedding[]): void {
    this.embeddings.clear();
    for (const embedding of embeddings) {
      this.embeddings.set(embedding.id, embedding);
    }
    this.indexedCount = embeddings.length;
    console.log(`Imported ${embeddings.length} embeddings`);
  }
}

// Export singleton instance
export const vectorSearchService = new VectorSearchService();

// Export for testing or custom instances
export { VectorSearchService };