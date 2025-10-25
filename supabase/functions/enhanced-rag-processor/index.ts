import "https://deno.land/x/xhr@0.1.0/mod.ts";
// @ts-ignore
import { createClient } from 'npm:@supabase/supabase-js';

// Deno types
declare global {
  interface Window {
    Deno: any;
  }
}

const Deno = window.Deno;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface RagRequest {
  files: any[];
  query: string;
  ragType?: 'hierarchical' | 'map' | 'standard';
  maxResults?: number;
}

interface DocumentChunk {
  id: string;
  content: string;
  metadata: any;
  embedding?: number[];
  similarity?: number;
}

// Generate embeddings for text using Gemini API
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }

    if (!text || text.trim() === '') {
      throw new Error('Text content cannot be empty');
    }

    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent';
    const response = await fetch(`${endpoint}?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: {
          parts: [{ text: text.slice(0, 20000) }]
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini Embeddings API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const values = data?.embedding?.values;
    if (!values || !Array.isArray(values)) {
      throw new Error('Invalid embedding response from Gemini');
    }
    
    return values as number[];
  } catch (error) {
    console.error('Embedding generation error:', error);
    throw new Error(`Embedding generation failed: ${error.message}`);
  }
}

// Process document into chunks for better retrieval
function chunkDocument(document: any): DocumentChunk[] {
  const content = document.content || '';
  const chunkSize = 1500;
  const overlap = 200;
  const chunks: DocumentChunk[] = [];
  
  // Check if document is already chunked in the database
  if (document.chunks && Array.isArray(document.chunks)) {
    return document.chunks.map((chunk, index) => ({
      id: `${document.file_id || document.id}-chunk-${index}`,
      content: chunk,
      metadata: {
        ...document.metadata,
        name: document.name,
        mimeType: document.mime_type || document.mimeType,
        chunkIndex: index,
        totalChunks: document.chunks.length,
        source: document.name
      }
    }));
  }
  
  // If content is too short, return as single chunk
  if (content.length < chunkSize) {
    return [{
      id: document.file_id || document.id,
      content,
      metadata: {
        name: document.name,
        mimeType: document.mime_type || document.mimeType,
        source: document.name
      }
    }];
  }
  
  // Split by paragraphs first
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  let currentChunk = '';
  let currentParagraphs = [];
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed chunk size, save current chunk and start new one
    if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 0) {
      chunks.push({
        id: `${document.file_id || document.id}-chunk-${chunks.length}`,
        content: currentChunk,
        metadata: {
          name: document.name,
          mimeType: document.mime_type || document.mimeType,
          chunkIndex: chunks.length,
          paragraphs: currentParagraphs,
          source: document.name
        }
      });
      
      // Start new chunk with overlap from previous chunk
      const overlapText = currentChunk.slice(-overlap);
      currentChunk = overlapText + paragraph;
      currentParagraphs = [paragraph];
    } else {
      // Add paragraph to current chunk
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      currentParagraphs.push(paragraph);
    }
  }
  
  // Add the last chunk if it's not empty
  if (currentChunk.trim().length > 0) {
    chunks.push({
      id: `${document.file_id || document.id}-chunk-${chunks.length}`,
      content: currentChunk,
      metadata: {
        name: document.name,
        mimeType: document.mime_type || document.mimeType,
        chunkIndex: chunks.length,
        paragraphs: currentParagraphs,
        source: document.name
      }
    });
  }
  
  return chunks;
}

// Retrieve relevant document chunks based on query
async function retrieveRelevantChunks(query: string, maxResults = 10): Promise<DocumentChunk[]> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    // Search for similar documents using vector similarity
    const { data: vectorResults, error: vectorError } = await supabase.rpc('search_documents_by_embedding', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: maxResults
    });
    
    if (vectorError) {
      console.error('Vector search error:', vectorError);
      throw new Error(`Vector search failed: ${vectorError.message}`);
    }
    
    // Also search in processed documents
    const { data: processedResults, error: processedError } = await supabase
      .from('processed_documents')
      .select('id, file_id, name, content, mime_type, metadata, chunks')
      .limit(maxResults);
      
    if (processedError) {
      console.error('Processed documents search error:', processedError);
    }
    
    // Combine results and chunk them
    const allDocuments = [
      ...(vectorResults || []),
      ...(processedResults || [])
    ];
    
    // Remove duplicates based on file_id
    const uniqueDocuments = Array.from(
      new Map(allDocuments.map(doc => [doc.file_id, doc])).values()
    );
    
    // Chunk all documents
    let allChunks: DocumentChunk[] = [];
    for (const doc of uniqueDocuments) {
      const docChunks = chunkDocument(doc);
      allChunks = [...allChunks, ...docChunks];
    }
    
    // Calculate similarity for each chunk
    for (const chunk of allChunks) {
      try {
        const chunkEmbedding = await generateEmbedding(chunk.content);
        chunk.embedding = chunkEmbedding;
        
        // Calculate cosine similarity
        const dotProduct = queryEmbedding.reduce((sum, val, i) => sum + val * chunkEmbedding[i], 0);
        const queryMagnitude = Math.sqrt(queryEmbedding.reduce((sum, val) => sum + val * val, 0));
        const chunkMagnitude = Math.sqrt(chunkEmbedding.reduce((sum, val) => sum + val * val, 0));
        
        chunk.similarity = dotProduct / (queryMagnitude * chunkMagnitude);
      } catch (error) {
        console.error('Error generating embedding for chunk:', error);
        chunk.similarity = 0;
      }
    }
    
    // Sort by similarity and take top results
    allChunks.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
    return allChunks.slice(0, maxResults);
    
  } catch (error) {
    console.error('Retrieval error:', error);
    throw error;
  }
}

// Generate hierarchical analysis from document chunks
async function generateHierarchicalAnalysis(chunks: DocumentChunk[], query: string): Promise<any> {
  try {
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }
    
    // Prepare context from chunks
    const context = chunks.map(chunk => {
      return `Document: ${chunk.metadata.name}\nContent: ${chunk.content}\n`;
    }).join('\n---\n');
    
    // Generate analysis with Gemini
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
    const response = await fetch(`${endpoint}?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ 
            text: `You are an expert document analyzer for engineering and technical documents. 
            
            Analyze the following document chunks to answer this query: "${query}"
            
            ${context}
            
            Provide a comprehensive analysis with the following structure:
            1. Summary: A concise summary of the key information related to the query
            2. Technical Details: Specific technical information found in the documents
            3. Key Components: List of important components or systems mentioned
            4. Specifications: Any numerical specifications or measurements
            5. Relationships: How different components or systems relate to each other
            6. Recommendations: Based on the documents, what recommendations can be made
            
            Format your response as JSON with these keys: summary, technical_details, key_components, specifications, relationships, recommendations.
            Each value should be a string with proper formatting.`
          }]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error('Invalid response from Gemini');
    }
    
    // Extract JSON from response
    try {
      // Find JSON in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback: create structured response from text
      return {
        summary: text.split('\n\n')[0] || 'No summary available',
        technical_details: text,
        key_components: [],
        specifications: [],
        relationships: 'No relationship data available',
        recommendations: 'No recommendations available'
      };
    } catch (jsonError) {
      console.error('Error parsing JSON from Gemini response:', jsonError);
      return {
        summary: text.split('\n\n')[0] || 'No summary available',
        technical_details: text,
        raw_response: text
      };
    }
  } catch (error) {
    console.error('Analysis generation error:', error);
    throw error;
  }
}

// Generate map-based analysis for spatial data
async function generateMapAnalysis(chunks: DocumentChunk[], query: string): Promise<any> {
  try {
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }
    
    // Prepare context from chunks
    const context = chunks.map(chunk => {
      return `Document: ${chunk.metadata.name}\nContent: ${chunk.content}\n`;
    }).join('\n---\n');
    
    // Generate analysis with Gemini
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
    const response = await fetch(`${endpoint}?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ 
            text: `You are an expert in spatial data analysis for engineering documents. 
            
            Analyze the following document chunks to extract spatial and location information related to this query: "${query}"
            
            ${context}
            
            Extract all spatial information including:
            1. Locations mentioned (rooms, areas, buildings, etc.)
            2. Coordinates or position references
            3. Spatial relationships between components
            4. Any measurements or distances
            5. Layout information
            
            Format your response as JSON with these keys: 
            - locations: array of location objects with name and description
            - coordinates: array of coordinate objects with x, y values and description
            - spatial_relationships: description of how components relate spatially
            - measurements: array of measurement objects with value, unit, and description
            - layout_summary: overall description of the spatial layout
            
            If you cannot find specific spatial information, provide null values but include any relevant text.`
          }]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error('Invalid response from Gemini');
    }
    
    // Extract JSON from response
    try {
      // Find JSON in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback: create structured response
      return {
        locations: [],
        coordinates: [],
        spatial_relationships: 'No spatial relationship data available',
        measurements: [],
        layout_summary: 'No layout information available',
        raw_response: text
      };
    } catch (jsonError) {
      console.error('Error parsing JSON from Gemini response:', jsonError);
      return {
        layout_summary: text.split('\n\n')[0] || 'No summary available',
        raw_response: text
      };
    }
  } catch (error) {
    console.error('Map analysis generation error:', error);
    throw error;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { files, query, ragType = 'hierarchical', maxResults = 10 }: RagRequest = await req.json();

    console.log('Enhanced RAG processing request:', { query, ragType, fileCount: files.length });
    
    // Retrieve relevant document chunks
    const relevantChunks = await retrieveRelevantChunks(query, maxResults);
    
    console.log(`Retrieved ${relevantChunks.length} relevant chunks for analysis`);
    
    // Generate analysis based on RAG type
    let analysis;
    if (ragType === 'map') {
      analysis = await generateMapAnalysis(relevantChunks, query);
    } else {
      // Default to hierarchical analysis
      analysis = await generateHierarchicalAnalysis(relevantChunks, query);
    }
    
    // Add source information to the analysis
    const sources = relevantChunks.map(chunk => ({
      id: chunk.id,
      name: chunk.metadata.name,
      similarity: chunk.similarity || 0,
      content_preview: chunk.content.substring(0, 200) + '...'
    }));
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        query,
        ragType,
        analysis,
        sources,
        chunk_count: relevantChunks.length,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Enhanced RAG processing error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack || 'No stack trace available',
        timestamp: new Date().toISOString(),
        success: false
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});