import "https://deno.land/x/xhr@0.1.0/mod.ts";
// @ts-ignore
import { createClient } from 'npm:@supabase/supabase-js';
// @ts-ignore
import { PDFDocument } from 'npm:pdf-lib';
// @ts-ignore
import * as mammoth from 'npm:mammoth';
// @ts-ignore
import * as XLSX from 'npm:xlsx';

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

interface ProcessRequest {
  fileId: string;
  contentBase64?: string;
  content?: string;
  name: string;
  mimeType: string;
  size?: number;
  modifiedTime?: string;
}

interface ExcelTable {
  sheetName: string;
  data: any[];
}

interface ProcessedDocument {
  fileId: string;
  name: string;
  content: string;
  mimeType: string;
  size?: number;
  modifiedTime?: string;
  metadata: {
    processingMethod: string;
    processingTime: number;
    contentLength: number;
    pageCount?: number;
    sections?: string[];
    tables?: any[];
    [key: string]: any;
  };
}

// Process PDF documents
async function processPdf(contentBase64: string): Promise<{ text: string; metadata: any }> {
  try {
    const pdfBytes = Uint8Array.from(atob(contentBase64), c => c.charCodeAt(0));
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();
    
    // For now, we're just returning metadata since we can't extract text directly
    // In a production environment, you would use a PDF extraction service or library
    return {
      text: `PDF document with ${pageCount} pages. Content extraction requires additional processing.`,
      metadata: {
        pageCount,
        processingMethod: 'pdf-lib',
      }
    };
  } catch (error) {
    console.error('PDF processing error:', error);
    return {
      text: 'Error processing PDF document',
      metadata: {
        processingMethod: 'pdf-lib',
        error: error.message
      }
    };
  }
}

// Process Word documents
async function processWord(contentBase64: string): Promise<{ text: string; metadata: any }> {
  try {
    const buffer = Uint8Array.from(atob(contentBase64), c => c.charCodeAt(0));
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    const text = result.value;
    
    // Extract sections based on headings (simple approach)
    const sections = text.split(/\n(?=[A-Z][^a-z]*:)/).filter(Boolean);
    
    return {
      text,
      metadata: {
        processingMethod: 'mammoth',
        sections,
        warnings: result.messages
      }
    };
  } catch (error) {
    console.error('Word processing error:', error);
    return {
      text: 'Error processing Word document',
      metadata: {
        processingMethod: 'mammoth',
        error: error.message
      }
    };
  }
}

// Process Excel documents
async function processExcel(contentBase64: string): Promise<{ text: string; metadata: any }> {
  try {
    const buffer = Uint8Array.from(atob(contentBase64), c => c.charCodeAt(0));
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    let text = '';
    const tables = [];
    
    // Process each sheet
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);
      
      // Add sheet name and content to text
      text += `\n\nSheet: ${sheetName}\n`;
      
      // Convert sheet data to text
      if (json.length > 0) {
        const headers = Object.keys(json[0]);
        text += headers.join('\t') + '\n';
        
        json.forEach((row: any) => {
          text += headers.map(header => row[header] || '').join('\t') + '\n';
        });
      }
      
      // Store structured data
      tables.push({
        sheetName,
        data: json
      });
    });
    
    return {
      text,
      metadata: {
        processingMethod: 'xlsx',
        sheetCount: workbook.SheetNames.length,
        sheetNames: workbook.SheetNames,
        tables
      }
    };
  } catch (error) {
    console.error('Excel processing error:', error);
    return {
      text: 'Error processing Excel document',
      metadata: {
        processingMethod: 'xlsx',
        error: error.message
      }
    };
  }
}

// Process text-based documents
function processText(content: string): { text: string; metadata: any } {
  // Simple text processing - could be enhanced with NLP
  const lines = content.split('\n');
  const wordCount = content.split(/\s+/).length;
  
  return {
    text: content,
    metadata: {
      processingMethod: 'text',
      lineCount: lines.length,
      wordCount,
      charCount: content.length
    }
  };
}

// Process large documents by chunking
function processLargeDocument(content: string, chunkSize = 10000): string[] {
  const chunks = [];
  let currentPosition = 0;
  
  while (currentPosition < content.length) {
    // Find a good break point (end of paragraph or sentence)
    let endPosition = Math.min(currentPosition + chunkSize, content.length);
    
    if (endPosition < content.length) {
      // Try to find paragraph break
      const paragraphBreak = content.lastIndexOf('\n\n', endPosition);
      if (paragraphBreak > currentPosition && paragraphBreak > endPosition - 500) {
        endPosition = paragraphBreak;
      } else {
        // Try to find sentence break
        const sentenceBreak = content.lastIndexOf('. ', endPosition);
        if (sentenceBreak > currentPosition && sentenceBreak > endPosition - 200) {
          endPosition = sentenceBreak + 1; // Include the period
        }
      }
    }
    
    chunks.push(content.substring(currentPosition, endPosition));
    currentPosition = endPosition;
  }
  
  return chunks;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileId, contentBase64, content, name, mimeType, size, modifiedTime }: ProcessRequest = await req.json();

    console.log('Processing document:', { fileId, name, mimeType, size });
    
    const startTime = Date.now();
    let processedContent = '';
    let metadata: any = {};
    
    // Process based on file type
    if (contentBase64) {
      if (mimeType.includes('pdf')) {
        const result = await processPdf(contentBase64);
        processedContent = result.text;
        metadata = result.metadata;
      } else if (mimeType.includes('word') || mimeType.includes('document') || mimeType.includes('docx')) {
        const result = await processWord(contentBase64);
        processedContent = result.text;
        metadata = result.metadata;
      } else if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('xlsx')) {
        const result = await processExcel(contentBase64);
        processedContent = result.text;
        metadata = result.metadata;
      } else {
        // Default to text processing for unknown binary formats
        processedContent = `Binary file: ${name}. Content extraction not supported for this file type.`;
        metadata = {
          processingMethod: 'binary',
          mimeType
        };
      }
    } else if (content) {
      const result = processText(content);
      processedContent = result.text;
      metadata = result.metadata;
    } else {
      throw new Error('No content provided for processing');
    }
    
    // Handle large documents by chunking if needed
    let chunks: string[] = [];
    const isLargeDocument = processedContent.length > 20000;
    
    if (isLargeDocument) {
      chunks = processLargeDocument(processedContent);
      metadata.chunked = true;
      metadata.chunkCount = chunks.length;
    }
    
    const processingTime = Date.now() - startTime;
    
    // Prepare the processed document
    const processedDocument: ProcessedDocument = {
      fileId,
      name,
      content: processedContent,
      mimeType,
      size,
      modifiedTime,
      metadata: {
        ...metadata,
        processingTime,
        contentLength: processedContent.length,
        isLargeDocument
      }
    };
    
    // Store processed document in the database
    const { data, error } = await supabase
      .from('processed_documents')
      .upsert({
        file_id: fileId,
        name,
        content: processedContent,
        mime_type: mimeType,
        size,
        modified_time: modifiedTime ? new Date(modifiedTime).toISOString() : null,
        metadata: processedDocument.metadata,
        chunks: isLargeDocument ? chunks : null
      });

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Failed to store processed document: ${error.message}`);
    }

    console.log('Document processed successfully:', fileId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        fileId,
        message: 'Document processed successfully',
        timestamp: new Date().toISOString(),
        details: processedDocument
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Document processing error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack || 'No stack trace available',
        timestamp: new Date().toISOString(),
        success: false,
        fileId: null
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});