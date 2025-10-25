export interface DriveFile {
  id: string;
  name: string;
  mimeType?: string;
  size?: string;
  modifiedTime?: string;
  type: 'file' | 'folder';
  parents?: string[];
}

export interface DocumentAnalysis {
  summary: string;
  keyPoints: string[];
  entities: {
    name: string;
    type: string;
    description: string;
  }[];
  sentiment: {
    score: number;
    magnitude: number;
    label: string;
  };
  topics: string[];
  recommendations: string[];
}

export interface SearchResult {
  id: string;
  file_id: string;
  name: string;
  content: string;
  mime_type: string;
  similarity: number;
}

export interface DocumentSearchResults {
  query: string;
  results: SearchResult[];
}

export interface ProcessedDocument {
  id: string;
  file_id: string;
  name: string;
  content: string;
  mime_type: string;
  size: number;
  modified_time: string;
  chunks?: DocumentChunk[];
  metadata?: {
    page_count?: number;
    processed_at: string;
    content_length: number;
    sections?: string[];
    sheets?: string[];
    processing_type: 'pdf' | 'word' | 'excel' | 'text' | 'other';
  };
}

export interface DocumentChunk {
  id: string;
  content: string;
  metadata?: {
    page?: number;
    section?: string;
    sheet?: string;
    start_index?: number;
    end_index?: number;
  };
}

export interface HierarchicalAnalysis {
  summary: string;
  technical_details: string[];
  key_components: {
    name: string;
    description: string;
    importance: string;
  }[];
  specifications: Record<string, string>;
  relationships: {
    from: string;
    to: string;
    type: string;
    description: string;
  }[];
  recommendations: string[];
  source_chunks: {
    content: string;
    relevance: number;
    metadata?: any;
  }[];
}

export interface MapAnalysis {
  locations: {
    name: string;
    description: string;
    coordinates?: {
      latitude?: number;
      longitude?: number;
      x?: number;
      y?: number;
    };
  }[];
  spatial_relationships: {
    from: string;
    to: string;
    type: string; // adjacent, contains, north_of, etc.
    distance?: string;
  }[];
  measurements: {
    type: string; // area, distance, etc.
    value: number;
    unit: string;
    description: string;
  }[];
  layout: {
    width?: number;
    height?: number;
    orientation?: string;
    scale?: string;
    description: string;
  };
  source_chunks: {
    content: string;
    relevance: number;
    metadata?: any;
  }[];
}

export interface OCRResult {
  text: string;
  confidence: number;
  boundingBoxes: Array<{
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

export interface DiagramData {
  type: 'wiring' | 'architecture' | 'circuit' | 'flow';
  elements: Array<{
    id: string;
    type: string;
    label: string;
    properties?: Record<string, any>;
  }>;
  connections: Array<{
    from: string;
    to: string;
    label?: string;
    properties?: Record<string, any>;
  }>;
}