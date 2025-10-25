import "https://deno.land/x/xhr@0.1.0/mod.ts";

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

interface DiagramRequest {
  type: 'wiring' | 'architecture' | 'circuit' | 'flow';
  content: string;
  title?: string;
}

async function generateDiagram(request: DiagramRequest) {
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `
Based on the following metro engineering content, generate a ${request.type} diagram in Mermaid syntax.

Content: ${request.content}

Generate a detailed ${request.type} diagram that includes:
- Clear component identification
- Proper connections and relationships
- Labels and annotations
- Color coding where appropriate

Return ONLY the Mermaid diagram code, starting with the diagram type declaration.
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo',
      max_tokens: 2000,
      messages: [
        {
          role: 'system',
          content: 'You are an expert in metro engineering systems and Mermaid diagram syntax. Generate clear, accurate technical diagrams.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, content, title }: DiagramRequest = await req.json();
    
    console.log(`Generating ${type} diagram for: ${title || 'Untitled'}`);

    if (!content || !type) {
      throw new Error('Content and type are required');
    }

    const mermaidCode = await generateDiagram({ type, content, title });

    return new Response(JSON.stringify({
      success: true,
      diagram: mermaidCode,
      type,
      title: title || `${type.charAt(0).toUpperCase() + type.slice(1)} Diagram`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Diagram generation error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});