-- Create table for caching Google Drive files
CREATE TABLE IF NOT EXISTS public.google_drive_files (
  id BIGSERIAL PRIMARY KEY,
  file_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  mime_type TEXT,
  last_modified TIMESTAMP,
  size BIGINT,
  web_view_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.google_drive_files ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is for file listing)
CREATE POLICY "Google Drive files are viewable by everyone" 
ON public.google_drive_files 
FOR SELECT 
USING (true);

CREATE POLICY "Google Drive files can be inserted by service" 
ON public.google_drive_files 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Google Drive files can be updated by service" 
ON public.google_drive_files 
FOR UPDATE 
USING (true);

CREATE POLICY "Google Drive files can be deleted by service" 
ON public.google_drive_files 
FOR DELETE 
USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_google_drive_files_file_id ON public.google_drive_files(file_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_google_drive_files_updated_at
BEFORE UPDATE ON public.google_drive_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();