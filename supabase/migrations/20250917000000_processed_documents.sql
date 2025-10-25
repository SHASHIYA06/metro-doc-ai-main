-- Create processed_documents table for storing processed document content
CREATE TABLE IF NOT EXISTS public.processed_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  content TEXT,
  mime_type TEXT,
  size BIGINT,
  modified_time TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  chunks TEXT[] DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_processed_documents_file_id ON public.processed_documents(file_id);
CREATE INDEX IF NOT EXISTS idx_processed_documents_name ON public.processed_documents USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_processed_documents_content ON public.processed_documents USING gin(to_tsvector('english', content));

-- Enable RLS
ALTER TABLE public.processed_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Processed documents are viewable by everyone" 
ON public.processed_documents 
FOR SELECT 
USING (true);

CREATE POLICY "Processed documents can be inserted by service" 
ON public.processed_documents 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Processed documents can be updated by service" 
ON public.processed_documents 
FOR UPDATE 
USING (true);

CREATE POLICY "Processed documents can be deleted by service" 
ON public.processed_documents 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_processed_documents_updated_at
    BEFORE UPDATE ON public.processed_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function for text search in processed documents
CREATE OR REPLACE FUNCTION public.search_processed_documents(
  search_query text,
  limit_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  file_id text,
  name text,
  content text,
  mime_type text,
  relevance float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    pd.id,
    pd.file_id,
    pd.name,
    pd.content,
    pd.mime_type,
    ts_rank(to_tsvector('english', pd.content), to_tsquery('english', search_query)) AS relevance
  FROM processed_documents pd
  WHERE to_tsvector('english', pd.content) @@ to_tsquery('english', search_query)
  ORDER BY relevance DESC
  LIMIT limit_count;
$$;