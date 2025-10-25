// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_VISION_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent';

interface OCRRequest {
  imageData: string; // base64 encoded image
  extractionType: 'text' | 'technical' | 'wiring' | 'components';
}

interface OCRResponse {
  text?: string;
  technical_details?: string;
  wiring?: Array<{number: string; specification: string}>;
  components?: Array<{name: string; partNumber: string; description: string}>;
  diagrams?: Array<string>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, extractionType }: OCRRequest = await req.json();
    
    console.log('Processing OCR request:', { extractionType });

    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    // Prepare prompts based on extraction type
    const prompts = {
      text: 'Extract all visible text from this image, maintaining structure and formatting.',
      technical: 'Extract technical specifications, measurements, part numbers, and engineering details from this technical document.',
      wiring: 'Extract wiring information including wire numbers, connections, terminal blocks, and electrical specifications from this wiring diagram.',
      components: 'Identify and extract component information including part numbers, specifications, locations, and descriptions from this technical diagram.'
    };

    const prompt = prompts[extractionType] || prompts.text;

    // Call Gemini Vision API
    const geminiResponse = await fetch(`${GEMINI_VISION_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: imageData.replace(/^data:image\/[a-z]+;base64,/, '')
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 32,
          topP: 0.8,
          maxOutputTokens: 4096,
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      throw new Error(`Gemini Vision API error: ${geminiResponse.status} - ${errorText}`);
    }

    const geminiData = await geminiResponse.json();
    const extractedText = geminiData.candidates[0]?.content?.parts[0]?.text || 'No text extracted';

    // Parse extracted text based on type
    const result = parseOCRResult(extractedText, extractionType);

    console.log('OCR processing completed successfully');
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('OCR processing error:', error);
    return new Response(JSON.stringify({ 
      error: 'OCR processing failed',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function parseOCRResult(text: string, type: string): OCRResponse {
  const baseResult = {
    text: text,
    confidence: 0.85, // Simulated confidence score
    extractionType: type
  };

  switch (type) {
    case 'technical':
      return {
        text: text,
        technical_details: `Specifications: ${extractSpecifications(text).join(', ')}\nPart Numbers: ${extractPartNumbers(text).join(', ')}\nMeasurements: ${extractMeasurements(text).join(', ')}`
      };
    
    case 'wiring':
      const wireNumbers = extractWireNumbers(text);
      const specifications = extractSpecifications(text);
      
      const wiring = wireNumbers.map((number, i) => ({
        number,
        specification: specifications[i % specifications.length] || 'Standard wire'
      }));
      
      return {
        text: text,
        wiring: wiring
      };
    
    case 'components':
      const componentInfoList = extractComponentInfo(text);
      const partNumbers = extractPartNumbers(text);
      
      // Ensure components match the expected interface format
      const components = componentInfoList.map((comp, i) => ({
        name: comp.name,
        partNumber: comp.partNumber || partNumbers[i] || 'N/A',
        description: comp.description || `${comp.name} component`
      }));
      
      return {
        text: text,
        components: components
      };
    
    default:
      return { text: text };
  }
}

function extractSpecifications(text: string): string[] {
  const specRegex = /(\d+(?:\.\d+)?)\s*(V|A|W|Hz|Ω|mm|cm|m|kg|lb)/gi;
  const matches = text.match(specRegex) || [];
  return matches.slice(0, 10); // Limit to 10 specs
}

function extractPartNumbers(text: string): string[] {
  const partRegex = /[A-Z]{1,3}[\d-]{3,10}/gi;
  const matches = text.match(partRegex) || [];
  return [...new Set(matches)].slice(0, 20); // Unique part numbers, limit 20
}

function extractMeasurements(text: string): string[] {
  const measureRegex = /\d+(?:\.\d+)?\s*(?:mm|cm|m|inches?|ft|'|")/gi;
  const matches = text.match(measureRegex) || [];
  return matches.slice(0, 15);
}

function extractWireNumbers(text: string): string[] {
  const wireRegex = /(?:wire|cable)\s*(?:#|no\.?)?\s*([A-Z]?\d+(?:[-/]\d+)?)/gi;
  const matches = [];
  let match;
  while ((match = wireRegex.exec(text)) !== null && matches.length < 30) {
    matches.push(match[1]);
  }
  return matches;
}

function extractConnections(text: string): string[] {
  const connectionRegex = /(?:from|to|connect|terminal)\s+([A-Z]?\d+(?:[-/]\w*)?)/gi;
  const matches = [];
  let match;
  while ((match = connectionRegex.exec(text)) !== null && matches.length < 25) {
    matches.push(match[1]);
  }
  return matches;
}

function extractTerminals(text: string): string[] {
  const terminalRegex = /(?:terminal|TB|terminal block)\s*([A-Z]?\d+(?:[-/]\d+)?)/gi;
  const matches = [];
  let match;
  while ((match = terminalRegex.exec(text)) !== null && matches.length < 20) {
    matches.push(match[1]);
  }
  return matches;
}

function extractComponentInfo(text: string): Array<{name: string, partNumber?: string, description?: string}> {
  const components: Array<{name: string, partNumber?: string, description?: string}> = [];
  const componentRegex = /(relay|contactor|breaker|fuse|switch|motor|transformer|sensor)\s*([A-Z]?\d+(?:[-/]\w*)?)?/gi;
  let match;
  
  while ((match = componentRegex.exec(text)) !== null && components.length < 15) {
    components.push({
      name: match[1],
      partNumber: match[2] || 'N/A',
      description: `${match[1]}${match[2] ? ` ${match[2]}` : ''}`
    });
  }
  
  return components;
}

function extractLocations(text: string): string[] {
  const locationRegex = /(?:panel|room|floor|level|section|area)\s*([A-Z]?\d+(?:[-/]\w*)?)/gi;
  const matches = [];
  let match;
  while ((match = locationRegex.exec(text)) !== null && matches.length < 15) {
    matches.push(`${match[0]}`);
  }
  return matches;
}