import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

interface AdvancedRAGRequest {
  files: Array<{
    id: string;
    name: string;
    mimeType: string;
    size: string;
    modifiedTime: string;
    type: string;
    selected?: boolean;
  }>;
  query: string;
  ragType: 'hierarchical' | 'contextual' | 'semantic';
}

async function processWithGemini(content: string, query: string): Promise<any> {
  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiKey) {
    throw new Error('GEMINI_API_KEY is required');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiKey}`;
  
  const prompt = `
You are an advanced AI assistant specialized in technical document analysis for metro engineering systems.

QUERY: ${query}

DOCUMENTS TO ANALYZE:
${content}

Please provide a comprehensive analysis that includes:

1. **EXECUTIVE SUMMARY**: Key findings and recommendations
2. **TECHNICAL ANALYSIS**: Detailed technical breakdown
3. **SAFETY CONSIDERATIONS**: Safety implications and recommendations
4. **COMPLIANCE NOTES**: Regulatory and standard compliance insights
5. **ACTIONABLE INSIGHTS**: Specific next steps and recommendations
6. **WIRE_ANALYSIS**: Detailed wire specifications and requirements (if applicable)
7. **COMPONENT_DETAILS**: Component specifications and requirements (if applicable)
8. **SYSTEM_INTEGRATION**: How components work together (if applicable)

Format your response clearly with sections and bullet points where appropriate.
`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  const analysisText = data.candidates[0]?.content?.parts[0]?.text || 'No analysis generated';

  return {
    success: true,
    analysis: analysisText,
    executiveSummary: extractSection(analysisText, 'EXECUTIVE SUMMARY') || 'Analysis completed',
    technicalAnalysis: extractSection(analysisText, 'TECHNICAL ANALYSIS') || analysisText,
    safetyConsiderations: extractSection(analysisText, 'SAFETY CONSIDERATIONS') || 'No specific safety considerations identified',
    complianceNotes: extractSection(analysisText, 'COMPLIANCE NOTES') || 'Standard compliance assumed',
    actionableInsights: extractSection(analysisText, 'ACTIONABLE INSIGHTS') || 'Review technical specifications',
    wireAnalysis: extractSection(analysisText, 'WIRE_ANALYSIS') || 'No wire analysis available',
    componentDetails: extractSection(analysisText, 'COMPONENT_DETAILS') || 'No component details available',
    systemIntegration: extractSection(analysisText, 'SYSTEM_INTEGRATION') || 'System integration details not specified'
  };
}

function extractSection(text: string, sectionName: string): string | null {
  const regex = new RegExp(`\\*\\*${sectionName}\\*\\*:?\\s*([\\s\\S]*?)(?=\\n\\n\\*\\*[A-Z_\\s]+\\*\\*:|$)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { files, query, ragType }: AdvancedRAGRequest = await req.json();
    
    console.log('Advanced RAG processing:', { 
      fileCount: files.length, 
      ragType,
      query: query.substring(0, 100) + '...' 
    });

    // Simulate file content processing (in real implementation, this would fetch actual content)
    let combinedContent = `ADVANCED RAG ANALYSIS (${ragType.toUpperCase()})\n\n`;
    
    files.forEach((file, index) => {
      combinedContent += `=== DOCUMENT ${index + 1}: ${file.name} ===\n`;
      combinedContent += `File Type: ${file.mimeType}\n`;
      combinedContent += `Size: ${file.size} bytes\n`;
      combinedContent += `Modified: ${file.modifiedTime}\n`;
      combinedContent += `Content: This is a ${file.mimeType} document containing technical specifications and engineering data relevant to metro systems.\n\n`;
    });

    // Process with advanced AI
    const result = await processWithGemini(combinedContent, query);

    console.log('Advanced RAG processing completed successfully');
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Advanced RAG error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Advanced RAG processing failed',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});