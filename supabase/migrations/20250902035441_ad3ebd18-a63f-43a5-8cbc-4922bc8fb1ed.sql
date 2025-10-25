-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create documents table for storing Google Drive files with vector embeddings
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  content TEXT,
  mime_type TEXT,
  size BIGINT,
  modified_time TIMESTAMP WITH TIME ZONE,
  embedding vector(1536), -- OpenAI ada-002 embedding dimension
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_documents_file_id ON public.documents(file_id);
CREATE INDEX idx_documents_embedding ON public.documents USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_documents_name ON public.documents USING gin(to_tsvector('english', name));
CREATE INDEX idx_documents_content ON public.documents USING gin(to_tsvector('english', content));

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is document analysis)
CREATE POLICY "Documents are viewable by everyone" 
ON public.documents 
FOR SELECT 
USING (true);

CREATE POLICY "Documents can be inserted by service" 
ON public.documents 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Documents can be updated by service" 
ON public.documents 
FOR UPDATE 
USING (true);

CREATE POLICY "Documents can be deleted by service" 
ON public.documents 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function for vector similarity search
CREATE OR REPLACE FUNCTION public.search_documents_by_embedding(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.78,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  file_id text,
  name text,
  content text,
  mime_type text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    documents.id,
    documents.file_id,
    documents.name,
    documents.content,
    documents.mime_type,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
$$;